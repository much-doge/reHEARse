import { createHash, randomInt } from "node:crypto";

import { getPool } from "@/adapters/db/client";
import { effectiveDiagnosticResult, type CompletedSectionReset, type FullDiagnosticResult } from "../application/diagnostic-effective-result";
import { aggregateTeacherQuestionAnalytics, type TeacherQuestionAnalytics, type TeacherQuestionResult } from "../application/teacher-question-analytics";
import { diagnosticPackage } from "../application/diagnostic-package";
import { hashPassword } from "@/adapters/identity/password";
import { generateResourceCode, hashResourceCode, isValidResourceCode, normalizeResourceCode } from "../application/resource-code";

export type TestCenterResource = {
  id: string;
  assignmentId: string;
  code: string;
  version: number;
  kind: "listening_form" | "diagnostic_package";
  title: string;
  assignmentTitle: string;
  status: "draft" | "published" | "hidden" | "retired";
  assignedAt: string;
  startsAt: string;
  endsAt: string | null;
  hasAttempt: boolean;
  listeningMode: "autoplay" | "question_click";
  deliveryScope: "full" | "listening" | "structure" | "reading";
};

const publicStatus = (status: string) => ["draft", "published", "hidden", "retired"].includes(status);
const temporaryPasswordAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function generateTemporaryPassword() {
  const group = () => Array.from({ length: 4 }, () => temporaryPasswordAlphabet[randomInt(temporaryPasswordAlphabet.length)]).join("");
  return `NJL-${group()}-${group()}-${group()}`;
}

export async function assignedResources(actorId: string): Promise<TestCenterResource[]> {
  const result = await getPool().query(
    `SELECT r.id,a.id AS assignment_id,r.code,r.version,r.kind,r.title,r.status,
       COALESCE(a.assignment_title,r.title) AS assignment_title,
       a.assigned_at,a.starts_at,a.ends_at,a.listening_mode,a.delivery_scope,
            (EXISTS(SELECT 1 FROM protefl_attempt t WHERE t.actor_id=a.actor_id AND t.form_id=r.listening_form_id AND t.status<>'invalidated') OR EXISTS(SELECT 1 FROM protefl_diagnostic_attempt d WHERE d.assignment_id=a.id AND d.archived_at IS NULL)) AS has_attempt
     FROM protefl_resource_assignment a
     JOIN protefl_resource r ON r.id=a.resource_id
     WHERE a.actor_id=$1 AND a.revoked_at IS NULL
       AND (a.ends_at IS NULL OR a.ends_at>now())
       AND (r.status='published' OR (r.status='hidden' AND (EXISTS(SELECT 1 FROM protefl_attempt t WHERE t.actor_id=a.actor_id AND t.form_id=r.listening_form_id AND t.status<>'invalidated') OR EXISTS(SELECT 1 FROM protefl_diagnostic_attempt d WHERE d.assignment_id=a.id AND d.archived_at IS NULL))))
       AND (a.starts_at<=now())
     ORDER BY r.created_at DESC`,
    [actorId],
  );
  return result.rows.map((row) => ({
    id: String(row.id), assignmentId: String(row.assignment_id), code: row.code, version: Number(row.version), kind: row.kind,
    title: row.title, assignmentTitle: row.assignment_title, status: row.status, assignedAt: new Date(row.assigned_at).toISOString(),
    startsAt: new Date(row.starts_at).toISOString(), endsAt: row.ends_at ? new Date(row.ends_at).toISOString() : null,
    hasAttempt: row.has_attempt === true, listeningMode: row.listening_mode, deliveryScope: row.delivery_scope,
  }));
}

export async function claimResource(actorId: string, rawCode: string): Promise<void> {
  const code = normalizeResourceCode(rawCode);
  // Keep still-valid 24-character invites issued before migration 019 usable;
  // new invites always use the shorter normalized format.
  const legacyCode = rawCode.trim();
  const codeHash = isValidResourceCode(code)
    ? hashResourceCode(code)
    : legacyCode.length >= 12 && legacyCode.length <= 80
      ? createHash("sha256").update(legacyCode).digest("hex")
      : null;
  if (!codeHash) throw new Error("invite_unavailable");
  const pool = getPool();
  const rateLimit = await pool.query(
    `INSERT INTO protefl_resource_claim_rate_limit(actor_id,window_started_at,attempt_count)
     VALUES($1,date_trunc('hour',now()),1)
     ON CONFLICT(actor_id) DO UPDATE SET
       window_started_at=CASE
         WHEN protefl_resource_claim_rate_limit.window_started_at<date_trunc('hour',now()) THEN date_trunc('hour',now())
         ELSE protefl_resource_claim_rate_limit.window_started_at END,
       attempt_count=CASE
         WHEN protefl_resource_claim_rate_limit.window_started_at<date_trunc('hour',now()) THEN 1
         ELSE protefl_resource_claim_rate_limit.attempt_count+1 END
     WHERE protefl_resource_claim_rate_limit.window_started_at<date_trunc('hour',now())
        OR protefl_resource_claim_rate_limit.attempt_count<10
     RETURNING attempt_count`, [actorId],
  );
  if (!rateLimit.rowCount) throw new Error("invite_rate_limited");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invite = (await client.query(
      `SELECT i.*,r.status,(i.expires_at>now()) AS not_expired FROM protefl_resource_invite i
       JOIN protefl_resource r ON r.id=i.resource_id
       WHERE i.code_hash=$1 FOR UPDATE OF i`, [codeHash],
    )).rows[0];
    if (!invite || invite.status !== "published" || invite.revoked_at || !invite.not_expired)
      throw new Error("invite_unavailable");
    const existingAssignment = await client.query(
      `SELECT id FROM protefl_resource_assignment
       WHERE resource_id=$1 AND actor_id=$2 AND revoked_at IS NULL
         AND invite_id=$3
         AND starts_at<=now() AND (ends_at IS NULL OR ends_at>now())`,
      [invite.resource_id, actorId, invite.id],
    );
    if (existingAssignment.rowCount) {
      await client.query("COMMIT");
      return;
    }
    if (invite.invite_kind === "private" && invite.claimed_at)
      throw new Error("invite_unavailable");
    await client.query(
      `INSERT INTO protefl_resource_assignment(resource_id,actor_id,assigned_by,invite_id,assignment_kind,listening_mode,show_listening_question_text,delivery_scope,assignment_title)
       VALUES($1,$2,$3,$4,'invite',$5,$6,$7,$8)
       ON CONFLICT(resource_id,actor_id,invite_id) WHERE revoked_at IS NULL AND invite_id IS NOT NULL DO NOTHING`,
      [invite.resource_id, actorId, invite.created_by, invite.id, invite.listening_mode, invite.show_listening_question_text, invite.delivery_scope, invite.assignment_title],
    );
    if (invite.invite_kind === "private")
      await client.query("UPDATE protefl_resource_invite SET claimed_at=now(),claimed_by=$2 WHERE id=$1", [invite.id, actorId]);
    await client.query("INSERT INTO protefl_resource_event(resource_id,actor_id,invite_id,event_type) VALUES($1,$2,$3,'invite_claimed')", [invite.resource_id, actorId, invite.id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error && error.message === "invite_unavailable") throw error;
    throw new Error("invite_unavailable");
  } finally {
    client.release();
  }
}

type ManagedHistoryAttemptRow = {
  result?: FullDiagnosticResult | null;
  answeredQuestions?: unknown[];
  retakes?: Array<{ teacherIssuedRestart?: boolean; archivedAt?: string | null; status?: string; section: string; result?: unknown }>;
};
type ManagedCandidateHistoryRow = {
  assignment_id: string;
  display_name: string;
  email: string;
  actor_id: string;
  can_reset_password: boolean;
  delivery_scope: "full" | "listening" | "structure" | "reading";
  assignment_title: string;
  attempts?: ManagedHistoryAttemptRow[];
};

const managedCandidateHistoryQuery = `
  SELECT a.id AS assignment_id,a.resource_id,a.actor_id,a.delivery_scope,COALESCE(a.assignment_title,r.title) AS assignment_title,u.display_name,u.email,
    ($2='admin' OR a.assigned_by=$1) AS can_reset_password,
    COALESCE(history.attempts,'[]'::jsonb) AS attempts
  FROM protefl_resource_assignment a
  JOIN app_user u ON u.id=a.actor_id
  JOIN protefl_resource r ON r.id=a.resource_id
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object(
      'id',d.id,'number',d.attempt_number,'status',d.status,'scope',d.scope,'deliveryScope',d.delivery_scope,
      'createdAt',d.created_at,'completedAt',d.completed_at,'archivedAt',d.archived_at,'result',result_row.result_data,
      'answeredQuestions',COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'section',answer_events.section,
          'question',answer_events.question_number,
          'selected',answer_events.answer_choice,
          'answeredAt',answer_events.created_at
        ) ORDER BY answer_events.id)
        FROM (
          SELECT DISTINCT ON (e.section,e.question_number)
            e.id,e.section,e.question_number,e.answer_choice,e.created_at
          FROM protefl_diagnostic_event e
          WHERE e.attempt_id=d.id AND e.event_type='answer'
          ORDER BY e.section,e.question_number,e.id DESC
        ) answer_events
      ),'[]'::jsonb),
      'retakes',COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id',retry.id,'section',retry.scope,'number',retry.section_retake_number,'status',retry.status,
          'teacherIssuedRestart',(retry.teacher_restarted_by IS NOT NULL),
          'createdAt',retry.created_at,'completedAt',retry.completed_at,'archivedAt',retry.archived_at,'result',rr.result_data
        ) ORDER BY retry.attempt_number)
        FROM protefl_diagnostic_attempt retry
        LEFT JOIN protefl_diagnostic_result rr ON rr.attempt_id=retry.id
        WHERE retry.parent_attempt_id=d.id
      ),'[]'::jsonb)
    ) ORDER BY d.attempt_number) AS attempts
    FROM protefl_diagnostic_attempt d
    LEFT JOIN protefl_diagnostic_result result_row ON result_row.attempt_id=d.id
      WHERE d.assignment_id=a.id
      AND d.parent_attempt_id IS NULL
  ) history ON true
  WHERE a.revoked_at IS NULL
    AND ($2='admin' OR a.assigned_by=$1)`;

function mapManagedCandidateHistory(row: ManagedCandidateHistoryRow) {
  const attempts = (row.attempts ?? []).map((attempt) => {
    const resets = (attempt.retakes ?? []).filter((retry) => retry.teacherIssuedRestart && !retry.archivedAt && retry.status === "completed" && retry.result).map((retry) => ({ section: retry.section, result: retry.result })) as CompletedSectionReset[];
    return { ...attempt, effectiveResult: attempt.result && resets.length ? effectiveDiagnosticResult(attempt.result, resets) : null };
  });
  return {
    assignmentId: String(row.assignment_id),
    name: row.display_name as string,
    email: row.email as string,
    actorId: String(row.actor_id),
    canResetPassword: row.can_reset_password === true,
    deliveryScope: row.delivery_scope as "full" | "listening" | "structure" | "reading",
    assignmentTitle: row.assignment_title as string,
    attempts,
    attemptCount: attempts.length,
    retakeCount: attempts.reduce((count: number, attempt: { retakes?: unknown[] }) => count + (attempt.retakes?.length ?? 0), 0),
    answeredCount: attempts.reduce((count: number, attempt: { answeredQuestions?: unknown[] }) => count + (attempt.answeredQuestions?.length ?? 0), 0),
    historyLoaded: true,
  };
}

export async function getManagedCandidateHistory(
  resourceId: string,
  assignmentId: string,
  candidateActorId: string,
  staffActorId: string,
  staffRole: "teacher" | "admin",
) {
  const result = await getPool().query(
    `${managedCandidateHistoryQuery} AND a.resource_id=$3 AND a.id=$4 AND a.actor_id=$5 LIMIT 1`,
    [staffActorId, staffRole, resourceId, assignmentId, candidateActorId],
  );
  return result.rows[0] ? mapManagedCandidateHistory(result.rows[0]) : null;
}

export async function getManagedQuestionAnalytics(
  resourceId: string,
  assignmentIds: string[],
  staffActorId: string,
  staffRole: "teacher" | "admin",
): Promise<TeacherQuestionAnalytics> {
  const resource = await getPool().query("SELECT code FROM protefl_resource WHERE id=$1 AND kind='diagnostic_package'", [resourceId]);
  const packageCode = String(resource.rows[0]?.code ?? "");
  if (!diagnosticPackage(packageCode)) throw new Error("resource_unavailable");
  if (!assignmentIds.length) return aggregateTeacherQuestionAnalytics([], packageCode);
  const result = await getPool().query(
    `SELECT DISTINCT ON (d.assignment_id)
       d.id,d.assignment_id,d.actor_id,d.status,d.attempt_number,root_result.result_data,
       COALESCE((
         SELECT jsonb_agg(jsonb_build_object('id',retry.id,'section',retry.scope,'result',retry_result.result_data) ORDER BY retry.completed_at)
         FROM protefl_diagnostic_attempt retry
         JOIN protefl_diagnostic_result retry_result ON retry_result.attempt_id=retry.id
         WHERE retry.parent_attempt_id=d.id
           AND retry.teacher_restarted_by IS NOT NULL
           AND retry.status='completed'
           AND retry.archived_at IS NULL
       ),'[]'::jsonb) AS resets
     FROM protefl_diagnostic_attempt d
     JOIN protefl_resource_assignment a ON a.id=d.assignment_id
     JOIN protefl_resource r ON r.id=a.resource_id
     LEFT JOIN protefl_diagnostic_result root_result ON root_result.attempt_id=d.id
     WHERE d.parent_attempt_id IS NULL
       AND d.status='completed'
       AND root_result.result_data IS NOT NULL
       AND d.archived_at IS NULL
       AND a.resource_id=$1
       AND a.id=ANY($2::uuid[])
       AND a.revoked_at IS NULL
       AND ($4='admin' OR a.assigned_by=$3)
     ORDER BY d.assignment_id,d.attempt_number DESC`,
    [resourceId, assignmentIds, staffActorId, staffRole],
  );
  const completedResults: TeacherQuestionResult[] = [];
  for (const row of result.rows) {
    const resets = (Array.isArray(row.resets) ? row.resets : []) as Array<{ id?: string; section?: string; result?: unknown }>;
    const fullResult = row.result_data as FullDiagnosticResult;
    const rootSource = { candidateActorId: String(row.actor_id), attemptId: String(row.id) };
    if (fullResult.sections && resets.length) {
      const resetEntries = resets.filter((reset) => (reset.section === "listening" || reset.section === "structure" || reset.section === "reading") && reset.result && typeof reset.result === "object");
      const completedResets = resetEntries.map((reset) => ({ section: reset.section as "listening" | "structure" | "reading", result: reset.result })) as CompletedSectionReset[];
      const effective = effectiveDiagnosticResult(fullResult, completedResets);
      const sourceBySection = new Map(resetEntries.map((reset) => [reset.section, { candidateActorId: String(row.actor_id), attemptId: String(reset.id ?? row.id) }]));
      completedResults.push({ ...effective, review: effective.review.map((item) => ({ ...item, source: sourceBySection.get(item.section) ?? rootSource })) });
    } else {
      const resultData = row.result_data as TeacherQuestionResult;
      completedResults.push({ ...resultData, review: resultData.review?.map((item) => ({ ...item, source: rootSource })) });
    }
  }
  return aggregateTeacherQuestionAnalytics(completedResults, packageCode);
}

export async function listManagedResources(staffActorId: string, staffRole: "teacher" | "admin") {
  const result = await getPool().query(
    `SELECT r.id,r.code,r.version,r.kind,r.title,r.status,r.tags,r.created_at,
       (SELECT count(*)::int FROM protefl_resource_assignment a
        WHERE a.resource_id=r.id AND a.revoked_at IS NULL
          AND ($2='admin' OR a.assigned_by=$1)) AS assigned_count
     FROM protefl_resource r
     WHERE $2='admin'
        OR r.created_by=$1
        OR EXISTS (SELECT 1 FROM protefl_resource_assignment owned WHERE owned.resource_id=r.id AND owned.assigned_by=$1)
        OR EXISTS (SELECT 1 FROM protefl_resource_invite owned WHERE owned.resource_id=r.id AND owned.created_by=$1)
     ORDER BY r.created_at DESC`,
    [staffActorId, staffRole],
  );
  const candidates = await getPool().query(
    `SELECT a.id AS assignment_id,a.resource_id,a.actor_id,a.delivery_scope,COALESCE(a.assignment_title,r.title) AS assignment_title,u.display_name,u.email,
       ($2='admin' OR a.assigned_by=$1) AS can_reset_password,
       COALESCE(stats.attempt_count,0)::int AS attempt_count,
       COALESCE(stats.retake_count,0)::int AS retake_count,
       COALESCE(stats.answered_count,0)::int AS answered_count,
       stats.latest_attempt
     FROM protefl_resource_assignment a
     JOIN app_user u ON u.id=a.actor_id
     JOIN protefl_resource r ON r.id=a.resource_id
     LEFT JOIN LATERAL (
       SELECT count(*)::int AS attempt_count,
              COALESCE(sum(root.retake_count),0)::int AS retake_count,
              COALESCE(sum(root.answered_count),0)::int AS answered_count,
              (SELECT jsonb_build_object(
                 'id',latest.id,'number',latest.attempt_number,'status',latest.status,'scope',latest.scope,'deliveryScope',latest.delivery_scope,
                 'createdAt',latest.created_at,'completedAt',latest.completed_at,'archivedAt',latest.archived_at,
                 'result',CASE WHEN latest_result.result_data IS NULL THEN NULL ELSE jsonb_build_object('total',latest_result.result_data->'total','sections',latest_result.result_data->'sections','summary',latest_result.result_data->'summary') END,
                 'answeredCount',latest.answered_count,'retakeCount',latest.retake_count
               )
               FROM (
                 SELECT d.id,d.attempt_number,d.status,d.scope,d.delivery_scope,d.created_at,d.completed_at,d.archived_at,
                   (SELECT count(DISTINCT (e.section,e.question_number))::int FROM protefl_diagnostic_event e WHERE e.attempt_id=d.id AND e.event_type='answer') AS answered_count,
                   (SELECT count(*)::int FROM protefl_diagnostic_attempt retry WHERE retry.parent_attempt_id=d.id) AS retake_count
                 FROM protefl_diagnostic_attempt d
                 WHERE d.assignment_id=a.id AND d.parent_attempt_id IS NULL AND d.archived_at IS NULL
                 ORDER BY d.attempt_number DESC LIMIT 1
               ) latest
               LEFT JOIN protefl_diagnostic_result latest_result ON latest_result.attempt_id=latest.id
              ) AS latest_attempt
       FROM (
         SELECT d.id,
           (SELECT count(*)::int FROM protefl_diagnostic_attempt retry WHERE retry.parent_attempt_id=d.id) AS retake_count,
           (SELECT count(DISTINCT (e.section,e.question_number))::int FROM protefl_diagnostic_event e WHERE e.attempt_id=d.id AND e.event_type='answer') AS answered_count
         FROM protefl_diagnostic_attempt d
         WHERE d.assignment_id=a.id AND d.parent_attempt_id IS NULL
       ) root
     ) stats ON true
     WHERE a.revoked_at IS NULL
       AND ($2='admin' OR a.assigned_by=$1)
     ORDER BY a.resource_id,u.display_name`,
    [staffActorId, staffRole],
  );
  return result.rows.map((row) => ({
    id: String(row.id), code: row.code, version: Number(row.version), kind: row.kind,
    title: row.title, status: row.status, createdAt: new Date(row.created_at).toISOString(),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    assignedCount: Number(row.assigned_count),
    candidates: candidates.rows.filter((candidate) => String(candidate.resource_id) === String(row.id)).map((candidate) => ({
      assignmentId: String(candidate.assignment_id),
      name: candidate.display_name as string,
      email: candidate.email as string,
      actorId: String(candidate.actor_id),
      canResetPassword: candidate.can_reset_password === true,
      deliveryScope: candidate.delivery_scope as "full" | "listening" | "structure" | "reading",
      assignmentTitle: candidate.assignment_title as string,
      attempts: candidate.latest_attempt ? [{ ...candidate.latest_attempt, retakes: [], answeredQuestions: [] }] : [],
      attemptCount: Number(candidate.attempt_count),
      retakeCount: Number(candidate.retake_count),
      answeredCount: Number(candidate.answered_count),
      historyLoaded: false,
    })),
  }));
}

export async function setResourceTags(resourceId: string, rawTags: string[], actorId: string, staffRole: "teacher" | "admin") {
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const rawTag of rawTags) {
    const tag = rawTag.trim().replace(/\s+/g, " ");
    if (tag.length > 80) throw new Error("invalid_tags");
    const key = tag.toLocaleLowerCase("en-US");
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  if (tags.length > 8) throw new Error("invalid_tags");
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const resource = (await client.query(
      `UPDATE protefl_resource AS r SET tags=$2,updated_at=now()
       WHERE r.id=$1
         AND ($4='admin' OR r.created_by=$3
           OR EXISTS (SELECT 1 FROM protefl_resource_assignment a WHERE a.resource_id=r.id AND a.assigned_by=$3)
           OR EXISTS (SELECT 1 FROM protefl_resource_invite i WHERE i.resource_id=r.id AND i.created_by=$3))
       RETURNING r.id,r.tags`,
      [resourceId, tags, actorId, staffRole],
    )).rows[0];
    if (!resource) throw new Error("resource_unavailable");
    await client.query(
      "INSERT INTO protefl_resource_event(resource_id,actor_id,event_type) VALUES($1,$2,'tags_updated')",
      [resourceId, actorId],
    );
    await client.query("COMMIT");
    return { id: String(resource.id), tags: resource.tags as string[] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function archiveCandidateDiagnostic(resourceId: string, assignmentId: string, candidateActorId: string, staffActorId: string, staffRole: "teacher" | "admin") {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const assignment = await client.query(
      `SELECT a.id FROM protefl_resource_assignment a
       JOIN protefl_resource r ON r.id=a.resource_id
       WHERE a.resource_id=$1 AND a.id=$2 AND a.actor_id=$3 AND a.revoked_at IS NULL
         AND r.kind='diagnostic_package' AND ($5='admin' OR a.assigned_by=$4) FOR UPDATE OF a,r`,
      [resourceId, assignmentId, candidateActorId, staffActorId, staffRole],
    );
    if (!assignment.rowCount) throw new Error("assignment_unavailable");
    const attempts = await client.query(
      `SELECT id FROM protefl_diagnostic_attempt
       WHERE assignment_id=$1 AND actor_id=$2 AND archived_at IS NULL
       ORDER BY attempt_number FOR UPDATE`,
      [assignmentId, candidateActorId],
    );
    if (!attempts.rowCount) throw new Error("attempt_unavailable");
    const archive = (await client.query(
      `INSERT INTO protefl_diagnostic_attempt_archive(resource_id,actor_id,archived_by,attempt_count)
       VALUES($1,$2,$3,$4) RETURNING id,archived_at`,
      [resourceId, candidateActorId, staffActorId, attempts.rowCount],
    )).rows[0];
    await client.query(
      `UPDATE protefl_diagnostic_attempt
       SET archived_at=$3,archived_by=$4,archive_batch_id=$5
       WHERE assignment_id=$1 AND actor_id=$2 AND archived_at IS NULL`,
      [assignmentId, candidateActorId, archive.archived_at, staffActorId, archive.id],
    );
    await client.query("COMMIT");
    return { archivedAttempts: attempts.rowCount, archivedAt: new Date(archive.archived_at).toISOString() };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error && ["assignment_unavailable", "attempt_unavailable"].includes(error.message)) throw error;
    throw new Error("archive_unavailable");
  } finally {
    client.release();
  }
}

export async function resetAssignedLearnerPassword(
  resourceId: string,
  assignmentId: string,
  candidateActorId: string,
  staffActorId: string,
  staffRole: "teacher" | "admin",
) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const learner = (await client.query(
      `SELECT u.id,u.email,u.display_name
       FROM protefl_resource_assignment a
       JOIN app_user u ON u.id=a.actor_id
       WHERE a.resource_id=$1 AND a.id=$2 AND a.actor_id=$3 AND a.revoked_at IS NULL
         AND u.role='learner' AND ($5='admin' OR a.assigned_by=$4)
       FOR UPDATE OF u`,
      [resourceId, assignmentId, candidateActorId, staffActorId, staffRole],
    )).rows[0];
    if (!learner) throw new Error("password_reset_unavailable");

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    await client.query("UPDATE app_user SET password_hash=$2,updated_at=now() WHERE id=$1", [candidateActorId, passwordHash]);
    const revoked = await client.query("DELETE FROM app_session WHERE user_id=$1", [candidateActorId]);
    await client.query(
      `INSERT INTO app_password_reset(user_id,reset_by,resource_id,assignment_id,sessions_revoked)
       VALUES($1,$2,$3,$4,$5)`,
      [candidateActorId, staffActorId, resourceId, assignmentId, revoked.rowCount ?? 0],
    );
    await client.query("COMMIT");
    return {
      learner: { name: String(learner.display_name), email: String(learner.email) },
      temporaryPassword,
      revokedSessions: revoked.rowCount ?? 0,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error && error.message === "password_reset_unavailable") throw error;
    throw new Error("password_reset_unavailable");
  } finally {
    client.release();
  }
}

export async function issueResourceInvite(
  resourceId: string,
  actorId: string,
  staffRole: "teacher" | "admin",
  assignmentTitle: string,
  listeningMode: "autoplay" | "question_click" = "question_click",
  showListeningQuestionText = true,
  deliveryScope: "full" | "listening" | "structure" | "reading" = "full",
  inviteKind: "private" | "classroom" = "private",
) {
  const pinnedTitle = assignmentTitle.trim();
  if (!pinnedTitle || pinnedTitle.length > 120) throw new Error("invalid_assignment_title");
  const code = generateResourceCode();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const resource = (await client.query(
      `SELECT r.id,r.status,r.kind
       FROM protefl_resource r
       WHERE r.id=$1
         AND ($3='admin' OR r.created_by=$2
           OR EXISTS (SELECT 1 FROM protefl_resource_assignment a WHERE a.resource_id=r.id AND a.assigned_by=$2)
           OR EXISTS (SELECT 1 FROM protefl_resource_invite i WHERE i.resource_id=r.id AND i.created_by=$2))
       FOR UPDATE`,
      [resourceId, actorId, staffRole],
    )).rows[0];
    if (!resource || resource.status !== "published") throw new Error("resource_unavailable");
    if (!(listeningMode === "autoplay" || listeningMode === "question_click")) throw new Error("invalid_listening_mode");
    if (!(inviteKind === "private" || inviteKind === "classroom")) throw new Error("invalid_invite_kind");
    const pinnedMode = resource.kind === "diagnostic_package" ? listeningMode : "question_click";
    const invite = (await client.query(
      `INSERT INTO protefl_resource_invite(resource_id,code_hash,created_by,expires_at,listening_mode,show_listening_question_text,delivery_scope,invite_kind,assignment_title)
       VALUES($1,$2,$3,now()+interval '7 days',$4,$5,$6,$7,$8) RETURNING id`,
      [resourceId, hashResourceCode(code), actorId, pinnedMode, showListeningQuestionText, deliveryScope, inviteKind, pinnedTitle],
    )).rows[0];
    await client.query("INSERT INTO protefl_resource_event(resource_id,actor_id,invite_id,event_type) VALUES($1,$2,$3,'invite_created')", [resourceId, actorId, invite.id]);
    await client.query("COMMIT");
    return { code, assignmentTitle: pinnedTitle, listeningMode: pinnedMode, showListeningQuestionText, deliveryScope, inviteKind, expiresInDays: 7 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function setResourceStatus(resourceId: string, status: string, actorId: string, staffRole: "teacher" | "admin") {
  if (!publicStatus(status) || !["published", "hidden"].includes(status)) throw new Error("invalid_status");
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE protefl_resource SET status=$2,published_at=CASE WHEN $2='published' THEN COALESCE(published_at,now()) ELSE published_at END,updated_at=now()
       WHERE id=$1 AND status IN ('draft','published','hidden')
         AND ($4='admin' OR created_by=$3
           OR EXISTS (SELECT 1 FROM protefl_resource_assignment a WHERE a.resource_id=protefl_resource.id AND a.assigned_by=$3)
           OR EXISTS (SELECT 1 FROM protefl_resource_invite i WHERE i.resource_id=protefl_resource.id AND i.created_by=$3))
       RETURNING id,code,status`, [resourceId, status, actorId, staffRole],
    );
    const resource = result.rows[0];
    if (!resource) throw new Error("resource_unavailable");
    await client.query("INSERT INTO protefl_resource_event(resource_id,actor_id,event_type) VALUES($1,$2,$3)", [resourceId, actorId, status]);
    await client.query("COMMIT");
    return resource;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}
