import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { getPool } from "@/adapters/db/client";
import { convertedSectionRange, convertedTotalRange, type ScoreRangeRow } from "../application/diagnostic-scoring";

const root = join(process.cwd(), "apps/protefl-center/content/ets-volume3-practice-test-a-v1");
const packageCode = "ets-volume3-practice-test-a";
type Section = "listening" | "structure" | "reading";
type Choice = "A" | "B" | "C" | "D";
type Keys = Record<Section, Choice[]>;

export type DiagnosticInstructions = {
  listening: { overview: string; partA: string; partB: string; partC: string };
  structure: { overview: string; time: string; partA: string; partB: string };
  reading: { overview: string; time: string; basis: string };
};

async function json<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(join(root, name), "utf8")) as T;
}
async function pinnedPackageHashes() {
  const manifest = await json<{ version: number; sourceFiles: Array<{ path: string; sha256: string }> }>("package-manifest.json");
  const hashFor = (name: string) => manifest.sourceFiles.find((file) => file.path === name)?.sha256;
  const answerKeyHash = hashFor("metadata/answer-key-practice-test-a-v1.json");
  const scoreTableHash = hashFor("metadata/score-conversion-practice-test-a-v1.json");
  const pausesHash = hashFor("metadata/listening-pauses-v1.json");
  const questionMapHash = hashFor("metadata/listening-question-map-v1.json");
  if (!answerKeyHash || !scoreTableHash || !pausesHash || !questionMapHash) throw new Error("package_manifest_invalid");
  const contentHash = createHash("sha256").update(manifest.sourceFiles.map((file) => file.path + ":" + file.sha256).join("\n")).digest("hex");
  const timingMapHash = createHash("sha256").update(pausesHash + ":" + questionMapHash).digest("hex");
  return { version: manifest.version, contentHash, answerKeyHash, scoreTableHash, timingMapHash };
}
function validQuestion(section: Section, number: number) {
  return Number.isInteger(number) && number >= 1 && number <= (section === "structure" ? 40 : 50);
}
const answerQuery = "SELECT DISTINCT ON(section,question_number) section,question_number,answer_choice FROM protefl_diagnostic_event WHERE attempt_id=$1 AND event_type='answer' ORDER BY section,question_number,id DESC";

export async function diagnosticAssignment(actorId: string) {
  const result = await getPool().query(
    "SELECT r.id,r.code,r.version,r.title,r.status,a.listening_mode,EXISTS(SELECT 1 FROM protefl_diagnostic_attempt d WHERE d.resource_id=r.id AND d.actor_id=a.actor_id) AS has_attempt FROM protefl_resource_assignment a JOIN protefl_resource r ON r.id=a.resource_id WHERE a.actor_id=$1 AND r.code=$2 AND r.kind='diagnostic_package' AND a.revoked_at IS NULL AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now()) AND (r.status='published' OR EXISTS(SELECT 1 FROM protefl_diagnostic_attempt d WHERE d.resource_id=r.id AND d.actor_id=a.actor_id)) LIMIT 1",
    [actorId, packageCode],
  );
  const row = result.rows[0];
  return row ? { id: String(row.id), code: row.code as string, version: Number(row.version), title: row.title as string, status: row.status as string, listeningMode: row.listening_mode as "autoplay" | "question_click", hasAttempt: row.has_attempt === true } : null;
}

export async function diagnosticPageIndex() {
  return json<{ questionPages: Record<Section, Record<string, number>>; readingPassages: Array<{ questions: [number, number]; page: number }>; renderedPages: Record<string, number[]> }>("metadata/page-index-v1.json");
}

export async function diagnosticInstructions() {
  return json<DiagnosticInstructions>("metadata/instructions-practice-test-a-v1.json");
}

export async function diagnosticListeningTiming() {
  const [timing, questionMap] = await Promise.all([
    json<{ audioDurationMs: number; pauses: Array<{ question: number; answerWindowStartMs: number; answerWindowEndMs: number; durationMs: number }> }>("metadata/listening-pauses-v1.json"),
    json<{ questions: Array<{ question: number; groupId: string; groupType: string; questionAudioStartMs: number; questionAudioEndMs: number; contextStartMs: number; answerWindowStartMs: number; answerWindowEndMs: number }> }>("metadata/listening-question-map-v1.json"),
  ]);
  return { ...timing, questions: questionMap.questions };
}

export async function protectedDiagnosticPage(actorId: string, attemptId: string, pageValue: string) {
  const page = Number(pageValue);
  const index = await diagnosticPageIndex();
  const allowed = new Set([...Object.values(index.questionPages).flatMap(Object.values), 20, 33, 36, 41, ...index.readingPassages.map((row) => row.page)]);
  const attempt = await diagnosticAttempt(actorId, attemptId);
  if (!Number.isInteger(page) || !allowed.has(page) || !attempt) return null;
  const permitted = attempt.status === "completed" ||
    (attempt.current_section === "listening" && [20, ...Object.values(index.questionPages.listening)].includes(page)) ||
    (attempt.current_section === "structure" && [33, 36, ...Object.values(index.questionPages.structure)].includes(page)) ||
    (attempt.current_section === "reading" && [41, ...Object.values(index.questionPages.reading), ...index.readingPassages.map((row) => row.page)].includes(page));
  if (!permitted) return null;
  try {
    return await readFile(join(root, "pages", "page-" + String(page).padStart(3, "0") + ".jpg"));
  } catch {
    return null;
  }
}

export async function diagnosticAudio(actorId: string, id: string) {
  const attempt = await diagnosticAttempt(actorId, id);
  if (!attempt || attempt.current_section !== "listening" || !attempt.listening_started_at) return null;
  try {
    return await readFile(join(root, "source/practice-test-a-listening.m4a"));
  } catch {
    return null;
  }
}

export async function latestDiagnosticAttemptState(actorId: string) {
  const row = await getPool().query(
    "SELECT d.id FROM protefl_diagnostic_attempt d JOIN protefl_resource r ON r.id=d.resource_id WHERE d.actor_id=$1 AND r.code=$2 ORDER BY d.attempt_number DESC LIMIT 1",
    [actorId, packageCode],
  );
  return row.rows[0] ? diagnosticAttemptState(actorId, String(row.rows[0].id)) : null;
}

export async function diagnosticAttempt(actorId: string, id: string) {
  const result = await getPool().query(
    "SELECT d.*,now() AS server_now FROM protefl_diagnostic_attempt d JOIN protefl_resource_assignment a ON a.resource_id=d.resource_id AND a.actor_id=d.actor_id JOIN protefl_resource r ON r.id=d.resource_id WHERE d.id=$1 AND d.actor_id=$2 AND a.revoked_at IS NULL AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now()) LIMIT 1",
    [id, actorId],
  );
  return result.rows[0] ?? null;
}

export async function startOrResumeDiagnostic(actorId: string, retake = false) {
  const db = getPool();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const access = (await client.query(
      "SELECT r.id,r.status,r.version,a.listening_mode FROM protefl_resource_assignment a JOIN protefl_resource r ON r.id=a.resource_id WHERE a.actor_id=$1 AND r.code=$2 AND r.kind='diagnostic_package' AND a.revoked_at IS NULL AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now()) FOR UPDATE OF a,r",
      [actorId, packageCode],
    )).rows[0];
    if (!access) throw new Error("resource_unavailable");
    const active = (await client.query("SELECT id FROM protefl_diagnostic_attempt WHERE resource_id=$1 AND actor_id=$2 AND status='in_progress' ORDER BY attempt_number DESC LIMIT 1 FOR UPDATE", [access.id, actorId])).rows[0];
    if (active) {
      await client.query("COMMIT");
      return { attemptId: String(active.id), resumed: true };
    }
    const latest = (await client.query("SELECT id,attempt_number,status FROM protefl_diagnostic_attempt WHERE resource_id=$1 AND actor_id=$2 ORDER BY attempt_number DESC LIMIT 1 FOR UPDATE", [access.id, actorId])).rows[0];
    // Hiding a resource stops new starts and retakes, but does not strand an
    // already assigned candidate who needs to resume an interrupted attempt.
    if (access.status !== "published") throw new Error("resource_unavailable");
    if ((latest && (!retake || latest.status !== "completed")) || (!latest && retake)) throw new Error("attempt_unavailable");
    const number = latest ? Number(latest.attempt_number) + 1 : 1;
    const hashes = await pinnedPackageHashes();
    if (hashes.version !== Number(access.version)) throw new Error("resource_unavailable");
    const inserted = (await client.query(
      "INSERT INTO protefl_diagnostic_attempt(resource_id,actor_id,attempt_number,is_primary,package_version,content_hash,answer_key_hash,score_table_hash,timing_map_hash,listening_mode) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id",
      [access.id, actorId, number, number === 1, access.version, hashes.contentHash, hashes.answerKeyHash, hashes.scoreTableHash, hashes.timingMapHash, access.listening_mode],
    )).rows[0];
    await client.query("COMMIT");
    return { attemptId: String(inserted.id), resumed: false };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error && error.message === "resource_unavailable") throw error;
    throw new Error("attempt_unavailable");
  } finally {
    client.release();
  }
}

export type DiagnosticAction =
  | { type: "begin_section"; requestId: string }
  | { type: "answer"; section: Section; question: number; choice: Choice; requestId: string }
  | { type: "audio_played"; question: number; positionMs: number; requestId: string }
  | { type: "finish_section"; requestId: string }
  | { type: "submit"; requestId: string };

export async function applyDiagnosticAction(actorId: string, attemptId: string, action: DiagnosticAction) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const attempt = (await client.query(
      "SELECT d.*,now() AS server_now FROM protefl_diagnostic_attempt d JOIN protefl_resource_assignment a ON a.resource_id=d.resource_id AND a.actor_id=d.actor_id JOIN protefl_resource r ON r.id=d.resource_id WHERE d.id=$1 AND d.actor_id=$2 AND d.status='in_progress' AND a.revoked_at IS NULL AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now()) FOR UPDATE OF d",
      [attemptId, actorId],
    )).rows[0];
    if (!attempt) throw new Error("attempt_unavailable");
    const duplicate = await client.query("SELECT id FROM protefl_diagnostic_event WHERE attempt_id=$1 AND idempotency_key=$2", [attemptId, action.requestId]);
    if (duplicate.rowCount) {
      await client.query("COMMIT");
      return;
    }
    let eventType = "";
    let section: Section | null = null;
    let question: number | null = null;
    let choice: Choice | null = null;
    let eventData: Record<string, string | number | boolean> = {};
    if (action.type === "begin_section") {
      if (attempt.current_section === "listening" && !attempt.listening_started_at) {
        await client.query("UPDATE protefl_diagnostic_attempt SET listening_started_at=now() WHERE id=$1", [attemptId]); section = "listening";
      } else if (attempt.current_section === "structure" && !attempt.structure_started_at) {
        await client.query("UPDATE protefl_diagnostic_attempt SET structure_started_at=now(),structure_deadline_at=now()+interval '25 minutes' WHERE id=$1", [attemptId]); section = "structure";
      } else if (attempt.current_section === "reading" && !attempt.reading_started_at) {
        await client.query("UPDATE protefl_diagnostic_attempt SET reading_started_at=now(),reading_deadline_at=now()+interval '55 minutes' WHERE id=$1", [attemptId]); section = "reading";
      } else throw new Error("action_unavailable");
      eventType = "section_started";
    } else if (action.type === "answer") {
      if (attempt.current_section !== action.section || !validQuestion(action.section, action.question)) throw new Error("action_unavailable");
      if (action.section === "listening" && attempt.listening_mode === "autoplay") {
        const window = await client.query(
          "SELECT created_at FROM protefl_diagnostic_event WHERE attempt_id=$1 AND event_type='audio_played' AND question_number=$2 AND event_data->>'final' IS DISTINCT FROM 'true' ORDER BY id DESC LIMIT 1",
          [attemptId, action.question],
        );
        if (!window.rows[0] || new Date(window.rows[0].created_at).getTime() + 12_000 < new Date(attempt.server_now).getTime()) throw new Error("action_unavailable");
      }
      if (action.section === "listening" && attempt.listening_mode === "question_click") {
        const heard = await client.query("SELECT id FROM protefl_diagnostic_event WHERE attempt_id=$1 AND event_type='audio_played' AND question_number=$2 LIMIT 1", [attemptId, action.question]);
        if (!heard.rowCount) throw new Error("action_unavailable");
      }
      if (action.section === "listening" && !attempt.listening_started_at) throw new Error("action_unavailable");
      if (action.section === "structure" && (!attempt.structure_started_at || new Date(attempt.structure_deadline_at).getTime() < new Date(attempt.server_now).getTime())) throw new Error("action_unavailable");
      if (action.section === "reading" && (!attempt.reading_started_at || new Date(attempt.reading_deadline_at).getTime() < new Date(attempt.server_now).getTime())) throw new Error("action_unavailable");
      eventType = "answer"; section = action.section; question = action.question; choice = action.choice;
    } else if (action.type === "audio_played") {
      if (attempt.current_section !== "listening" || !attempt.listening_started_at || !validQuestion("listening", action.question) || !Number.isInteger(action.positionMs) || action.positionMs < 0 || action.positionMs > 2102073) throw new Error("action_unavailable");
      if (attempt.listening_mode === "autoplay") {
        const timeline = await json<{ audioDurationMs: number; pauses: Array<{ question: number; answerWindowStartMs: number }> }>("metadata/listening-pauses-v1.json");
        const expected = timeline.pauses[action.question - 1];
        const prior = await client.query("SELECT max(question_number)::int AS question FROM protefl_diagnostic_event WHERE attempt_id=$1 AND event_type='audio_played' AND event_data->>'final' IS DISTINCT FROM 'true'", [attemptId]);
        const lastQuestion = Number(prior.rows[0].question ?? 0);
        const finalMarker = action.question === 50 && action.positionMs >= timeline.audioDurationMs - 1000 && lastQuestion === 50;
        const sequential = action.question === lastQuestion + 1;
        const positioned = expected && Math.abs(action.positionMs - expected.answerWindowStartMs) <= 500;
        const elapsed = new Date(attempt.server_now).getTime() - new Date(attempt.listening_started_at).getTime();
        if ((!finalMarker && (!sequential || !positioned || elapsed < expected.answerWindowStartMs - 1000)) || (finalMarker && !sequential && lastQuestion !== 50)) throw new Error("action_unavailable");
        eventData = finalMarker ? { positionMs: action.positionMs, final: true } : { positionMs: action.positionMs };
      } else eventData = { positionMs: action.positionMs };
      eventType = "audio_played"; section = "listening"; question = action.question;
    } else if (action.type === "finish_section") {
      if (attempt.current_section === "listening" && attempt.listening_started_at) {
        if (attempt.listening_mode === "question_click") {
          const heard = await client.query("SELECT count(DISTINCT question_number)::int AS count FROM protefl_diagnostic_event WHERE attempt_id=$1 AND event_type='audio_played'", [attemptId]);
          if (Number(heard.rows[0].count) < 50) throw new Error("listening_incomplete");
        } else {
          const progress = await client.query("SELECT max((event_data->>'positionMs')::int) AS position FROM protefl_diagnostic_event WHERE attempt_id=$1 AND event_type='audio_played'", [attemptId]);
          const audioPosition = Number(progress.rows[0].position ?? 0);
          const elapsed = new Date(attempt.server_now).getTime() - new Date(attempt.listening_started_at).getTime();
          if (audioPosition < 2_101_073 || elapsed < 2_101_073) throw new Error("listening_incomplete");
        }
        await client.query("UPDATE protefl_diagnostic_attempt SET current_section='structure' WHERE id=$1", [attemptId]); section = "listening";
      } else if (attempt.current_section === "structure" && attempt.structure_started_at) {
        await client.query("UPDATE protefl_diagnostic_attempt SET current_section='reading' WHERE id=$1", [attemptId]); section = "structure";
      } else throw new Error("action_unavailable");
      eventType = "section_finished";
    } else {
      if (attempt.current_section !== "reading" || !attempt.reading_started_at) throw new Error("action_unavailable");
      const [keyFile, scoreFile] = await Promise.all([
        json<{ sections: Keys }>("metadata/answer-key-practice-test-a-v1.json"),
        json<{ ranges: ScoreRangeRow[] }>("metadata/score-conversion-practice-test-a-v1.json"),
      ]);
      const rows = (await client.query(answerQuery, [attemptId])).rows;
      const answers = new Map<string, Choice>();
      for (const row of rows) answers.set(row.section + ":" + row.question_number, row.answer_choice);
      const sections = {} as Record<Section, { correct: number; incorrect: number; omitted: number; total: number; converted: [number, number] | null }>;
      let totalCorrect = 0, incorrect = 0, omitted = 0;
      for (const name of ["listening", "structure", "reading"] as const) {
        const count = keyFile.sections[name].length;
        let correct = 0, answered = 0;
        keyFile.sections[name].forEach((key, index) => {
          const response = answers.get(name + ":" + (index + 1));
          if (response) { answered += 1; if (response === key) correct += 1; }
        });
        const range = convertedSectionRange(scoreFile.ranges, name, correct);
        sections[name] = { correct, incorrect: answered - correct, omitted: count - answered, total: count, converted: range as [number, number] | null };
        totalCorrect += correct; incorrect += answered - correct; omitted += count - answered;

      }
      const review = (Object.keys(keyFile.sections) as Section[]).flatMap((name) => keyFile.sections[name].map((correctAnswer, index) => {
        const question = index + 1;
        const selected = answers.get(name + ":" + question) ?? null;
        return { section: name, question, selected, correctAnswer, correct: selected === correctAnswer };
      }));
      const totalRange = convertedTotalRange([sections.listening.converted, sections.structure.converted, sections.reading.converted]);
      const resultData = { sections, total: { correct: totalCorrect, incorrect, omitted, questions: 140 }, convertedTotal: totalRange, answers: Object.fromEntries(answers), review };
      await client.query("INSERT INTO protefl_diagnostic_result(attempt_id,is_primary,result_version,package_version,result_data) VALUES($1,$2,'ets-volume3-practice-test-a.result.v1',$3,$4)", [attemptId, attempt.is_primary, attempt.package_version, JSON.stringify(resultData)]);
      await client.query("UPDATE protefl_diagnostic_attempt SET status='completed',current_section='completed',completed_at=now() WHERE id=$1", [attemptId]);
      eventType = "diagnostic_submitted"; section = "reading";
    }
    await client.query(
      "INSERT INTO protefl_diagnostic_event(attempt_id,idempotency_key,event_type,section,question_number,answer_choice,event_data) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [attemptId, action.requestId, eventType, section, question, choice, JSON.stringify(eventData)],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error && ["listening_incomplete", "action_unavailable", "attempt_unavailable"].includes(error.message)) throw error;
    throw new Error("diagnostic_unavailable");
  } finally {
    client.release();
  }
}

export async function diagnosticAttemptState(actorId: string, attemptId: string) {
  const attempt = await diagnosticAttempt(actorId, attemptId);
  if (!attempt) return null;
  const events = (await getPool().query("SELECT section,question_number,answer_choice,event_type,event_data FROM protefl_diagnostic_event WHERE attempt_id=$1 ORDER BY id", [attemptId])).rows;
  const answers = new Map<string, Choice>(), heard = new Set<number>();
  let lastListeningPositionMs = 0;
  for (const event of events) {
    if (event.event_type === "answer") answers.set(event.section + ":" + event.question_number, event.answer_choice);
    if (event.event_type === "audio_played" && event.question_number) {
      heard.add(Number(event.question_number));
      lastListeningPositionMs = Math.max(lastListeningPositionMs, Number(event.event_data?.positionMs ?? 0));
    }
  }
  const state: Record<string, unknown> = {
    id: String(attempt.id), attemptNumber: Number(attempt.attempt_number), isPrimary: attempt.is_primary === true,
    packageVersion: Number(attempt.package_version),
    status: attempt.status, currentSection: attempt.current_section, listeningMode: attempt.listening_mode,
    listeningStartedAt: attempt.listening_started_at ? new Date(attempt.listening_started_at).toISOString() : null,
    structureStartedAt: attempt.structure_started_at ? new Date(attempt.structure_started_at).toISOString() : null,
    structureDeadlineAt: attempt.structure_deadline_at ? new Date(attempt.structure_deadline_at).toISOString() : null,
    readingStartedAt: attempt.reading_started_at ? new Date(attempt.reading_started_at).toISOString() : null,
    readingDeadlineAt: attempt.reading_deadline_at ? new Date(attempt.reading_deadline_at).toISOString() : null,
    serverTime: new Date(attempt.server_now ?? Date.now()).toISOString(),
    answers: Object.fromEntries(answers), heardListeningQuestions: [...heard].sort((a, b) => a - b), lastListeningPositionMs,
  };
  if (attempt.status === "completed") {
    const result = await getPool().query("SELECT result_data FROM protefl_diagnostic_result WHERE attempt_id=$1", [attemptId]);
    if (result.rows[0]) state.result = result.rows[0].result_data;
  }
  if (attempt.is_primary !== true) {
    const primary = await getPool().query(
      "SELECT result_data FROM protefl_diagnostic_result WHERE is_primary=true AND attempt_id IN (SELECT id FROM protefl_diagnostic_attempt WHERE resource_id=$1 AND actor_id=$2)",
      [attempt.resource_id, actorId],
    );
    if (primary.rows[0]) state.primaryResult = primary.rows[0].result_data;
  }
  return state;
}
