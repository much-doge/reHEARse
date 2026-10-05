import { readFile, stat } from "node:fs/promises";
import { createHash, randomUUID, randomBytes } from "node:crypto";
import path from "node:path";
import pg from "pg";
import { deckSchema } from "../src/domain/game/contracts";
import { S3CompatibleMediaStore } from "../src/adapters/media/s3-media-store";
import { readS3MediaConfig } from "../src/adapters/media/s3-config";
async function main() {
  const [manifest, directory] = process.argv.slice(2);
  if (!manifest || !directory)
    throw new Error("manifest and audio directory required");
  const deck = deckSchema.parse(JSON.parse(await readFile(manifest, "utf8")));
  const config = readS3MediaConfig();
  if (config.deliveryMode !== "public")
    throw new Error("classroom requires operator-authorized public media");
  const media = new S3CompatibleMediaStore(config);
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(817240212)");
    const exists = await c.query("SELECT id FROM game_deck WHERE version=$1", [
      deck.version,
    ]);
    if (exists.rowCount) {
      console.log("Deck version already imported");
      await c.query("ROLLBACK");
      return;
    }
    const id = randomUUID();
    const lineage = [];
    for (const r of deck.rounds) {
      const file = path.join(directory, `${r.number}.mp3`);
      const bytes = await readFile(file);
      const size = (await stat(file)).size;
      const sha = createHash("sha256").update(bytes).digest("hex");
      const key = `${config.prefix}/activities/${id}/v1/${randomBytes(16).toString("hex")}-${r.number}.mp3`;
      await media.uploadFile({
        path: file,
        storageKey: key,
        contentType: "audio/mpeg",
        sizeBytes: size,
        sha256: sha,
        activitySlug: "part-a-classroom",
      });
      r.audioUrl = (await media.createDownloadUrl(key)).url;
      lineage.push({
        number: r.number,
        sha256: sha,
        sizeBytes: size,
        storageKey: key,
      });
      console.log(`Prepared clip ${r.number}`);
    }
    await c.query(
      "INSERT INTO game_deck(id,version,title,rounds,source) VALUES($1,$2,$3,$4,$5)",
      [
        id,
        deck.version,
        deck.title,
        JSON.stringify(deck.rounds),
        JSON.stringify({
          contractVersion: "game-source.v1",
          source: "Operator-provided ConTEFL 1163 Part A",
          lineage,
        }),
      ],
    );
    await c.query("COMMIT");
    console.log(`Published ${deck.rounds.length} rounds`);
  } catch {
    await c.query("ROLLBACK");
    throw new Error(
      "Game import failed; unpublished uploads may need operator reconciliation",
    );
  } finally {
    c.release();
    await pool.end();
  }
}
main().catch(() => {
  console.error(
    "Game import failed safely; inspect configuration and source package without logging secrets",
  );
  process.exitCode = 1;
});
