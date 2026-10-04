import { Pool } from "pg";

const globalForDatabase = globalThis as unknown as { listeningPool?: Pool };

export function getPool(): Pool {
  if (globalForDatabase.listeningPool) return globalForDatabase.listeningPool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  const pool = new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });
  globalForDatabase.listeningPool = pool;
  return pool;
}
