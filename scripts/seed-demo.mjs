import { randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { promisify } from "node:util";
import process from "node:process";

import pg from "pg";

if (process.env.ALLOW_DEMO_SEED !== "true") {
  throw new Error("Refusing to seed known demo credentials without ALLOW_DEMO_SEED=true");
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const scrypt = promisify(nodeScrypt);

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${Buffer.from(derived).toString("hex")}`;
}

const accounts = [
  {
    email: process.env.DEMO_LEARNER_EMAIL,
    password: process.env.DEMO_LEARNER_PASSWORD,
    displayName: "Demo Student",
    role: "learner",
  },
  {
    email: process.env.DEMO_TEACHER_EMAIL,
    password: process.env.DEMO_TEACHER_PASSWORD,
    displayName: "Demo Teacher",
    role: "teacher",
  },
  {
    email: process.env.DEMO_ADMIN_EMAIL,
    password: process.env.DEMO_ADMIN_PASSWORD,
    displayName: "Demo Admin",
    role: "admin",
  },
];

const preparedAccounts = [];
for (const account of accounts) {
  if (!account.email || !account.password || account.password.length < 10) {
    throw new Error(`Missing or invalid demo credentials for ${account.role}`);
  }
  preparedAccounts.push({ ...account, passwordHash: await hashPassword(account.password) });
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const account of preparedAccounts) {
    await client.query(
      `INSERT INTO app_user (email, display_name, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (lower(email)) DO UPDATE
       SET display_name = excluded.display_name,
           password_hash = excluded.password_hash,
           role = excluded.role,
           updated_at = now()`,
      [account.email.toLowerCase(), account.displayName, account.passwordHash, account.role],
    );
  }
  await client.query("COMMIT");
  console.log("Seeded three local demo roles without printing credentials.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  client.release();
  await pool.end();
}
