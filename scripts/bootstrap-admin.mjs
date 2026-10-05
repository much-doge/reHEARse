import { randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";
const env = process.env;
if (env.ALLOW_ADMIN_BOOTSTRAP !== "true" || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 24 || env.ADMIN_PASSWORD.includes("ReHEARse-")) throw new Error("protected_bootstrap_required");
const salt = randomBytes(16);
const hash = await promisify(nodeScrypt)(env.ADMIN_PASSWORD, salt, 64);
const passwordHash = `scrypt$${salt.toString("hex")}$${Buffer.from(hash).toString("hex")}`;
const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 1 });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("LOCK TABLE app_user IN EXCLUSIVE MODE");
  const existing = await client.query("SELECT id FROM app_user WHERE role = 'admin'");
  if (existing.rowCount) throw new Error("administrator_already_exists");
  await client.query("INSERT INTO app_user (email, display_name, password_hash, role) VALUES ($1, $2, $3, 'admin')", [env.ADMIN_EMAIL.toLowerCase(), "Administrator", passwordHash]);
  await client.query("COMMIT");
  console.log("Initial administrator created; credentials omitted.");
} catch {
  await client.query("ROLLBACK").catch(() => undefined);
  console.error("administrator_bootstrap_failed"); process.exitCode = 1;
} finally { client.release(); await pool.end(); }
