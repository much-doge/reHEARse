import { createHash, randomBytes } from "node:crypto";

import { getPool } from "@/adapters/db/client";

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
};

const hashCode = (code: string) => createHash("sha256").update(code).digest("hex");
const publicStatus = (status: string) => ["draft", "published", "hidden", "retired"].includes(status);

export async function assignedResources(actorId: string): Promise<TestCenterResource[]> {
  const result = await getPool().query(
    `SELECT r.id,r.code,r.version,r.kind,r.title,r.status,
            a.assigned_at,a.starts_at,a.ends_at,
            EXISTS(SELECT 1 FROM protefl_attempt t WHERE t.actor_id=a.actor_id AND t.form_id=r.listening_form_id AND t.status<>'invalidated') AS has_attempt
     FROM protefl_resource_assignment a
     JOIN protefl_resource r ON r.id=a.resource_id
     WHERE a.actor_id=$1 AND a.revoked_at IS NULL
       AND (a.ends_at IS NULL OR a.ends_at>now())
       AND (r.status='published' OR (r.status='hidden' AND EXISTS(
         SELECT 1 FROM protefl_attempt t WHERE t.actor_id=a.actor_id AND t.form_id=r.listening_form_id AND t.status<>'invalidated'
       )))
       AND (a.starts_at<=now())
     ORDER BY r.created_at DESC`,
    [actorId],
  );
  return result.rows.map((row) => ({
    id: String(row.id), code: row.code, version: Number(row.version), kind: row.kind,
    title: row.title, status: row.status, assignedAt: new Date(row.assigned_at).toISOString(),
    startsAt: new Date(row.starts_at).toISOString(), endsAt: row.ends_at ? new Date(row.ends_at).toISOString() : null,
    hasAttempt: row.has_attempt === true,
  }));
}

export async function claimResource(actorId: string, rawCode: string): Promise<void> {
  const code = rawCode.trim();
  if (code.length < 12 || code.length > 80) throw new Error("invite_unavailable");
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const invite = (await client.query(
      `SELECT i.*,r.status,(i.expires_at>now()) AS not_expired FROM protefl_resource_invite i
       JOIN protefl_resource r ON r.id=i.resource_id
       WHERE i.code_hash=$1 FOR UPDATE OF i`, [hashCode(code)],
    )).rows[0];
    if (!invite || invite.status !== "published" || invite.claimed_at || invite.revoked_at || !invite.not_expired)
      throw new Error("invite_unavailable");
    await client.query(
      `INSERT INTO protefl_resource_assignment(resource_id,actor_id,assigned_by,invite_id,assignment_kind)
       VALUES($1,$2,$3,$4,'invite')`, [invite.resource_id, actorId, invite.created_by, invite.id],
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
  return result.rows.map((row) => ({
    id: String(row.id), code: row.code, version: Number(row.version), kind: row.kind,
    title: row.title, status: row.status, createdAt: new Date(row.created_at).toISOString(),
    assignedCount: Number(row.assigned_count),
  }));
}

export async function issueResourceInvite(resourceId: string, actorId: string) {
  const code = randomBytes(18).toString("base64url");
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const resource = (await client.query("SELECT id,status FROM protefl_resource WHERE id=$1 FOR UPDATE", [resourceId])).rows[0];
    if (!resource || resource.status !== "published") throw new Error("resource_unavailable");
    const invite = (await client.query(
      `INSERT INTO protefl_resource_invite(resource_id,code_hash,created_by,expires_at)
       VALUES($1,$2,$3,now()+interval '7 days') RETURNING id`,
      [resourceId, hashCode(code), actorId],
    )).rows[0];
    await client.query("INSERT INTO protefl_resource_event(resource_id,actor_id,invite_id,event_type) VALUES($1,$2,$3,'invite_created')", [resourceId, actorId, invite.id]);
    await client.query("COMMIT");
    return { code, expiresInDays: 7 };
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
