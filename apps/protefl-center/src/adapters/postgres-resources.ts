import { createHash } from "node:crypto";

import { getPool } from "@/adapters/db/client";
import { generateResourceCode, hashResourceCode, isValidResourceCode, normalizeResourceCode } from "../application/resource-code";

export type TestCenterResource = {
  id: string;
  code: string;
  version: number;
  kind: "listening_form" | "diagnostic_package";
  title: string;
  status: "draft" | "published" | "hidden" | "retired";
  assignedAt: string;
  startsAt: string;
  endsAt: string | null;
  hasAttempt: boolean;
  listeningMode: "autoplay" | "question_click";
  deliveryScope: "full" | "listening" | "structure" | "reading";
};

const publicStatus = (status: string) => ["draft", "published", "hidden", "retired"].includes(status);

export async function assignedResources(actorId: string): Promise<TestCenterResource[]> {
  const result = await getPool().query(
    `SELECT r.id,r.code,r.version,r.kind,r.title,r.status,
       a.assigned_at,a.starts_at,a.ends_at,a.listening_mode,a.delivery_scope,
            (EXISTS(SELECT 1 FROM protefl_attempt t WHERE t.actor_id=a.actor_id AND t.form_id=r.listening_form_id AND t.status<>'invalidated') OR EXISTS(SELECT 1 FROM protefl_diagnostic_attempt d WHERE d.actor_id=a.actor_id AND d.resource_id=r.id)) AS has_attempt
     FROM protefl_resource_assignment a
     JOIN protefl_resource r ON r.id=a.resource_id
     WHERE a.actor_id=$1 AND a.revoked_at IS NULL
       AND (a.ends_at IS NULL OR a.ends_at>now())
       AND (r.status='published' OR (r.status='hidden' AND (EXISTS(SELECT 1 FROM protefl_attempt t WHERE t.actor_id=a.actor_id AND t.form_id=r.listening_form_id AND t.status<>'invalidated') OR EXISTS(SELECT 1 FROM protefl_diagnostic_attempt d WHERE d.actor_id=a.actor_id AND d.resource_id=r.id))))
       AND (a.starts_at<=now())
     ORDER BY r.created_at DESC`,
    [actorId],
  );
  return result.rows.map((row) => ({
    id: String(row.id), code: row.code, version: Number(row.version), kind: row.kind,
    title: row.title, status: row.status, assignedAt: new Date(row.assigned_at).toISOString(),
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
    if (!invite || invite.status !== "published" || invite.claimed_at || invite.revoked_at || !invite.not_expired)
      throw new Error("invite_unavailable");
    await client.query(
      `INSERT INTO protefl_resource_assignment(resource_id,actor_id,assigned_by,invite_id,assignment_kind,listening_mode,show_listening_question_text,delivery_scope)
       VALUES($1,$2,$3,$4,'invite',$5,$6,$7)
       ON CONFLICT(resource_id,actor_id) WHERE revoked_at IS NULL DO UPDATE SET
         assigned_by=excluded.assigned_by,invite_id=excluded.invite_id,assignment_kind='invite',listening_mode=excluded.listening_mode,
         show_listening_question_text=excluded.show_listening_question_text,delivery_scope=excluded.delivery_scope,starts_at=now(),ends_at=NULL`,
      [invite.resource_id, actorId, invite.created_by, invite.id, invite.listening_mode, invite.show_listening_question_text, invite.delivery_scope],
    );
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

export async function listManagedResources() {
  const result = await getPool().query(
    `SELECT r.id,r.code,r.version,r.kind,r.title,r.status,r.created_at,
       (SELECT count(*)::int FROM protefl_resource_assignment a WHERE a.resource_id=r.id AND a.revoked_at IS NULL) AS assigned_count
     FROM protefl_resource r ORDER BY r.created_at DESC`,
  );
  const candidates = await getPool().query(
    `SELECT a.resource_id,a.delivery_scope,u.display_name,u.email,
       COALESCE(history.attempts,'[]'::jsonb) AS attempts
     FROM protefl_resource_assignment a JOIN app_user u ON u.id=a.actor_id
     LEFT JOIN LATERAL (
       SELECT jsonb_agg(jsonb_build_object(
         'number',d.attempt_number,'status',d.status,'scope',d.scope,'deliveryScope',d.delivery_scope,
         'createdAt',d.created_at,'completedAt',d.completed_at,'result',r.result_data,
         'retakes',COALESCE((
           SELECT jsonb_agg(jsonb_build_object(
             'section',retry.scope,'number',retry.section_retake_number,'status',retry.status,
             'createdAt',retry.created_at,'completedAt',retry.completed_at,'result',rr.result_data
           ) ORDER BY retry.attempt_number)
           FROM protefl_diagnostic_attempt retry
           LEFT JOIN protefl_diagnostic_result rr ON rr.attempt_id=retry.id
           WHERE retry.parent_attempt_id=d.id
         ),'[]'::jsonb)
       ) ORDER BY d.attempt_number) AS attempts
       FROM protefl_diagnostic_attempt d
       LEFT JOIN protefl_diagnostic_result r ON r.attempt_id=d.id
       WHERE d.resource_id=a.resource_id AND d.actor_id=a.actor_id
         AND d.scope='full' AND d.parent_attempt_id IS NULL
     ) history ON true
     WHERE a.revoked_at IS NULL ORDER BY a.resource_id,u.display_name`,
  );
  return result.rows.map((row) => ({
    id: String(row.id), code: row.code, version: Number(row.version), kind: row.kind,
    title: row.title, status: row.status, createdAt: new Date(row.created_at).toISOString(),
    assignedCount: Number(row.assigned_count),
    candidates: candidates.rows.filter((candidate) => String(candidate.resource_id) === String(row.id)).map((candidate) => ({
      name: candidate.display_name as string,
      email: candidate.email as string,
      deliveryScope: candidate.delivery_scope as "full" | "listening" | "structure" | "reading",
      attempts: candidate.attempts ?? [],
    })),
  }));
}

export async function issueResourceInvite(
  resourceId: string,
  actorId: string,
  listeningMode: "autoplay" | "question_click" = "question_click",
  showListeningQuestionText = true,
  deliveryScope: "full" | "listening" | "structure" | "reading" = "full",
) {
  const code = generateResourceCode();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const resource = (await client.query("SELECT id,status,kind FROM protefl_resource WHERE id=$1 FOR UPDATE", [resourceId])).rows[0];
    if (!resource || resource.status !== "published") throw new Error("resource_unavailable");
    if (!(listeningMode === "autoplay" || listeningMode === "question_click")) throw new Error("invalid_listening_mode");
    const pinnedMode = resource.kind === "diagnostic_package" ? listeningMode : "question_click";
    const invite = (await client.query(
      `INSERT INTO protefl_resource_invite(resource_id,code_hash,created_by,expires_at,listening_mode,show_listening_question_text,delivery_scope)
       VALUES($1,$2,$3,now()+interval '7 days',$4,$5,$6) RETURNING id`,
      [resourceId, hashResourceCode(code), actorId, pinnedMode, showListeningQuestionText, deliveryScope],
    )).rows[0];
    await client.query("INSERT INTO protefl_resource_event(resource_id,actor_id,invite_id,event_type) VALUES($1,$2,$3,'invite_created')", [resourceId, actorId, invite.id]);
    await client.query("COMMIT");
    return { code, listeningMode: pinnedMode, showListeningQuestionText, deliveryScope, expiresInDays: 7 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function setResourceStatus(resourceId: string, status: string, actorId: string) {
  if (!publicStatus(status) || !["published", "hidden"].includes(status)) throw new Error("invalid_status");
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE protefl_resource SET status=$2,published_at=CASE WHEN $2='published' THEN COALESCE(published_at,now()) ELSE published_at END,updated_at=now()
       WHERE id=$1 AND status IN ('draft','published','hidden') RETURNING id,code,status`, [resourceId, status],
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
