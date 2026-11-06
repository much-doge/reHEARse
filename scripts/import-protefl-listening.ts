import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import pg from "pg";
import { z } from "zod";

const option = z.enum(["A", "B", "C", "D"]);
const media = z.object({
  localFile: z.string().min(1),
  durationMs: z.number().int().positive(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  sizeBytes: z.number().int().positive(),
  contentType: z.literal("audio/mpeg"),
  sourceStartMs: z.number().int().nonnegative(),
  sourceEndMs: z.number().int().positive(),
});
const item = z.object({
  number: z.number().int().min(1).max(50),
  part: z.enum(["A", "B", "C"]),
  group: z.string().min(1).max(80),
  options: z.object({ A: z.string(), B: z.string(), C: z.string(), D: z.string() }).strict(),
  answer: option,
  media,
});
const formSchema = z.object({
  contractVersion: z.literal("protefl-listening-form.v1"),
  code: z.literal("ptc-listening-2000-10-v1"),
  title: z.string().min(1).max(200),
  responseWindowMs: z.literal(12000),
  pilot: z.literal(true),
  items: z.array(item).length(50),
});

const packagePath = process.argv.slice(2).find((argument) => argument !== "--");
const databaseUrl = process.env.DATABASE_URL;
if (!packagePath) throw new Error("Usage: tsx scripts/import-protefl-listening.ts <private-package.json>");
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const raw = await readFile(path.resolve(packagePath), "utf8");
const parsed = formSchema.parse(JSON.parse(raw));
for (const [index, current] of parsed.items.entries()) {
  if (current.number !== index + 1) throw new Error("Items must be in the original 1-50 sequence");
  if ((current.number <= 30 ? "A" : current.number <= 39 ? "B" : "C") !== current.part)
    throw new Error(`Part boundary mismatch at item ${current.number}`);
  const mediaFile = process.env.PROTEFL_IMPORT_MEDIA_DIR
    ? path.join(process.env.PROTEFL_IMPORT_MEDIA_DIR, path.basename(current.media.localFile))
    : current.media.localFile;
  const data = await readFile(mediaFile);
  const details = await stat(mediaFile);
  if (details.size !== current.media.sizeBytes) throw new Error(`Media size mismatch at item ${current.number}`);
  if (createHash("sha256").update(data).digest("hex") !== current.media.sha256)
    throw new Error(`Media hash mismatch at item ${current.number}`);
}

const sourceDigest = createHash("sha256").update(raw).digest("hex");
const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const existing = (await client.query("SELECT id,source_digest FROM protefl_test_form WHERE code=$1", [parsed.code])).rows[0];
  if (existing && existing.source_digest !== sourceDigest)
    throw new Error("The immutable form code already exists with different content");
  let formId = existing?.id;
  if (!formId) {
    formId = (
      await client.query(
        `INSERT INTO protefl_test_form(code,version,title,contract_version,response_window_ms,source_digest)
         VALUES($1,1,$2,$3,$4,$5) RETURNING id`,
        [parsed.code, parsed.title, parsed.contractVersion, parsed.responseWindowMs, sourceDigest],
      )
    ).rows[0].id;
    for (const current of parsed.items) {
      await client.query(
        `INSERT INTO protefl_test_item(
           form_id,ordinal,part,passage_group,options_json,answer,media_storage_key,
           media_duration_ms,media_sha256,media_size_bytes
         ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          formId,
          current.number,
          current.part,
          current.group,
          JSON.stringify(current.options),
          current.answer,
          `${parsed.code}/${String(current.number).padStart(3, "0")}.mp3`,
          current.media.durationMs,
          current.media.sha256,
          current.media.sizeBytes,
        ],
      );
    }
  }
  const count = Number((await client.query("SELECT count(*) FROM protefl_test_item WHERE form_id=$1", [formId])).rows[0].count);
  if (count !== 50) throw new Error("Imported form does not contain exactly 50 items");
  await client.query("COMMIT");
  console.log(`Validated and imported ${parsed.code}: ${count} items`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
