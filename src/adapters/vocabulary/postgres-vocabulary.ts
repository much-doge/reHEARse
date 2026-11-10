import { createHash, randomBytes } from "node:crypto";
import type { PoolClient } from "pg";

import { getPool } from "@/adapters/db/client";
import packageV1Json from "../../../content/vocabulary/toefl-itp-full-frequency.v1.json";
import packageV2Json from "../../../content/vocabulary/toefl-itp-full-frequency.v2.json";

type Part = "Noun" | "Verb" | "Adjective" | "Adverb";
type Card = { id: string; headword: string; partsOfSpeech: Part[]; classification: string[]; teachingFocus: string[]; priority: string[]; frequencyBand: string[]; frequencyReference: string[]; wordForms: string[]; bookOccurrences: number | null; bookTestCoverage: number | null; skillOccurrences: { listening: number; structure: number; reading: number }; sourceRows: number; example?: { sentence: string; highlightStart: number; highlightLength: number; source: "wordnet-3.0" | "rehearse-original" } };
type Package = { contractVersion: string; version: number; id: string; title: string; prompt: string; sourceNote: string; cardCount: number; cards: Card[] };
const packageByVersion = new Map<number, Package>([[1, packageV1Json as Package], [2, packageV2Json as Package]]);
const roundSize = 12;

export class VocabularyError extends Error {
  constructor(readonly code: string, readonly status = 409) { super(code); }
}

const codeHash = (code: string) => createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
function vocabularyPackage(version: number) {
  const pack = packageByVersion.get(version);
  if (!pack) throw new VocabularyError("package_unavailable", 503);
  return pack;
}
function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}

async function createAttempt(client: PoolClient, assignmentId: string, learnerId: string, previousAttemptId: string | null = null, missedOnly = false) {
  const assignment = await client.query("SELECT id,package_version FROM vocabulary_assignment WHERE id=$1 AND learner_id=$2 AND revoked_at IS NULL FOR UPDATE", [assignmentId, learnerId]);
  if (!assignment.rows[0]) throw new VocabularyError("assignment_unavailable", 404);
  const pack = vocabularyPackage(Number(assignment.rows[0].package_version));
  const cardById = new Map(pack.cards.map((card) => [card.id, card]));
  const previousResult = await client.query(
    "SELECT id,status FROM vocabulary_attempt WHERE assignment_id=$1 AND ($2::uuid IS NULL OR id=$2) AND status<>'archived' ORDER BY attempt_number DESC LIMIT 1",
    [assignmentId, previousAttemptId],
  );
  const previous = previousResult.rows[0];
  if (previousAttemptId && (!previous || String(previous.id) !== previousAttemptId || previous.status !== "completed")) throw new VocabularyError("round_not_complete");
  let candidateIds: string[];
  if (missedOnly && previous) {
    const missed = await client.query("SELECT DISTINCT ON(card_id) card_id,is_correct FROM vocabulary_event WHERE attempt_id=$1 AND event_type='answered' ORDER BY card_id,id DESC", [previous.id]);
    candidateIds = missed.rows.filter((row) => row.is_correct === false).map((row) => String(row.card_id)).filter((id) => cardById.has(id));
    if (!candidateIds.length) throw new VocabularyError("no_missed_cards");
  } else {
    const history = await client.query(
      `SELECT e.card_id,min(e.created_at) AS first_opened FROM vocabulary_event e
       JOIN vocabulary_attempt t ON t.id=e.attempt_id WHERE t.assignment_id=$1 AND e.event_type='opened'
       GROUP BY e.card_id`, [assignmentId],
    );
    const seen = new Map(history.rows.map((row) => [String(row.card_id), new Date(row.first_opened).getTime()]));
    const unseen = pack.cards.map((card) => card.id).filter((id) => !seen.has(id));
    candidateIds = unseen.length ? shuffle(unseen) : pack.cards.map((card) => card.id).sort((a, b) => (seen.get(a) ?? 0) - (seen.get(b) ?? 0) || Math.random() - 0.5);
  }
  const cardOrder = shuffle(candidateIds).slice(0, Math.min(roundSize, candidateIds.length));
  const numberResult = await client.query("SELECT COALESCE(max(attempt_number),0)+1 AS n FROM vocabulary_attempt WHERE assignment_id=$1", [assignmentId]);
  const inserted = await client.query(
    `INSERT INTO vocabulary_attempt (assignment_id,attempt_number,previous_attempt_id,package_version,card_order,status)
     VALUES ($1,$2,$3,$4,$5::jsonb,'active') RETURNING id,attempt_number,created_at`,
    [assignmentId, Number(numberResult.rows[0].n), previous?.id ?? null, pack.version, JSON.stringify(cardOrder)],
  );
  return inserted.rows[0];
}

async function attemptState(client: PoolClient, learnerId: string, assignmentId: string, attemptId?: string) {
  const rows = await client.query(
    `SELECT t.id,t.attempt_number,t.previous_attempt_id,t.card_order,t.status,t.created_at,t.completed_at,
       a.assignment_title,a.deck_id,t.package_version
     FROM vocabulary_attempt t JOIN vocabulary_assignment a ON a.id=t.assignment_id
     WHERE a.id=$1 AND a.learner_id=$2 AND a.revoked_at IS NULL AND t.status<>'archived'
       AND ($3::uuid IS NULL OR t.id=$3)
     ORDER BY t.attempt_number DESC LIMIT 1`, [assignmentId, learnerId, attemptId ?? null],
  );
  let run = rows.rows[0];
  if (!run && attemptId) throw new VocabularyError("attempt_unavailable", 404);
  if (!run || run.status === "archived") run = await createAttempt(client, assignmentId, learnerId);
  const pack = vocabularyPackage(Number(run.package_version));
  const cardById = new Map(pack.cards.map((card) => [card.id, card]));
  const events = await client.query(
    `SELECT DISTINCT ON(card_id) card_id,event_type,selected_parts,is_correct,created_at
     FROM vocabulary_event WHERE attempt_id=$1 AND event_type='answered' ORDER BY card_id,id DESC`, [run.id],
  );
  const opened = await client.query("SELECT card_id,count(*)::int AS opens FROM vocabulary_event WHERE attempt_id=$1 AND event_type='opened' GROUP BY card_id", [run.id]);
  const answers = Object.fromEntries(events.rows.filter((row) => row.event_type === "answered").map((row) => [String(row.card_id), { selectedParts: row.selected_parts, isCorrect: row.is_correct, answeredAt: row.created_at }]));
  const openCounts = Object.fromEntries(opened.rows.map((row) => [String(row.card_id), Number(row.opens)]));
  const order = (run.card_order as string[]).filter((id) => cardById.has(id));
  return {
    assignment: { id: assignmentId, title: run.assignment_title as string },
    attempt: { id: String(run.id), number: Number(run.attempt_number), previousAttemptId: run.previous_attempt_id ? String(run.previous_attempt_id) : null, status: run.status as string, createdAt: new Date(run.created_at).toISOString(), completedAt: run.completed_at ? new Date(run.completed_at).toISOString() : null, cardOrder: order },
    cards: order.map((id) => cardById.get(id)!), answers, openCounts,
    prompt: pack.prompt,
  };
}

export async function learnerAssignments(learnerId: string) {
  const result = await getPool().query(
    `SELECT a.id,a.assignment_title,a.deck_id,a.created_at,
       (SELECT t.status FROM vocabulary_attempt t WHERE t.assignment_id=a.id AND t.status<>'archived' ORDER BY t.attempt_number DESC LIMIT 1) AS latest_status
     FROM vocabulary_assignment a WHERE a.learner_id=$1 AND a.revoked_at IS NULL ORDER BY a.created_at DESC`, [learnerId],
  );
  return result.rows.map((row) => ({ id: String(row.id), title: row.assignment_title as string, deckId: row.deck_id as string, createdAt: new Date(row.created_at).toISOString(), latestStatus: row.latest_status as string | null }));
}

export async function claimVocabularyCode(learnerId: string, rawCode: string) {
  const db = getPool(); const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT id,deck_id,package_version,invite_kind,assignment_title,created_by FROM vocabulary_invite
       WHERE code_hash=$1 AND revoked_at IS NULL AND expires_at>now() FOR UPDATE`, [codeHash(rawCode)],
    );
    const invite = result.rows[0];
    if (!invite) throw new VocabularyError("code_unavailable", 404);
    const existing = await client.query("SELECT id FROM vocabulary_assignment WHERE invite_id=$1 AND learner_id=$2", [invite.id, learnerId]);
    if (existing.rows[0]) { await client.query("COMMIT"); return { assignmentId: String(existing.rows[0].id), alreadyClaimed: true }; }
    if (invite.invite_kind === "private") {
      const used = await client.query("SELECT 1 FROM vocabulary_assignment WHERE invite_id=$1 LIMIT 1", [invite.id]);
      if (used.rows[0]) throw new VocabularyError("code_unavailable", 404);
    }
    const created = await client.query(
      `INSERT INTO vocabulary_assignment (invite_id,deck_id,package_version,learner_id,assigned_by,assignment_title)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [invite.id, invite.deck_id, invite.package_version, learnerId, invite.created_by, invite.assignment_title],
    );
    await client.query("COMMIT");
    return { assignmentId: String(created.rows[0].id), alreadyClaimed: false };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

export async function getVocabularyRun(learnerId: string, assignmentId: string, attemptId?: string) {
  const db = getPool(); const client = await db.connect();
  try { await client.query("BEGIN"); await client.query("SELECT id FROM vocabulary_assignment WHERE id=$1 AND learner_id=$2 AND revoked_at IS NULL FOR UPDATE", [assignmentId, learnerId]); const result = await attemptState(client, learnerId, assignmentId, attemptId); await client.query("COMMIT"); return result; }
  catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

export async function recordVocabularyOpen(learnerId: string, attemptId: string, cardId: string) {
  const result = await getPool().query(
    `INSERT INTO vocabulary_event (attempt_id,card_id,event_type)
     SELECT t.id,$3,'opened' FROM vocabulary_attempt t JOIN vocabulary_assignment a ON a.id=t.assignment_id
     WHERE t.id=$1 AND a.learner_id=$2 AND a.revoked_at IS NULL AND t.status='active' AND t.card_order ? $3
     RETURNING id`, [attemptId, learnerId, cardId],
  );
  if (!result.rowCount) throw new VocabularyError("card_unavailable", 404);
}

export async function answerVocabularyCard(learnerId: string, attemptId: string, cardId: string, selected: Part[]) {
  const attempt = await getPool().query(
    `SELECT t.package_version FROM vocabulary_attempt t JOIN vocabulary_assignment a ON a.id=t.assignment_id
     WHERE t.id=$1 AND a.learner_id=$2 AND a.revoked_at IS NULL AND t.status='active' AND t.card_order ? $3
       AND EXISTS(SELECT 1 FROM vocabulary_event e WHERE e.attempt_id=t.id AND e.card_id=$3 AND e.event_type='opened')`, [attemptId, learnerId, cardId],
  );
  if (!attempt.rows[0]) throw new VocabularyError("card_unavailable", 404);
  const card = vocabularyPackage(Number(attempt.rows[0].package_version)).cards.find((item) => item.id === cardId);
  if (!card) throw new VocabularyError("card_unavailable", 404);
  const selectedParts = [...new Set(selected)].sort();
  const expected = [...card.partsOfSpeech].sort();
  const isCorrect = selectedParts.length === expected.length && selectedParts.every((part, index) => part === expected[index]);
  const result = await getPool().query(
    `INSERT INTO vocabulary_event (attempt_id,card_id,event_type,selected_parts,is_correct)
     SELECT t.id,$3,'answered',$4,$5 FROM vocabulary_attempt t JOIN vocabulary_assignment a ON a.id=t.assignment_id
     WHERE t.id=$1 AND a.learner_id=$2 AND a.revoked_at IS NULL AND t.status='active' AND t.card_order ? $3
       AND EXISTS(SELECT 1 FROM vocabulary_event e WHERE e.attempt_id=t.id AND e.card_id=$3 AND e.event_type='opened')
     RETURNING id`, [attemptId, learnerId, cardId, selectedParts, isCorrect],
  );
  if (!result.rowCount) throw new VocabularyError("card_unavailable", 404);
  return { isCorrect, expectedParts: card.partsOfSpeech };
}

export async function finishVocabularyRound(learnerId: string, attemptId: string) {
  const result = await getPool().query(
    `UPDATE vocabulary_attempt t SET status='completed',completed_at=now()
     FROM vocabulary_assignment a WHERE t.id=$1 AND a.id=t.assignment_id AND a.learner_id=$2 AND a.revoked_at IS NULL AND t.status='active'
     RETURNING t.assignment_id`, [attemptId, learnerId],
  );
  if (!result.rowCount) throw new VocabularyError("attempt_unavailable", 404);
  return { completed: true };
}

export async function nextVocabularyRound(learnerId: string, assignmentId: string, previousAttemptId: string, missedOnly: boolean) {
  const db = getPool(); const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM vocabulary_assignment WHERE id=$1 AND learner_id=$2 AND revoked_at IS NULL FOR UPDATE", [assignmentId, learnerId]);
    const result = await createAttempt(client, assignmentId, learnerId, previousAttemptId, missedOnly);
    await client.query("COMMIT");
    return { attemptId: String(result.id), number: Number(result.attempt_number) };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

export async function createVocabularyCode(staffId: string, deckId: string, inviteKind: "private" | "classroom", title: string) {
  const code = `LEX-${randomBytes(8).toString("hex").toUpperCase()}`;
  const result = await getPool().query(
    `INSERT INTO vocabulary_invite (deck_id,package_version,code_hash,invite_kind,assignment_title,created_by,expires_at)
     SELECT id,version,$2,$3,$4,$5,now()+interval '7 days' FROM vocabulary_deck WHERE id=$1 AND state='published'
     RETURNING id,expires_at`, [deckId, codeHash(code), inviteKind, title.trim(), staffId],
  );
  if (!result.rowCount) throw new VocabularyError("deck_unavailable", 404);
  return { code, inviteId: String(result.rows[0].id), expiresAt: new Date(result.rows[0].expires_at).toISOString(), inviteKind, title: title.trim() };
}

export async function teacherVocabularyAssignments(staffId: string, role: "teacher" | "admin") {
  const result = await getPool().query(
    `SELECT i.id AS invite_id,i.invite_kind,i.assignment_title,i.created_at,i.expires_at,i.revoked_at,
       COALESCE(jsonb_agg(jsonb_build_object('id',a.id,'learnerId',a.learner_id,'name',u.display_name,'email',u.email,'createdAt',a.created_at,
         'attempts',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',t.id,'number',t.attempt_number,'status',t.status,'createdAt',t.created_at,'completedAt',t.completed_at,'archivedAt',t.archived_at) ORDER BY t.attempt_number DESC),'[]'::jsonb) FROM vocabulary_attempt t WHERE t.assignment_id=a.id)
       )) FILTER (WHERE a.id IS NOT NULL),'[]'::jsonb) AS candidates
     FROM vocabulary_invite i LEFT JOIN vocabulary_assignment a ON a.invite_id=i.id
     LEFT JOIN app_user u ON u.id=a.learner_id
     WHERE ($2='admin' OR i.created_by=$1)
     GROUP BY i.id ORDER BY i.created_at DESC LIMIT 100`, [staffId, role],
  );
  return result.rows.map((row) => ({ id: String(row.invite_id), type: row.invite_kind as string, title: row.assignment_title as string, createdAt: new Date(row.created_at).toISOString(), expiresAt: new Date(row.expires_at).toISOString(), revoked: row.revoked_at !== null, candidates: row.candidates ?? [] }));
}

export async function teacherVocabularyReview(staffId: string, role: "teacher" | "admin", assignmentId: string, attemptId: string) {
  const allowed = await getPool().query(
    `SELECT a.id,a.assignment_title,u.display_name FROM vocabulary_assignment a
     JOIN app_user u ON u.id=a.learner_id JOIN vocabulary_invite i ON i.id=a.invite_id
     WHERE a.id=$1 AND ($3='admin' OR i.created_by=$2) AND a.revoked_at IS NULL`, [assignmentId, staffId, role],
  );
  if (!allowed.rows[0]) throw new VocabularyError("assignment_unavailable", 404);
  const attempt = await getPool().query("SELECT id,assignment_id,status,package_version,card_order FROM vocabulary_attempt WHERE id=$1 AND assignment_id=$2", [attemptId, assignmentId]);
  if (!attempt.rows[0]) throw new VocabularyError("attempt_unavailable", 404);
  const pack = vocabularyPackage(Number(attempt.rows[0].package_version));
  const cardById = new Map(pack.cards.map((card) => [card.id, card]));
  const events = await getPool().query(
    `SELECT card_id,count(*) FILTER (WHERE event_type='opened')::int AS opens,
       (array_agg(selected_parts ORDER BY id DESC) FILTER (WHERE event_type='answered'))[1] AS selected_parts,
       (array_agg(is_correct ORDER BY id DESC) FILTER (WHERE event_type='answered'))[1] AS is_correct,
       jsonb_agg(jsonb_build_object('selectedParts',selected_parts,'isCorrect',is_correct,'answeredAt',created_at) ORDER BY id) FILTER (WHERE event_type='answered') AS response_trail,
       max(created_at) AS last_seen
     FROM vocabulary_event WHERE attempt_id=$1 GROUP BY card_id`, [attemptId],
  );
  const states = new Map(events.rows.map((row) => [String(row.card_id), row]));
  const cards = (attempt.rows[0].card_order as string[]).map((id) => {
    const card = cardById.get(id); const state = states.get(id);
    return card ? { id, headword: card.headword, sourcePartsOfSpeech: card.partsOfSpeech, example: card.example ?? null, opened: Number(state?.opens ?? 0) > 0, openEvents: Number(state?.opens ?? 0), selectedParts: state?.selected_parts ?? null, isCorrect: state?.is_correct ?? null, responseTrail: state?.response_trail ?? [], lastSeen: state?.last_seen ? new Date(state.last_seen).toISOString() : null } : null;
  }).filter(Boolean);
  return { learnerName: allowed.rows[0].display_name as string, assignmentTitle: allowed.rows[0].assignment_title as string, attemptStatus: attempt.rows[0].status as string, cards };
}

export async function resetVocabularyAssignment(staffId: string, role: "teacher" | "admin", assignmentId: string) {
  const result = await getPool().query(
    `WITH allowed AS (
       SELECT a.id FROM vocabulary_assignment a JOIN vocabulary_invite i ON i.id=a.invite_id
       WHERE a.id=$1 AND a.revoked_at IS NULL AND ($3='admin' OR i.created_by=$2)
     ), latest AS (
       SELECT t.id FROM vocabulary_attempt t JOIN allowed a ON a.id=t.assignment_id
       WHERE t.status<>'archived' ORDER BY t.attempt_number DESC LIMIT 1
     )
     UPDATE vocabulary_attempt t SET status='archived',archived_at=now(),archived_by=$2
     FROM latest WHERE t.id=latest.id RETURNING t.id`, [assignmentId, staffId, role],
  );
  if (!result.rowCount) throw new VocabularyError("attempt_unavailable", 404);
  return { archivedAttemptId: String(result.rows[0].id) };
}
