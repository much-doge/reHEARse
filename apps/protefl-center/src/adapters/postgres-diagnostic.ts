import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { PoolClient } from "pg";

import { getPool } from "@/adapters/db/client";
import { attemptMatchesAssignmentScope, completesAfterSection } from "../application/diagnostic-delivery";
import { effectiveDiagnosticResult, type CompletedSectionReset, type FullDiagnosticResult } from "../application/diagnostic-effective-result";
import { convertedSectionRange, convertedTotalRange, type ScoreRangeRow } from "../application/diagnostic-scoring";
import { diagnosticPackage, diagnosticPackagePath, type DiagnosticPackageDescriptor } from "../application/diagnostic-package";

const defaultPackageCode = "ets-volume3-practice-test-a";
export type DiagnosticSection = "listening" | "structure" | "reading";
type Section = DiagnosticSection;
type Choice = "A" | "B" | "C" | "D";
type Keys = Record<Section, Choice[]>;
type StandardItem = { number: number; prompt: string; options: Record<Choice, string>; sourcePage: number; part?: "A" | "B" | "C" };
type ErrorItem = { number: number; tokens: Array<{ text: string; choice?: Choice }>; options: Record<Choice, string>; sourcePage: number };
type Passage = { id: string; questions: [number, number]; sourcePage: number; lines: Array<{ text: string; line: number | null; paragraphStart: boolean }> };
type ItemPackage = { listening: StandardItem[]; structure: { completion: StandardItem[]; errorIdentification: ErrorItem[] }; reading: { passages: Passage[]; questions: StandardItem[] } };
type ListeningMapItem = {
  question: number;
  groupId: string;
  groupType: "question" | "conversation" | "talk";
  questionAudioStartMs: number;
  questionAudioEndMs: number;
  contextStartMs: number;
  answerWindowStartMs: number;
  answerWindowEndMs: number;
};

export type DiagnosticInstructions = {
  listening: { overview: string; partA: string; partB: string; partC: string };
  structure: { overview: string; time: string; partA: string; partB: string };
  reading: { overview: string; time: string; basis: string };
};

function packageDescriptor(code = defaultPackageCode): DiagnosticPackageDescriptor {
  const descriptor = diagnosticPackage(code);
  if (!descriptor) throw new Error("package_not_registered");
  return descriptor;
}
function packageRoot(code = defaultPackageCode) {
  return diagnosticPackagePath(code) ?? join(process.cwd(), "apps/protefl-center/content/__missing__");
}
async function packageJson<T>(code: string, name: string): Promise<T> {
  return JSON.parse(await readFile(join(/*turbopackIgnore: true*/ packageRoot(code), name), "utf8")) as T;
}
async function pinnedPackageHashes(code = defaultPackageCode) {
  const descriptor = packageDescriptor(code);
  const manifest = await packageJson<{ version: number; sourceFiles: Array<{ path: string; sha256: string }> }>(code, descriptor.files.manifest);
  const hashFor = (name: string) => manifest.sourceFiles.find((file) => file.path === name)?.sha256;
  const answerKeyHash = hashFor(descriptor.files.answerKey);
  const scoreTableHash = hashFor(descriptor.files.scoreConversion);
  const pausesHash = hashFor(descriptor.files.listeningPauses);
  const questionMapHash = hashFor(descriptor.files.listeningQuestionMap);
  if (!answerKeyHash || !scoreTableHash || !pausesHash || !questionMapHash) throw new Error("package_manifest_invalid");
  const contentHash = createHash("sha256").update(manifest.sourceFiles.map((file) => file.path + ":" + file.sha256).join("\n")).digest("hex");
  const timingMapHash = createHash("sha256").update(pausesHash + ":" + questionMapHash).digest("hex");
  return { version: manifest.version, contentHash, answerKeyHash, scoreTableHash, timingMapHash };
}
function validQuestion(section: Section, number: number, code = defaultPackageCode) {
  return Number.isInteger(number) && number >= 1 && number <= (packageDescriptor(code).questionCounts[section] ?? 0);
}
const answerQuery = "SELECT DISTINCT ON(section,question_number) section,question_number,answer_choice FROM protefl_diagnostic_event WHERE attempt_id=$1 AND event_type='answer' ORDER BY section,question_number,id DESC";

async function calculateSectionResult(client: PoolClient, attemptId: string, section: Section) {
  const attempt = (await client.query("SELECT selected_questions,r.code FROM protefl_diagnostic_attempt d JOIN protefl_resource r ON r.id=d.resource_id WHERE d.id=$1", [attemptId])).rows[0];
  const descriptor = packageDescriptor(String(attempt?.code ?? defaultPackageCode));
  const [keyFile, scoreFile, rows] = await Promise.all([
    packageJson<{ sections: Keys }>(descriptor.code, descriptor.files.answerKey),
    packageJson<{ ranges: ScoreRangeRow[] }>(descriptor.code, descriptor.files.scoreConversion),
    client.query(answerQuery, [attemptId]),
  ]);
  const answers = new Map<number, Choice>();
  for (const row of rows.rows) if (row.section === section) answers.set(Number(row.question_number), row.answer_choice);
  const selectedQuestions = Array.isArray(attempt?.selected_questions) ? attempt.selected_questions.map(Number) as number[] : null;
  const questionNumbers = selectedQuestions ?? keyFile.sections[section].map((_, index) => index + 1);
  let correct = 0;
  for (const question of questionNumbers) if (answers.get(question) === keyFile.sections[section][question - 1]) correct += 1;
  const answered = questionNumbers.filter((question) => answers.has(question)).length;
  const total = questionNumbers.length;
  const summary = {
    correct,
    incorrect: answered - correct,
    omitted: total - answered,
    total,
    converted: convertedSectionRange(scoreFile.ranges, section, correct) as [number, number] | null,
  };
  const review = questionNumbers.map((question) => {
    const correctAnswer = keyFile.sections[section][question - 1];
    const selected = answers.get(question) ?? null;
    return { section, question, selected, correctAnswer, correct: selected === correctAnswer };
  });
  return { section, summary, review, answers: Object.fromEntries(answers) };
}

export async function diagnosticAssignment(actorId: string, assignmentId?: string, requestedPackageCode = defaultPackageCode) {
  packageDescriptor(requestedPackageCode);
  const assignmentFilter = assignmentId ? "a.id=$1 AND a.actor_id=$2 AND r.code=$3" : "a.actor_id=$1 AND r.code=$2";
  const values = assignmentId ? [assignmentId, actorId, requestedPackageCode] : [actorId, requestedPackageCode];
  const result = await getPool().query(
    `SELECT r.id,a.id AS assignment_id,r.code,r.version,r.title,r.status,COALESCE(a.assignment_title,r.title) AS assignment_title,a.listening_mode,a.delivery_scope,EXISTS(SELECT 1 FROM protefl_diagnostic_attempt d WHERE d.assignment_id=a.id AND d.archived_at IS NULL) AS has_attempt
     FROM protefl_resource_assignment a JOIN protefl_resource r ON r.id=a.resource_id
     WHERE ${assignmentFilter} AND r.kind='diagnostic_package' AND a.revoked_at IS NULL
       AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now())
       AND (r.status='published' OR EXISTS(SELECT 1 FROM protefl_diagnostic_attempt d WHERE d.assignment_id=a.id AND d.archived_at IS NULL))
     ORDER BY EXISTS(SELECT 1 FROM protefl_diagnostic_attempt d WHERE d.assignment_id=a.id AND d.status='in_progress' AND d.archived_at IS NULL) DESC, a.assigned_at DESC LIMIT 1`,
    values,
  );
  const row = result.rows[0];
  return row ? { id: String(row.assignment_id), resourceId: String(row.id), code: row.code as string, version: Number(row.version), title: row.title as string, assignmentTitle: row.assignment_title as string, status: row.status as string, listeningMode: row.listening_mode as "autoplay" | "question_click", deliveryScope: row.delivery_scope as "full" | Section, hasAttempt: row.has_attempt === true } : null;
}

export async function diagnosticInstructions(requestedPackageCode = defaultPackageCode) {
  const descriptor = packageDescriptor(requestedPackageCode);
  return packageJson<DiagnosticInstructions>(descriptor.code, descriptor.files.instructions);
}

export async function diagnosticListeningTiming(requestedPackageCode = defaultPackageCode) {
  const descriptor = packageDescriptor(requestedPackageCode);
  const [timing, questionMap] = await Promise.all([
    packageJson<{ audioDurationMs: number; pauses: Array<{ question: number; answerWindowStartMs: number; answerWindowEndMs: number; durationMs: number }> }>(descriptor.code, descriptor.files.listeningPauses),
    packageJson<{ questions: Array<{ question: number; groupId: string; groupType: string; questionAudioStartMs: number; questionAudioEndMs: number; contextStartMs: number; answerWindowStartMs: number; answerWindowEndMs: number }> }>(descriptor.code, descriptor.files.listeningQuestionMap),
  ]);
  return { ...timing, questions: questionMap.questions };
}

export async function protectedDiagnosticItem(actorId: string, attemptId: string, sectionValue: string, questionValue: string) {
  if (!(sectionValue === "listening" || sectionValue === "structure" || sectionValue === "reading")) return null;
  const section = sectionValue as Section;
  const question = Number(questionValue);
  const attempt = await diagnosticAttempt(actorId, attemptId);
  const code = String(attempt?.resource_code ?? defaultPackageCode);
  const descriptor = packageDescriptor(code);
  if (!attempt || !validQuestion(section, question, code) || (attempt.status !== "completed" && attempt.current_section !== section)) return null;
  if (Array.isArray(attempt.selected_questions) && !attempt.selected_questions.map(Number).includes(question)) return null;
  const content = await packageJson<ItemPackage>(code, descriptor.files.questions);
  if (section === "listening") {
    const item = content.listening[question - 1];
    return { section, item: attempt.show_listening_question_text ? item : { ...item, prompt: "" } };
  }
  if (section === "structure") return { section, part: question <= 15 ? "completion" : "errorIdentification", item: question <= 15 ? content.structure.completion[question - 1] : content.structure.errorIdentification[question - 16] };
  const passage = content.reading.passages.find((candidate) => question >= candidate.questions[0] && question <= candidate.questions[1]);
  return { section, item: content.reading.questions[question - 1], passage };
}

export async function teacherDiagnosticReviewItem(
  staffActorId: string,
  staffRole: "teacher" | "admin",
  resourceId: string,
  candidateActorId: string,
  attemptId: string,
  sectionValue: string,
  questionValue: string,
) {
  if (!(sectionValue === "listening" || sectionValue === "structure" || sectionValue === "reading")) return null;
  const section = sectionValue as Section;
  const question = Number(questionValue);
  const result = await getPool().query(
    `SELECT d.id,d.package_version,d.status,d.archived_at,d.selected_questions,r.code,dr.result_data
     FROM protefl_diagnostic_attempt d
     JOIN protefl_resource r ON r.id=d.resource_id
     JOIN protefl_resource_assignment a ON a.id=d.assignment_id
     LEFT JOIN protefl_diagnostic_result dr ON dr.attempt_id=d.id
     WHERE d.id=$1 AND d.resource_id=$2 AND d.actor_id=$3
       AND r.kind='diagnostic_package'
       AND a.revoked_at IS NULL AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now())
       AND ($5='admin' OR a.assigned_by=$4)
     LIMIT 1`,
    [attemptId, resourceId, candidateActorId, staffActorId, staffRole],
  );
  const row = result.rows[0];
  const code = String(row?.code ?? "");
  const descriptor = diagnosticPackage(code);
  if (!row || !descriptor || !validQuestion(section, question, code)) return null;
  if (Array.isArray(row.selected_questions) && !row.selected_questions.map(Number).includes(question)) return null;
  let reviewItem = (row.result_data?.review ?? []).find((item: { section: string; question: number }) => item.section === section && Number(item.question) === question) as { section: string; question: number; selected: Choice | null; correctAnswer: Choice; correct: boolean } | undefined;
  if (!reviewItem) {
    const answer = await getPool().query(
      `SELECT answer_choice FROM protefl_diagnostic_event
       WHERE attempt_id=$1 AND event_type='answer' AND section=$2 AND question_number=$3
       ORDER BY id DESC LIMIT 1`,
      [attemptId, section, question],
    );
    if (!answer.rows[0]) return null;
    const keyFile = await packageJson<{ sections: Keys }>(code, descriptor.files.answerKey);
    const selected = answer.rows[0].answer_choice as Choice;
    const correctAnswer = keyFile.sections[section][question - 1];
    reviewItem = { section, question, selected, correctAnswer, correct: selected === correctAnswer };
  }
  const content = await packageJson<ItemPackage>(code, descriptor.files.questions);
  if (section === "listening") {
    const map = await packageJson<{ questions: ListeningMapItem[] }>(code, descriptor.files.listeningQuestionMap);
    const timing = map.questions[question - 1];
    if (!timing) return null;
    const group = map.questions.filter((entry) => entry.groupId === timing.groupId);
    return {
      section,
      question: reviewItem,
      item: content.listening[question - 1],
      audio: {
        groupId: timing.groupId,
        groupType: timing.groupType,
        contextStartMs: timing.contextStartMs,
        contextEndMs: Math.max(...group.map((entry) => entry.questionAudioEndMs)),
        questionStartMs: timing.questionAudioStartMs,
        questionEndMs: timing.questionAudioEndMs,
      },
    };
  }
  if (section === "structure") return {
    section,
    question: reviewItem,
    part: question <= 15 ? "completion" : "errorIdentification",
    item: question <= 15 ? content.structure.completion[question - 1] : content.structure.errorIdentification[question - 16],
  };
  const passage = content.reading.passages.find((candidate) => question >= candidate.questions[0] && question <= candidate.questions[1]);
  return { section, question: reviewItem, item: content.reading.questions[question - 1], passage };
}

export async function teacherDiagnosticAudio(
  staffActorId: string,
  staffRole: "teacher" | "admin",
  resourceId: string,
  candidateActorId: string,
  attemptId: string,
) {
  const authorized = await getPool().query(
    `SELECT d.id,r.code
     FROM protefl_diagnostic_attempt d
     JOIN protefl_resource r ON r.id=d.resource_id
     JOIN protefl_resource_assignment a ON a.id=d.assignment_id
     WHERE d.id=$1 AND d.resource_id=$2 AND d.actor_id=$3 AND r.kind='diagnostic_package'
       AND a.revoked_at IS NULL AND ($5='admin' OR a.assigned_by=$4)
     LIMIT 1`,
    [attemptId, resourceId, candidateActorId, staffActorId, staffRole],
  );
  if (!authorized.rowCount) return null;
  const descriptor = diagnosticPackage(String(authorized.rows[0].code));
  if (!descriptor) return null;
  try {
    return await readFile(join(/*turbopackIgnore: true*/ packageRoot(descriptor.code), descriptor.files.listeningAudio));
  } catch {
    return null;
  }
}

export async function diagnosticAudio(actorId: string, id: string) {
  const attempt = await diagnosticAttempt(actorId, id);
  if (!attempt || attempt.current_section !== "listening" || !attempt.listening_started_at) return null;
  const descriptor = diagnosticPackage(String(attempt.resource_code ?? ""));
  if (!descriptor) return null;
  try {
    return await readFile(join(/*turbopackIgnore: true*/ packageRoot(descriptor.code), descriptor.files.listeningAudio));
  } catch {
    return null;
  }
}

export async function latestDiagnosticAttemptState(actorId: string, assignmentId: string) {
  const active = await getPool().query(
    "SELECT d.id FROM protefl_diagnostic_attempt d WHERE d.assignment_id=$1 AND d.actor_id=$2 AND d.status='in_progress' AND d.archived_at IS NULL ORDER BY d.attempt_number DESC LIMIT 1",
    [assignmentId, actorId],
  );
  if (active.rows[0]) return diagnosticAttemptState(actorId, String(active.rows[0].id));
  const full = await getPool().query(
    "SELECT d.id FROM protefl_diagnostic_attempt d WHERE d.assignment_id=$1 AND d.actor_id=$2 AND d.scope='full' AND d.archived_at IS NULL ORDER BY d.attempt_number DESC LIMIT 1",
    [assignmentId, actorId],
  );
  return full.rows[0] ? diagnosticAttemptState(actorId, String(full.rows[0].id)) : null;
}

export async function diagnosticAssignmentHistory(actorId: string, assignmentId: string) {
  const result = await getPool().query(
    `SELECT d.id,d.attempt_number,d.status,d.scope,d.delivery_scope,d.created_at,d.completed_at,r.result_data
     FROM protefl_diagnostic_attempt d LEFT JOIN protefl_diagnostic_result r ON r.attempt_id=d.id
     WHERE d.assignment_id=$1 AND d.actor_id=$2 AND d.archived_at IS NULL ORDER BY d.attempt_number DESC`, [assignmentId, actorId],
  );
  return result.rows.map((row) => ({ id: String(row.id), attemptNumber: Number(row.attempt_number), status: row.status as string, scope: row.scope as string, deliveryScope: row.delivery_scope as "full" | Section, createdAt: new Date(row.created_at).toISOString(), completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null, result: row.result_data ?? null }));
}

export async function diagnosticAttempt(actorId: string, id: string) {
  const result = await getPool().query(
    "SELECT d.*,r.code AS resource_code,now() AS server_now FROM protefl_diagnostic_attempt d JOIN protefl_resource_assignment a ON a.id=d.assignment_id JOIN protefl_resource r ON r.id=d.resource_id WHERE d.id=$1 AND d.actor_id=$2 AND d.archived_at IS NULL AND a.revoked_at IS NULL AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now()) LIMIT 1",
    [id, actorId],
  );
  return result.rows[0] ?? null;
}

export async function startOrResumeDiagnostic(actorId: string, assignmentId: string, retake = false, requestedPackageCode = defaultPackageCode) {
  packageDescriptor(requestedPackageCode);
  const db = getPool();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const access = (await client.query(
      "SELECT a.id AS assignment_id,r.id,r.status,r.version,a.listening_mode,a.show_listening_question_text,a.delivery_scope FROM protefl_resource_assignment a JOIN protefl_resource r ON r.id=a.resource_id WHERE a.id=$1 AND a.actor_id=$2 AND r.code=$3 AND r.kind='diagnostic_package' AND a.revoked_at IS NULL AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now()) FOR UPDATE OF a,r",
      [assignmentId, actorId, requestedPackageCode],
    )).rows[0];
    if (!access) throw new Error("resource_unavailable");
    const active = (await client.query("SELECT id,delivery_scope FROM protefl_diagnostic_attempt WHERE assignment_id=$1 AND actor_id=$2 AND status='in_progress' AND archived_at IS NULL AND delivery_scope=$3 ORDER BY attempt_number DESC LIMIT 1 FOR UPDATE", [access.assignment_id, actorId, access.delivery_scope])).rows[0];
    if (active) {
      if (!attemptMatchesAssignmentScope(active.delivery_scope, access.delivery_scope)) throw new Error("assignment_scope_conflict");
      await client.query("COMMIT");
      return { attemptId: String(active.id), resumed: true };
    }
    const conflictingActive = (await client.query("SELECT delivery_scope FROM protefl_diagnostic_attempt WHERE assignment_id=$1 AND actor_id=$2 AND status='in_progress' AND archived_at IS NULL ORDER BY attempt_number DESC LIMIT 1 FOR UPDATE", [access.assignment_id, actorId])).rows[0];
    if (conflictingActive && !attemptMatchesAssignmentScope(conflictingActive.delivery_scope, access.delivery_scope)) throw new Error("assignment_scope_conflict");
    const latest = (await client.query("SELECT id,attempt_number,status,delivery_scope FROM protefl_diagnostic_attempt WHERE assignment_id=$1 AND actor_id=$2 AND scope='full' AND archived_at IS NULL ORDER BY attempt_number DESC LIMIT 1 FOR UPDATE", [access.assignment_id, actorId])).rows[0];
    if (latest && !attemptMatchesAssignmentScope(latest.delivery_scope, access.delivery_scope)) throw new Error("assignment_scope_conflict");
    // Hiding a resource stops new starts and retakes, but does not strand an
    // already assigned candidate who needs to resume an interrupted attempt.
    if (access.status !== "published") throw new Error("resource_unavailable");
    if ((latest && (!retake || latest.status !== "completed")) || (!latest && retake)) throw new Error("attempt_unavailable");
    const sequence = (await client.query("SELECT coalesce(max(attempt_number),0)::int AS number FROM protefl_diagnostic_attempt WHERE assignment_id=$1 AND actor_id=$2", [access.assignment_id, actorId])).rows[0];
    const number = Number(sequence.number) + 1;
    const primary = !(await client.query("SELECT 1 FROM protefl_diagnostic_attempt WHERE assignment_id=$1 AND actor_id=$2 AND is_primary=true AND archived_at IS NULL LIMIT 1", [access.assignment_id, actorId])).rowCount;
    const hashes = await pinnedPackageHashes(requestedPackageCode);
    if (hashes.version !== Number(access.version)) throw new Error("resource_unavailable");
    const inserted = (await client.query(
      "INSERT INTO protefl_diagnostic_attempt(resource_id,assignment_id,actor_id,attempt_number,is_primary,package_version,content_hash,answer_key_hash,score_table_hash,timing_map_hash,listening_mode,show_listening_question_text,delivery_scope,current_section) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id",
      [access.id, access.assignment_id, actorId, number, primary, access.version, hashes.contentHash, hashes.answerKeyHash, hashes.scoreTableHash, hashes.timingMapHash, access.listening_mode, access.show_listening_question_text, access.delivery_scope, access.delivery_scope === "full" ? "listening" : access.delivery_scope],
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

export async function startSectionRetake(actorId: string, assignmentId: string, sourceAttemptId: string, section: Section) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const source = (await client.query(
      "SELECT d.id,d.assignment_id,d.scope,d.parent_attempt_id,d.status,r.code FROM protefl_diagnostic_attempt d JOIN protefl_resource r ON r.id=d.resource_id WHERE d.id=$1 AND d.assignment_id=$2 AND d.actor_id=$3 AND d.archived_at IS NULL",
      [sourceAttemptId, assignmentId, actorId],
    )).rows[0];
    if (!source || source.status !== "completed" || (source.scope !== "full" && source.scope !== section)) throw new Error("attempt_unavailable");
    const parentAttemptId = source.scope === "full" ? source.id : source.parent_attempt_id;
    const parent = (await client.query(
      "SELECT d.*,r.status AS resource_status,r.version AS resource_version,a.listening_mode AS assigned_listening_mode FROM protefl_diagnostic_attempt d JOIN protefl_resource_assignment a ON a.id=d.assignment_id JOIN protefl_resource r ON r.id=d.resource_id WHERE d.id=$1 AND d.actor_id=$2 AND d.scope='full' AND d.status='completed' AND d.archived_at IS NULL AND a.revoked_at IS NULL AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now()) FOR UPDATE OF d,a,r",
      [parentAttemptId, actorId],
    )).rows[0];
    if (!parent || parent.resource_status !== "published") throw new Error("attempt_unavailable");
    const parentResult = (await client.query("SELECT result_data FROM protefl_diagnostic_result WHERE attempt_id=$1", [sourceAttemptId])).rows[0]?.result_data;
    const selectedQuestions = (parentResult?.review ?? []).filter((item: { section: string; correct: boolean }) => item.section === section && !item.correct).map((item: { question: number }) => Number(item.question));
    if (!selectedQuestions.length) throw new Error("no_missed_questions");
    const active = (await client.query("SELECT id FROM protefl_diagnostic_attempt WHERE assignment_id=$1 AND actor_id=$2 AND status='in_progress' AND archived_at IS NULL ORDER BY attempt_number DESC LIMIT 1 FOR UPDATE", [parent.assignment_id, actorId])).rows[0];
    if (active) {
      await client.query("COMMIT");
      return { attemptId: String(active.id), resumed: true };
    }
    const sequence = (await client.query("SELECT coalesce(max(attempt_number),0)::int AS number FROM protefl_diagnostic_attempt WHERE assignment_id=$1 AND actor_id=$2", [parent.assignment_id, actorId])).rows[0];
    const retake = (await client.query("SELECT coalesce(max(section_retake_number),0)::int AS number FROM protefl_diagnostic_attempt WHERE parent_attempt_id=$1 AND scope=$2", [parentAttemptId, section])).rows[0];
    const hashes = await pinnedPackageHashes(String(source.code));
    if (hashes.version !== Number(parent.resource_version)) throw new Error("attempt_unavailable");
    const inserted = (await client.query(
      "INSERT INTO protefl_diagnostic_attempt(resource_id,assignment_id,actor_id,attempt_number,is_primary,package_version,content_hash,answer_key_hash,score_table_hash,timing_map_hash,listening_mode,scope,parent_attempt_id,section_retake_number,current_section,show_listening_question_text,selected_questions,delivery_scope) VALUES($1,$2,$3,$4,false,$5,$6,$7,$8,$9,$10,$11,$12,$13,$11,$14,$15,$16) RETURNING id",
      [parent.resource_id, parent.assignment_id, actorId, Number(sequence.number) + 1, parent.package_version, hashes.contentHash, hashes.answerKeyHash, hashes.scoreTableHash, hashes.timingMapHash, parent.assigned_listening_mode, section, parentAttemptId, Number(retake.number) + 1, parent.show_listening_question_text, JSON.stringify(selectedQuestions), parent.delivery_scope],
    )).rows[0];
    await client.query("COMMIT");
    return { attemptId: String(inserted.id), resumed: false };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error && ["attempt_unavailable", "no_missed_questions"].includes(error.message)) throw error;
    throw new Error("attempt_unavailable");
  } finally {
    client.release();
  }
}

export async function restartCandidateDiagnosticSection(
  resourceId: string,
  assignmentId: string,
  candidateActorId: string,
  parentAttemptId: string,
  section: DiagnosticSection,
  staffActorId: string,
  staffRole: "teacher" | "admin",
) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const parent = (await client.query(
      `SELECT d.*,r.code AS resource_code,r.status AS resource_status,r.version AS resource_version,
         a.listening_mode AS assigned_listening_mode,a.show_listening_question_text AS assigned_show_question_text
       FROM protefl_diagnostic_attempt d
       JOIN protefl_resource_assignment a ON a.id=d.assignment_id
       JOIN protefl_resource r ON r.id=d.resource_id
       WHERE d.id=$1 AND d.resource_id=$2 AND d.assignment_id=$3 AND d.actor_id=$4
         AND d.scope='full' AND d.delivery_scope='full' AND d.parent_attempt_id IS NULL AND d.status='completed' AND d.archived_at IS NULL
         AND r.kind='diagnostic_package' AND r.status='published' AND a.revoked_at IS NULL
         AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now())
         AND ($6='admin' OR a.assigned_by=$5)
       FOR UPDATE OF d,a,r`,
      [parentAttemptId, resourceId, assignmentId, candidateActorId, staffActorId, staffRole],
    )).rows[0];
    if (!parent) throw new Error("section_restart_unavailable");

    const active = await client.query(
      `SELECT id FROM protefl_diagnostic_attempt
       WHERE assignment_id=(SELECT assignment_id FROM protefl_diagnostic_attempt WHERE id=$1)
         AND actor_id=$2 AND scope=$3 AND status='in_progress' AND archived_at IS NULL
       LIMIT 1 FOR UPDATE`,
      [parentAttemptId, candidateActorId, section],
    );
    if (active.rowCount) throw new Error("active_attempt_exists");

    const sequence = (await client.query(
      "SELECT coalesce(max(attempt_number),0)::int AS number FROM protefl_diagnostic_attempt WHERE assignment_id=(SELECT assignment_id FROM protefl_diagnostic_attempt WHERE id=$1) AND actor_id=$2",
      [parentAttemptId, candidateActorId],
    )).rows[0];
    const restart = (await client.query(
      "SELECT coalesce(max(section_retake_number),0)::int AS number FROM protefl_diagnostic_attempt WHERE parent_attempt_id=$1 AND scope=$2",
      [parentAttemptId, section],
    )).rows[0];
    const hashes = await pinnedPackageHashes(String(parent.resource_code));
    if (hashes.version !== Number(parent.resource_version) || hashes.version !== Number(parent.package_version))
      throw new Error("section_restart_unavailable");

    const inserted = (await client.query(
      `INSERT INTO protefl_diagnostic_attempt(
         resource_id,assignment_id,actor_id,attempt_number,is_primary,package_version,content_hash,answer_key_hash,
         score_table_hash,timing_map_hash,listening_mode,scope,parent_attempt_id,section_retake_number,
         current_section,show_listening_question_text,selected_questions,delivery_scope,teacher_restarted_by
       ) VALUES($1,$2,$3,$4,false,$5,$6,$7,$8,$9,$10,$11,$12,$13,$11,$14,NULL,$15,$16)
       RETURNING id,attempt_number,section_retake_number,created_at`,
      [
        resourceId, parent.assignment_id, candidateActorId, Number(sequence.number) + 1, parent.package_version,
        parent.content_hash, parent.answer_key_hash, parent.score_table_hash, parent.timing_map_hash,
        parent.assigned_listening_mode, section, parentAttemptId, Number(restart.number) + 1,
        parent.assigned_show_question_text, parent.delivery_scope, staffActorId,
      ],
    )).rows[0];
    await client.query("COMMIT");
    return {
      attemptId: String(inserted.id), attemptNumber: Number(inserted.attempt_number),
      sectionRetakeNumber: Number(inserted.section_retake_number), section,
      createdAt: new Date(inserted.created_at).toISOString(),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error && ["section_restart_unavailable", "active_attempt_exists"].includes(error.message)) throw error;
    throw new Error("section_restart_unavailable");
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
      "SELECT d.*,r.code AS resource_code,now() AS server_now FROM protefl_diagnostic_attempt d JOIN protefl_resource_assignment a ON a.id=d.assignment_id JOIN protefl_resource r ON r.id=d.resource_id WHERE d.id=$1 AND d.actor_id=$2 AND d.status='in_progress' AND d.archived_at IS NULL AND a.revoked_at IS NULL AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now()) FOR UPDATE OF d",
      [attemptId, actorId],
    )).rows[0];
    if (!attempt) throw new Error("attempt_unavailable");
    const descriptor = packageDescriptor(String(attempt.resource_code ?? defaultPackageCode));
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
      if (attempt.current_section !== action.section || !validQuestion(action.section, action.question, descriptor.code)) throw new Error("action_unavailable");
      if (Array.isArray(attempt.selected_questions) && !attempt.selected_questions.map(Number).includes(action.question)) throw new Error("action_unavailable");
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
      if (attempt.current_section !== "listening" || !attempt.listening_started_at || !validQuestion("listening", action.question, descriptor.code) || !Number.isInteger(action.positionMs) || action.positionMs < 0 || action.positionMs > 2102073) throw new Error("action_unavailable");
      const selectedQuestions = Array.isArray(attempt.selected_questions) ? attempt.selected_questions.map(Number) as number[] : null;
      if (selectedQuestions && !selectedQuestions.includes(action.question)) throw new Error("action_unavailable");
      if (attempt.listening_mode === "autoplay") {
        const timeline = await packageJson<{ audioDurationMs: number; pauses: Array<{ question: number; answerWindowStartMs: number }> }>(descriptor.code, descriptor.files.listeningPauses);
        const expected = timeline.pauses[action.question - 1];
        const prior = await client.query("SELECT question_number FROM protefl_diagnostic_event WHERE attempt_id=$1 AND event_type='audio_played' AND event_data->>'final' IS DISTINCT FROM 'true' ORDER BY id DESC LIMIT 1", [attemptId]);
        const lastQuestion = Number(prior.rows[0]?.question_number ?? 0);
        const finalMarker = action.question === 50 && action.positionMs >= timeline.audioDurationMs - 1000 && lastQuestion === 50;
        const expectedQuestion = selectedQuestions
          ? selectedQuestions[lastQuestion ? selectedQuestions.indexOf(lastQuestion) + 1 : 0]
          : lastQuestion + 1;
        const sequential = action.question === expectedQuestion;
        const positioned = expected && Math.abs(action.positionMs - expected.answerWindowStartMs) <= 500;
        const elapsed = new Date(attempt.server_now).getTime() - new Date(attempt.listening_started_at).getTime();
        const elapsedValid = selectedQuestions || elapsed >= expected.answerWindowStartMs - 1000;
        if ((!finalMarker && (!sequential || !positioned || !elapsedValid)) || (finalMarker && !sequential && lastQuestion !== 50)) throw new Error("action_unavailable");
        eventData = finalMarker ? { positionMs: action.positionMs, final: true } : { positionMs: action.positionMs };
      } else eventData = { positionMs: action.positionMs };
      eventType = "audio_played"; section = "listening"; question = action.question;
    } else if (action.type === "finish_section") {
      if (attempt.current_section === "listening" && attempt.listening_started_at) {
        const selectedCount = Array.isArray(attempt.selected_questions) ? attempt.selected_questions.length : 50;
        if (attempt.listening_mode === "question_click") {
          const heard = await client.query("SELECT count(DISTINCT question_number)::int AS count FROM protefl_diagnostic_event WHERE attempt_id=$1 AND event_type='audio_played'", [attemptId]);
          if (Number(heard.rows[0].count) < selectedCount) throw new Error("listening_incomplete");
        } else {
          if (Array.isArray(attempt.selected_questions)) {
            const heard = await client.query("SELECT count(DISTINCT question_number)::int AS count FROM protefl_diagnostic_event WHERE attempt_id=$1 AND event_type='audio_played'", [attemptId]);
            if (Number(heard.rows[0].count) < selectedCount) throw new Error("listening_incomplete");
          } else {
            const progress = await client.query("SELECT max((event_data->>'positionMs')::int) AS position FROM protefl_diagnostic_event WHERE attempt_id=$1 AND event_type='audio_played'", [attemptId]);
            const audioPosition = Number(progress.rows[0].position ?? 0);
            const elapsed = new Date(attempt.server_now).getTime() - new Date(attempt.listening_started_at).getTime();
            if (audioPosition < 2_101_073 || elapsed < 2_101_073) throw new Error("listening_incomplete");
          }
        }
        section = "listening";
        if (completesAfterSection(attempt.scope, attempt.delivery_scope, "listening")) {
          const resultData = await calculateSectionResult(client, attemptId, "listening");
          await client.query("INSERT INTO protefl_diagnostic_result(attempt_id,is_primary,result_version,package_version,result_data) VALUES($1,$2,$3,$4,$5)", [attemptId, attempt.is_primary, attempt.scope === "listening" ? attempt.teacher_restarted_by ? descriptor.resultVersions.sectionReset : descriptor.resultVersions.sectionRetake : descriptor.resultVersions.sectionAssignment, attempt.package_version, JSON.stringify(resultData)]);
          await client.query("UPDATE protefl_diagnostic_attempt SET status='completed',current_section='completed',completed_at=now() WHERE id=$1", [attemptId]);
          eventType = "diagnostic_submitted";
        } else {
          await client.query("UPDATE protefl_diagnostic_attempt SET current_section='structure' WHERE id=$1", [attemptId]);
          eventType = "section_finished";
        }
      } else if (attempt.current_section === "structure" && attempt.structure_started_at) {
        section = "structure";
        if (completesAfterSection(attempt.scope, attempt.delivery_scope, "structure")) {
          const resultData = await calculateSectionResult(client, attemptId, "structure");
          await client.query("INSERT INTO protefl_diagnostic_result(attempt_id,is_primary,result_version,package_version,result_data) VALUES($1,$2,$3,$4,$5)", [attemptId, attempt.is_primary, attempt.scope === "structure" ? attempt.teacher_restarted_by ? descriptor.resultVersions.sectionReset : descriptor.resultVersions.sectionRetake : descriptor.resultVersions.sectionAssignment, attempt.package_version, JSON.stringify(resultData)]);
          await client.query("UPDATE protefl_diagnostic_attempt SET status='completed',current_section='completed',completed_at=now() WHERE id=$1", [attemptId]);
          eventType = "diagnostic_submitted";
        } else {
          await client.query("UPDATE protefl_diagnostic_attempt SET current_section='reading' WHERE id=$1", [attemptId]);
          eventType = "section_finished";
        }
      } else throw new Error("action_unavailable");
    } else {
      if (attempt.current_section !== "reading" || !attempt.reading_started_at) throw new Error("action_unavailable");
      if (completesAfterSection(attempt.scope, attempt.delivery_scope, "reading")) {
        const resultData = await calculateSectionResult(client, attemptId, "reading");
        await client.query("INSERT INTO protefl_diagnostic_result(attempt_id,is_primary,result_version,package_version,result_data) VALUES($1,$2,$3,$4,$5)", [attemptId, attempt.is_primary, attempt.scope === "reading" ? attempt.teacher_restarted_by ? descriptor.resultVersions.sectionReset : descriptor.resultVersions.sectionRetake : descriptor.resultVersions.sectionAssignment, attempt.package_version, JSON.stringify(resultData)]);
        await client.query("UPDATE protefl_diagnostic_attempt SET status='completed',current_section='completed',completed_at=now() WHERE id=$1", [attemptId]);
        eventType = "diagnostic_submitted"; section = "reading";
      } else {
      const [keyFile, scoreFile] = await Promise.all([
        packageJson<{ sections: Keys }>(descriptor.code, descriptor.files.answerKey),
        packageJson<{ ranges: ScoreRangeRow[] }>(descriptor.code, descriptor.files.scoreConversion),
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
      await client.query("INSERT INTO protefl_diagnostic_result(attempt_id,is_primary,result_version,package_version,result_data) VALUES($1,$2,$3,$4,$5)", [attemptId, attempt.is_primary, descriptor.resultVersions.full, attempt.package_version, JSON.stringify(resultData)]);
      await client.query("UPDATE protefl_diagnostic_attempt SET status='completed',current_section='completed',completed_at=now() WHERE id=$1", [attemptId]);
      eventType = "diagnostic_submitted"; section = "reading";
      }
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
    scope: attempt.scope as "full" | Section,
    deliveryScope: attempt.delivery_scope as "full" | Section,
    parentAttemptId: attempt.parent_attempt_id ? String(attempt.parent_attempt_id) : null,
    sectionRetakeNumber: attempt.section_retake_number ? Number(attempt.section_retake_number) : null,
    packageVersion: Number(attempt.package_version),
    status: attempt.status, currentSection: attempt.current_section, listeningMode: attempt.listening_mode,
    showListeningQuestionText: attempt.show_listening_question_text !== false,
    selectedQuestions: Array.isArray(attempt.selected_questions) ? attempt.selected_questions.map(Number) : null,
    teacherIssuedRestart: attempt.teacher_restarted_by != null,
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
    if (result.rows[0]) {
      if (attempt.scope !== "full") state.sectionRetakeResult = result.rows[0].result_data;
      else if (attempt.delivery_scope !== "full") state.sectionAssignmentResult = result.rows[0].result_data;
      else state.result = result.rows[0].result_data;
    }
  }
  const primary = await getPool().query(
      "SELECT d.id,r.result_data FROM protefl_diagnostic_attempt d JOIN protefl_diagnostic_result r ON r.attempt_id=d.id WHERE d.assignment_id=$1 AND d.actor_id=$2 AND d.is_primary=true AND d.archived_at IS NULL",
      [attempt.assignment_id, actorId],
  );
  if (primary.rows[0]) {
    state.primaryAttemptId = String(primary.rows[0].id);
    if (attempt.is_primary !== true) state.primaryResult = primary.rows[0].result_data;
  }
  if (attempt.scope === "full" && attempt.status === "completed") {
    const retakes = await getPool().query(
      "SELECT d.id,d.scope,d.section_retake_number,d.completed_at,d.teacher_restarted_by,r.result_data FROM protefl_diagnostic_attempt d JOIN protefl_diagnostic_result r ON r.attempt_id=d.id WHERE d.parent_attempt_id=$1 AND d.status='completed' AND d.archived_at IS NULL ORDER BY d.completed_at,d.attempt_number",
      [attemptId],
    );
    state.sectionRetakes = retakes.rows.map((row) => ({
      id: String(row.id), section: row.scope as Section, number: Number(row.section_retake_number), teacherIssuedRestart: row.teacher_restarted_by != null, completedAt: new Date(row.completed_at).toISOString(), result: row.result_data,
    }));
    const teacherResets = retakes.rows.filter((row) => row.teacher_restarted_by != null).map((row) => ({ section: row.scope, result: row.result_data })) as CompletedSectionReset[];
    if (teacherResets.length && state.result) state.effectiveResult = effectiveDiagnosticResult(state.result as FullDiagnosticResult, teacherResets);
  }
  return state;
}
