import { spawnSync } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";

const expectedDatabase = "/listening";
const manifest = path.resolve(".secrets/lfl020-import/ocean-currents.activity-package.json");
const media = path.resolve(".secrets/lfl020-import/ocean-currents.mp3");
const expectedHash = "23d072cf57c1db8668299d349f87916584025b578942b98aed8d4326fc9580fa";
const ownerIndex = process.argv.indexOf("--owner");
const owner = ownerIndex >= 0 ? process.argv[ownerIndex + 1] : undefined;

if (!process.argv.includes("--apply") || !owner) {
  console.log(JSON.stringify({
    status: "guarded",
    usage: "node scripts/lfl020-import-second-activity.mjs --apply --owner OPERATOR_EMAIL [--publish]",
    manifest,
    media,
  }));
  process.exit(0);
}
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes(expectedDatabase))
  throw new Error("Refusing import: DATABASE_URL must target the listening database");
await access(manifest);
await access(media);

const pg = (await import("pg")).default;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  const existing = await pool.query(
    `SELECT av.id
     FROM activity a JOIN activity_version av ON av.activity_id=a.id
     WHERE a.slug='ocean-currents-in-motion' AND av.media_sha256=$1
     LIMIT 1`,
    [expectedHash],
  );
  if (existing.rowCount) {
    console.log(JSON.stringify({ status: "already_imported", slug: "ocean-currents-in-motion" }));
    process.exit(0);
  }
} finally {
  await pool.end();
}

const command = process.env.npm_execpath ?? "pnpm";
const args = command.endsWith("pnpm.cjs") || command.endsWith("pnpm")
  ? ["exec", "tsx", "scripts/import-activity.ts", "--manifest", manifest, "--media", media, "--owner", owner]
  : ["tsx", "scripts/import-activity.ts", "--manifest", manifest, "--media", media, "--owner", owner];
if (process.argv.includes("--publish")) args.push("--publish");
const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
