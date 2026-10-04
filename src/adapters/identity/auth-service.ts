import { createHash, randomBytes } from "node:crypto";

import type { PoolClient } from "pg";

import { getPool } from "@/adapters/db/client";
import { hashPassword, verifyPassword } from "@/adapters/identity/password";

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
  role: "learner" | "teacher" | "admin";
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toUser(row: Record<string, unknown>): AuthenticatedUser {
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: String(row.display_name),
    role: row.role as AuthenticatedUser["role"],
  };
}

export async function registerLearner(input: {
  email: string;
  displayName: string;
  password: string;
}): Promise<AuthenticatedUser | null> {
  const passwordHash = await hashPassword(input.password);
  try {
    const result = await getPool().query(
      `INSERT INTO app_user (email, display_name, password_hash, role)
       VALUES ($1, $2, $3, 'learner')
       RETURNING id, email, display_name, role`,
      [normalizeEmail(input.email), input.displayName.trim(), passwordHash],
    );
    return toUser(result.rows[0]);
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return null;
    }
    throw error;
  }
}

export async function authenticate(email: string, password: string): Promise<AuthenticatedUser | null> {
  const result = await getPool().query(
    `SELECT id, email, display_name, role, password_hash
     FROM app_user WHERE lower(email) = $1`,
    [normalizeEmail(email)],
  );
  const row = result.rows[0];
  if (!row || !(await verifyPassword(password, row.password_hash))) return null;
  return toUser(row);
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await getPool().query(
    `INSERT INTO app_session (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash(token), expiresAt],
  );
  return { token, expiresAt };
}

export async function findUserBySession(token: string): Promise<AuthenticatedUser | null> {
  const result = await getPool().query(
    `SELECT u.id, u.email, u.display_name, u.role
     FROM app_session s
     JOIN app_user u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [tokenHash(token)],
  );
  return result.rows[0] ? toUser(result.rows[0]) : null;
}

export async function revokeSession(token: string, client?: PoolClient): Promise<void> {
  const executor = client ?? getPool();
  await executor.query("DELETE FROM app_session WHERE token_hash = $1", [tokenHash(token)]);
}
