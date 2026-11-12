import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";

import { getPool } from "@/adapters/db/client";
import packageV1Json from "../../../content/vocabulary/toefl-itp-full-frequency.v1.json";
import packageV2Json from "../../../content/vocabulary/toefl-itp-full-frequency.v2.json";
import packageV3Json from "../../../content/vocabulary/toefl-itp-full-frequency.v3.json";
import packageV4Json from "../../../content/vocabulary/toefl-itp-full-frequency.v4.json";

type Part = "Noun" | "Verb" | "Adjective" | "Adverb";
type Card = { id: string; headword: string; targetPart?: Part; partsOfSpeech: Part[]; classification: string[]; teachingFocus: string[]; priority: string[]; frequencyBand: string[]; frequencyReference: string[]; wordForms: string[]; bookOccurrences: number | null; bookTestCoverage: number | null; skillOccurrences: { listening: number; structure: number; reading: number }; sourceRows: number; example?: { sentence: string; highlightStart: number; highlightLength: number; source: "wordnet-3.0" | "rehearse-original" | "rehearse-authored" } };
type Package = { contractVersion: string; version: number; id: string; title: string; prompt: string; sourceNote: string; cardCount: number; cards: Card[] };
const packageByVersion = new Map<number, Package>([[1, packageV1Json as Package], [2, packageV2Json as Package], [3, packageV3Json as Package], [4, packageV4Json as Package]]);
const roundSize = 20;
const reviewIntervalsDays = [1, 3, 7, 14];
const separationHeadwords = 6;

type QueueRow = {
  assignment_id: string; lineage_id: string; seed: string; unseen_order: string[];
  pending_retries: Array<{ cardId: string; headword: string; dueSequence: number; dueAt: string; kind: "missed" | "skipped" }>;
  recent_headwords: string[]; headword_sequence: number; exposure_sequence: number;
  unseen_since_revisit: number; batch_exposure_count: number; current_exposure_id: string | null;
};

export class VocabularyError extends Error {
  constructor(readonly code: string, readonly status = 409) { super(code); }
}

const codeHash = (code: string) => createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
const vocabularyCodeAlphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function generateVocabularyCode() {
  const raw = Array.from(randomBytes(6), (byte) => vocabularyCodeAlphabet[byte & 31]).join("");
  return `LEX-${raw}`;
}
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

function deterministicOrder(ids: string[], seed: string) {
  return [...ids].sort((a, b) => createHash("sha256").update(`${seed}\0${a}`).digest("hex").localeCompare(createHash("sha256").update(`${seed}\0${b}`).digest("hex")));
}

function boundedDelay(seed: string, sequence: number, minimum: number, maximum: number) {
  const hex = createHash("sha256").update(`${seed}\0retry\0${sequence}`).digest("hex").slice(0, 8);
  return minimum + (Number.parseInt(hex, 16) % (maximum - minimum + 1));
}

async function ensureQueue(client: PoolClient, assignmentId: string, pack: Package): Promise<QueueRow> {
  const found = await client.query("SELECT * FROM vocabulary_practice_queue WHERE assignment_id=$1 FOR UPDATE", [assignmentId]);
  if (found.rows[0]) return found.rows[0] as QueueRow;
  const seed = randomBytes(32).toString("hex");
  const lineageId = randomUUID();
  const generationResult = await client.query("SELECT COALESCE(max(generation),0)+1 AS n FROM vocabulary_queue_lineage WHERE assignment_id=$1", [assignmentId]);
  const generation = Number(generationResult.rows[0].n);
  await client.query(
    `INSERT INTO vocabulary_queue_lineage (id,assignment_id,generation,package_version,seed)
     VALUES ($1,$2,$3,4,$4)`, [lineageId, assignmentId, generation, seed],
  );
  await client.query(
    `INSERT INTO vocabulary_queue_lineage_event (assignment_id,lineage_id,event_type,reason)
     VALUES ($1,$2,'lineage_created','Initial v4 full-deck schedule')`, [assignmentId, lineageId],
  );
  const unseenOrder = deterministicOrder(pack.cards.map((card) => card.id), seed);
  const inserted = await client.query(
    `INSERT INTO vocabulary_practice_queue (assignment_id,package_version,lineage_id,seed,unseen_order)
     VALUES ($1,4,$2,$3,$4::jsonb) RETURNING *`, [assignmentId, lineageId, seed, JSON.stringify(unseenOrder)],
  );
  return inserted.rows[0] as QueueRow;
}

function recentHeadwordList(current: string[], headword: string) {
  const key = headword.toLocaleLowerCase("en-US");
  const next = [...current.filter((value) => value.toLocaleLowerCase("en-US") !== key), headword];
  return next.slice(-separationHeadwords);
}

function queueCandidate(queue: QueueRow, pack: Package) {
  const byId = new Map(pack.cards.map((card) => [card.id, card]));
  const recent = new Set(queue.recent_headwords.map((value) => value.toLocaleLowerCase("en-US")));
  const unseenOrder = queue.unseen_order ?? [];
  const pending = queue.pending_retries ?? [];
  const due = pending
    .map((item, index) => ({ ...item, index }))
    .filter((item) => item.dueSequence <= queue.headword_sequence && Date.parse(item.dueAt) <= Date.now())
    .sort((a, b) => a.dueSequence - b.dueSequence || a.index - b.index);
  const unseenIndex = unseenOrder.findIndex((id) => {
    const card = byId.get(id);
    return card && !recent.has(card.headword.toLocaleLowerCase("en-US"));
  });
  const forceUnseen = unseenIndex >= 0 && queue.unseen_since_revisit >= 3;
  if (due.length && !forceUnseen) return { cardId: due[0].cardId, kind: "requeue" as const, pendingIndex: due[0].index };
  if (unseenIndex >= 0) return { cardId: unseenOrder[unseenIndex], kind: "new" as const, unseenIndex };
  if (due.length) return { cardId: due[0].cardId, kind: "requeue" as const, pendingIndex: due[0].index };
  const spaced = pack.cards
    .filter((card) => !recent.has(card.headword.toLocaleLowerCase("en-US")))
    .map((card) => card.id);
  const scheduleFallback = spaced.length ? spaced : pack.cards.map((card) => card.id);
  return { cardId: scheduleFallback[0], kind: "review" as const };
}

function publicContextCard(card: Card) {
  return {
    id: card.id, headword: card.headword, classification: card.classification,
    teachingFocus: card.teachingFocus, priority: card.priority,
    frequencyBand: card.frequencyBand, frequencyReference: card.frequencyReference,
    wordForms: card.wordForms, bookOccurrences: card.bookOccurrences,
    bookTestCoverage: card.bookTestCoverage, skillOccurrences: card.skillOccurrences,
    sourceRows: card.sourceRows, example: card.example ?? null,
  };
}

async function createAttempt(client: PoolClient, assignmentId: string, learnerId: string, previousAttemptId: string | null = null, missedOnly = false) {
  const assignment = await client.query("SELECT id,package_version,assignment_title FROM vocabulary_assignment WHERE id=$1 AND learner_id=$2 AND revoked_at IS NULL FOR UPDATE", [assignmentId, learnerId]);
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
     VALUES ($1,$2,$3,$4,$5::jsonb,'active')
     RETURNING id,attempt_number,previous_attempt_id,package_version,card_order,status,created_at`,
    [assignmentId, Number(numberResult.rows[0].n), previous?.id ?? null, pack.version, JSON.stringify(cardOrder)],
  );
  return { ...inserted.rows[0], assignment_title: assignment.rows[0].assignment_title };
}

function orderedUniqueHeadwords(values: string[], headword: string) {
  return recentHeadwordList(values, headword);
}

async function createV4Attempt(client: PoolClient, assignmentId: string, learnerId: string, previousAttemptId: string | null = null) {
  const assignment = await client.query(
    "SELECT id,package_version,assignment_title FROM vocabulary_assignment WHERE id=$1 AND learner_id=$2 AND revoked_at IS NULL FOR UPDATE",
    [assignmentId, learnerId],
  );
  if (!assignment.rows[0]) throw new VocabularyError("assignment_unavailable", 404);
  if (Number(assignment.rows[0].package_version) !== 4) throw new VocabularyError("package_unavailable", 503);
  const pack = vocabularyPackage(4);
  const queue = await ensureQueue(client, assignmentId, pack);
  await archiveLegacyAttempt(client, assignmentId, queue.lineage_id);
  const latest = await client.query(
    "SELECT id,status,package_version FROM vocabulary_attempt WHERE assignment_id=$1 AND status<>'archived' ORDER BY attempt_number DESC LIMIT 1",
    [assignmentId],
  );
  if (previousAttemptId && (!latest.rows[0] || String(latest.rows[0].id) !== previousAttemptId || latest.rows[0].status !== "completed")) {
    throw new VocabularyError("batch_not_complete");
  }
  if (latest.rows[0]?.status === "active") throw new VocabularyError("batch_already_active");
  const numberResult = await client.query("SELECT COALESCE(max(attempt_number),0)+1 AS n FROM vocabulary_attempt WHERE assignment_id=$1", [assignmentId]);
  const inserted = await client.query(
    `INSERT INTO vocabulary_attempt (assignment_id,attempt_number,previous_attempt_id,package_version,card_order,status)
     VALUES ($1,$2,$3,4,'[]'::jsonb,'active')
     RETURNING id,attempt_number,previous_attempt_id,package_version,card_order,status,created_at,completed_at`,
    [assignmentId, Number(numberResult.rows[0].n), latest.rows[0]?.id ?? null],
  );
  await client.query("UPDATE vocabulary_practice_queue SET batch_exposure_count=0,current_exposure_id=NULL,updated_at=now() WHERE assignment_id=$1", [assignmentId]);
  const freshQueue = (await client.query("SELECT * FROM vocabulary_practice_queue WHERE assignment_id=$1 FOR UPDATE", [assignmentId])).rows[0] as QueueRow;
  await presentNextV4Exposure(client, assignmentId, inserted.rows[0].id, freshQueue, pack);
  return { ...inserted.rows[0], assignment_title: assignment.rows[0].assignment_title };
}

async function resolveV4Exposure(client: PoolClient, learnerId: string, attemptId: string, exposureId: string, kind: "answered" | "skipped", chosenPart?: Part) {
  const attempt = await client.query(
    `SELECT t.id,t.assignment_id,t.card_order,a.package_version
     FROM vocabulary_attempt t JOIN vocabulary_assignment a ON a.id=t.assignment_id
     WHERE t.id=$1 AND a.learner_id=$2 AND a.revoked_at IS NULL AND t.status='active' AND t.package_version=4 FOR UPDATE`,
    [attemptId, learnerId],
  );
  if (!attempt.rows[0]) throw new VocabularyError("attempt_unavailable", 404);
  const assignmentId = String(attempt.rows[0].assignment_id);
  const queueResult = await client.query("SELECT * FROM vocabulary_practice_queue WHERE assignment_id=$1 FOR UPDATE", [assignmentId]);
  const queue = queueResult.rows[0] as QueueRow | undefined;
  if (!queue || queue.current_exposure_id !== exposureId) throw new VocabularyError("exposure_unavailable", 404);
  const presented = await client.query(
    `SELECT card_id,headword,queue_sequence,exposure_kind FROM vocabulary_practice_event
     WHERE assignment_id=$1 AND attempt_id=$2 AND exposure_id=$3 AND event_type='presented'`,
    [assignmentId, attemptId, exposureId],
  );
  if (!presented.rows[0]) throw new VocabularyError("exposure_unavailable", 404);
  const existing = await client.query("SELECT event_type FROM vocabulary_practice_event WHERE exposure_id=$1 AND event_type IN ('answered','skipped')", [exposureId]);
  if (existing.rowCount) throw new VocabularyError("exposure_already_resolved");
  const card = vocabularyPackage(4).cards.find((item) => item.id === String(presented.rows[0].card_id));
  if (!card) throw new VocabularyError("package_unavailable", 503);
  const expected = card.targetPart ?? card.partsOfSpeech[0];
  const isCorrect = kind === "answered" && chosenPart === expected;
  await client.query(
    `INSERT INTO vocabulary_practice_event
       (assignment_id,lineage_id,attempt_id,exposure_id,queue_sequence,card_id,headword,event_type,selected_part,is_correct)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [assignmentId, queue.lineage_id, attemptId, exposureId, presented.rows[0].queue_sequence, card.id, card.headword, kind,
      kind === "answered" ? chosenPart : null, kind === "answered" ? isCorrect : null],
  );
  const schedule = await client.query(
    "SELECT exposure_count,next_due_at FROM vocabulary_item_schedule WHERE assignment_id=$1 AND lineage_id=$2 AND card_id=$3 FOR UPDATE",
    [assignmentId, queue.lineage_id, card.id],
  );
  const previousSuccesses = Number(schedule.rows[0]?.exposure_count ?? 0);
  const successCount = previousSuccesses + (isCorrect ? 1 : 0);
  const dueDays = isCorrect ? reviewIntervalsDays[Math.min(successCount - 1, reviewIntervalsDays.length - 1)] : 1;
  await client.query(
    `INSERT INTO vocabulary_item_schedule (assignment_id,lineage_id,card_id,first_seen_at,last_seen_at,exposure_count,next_due_at)
     SELECT $1,$2,$3,p.created_at,now(),$4,now()+($5::int * interval '1 day')
     FROM vocabulary_practice_event p WHERE p.exposure_id=$6 AND p.event_type='presented'
     ON CONFLICT (assignment_id,lineage_id,card_id) DO UPDATE
       SET last_seen_at=now(),exposure_count=EXCLUDED.exposure_count,
           next_due_at=CASE WHEN $7::boolean THEN now()+($5::int * interval '1 day') ELSE vocabulary_item_schedule.next_due_at END`,
    [assignmentId, queue.lineage_id, card.id, successCount, dueDays, exposureId, isCorrect],
  );
  if (!isCorrect) {
    const min = kind === "skipped" ? 2 : 3;
    // One forced unseen card can keep the full deck moving without starving
    // unseen coverage, while these interior bounds still guarantee a return
    // within the contract's 3-5 / 2-4 different-headword windows.
    const max = kind === "skipped" ? 3 : 4;
    const delay = boundedDelay(queue.seed, Number(presented.rows[0].queue_sequence), min, max);
    const retries = [...(queue.pending_retries ?? []), {
      cardId: card.id, headword: card.headword, dueSequence: Number(queue.headword_sequence) + delay,
      dueAt: new Date().toISOString(), kind: kind === "skipped" ? "skipped" : "missed",
    }];
    await client.query("UPDATE vocabulary_practice_queue SET pending_retries=$2::jsonb,updated_at=now() WHERE assignment_id=$1", [assignmentId, JSON.stringify(retries)]);
  }
  return { isCorrect, expectedPart: expected, exposureKind: String(presented.rows[0].exposure_kind ?? "") };
}

async function advanceV4Batch(client: PoolClient, learnerId: string, attemptId: string) {
  const attempt = await client.query(
    `SELECT t.assignment_id,t.card_order FROM vocabulary_attempt t
     JOIN vocabulary_assignment a ON a.id=t.assignment_id
     WHERE t.id=$1 AND a.learner_id=$2 AND a.revoked_at IS NULL AND t.status='active' AND t.package_version=4 FOR UPDATE`,
    [attemptId, learnerId],
  );
  if (!attempt.rows[0]) throw new VocabularyError("attempt_unavailable", 404);
  const assignmentId = String(attempt.rows[0].assignment_id);
  const queue = (await client.query("SELECT * FROM vocabulary_practice_queue WHERE assignment_id=$1 FOR UPDATE", [assignmentId])).rows[0] as QueueRow;
  const current = queue.current_exposure_id;
  if (current) {
    const resolved = await client.query("SELECT 1 FROM vocabulary_practice_event WHERE exposure_id=$1 AND event_type IN ('answered','skipped')", [current]);
    if (!resolved.rowCount) throw new VocabularyError("answer_or_skip_required");
  }
  const order = attempt.rows[0].card_order as string[];
  if (order.length >= roundSize) {
    await client.query("UPDATE vocabulary_attempt SET status='completed',completed_at=now() WHERE id=$1", [attemptId]);
    await client.query("UPDATE vocabulary_practice_queue SET current_exposure_id=NULL,updated_at=now() WHERE assignment_id=$1", [assignmentId]);
    return { completed: true, nextExposureId: null };
  }
  await client.query("UPDATE vocabulary_practice_queue SET current_exposure_id=NULL WHERE assignment_id=$1", [assignmentId]);
  const cleared = (await client.query("SELECT * FROM vocabulary_practice_queue WHERE assignment_id=$1 FOR UPDATE", [assignmentId])).rows[0] as QueueRow;
  const next = await presentNextV4Exposure(client, assignmentId, attemptId, cleared, vocabularyPackage(4));
  return { completed: false, nextExposureId: next?.exposureId ?? null };
}

async function presentNextV4Exposure(client: PoolClient, assignmentId: string, attemptId: string, queue: QueueRow, pack: Package) {
  const lockedQueue = await client.query("SELECT * FROM vocabulary_practice_queue WHERE assignment_id=$1 FOR UPDATE", [assignmentId]);
  if (!lockedQueue.rows[0]) throw new VocabularyError("queue_unavailable", 503);
  queue = lockedQueue.rows[0] as QueueRow;
  const batch = await client.query("SELECT card_order FROM vocabulary_attempt WHERE id=$1 AND assignment_id=$2 FOR UPDATE", [attemptId, assignmentId]);
  const order = (batch.rows[0]?.card_order as string[] | undefined) ?? [];
  if (order.length >= roundSize) return null;
  if (queue.current_exposure_id) {
    const resolved = await client.query(
      "SELECT 1 FROM vocabulary_practice_event WHERE exposure_id=$1 AND event_type IN ('answered','skipped') LIMIT 1",
      [queue.current_exposure_id],
    );
    if (!resolved.rowCount) throw new VocabularyError("exposure_already_open");
  }
  let candidate = queueCandidate(queue, pack);
  const hasUnseen = (queue.unseen_order ?? []).length > 0;
  const recentKeys = new Set((queue.recent_headwords ?? []).map((value) => value.toLocaleLowerCase("en-US")));
  let scheduledCardId: string | undefined;
  const forceUnseen = candidate.kind === "new" && queue.unseen_since_revisit >= 3;
  if (candidate.kind !== "requeue" && !forceUnseen) {
    const scheduled = await client.query(
      `SELECT s.card_id FROM vocabulary_item_schedule s
       WHERE s.assignment_id=$1 AND s.lineage_id=$2 AND s.next_due_at<=now()
       ORDER BY (s.next_due_at<=now()) DESC,s.next_due_at,s.last_seen_at,s.card_id`,
      [assignmentId, queue.lineage_id],
    );
    scheduledCardId = scheduled.rows.map((row) => String(row.card_id)).find((id) => {
      const scheduledCard = pack.cards.find((item) => item.id === id);
      return scheduledCard && !recentKeys.has(scheduledCard.headword.toLocaleLowerCase("en-US"));
    });
  }
  if (scheduledCardId) candidate = { cardId: scheduledCardId, kind: "review" as const };
  else if (candidate.kind === "review" || (!hasUnseen && candidate.kind !== "requeue")) {
    const scheduled = await client.query(
      `SELECT s.card_id FROM vocabulary_item_schedule s
       WHERE s.assignment_id=$1 AND s.lineage_id=$2
       ORDER BY (s.next_due_at<=now()) DESC,s.next_due_at,s.last_seen_at,s.card_id`,
      [assignmentId, queue.lineage_id],
    );
    const eligible = scheduled.rows.map((row) => String(row.card_id)).find((id) => {
      const item = pack.cards.find((entry) => entry.id === id);
      return item && !recentKeys.has(item.headword.toLocaleLowerCase("en-US"));
    });
    if (!eligible) throw new VocabularyError("queue_unavailable", 503);
    candidate = { ...candidate, cardId: eligible };
  }
  const card = pack.cards.find((item) => item.id === candidate.cardId);
  if (!card) throw new VocabularyError("queue_unavailable", 503);
  const exposureId = randomUUID();
  const sequence = Number(queue.exposure_sequence) + 1;
  const seenBefore = await client.query(
    "SELECT 1 FROM vocabulary_practice_event WHERE assignment_id=$1 AND event_type='presented' AND card_id=$2 LIMIT 1",
    [assignmentId, card.id],
  );
  const exposureKind = candidate.kind === "requeue" ? "requeue" : seenBefore.rowCount ? "review" : candidate.kind;
  const recent = orderedUniqueHeadwords(queue.recent_headwords ?? [], card.headword);
  const headwordStep = (queue.recent_headwords ?? []).some((value) => value.toLocaleLowerCase("en-US") === card.headword.toLocaleLowerCase("en-US")) ? 0 : 1;
  const pending = [...(queue.pending_retries ?? [])];
  const unseenOrder = [...(queue.unseen_order ?? [])];
  let unseenSinceRevisit = Number(queue.unseen_since_revisit);
  if (candidate.kind === "new" && candidate.unseenIndex !== undefined) {
    unseenOrder.splice(candidate.unseenIndex, 1);
    unseenSinceRevisit = 0;
  } else if (candidate.kind === "requeue" && candidate.pendingIndex !== undefined) {
    pending.splice(candidate.pendingIndex, 1);
    unseenSinceRevisit += 1;
  } else {
    unseenSinceRevisit += 1;
  }
  await client.query(
    `INSERT INTO vocabulary_practice_event
       (assignment_id,lineage_id,attempt_id,exposure_id,queue_sequence,card_id,headword,event_type,exposure_kind)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'presented',$8)`,
    [assignmentId, queue.lineage_id, attemptId, exposureId, sequence, card.id, card.headword, exposureKind],
  );
  await client.query(
    `UPDATE vocabulary_practice_queue SET unseen_order=$2::jsonb,pending_retries=$3::jsonb,
       recent_headwords=$4,headword_sequence=headword_sequence+$8,exposure_sequence=$5,
       unseen_since_revisit=$6,batch_exposure_count=batch_exposure_count+1,
       current_exposure_id=$7,updated_at=now() WHERE assignment_id=$1`,
    [assignmentId, JSON.stringify(unseenOrder), JSON.stringify(pending), recent, sequence, unseenSinceRevisit, exposureId, headwordStep],
  );
  await client.query("UPDATE vocabulary_attempt SET card_order=card_order || $2::jsonb WHERE id=$1", [attemptId, JSON.stringify([card.id])]);
  return { exposureId, cardId: card.id, sequence, exposureKind };
}

async function practiceStats(client: PoolClient, assignmentId: string, lineageId: string) {
  const result = await client.query(
    `SELECT to_char(r.created_at AT TIME ZONE 'Asia/Jakarta','YYYY-MM-DD') AS practice_day,
       count(*) FILTER (WHERE p.exposure_kind IN ('new','review'))::int AS target_count,
       count(*) FILTER (WHERE p.exposure_kind='new')::int AS new_count,
       count(*) FILTER (WHERE p.exposure_kind IN ('review','requeue'))::int AS revisited_count
     FROM vocabulary_practice_event r
     JOIN vocabulary_practice_event p ON p.exposure_id=r.exposure_id AND p.event_type='presented'
     WHERE r.assignment_id=$1 AND r.lineage_id=$2 AND r.event_type='answered'
     GROUP BY to_char(r.created_at AT TIME ZONE 'Asia/Jakarta','YYYY-MM-DD')
     ORDER BY practice_day DESC`, [assignmentId, lineageId],
  );
  const rows = result.rows as Array<{ practice_day: string; target_count: number; new_count: number; revisited_count: number }>;
  const todayResult = await client.query("SELECT to_char(now() AT TIME ZONE 'Asia/Jakarta','YYYY-MM-DD') AS day");
  const today = String(todayResult.rows[0].day);
  const todayRow = rows.find((row) => row.practice_day === today);
  let streak = 0;
  const yesterdayResult = await client.query("SELECT to_char((now() AT TIME ZONE 'Asia/Jakarta')::date - 1,'YYYY-MM-DD') AS day");
  const start = todayRow && Number(todayRow.target_count) >= roundSize ? today : String(yesterdayResult.rows[0].day);
  let expected = start;
  for (const row of rows) {
    if (row.practice_day !== expected || Number(row.target_count) < roundSize) break;
    streak += 1;
    const previousDay = await client.query("SELECT to_char($1::date - 1,'YYYY-MM-DD') AS day", [expected]);
    expected = String(previousDay.rows[0].day);
  }
  return { dailyTarget: roundSize, todayCount: Math.min(roundSize, Number(todayRow?.target_count ?? 0)), practiceDayStreak: streak,
    newExposuresToday: Number(todayRow?.new_count ?? 0), revisitedExposuresToday: Number(todayRow?.revisited_count ?? 0) };
}

async function legacyAttemptState(client: PoolClient, learnerId: string, assignmentId: string, attemptId?: string) {
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

async function archiveLegacyAttempt(client: PoolClient, assignmentId: string, lineageId: string) {
  const archived = await client.query(
    `UPDATE vocabulary_attempt SET status='archived',archived_at=now(),archived_by=NULL
     WHERE assignment_id=$1 AND package_version<4 AND status='active' RETURNING id`, [assignmentId],
  );
  for (const row of archived.rows) {
    await client.query(
      `INSERT INTO vocabulary_queue_lineage_event (assignment_id,lineage_id,event_type,attempt_id,reason)
       VALUES ($1,$2,'legacy_attempt_archived',$3,'Active v1-v3 attempt preserved and transitioned to v4 queue')`,
      [assignmentId, lineageId, row.id],
    );
  }
}

async function v4AttemptState(client: PoolClient, learnerId: string, assignmentId: string, requestedAttemptId?: string) {
  const pack = vocabularyPackage(4);
  let queue = await ensureQueue(client, assignmentId, pack);
  await archiveLegacyAttempt(client, assignmentId, queue.lineage_id);
  let runResult;
  if (requestedAttemptId) {
    runResult = await client.query(
      `SELECT t.id,t.attempt_number,t.previous_attempt_id,t.card_order,t.status,t.created_at,t.completed_at,
         a.assignment_title,t.package_version
       FROM vocabulary_attempt t JOIN vocabulary_assignment a ON a.id=t.assignment_id
       WHERE t.id=$1 AND t.assignment_id=$2 AND a.learner_id=$3 AND a.revoked_at IS NULL AND t.package_version=4`,
      [requestedAttemptId, assignmentId, learnerId],
    );
    if (!runResult.rows[0]) throw new VocabularyError("attempt_unavailable", 404);
  } else {
    runResult = await client.query(
      `SELECT t.id,t.attempt_number,t.previous_attempt_id,t.card_order,t.status,t.created_at,t.completed_at,
         a.assignment_title,t.package_version
       FROM vocabulary_attempt t JOIN vocabulary_assignment a ON a.id=t.assignment_id
       WHERE t.assignment_id=$1 AND a.learner_id=$2 AND a.revoked_at IS NULL AND t.status<>'archived'
       ORDER BY t.attempt_number DESC LIMIT 1`, [assignmentId, learnerId],
    );
    if (!runResult.rows[0] || Number(runResult.rows[0].package_version) < 4) {
      const created = await createV4Attempt(client, assignmentId, learnerId,
        runResult.rows[0] && runResult.rows[0].status === "completed" ? String(runResult.rows[0].id) : null);
      runResult = { rows: [created] };
    }
  }
  const run = runResult.rows[0];
  queue = (await client.query("SELECT * FROM vocabulary_practice_queue WHERE assignment_id=$1 FOR UPDATE", [assignmentId])).rows[0] as QueueRow;
  if (run.status === "active" && !queue.current_exposure_id) {
    await presentNextV4Exposure(client, assignmentId, run.id, queue, pack);
  }
  const queueResult = await client.query("SELECT * FROM vocabulary_practice_queue WHERE assignment_id=$1", [assignmentId]);
  const activeQueue = queueResult.rows[0] as QueueRow;
  const events = await client.query(
    `SELECT p.exposure_id,p.queue_sequence,p.card_id,p.headword,p.exposure_kind,p.created_at AS presented_at,
       r.event_type AS resolution_type,r.selected_part,r.is_correct,r.created_at AS resolved_at
     FROM vocabulary_practice_event p
     LEFT JOIN vocabulary_practice_event r ON r.exposure_id=p.exposure_id AND r.event_type IN ('answered','skipped')
     WHERE p.attempt_id=$1 AND p.event_type='presented' ORDER BY p.queue_sequence,p.id`, [run.id],
  );
  const cardById = new Map(pack.cards.map((card) => [card.id, card]));
  const exposures = events.rows.map((event) => {
    const card = cardById.get(String(event.card_id));
    if (!card) throw new VocabularyError("package_unavailable", 503);
    const resolved = Boolean(event.resolution_type);
    return {
      exposureId: String(event.exposure_id), sequence: Number(event.queue_sequence),
      exposureKind: event.exposure_kind as string, status: event.resolution_type === "answered" ? "answered" : event.resolution_type === "skipped" ? "skipped" : "open",
      selectedPart: event.resolution_type === "answered" ? event.selected_part as Part : null,
      isCorrect: event.resolution_type === "answered" ? Boolean(event.is_correct) : null,
      expectedPart: resolved ? card.targetPart ?? card.partsOfSpeech[0] : null,
      presentedAt: new Date(event.presented_at).toISOString(),
      card: publicContextCard(card),
    };
  });
  return {
    assignment: { id: assignmentId, title: run.assignment_title as string },
    attempt: { id: String(run.id), number: Number(run.attempt_number), previousAttemptId: run.previous_attempt_id ? String(run.previous_attempt_id) : null,
      status: run.status as string, createdAt: new Date(run.created_at).toISOString(), completedAt: run.completed_at ? new Date(run.completed_at).toISOString() : null,
      cardOrder: run.card_order as string[] },
    packageVersion: 4, isContextualQueue: true, lineageId: String(activeQueue.lineage_id),
    batchExposureCount: Number(activeQueue.batch_exposure_count), currentExposureId: activeQueue.current_exposure_id,
    exposures, stats: await practiceStats(client, assignmentId, String(activeQueue.lineage_id)), prompt: pack.prompt,
  };
}

async function attemptState(client: PoolClient, learnerId: string, assignmentId: string, attemptId?: string) {
  if (attemptId) {
    const version = await client.query("SELECT package_version FROM vocabulary_attempt WHERE id=$1 AND assignment_id=$2", [attemptId, assignmentId]);
    if (!version.rows[0]) throw new VocabularyError("attempt_unavailable", 404);
    if (Number(version.rows[0].package_version) < 4) return legacyAttemptState(client, learnerId, assignmentId, attemptId);
  }
  return v4AttemptState(client, learnerId, assignmentId, attemptId);
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
  try {
    await client.query("BEGIN");
    const allowed = await client.query("SELECT id FROM vocabulary_assignment WHERE id=$1 AND learner_id=$2 AND revoked_at IS NULL FOR UPDATE", [assignmentId, learnerId]);
    if (!allowed.rowCount) throw new VocabularyError("assignment_unavailable", 404);
    const result = await attemptState(client, learnerId, assignmentId, attemptId);
    await client.query("COMMIT"); return result;
  }
  catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

export async function answerVocabularyExposure(learnerId: string, attemptId: string, exposureId: string, selectedPart: Part) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await resolveV4Exposure(client, learnerId, attemptId, exposureId, "answered", selectedPart);
    await client.query("COMMIT");
    return { isCorrect: result.isCorrect, expectedPart: result.expectedPart };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

export async function skipVocabularyExposure(learnerId: string, attemptId: string, exposureId: string) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await resolveV4Exposure(client, learnerId, attemptId, exposureId, "skipped");
    const result = await advanceV4Batch(client, learnerId, attemptId);
    await client.query("COMMIT"); return result;
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

export async function advanceVocabularyExposure(learnerId: string, attemptId: string) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await advanceV4Batch(client, learnerId, attemptId);
    await client.query("COMMIT"); return result;
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

export async function nextVocabularyBatch(learnerId: string, assignmentId: string, previousAttemptId: string) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await createV4Attempt(client, assignmentId, learnerId, previousAttemptId);
    await client.query("COMMIT");
    return { attemptId: String(result.id), number: Number(result.attempt_number) };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

export async function recordVocabularyOpen(learnerId: string, attemptId: string, cardId: string) {
  const result = await getPool().query(
    `INSERT INTO vocabulary_event (attempt_id,card_id,event_type)
     SELECT t.id,$3,'opened' FROM vocabulary_attempt t JOIN vocabulary_assignment a ON a.id=t.assignment_id
     WHERE t.id=$1 AND a.learner_id=$2 AND a.revoked_at IS NULL AND t.status='active' AND t.package_version<4 AND t.card_order ? $3
     RETURNING id`, [attemptId, learnerId, cardId],
  );
  if (!result.rowCount) throw new VocabularyError("card_unavailable", 404);
}

export async function answerVocabularyCard(learnerId: string, attemptId: string, cardId: string, selected: Part[]) {
  const attempt = await getPool().query(
    `SELECT t.package_version FROM vocabulary_attempt t JOIN vocabulary_assignment a ON a.id=t.assignment_id
     WHERE t.id=$1 AND a.learner_id=$2 AND a.revoked_at IS NULL AND t.status='active' AND t.package_version<4 AND t.card_order ? $3
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
     WHERE t.id=$1 AND a.learner_id=$2 AND a.revoked_at IS NULL AND t.status='active' AND t.package_version<4 AND t.card_order ? $3
       AND EXISTS(SELECT 1 FROM vocabulary_event e WHERE e.attempt_id=t.id AND e.card_id=$3 AND e.event_type='opened')
     RETURNING id`, [attemptId, learnerId, cardId, selectedParts, isCorrect],
  );
  if (!result.rowCount) throw new VocabularyError("card_unavailable", 404);
  return { isCorrect, expectedParts: card.partsOfSpeech };
}

export async function finishVocabularyRound(learnerId: string, attemptId: string) {
  const result = await getPool().query(
    `UPDATE vocabulary_attempt t SET status='completed',completed_at=now()
     FROM vocabulary_assignment a WHERE t.id=$1 AND a.id=t.assignment_id AND a.learner_id=$2 AND a.revoked_at IS NULL AND t.status='active' AND t.package_version<4
     RETURNING t.assignment_id`, [attemptId, learnerId],
  );
  if (!result.rowCount) throw new VocabularyError("attempt_unavailable", 404);
  return { completed: true };
}

export async function nextVocabularyRound(learnerId: string, assignmentId: string, previousAttemptId: string, missedOnly: boolean) {
  const db = getPool(); const client = await db.connect();
  try {
    await client.query("BEGIN");
    const assignment = await client.query("SELECT id,package_version FROM vocabulary_assignment WHERE id=$1 AND learner_id=$2 AND revoked_at IS NULL FOR UPDATE", [assignmentId, learnerId]);
    if (!assignment.rowCount) throw new VocabularyError("assignment_unavailable", 404);
    if (Number(assignment.rows[0].package_version) >= 4) throw new VocabularyError("v4_action_required");
    const result = await createAttempt(client, assignmentId, learnerId, previousAttemptId, missedOnly);
    await client.query("COMMIT");
    return { attemptId: String(result.id), number: Number(result.attempt_number) };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

export async function createVocabularyCode(staffId: string, deckId: string, inviteKind: "private" | "classroom", title: string) {
  const code = generateVocabularyCode();
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
         'attempts',(SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id',t.id,'number',t.attempt_number,'status',t.status,'createdAt',t.created_at,'completedAt',t.completed_at,'archivedAt',t.archived_at,
           'presented',CASE WHEN t.package_version=4 THEN (SELECT count(*)::int FROM vocabulary_practice_event p WHERE p.attempt_id=t.id AND p.event_type='presented') ELSE (SELECT count(*)::int FROM vocabulary_event e WHERE e.attempt_id=t.id AND e.event_type='opened') END,
           'right',CASE WHEN t.package_version=4 THEN (SELECT count(*)::int FROM vocabulary_practice_event p WHERE p.attempt_id=t.id AND p.event_type='answered' AND p.is_correct=true) ELSE (SELECT count(*)::int FROM vocabulary_event e WHERE e.attempt_id=t.id AND e.event_type='answered' AND e.is_correct=true) END,
           'wrong',CASE WHEN t.package_version=4 THEN (SELECT count(*)::int FROM vocabulary_practice_event p WHERE p.attempt_id=t.id AND p.event_type='answered' AND p.is_correct=false) ELSE (SELECT count(*)::int FROM vocabulary_event e WHERE e.attempt_id=t.id AND e.event_type='answered' AND e.is_correct=false) END,
           'open',CASE WHEN t.package_version=4 THEN (SELECT count(*)::int FROM vocabulary_practice_event p WHERE p.attempt_id=t.id AND p.event_type='presented' AND NOT EXISTS (SELECT 1 FROM vocabulary_practice_event r WHERE r.exposure_id=p.exposure_id AND r.event_type IN ('answered','skipped'))) ELSE (SELECT count(*)::int FROM vocabulary_event e WHERE e.attempt_id=t.id AND e.event_type='opened' AND NOT EXISTS (SELECT 1 FROM vocabulary_event r WHERE r.attempt_id=t.id AND r.card_id=e.card_id AND r.event_type='answered')) END
         ) ORDER BY t.attempt_number DESC),'[]'::jsonb) FROM vocabulary_attempt t WHERE t.assignment_id=a.id)
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
     WHERE a.id=$1 AND ($3='admin' OR i.created_by=$2)`, [assignmentId, staffId, role],
  );
  if (!allowed.rows[0]) throw new VocabularyError("assignment_unavailable", 404);
  const attempt = await getPool().query("SELECT id,assignment_id,status,package_version,card_order FROM vocabulary_attempt WHERE id=$1 AND assignment_id=$2", [attemptId, assignmentId]);
  if (!attempt.rows[0]) throw new VocabularyError("attempt_unavailable", 404);
  const pack = vocabularyPackage(Number(attempt.rows[0].package_version));
  const cardById = new Map(pack.cards.map((card) => [card.id, card]));
  if (Number(attempt.rows[0].package_version) === 4) {
    const events = await getPool().query(
      `SELECT p.exposure_id,p.card_id,p.exposure_kind,p.queue_sequence,p.created_at AS presented_at,
         r.event_type AS resolution_type,r.selected_part,r.is_correct,r.created_at AS resolved_at
       FROM vocabulary_practice_event p
       LEFT JOIN vocabulary_practice_event r ON r.exposure_id=p.exposure_id AND r.event_type IN ('answered','skipped')
       WHERE p.attempt_id=$1 AND p.event_type='presented' ORDER BY p.queue_sequence,p.id`, [attemptId],
    );
    const cards = events.rows.map((row) => {
      const card = cardById.get(String(row.card_id));
      if (!card) return null;
      const answered = row.resolution_type === "answered";
      return {
        id: String(row.exposure_id), cardId: card.id, headword: card.headword,
        sourcePartsOfSpeech: card.partsOfSpeech, targetPart: card.targetPart ?? card.partsOfSpeech[0],
        example: card.example ?? null, opened: true, openEvents: 1,
        selectedParts: answered ? [row.selected_part as Part] : null,
        isCorrect: answered ? Boolean(row.is_correct) : null,
        status: answered ? "answered" : row.resolution_type === "skipped" ? "skipped" : "open",
        exposureKind: row.exposure_kind as string,
        responseTrail: answered ? [{ selectedParts: [row.selected_part as Part], isCorrect: Boolean(row.is_correct), answeredAt: new Date(row.resolved_at).toISOString() }] : [],
        lastSeen: new Date(row.resolved_at ?? row.presented_at).toISOString(),
      };
    }).filter(Boolean);
    return { learnerName: allowed.rows[0].display_name as string, assignmentTitle: allowed.rows[0].assignment_title as string, attemptStatus: attempt.rows[0].status as string, cards };
  }
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
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const allowed = await client.query(
      `SELECT a.id,a.package_version FROM vocabulary_assignment a JOIN vocabulary_invite i ON i.id=a.invite_id
       WHERE a.id=$1 AND a.revoked_at IS NULL AND ($3='admin' OR i.created_by=$2) FOR UPDATE`,
      [assignmentId, staffId, role],
    );
    if (!allowed.rows[0]) throw new VocabularyError("assignment_unavailable", 404);
    if (Number(allowed.rows[0].package_version) === 4) {
      const queueResult = await client.query("SELECT * FROM vocabulary_practice_queue WHERE assignment_id=$1 FOR UPDATE", [assignmentId]);
      const oldQueue = queueResult.rows[0] as QueueRow | undefined;
      if (!oldQueue) throw new VocabularyError("attempt_unavailable", 404);
      const archived = await client.query(
        `UPDATE vocabulary_attempt SET status='archived',archived_at=now(),archived_by=$2
         WHERE assignment_id=$1 AND package_version=4 AND status<>'archived' RETURNING id`, [assignmentId, staffId],
      );
      const nextGeneration = await client.query("SELECT COALESCE(max(generation),0)+1 AS n FROM vocabulary_queue_lineage WHERE assignment_id=$1", [assignmentId]);
      const newLineageId = randomUUID();
      const seed = randomBytes(32).toString("hex");
      await client.query(
        `INSERT INTO vocabulary_queue_lineage (id,assignment_id,generation,package_version,seed)
         VALUES ($1,$2,$3,4,$4)`, [newLineageId, assignmentId, Number(nextGeneration.rows[0].n), seed],
      );
      await client.query(
        `INSERT INTO vocabulary_queue_lineage_event (assignment_id,lineage_id,event_type,actor_id,related_lineage_id,reason)
         VALUES ($1,$2,'teacher_reset',$3,$4,'Teacher archived the active practice lineage and started a clean full-deck queue')`,
        [assignmentId, oldQueue.lineage_id, staffId, newLineageId],
      );
      await client.query(
        `INSERT INTO vocabulary_queue_lineage_event (assignment_id,lineage_id,event_type,actor_id,related_lineage_id,reason)
         VALUES ($1,$2,'lineage_created',$3,$4,'New full-deck queue created by teacher reset')`,
        [assignmentId, newLineageId, staffId, oldQueue.lineage_id],
      );
      await client.query(
        `UPDATE vocabulary_practice_queue SET lineage_id=$2,seed=$3,unseen_order=$4::jsonb,pending_retries='[]'::jsonb,
           recent_headwords='{}',headword_sequence=0,exposure_sequence=0,unseen_since_revisit=0,
           batch_exposure_count=0,current_exposure_id=NULL,updated_at=now() WHERE assignment_id=$1`,
        [assignmentId, newLineageId, seed, JSON.stringify(deterministicOrder(vocabularyPackage(4).cards.map((card) => card.id), seed))],
      );
      await client.query("COMMIT");
      return { archivedAttemptId: archived.rows[0] ? String(archived.rows[0].id) : null, archivedLineageId: oldQueue.lineage_id, newLineageId };
    }
    const result = await client.query(
      `WITH latest AS (
         SELECT id FROM vocabulary_attempt WHERE assignment_id=$1 AND status<>'archived' ORDER BY attempt_number DESC LIMIT 1
       )
       UPDATE vocabulary_attempt t SET status='archived',archived_at=now(),archived_by=$2
       FROM latest WHERE t.id=latest.id RETURNING t.id`, [assignmentId, staffId],
    );
    if (!result.rowCount) throw new VocabularyError("attempt_unavailable", 404);
    await client.query("COMMIT");
    return { archivedAttemptId: String(result.rows[0].id) };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
