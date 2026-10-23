/** Publish an immutable v2 package from the existing Part A row without re-uploading audio. */
import { createHash, randomUUID } from "node:crypto";
import pg from "pg";
import { workshopSchema, type WorkshopContent } from "../src/domain/workshop/content";
import { workshopGroups } from "../src/adapters/workshop/preparation";

const BASE_VERSION = "short-conversation-workshop-v1";
const TARGET_VERSION = "short-conversation-workshop-v2";
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

async function main() {
  const [mode] = process.argv.slice(2);
  if (!mode || !["--dry-run", "--publish"].includes(mode)) throw new Error("explicit_mode_required");
  if (mode === "--publish" && process.env.ALLOW_WORKSHOP_REVISION !== "true") throw new Error("explicit_operator_revision_required");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(817240223)");
    const base = (await client.query("SELECT id,activity_id,content_json,media_json FROM workshop_content WHERE version=$1 FOR SHARE", [BASE_VERSION])).rows[0];
    if (!base || base.activity_id !== "short-conversation-workshop") throw new Error("accepted_base_unavailable");
    const old = base.content_json as WorkshopContent;
    if (old.items.length !== 30 || old.groups.length !== 5) throw new Error("unexpected_base_shape");
    const oldMedia = new Map((base.media_json as Array<{ itemId: string; sha256: string; sizeBytes: number; durationMs: number; storageKey: string; publicUrl: string }>).map((entry) => [entry.itemId, entry]));
    const items = old.items.map((item, index) => {
      const lineage = oldMedia.get(item.id);
      if (!lineage || lineage.sha256 !== item.media.sha256 || lineage.sizeBytes !== item.media.sizeBytes || lineage.durationMs !== item.media.durationMs || lineage.storageKey !== item.media.storageKey || lineage.publicUrl !== item.media.publicUrl) throw new Error("base_media_lineage_mismatch");
      const revised = { ...item, title: { en: `Clip ${index + 1}`, id: `Klip ${index + 1}` } } as typeof item & { prompt?: unknown; questionTask?: unknown };
      delete revised.prompt;
      delete revised.questionTask;
      return revised;
    });
    const content = workshopSchema.parse({
      contractVersion: "part-a-workshop.v2",
      id: old.id,
      version: TARGET_VERSION,
      title: old.title,
      groupingVersion: "longman-part-a-v1",
      pedagogyVersion: "longman-part-a-practice-v2",
      groups: workshopGroups,
      items,
    });
    if (content.items.some((item) => item.prompt || item.questionTask)) throw new Error("written_stem_present");
    if (content.groups.map((group) => group.id).join(",") !== old.groups.map((group) => group.id).join(",")) throw new Error("group_order_changed");
    for (let i = 0; i < old.items.length; i++) {
      const before = old.items[i], after = content.items[i];
      if (before.id !== after.id || before.groupId !== after.groupId || before.primarySkill !== after.primarySkill || before.options.join("\u0000") !== after.options.join("\u0000") || before.answer !== after.answer || before.media.sha256 !== after.media.sha256 || before.media.publicUrl !== after.media.publicUrl) throw new Error("source_item_changed");
    }
    const canonical = structuredClone(content);
    for (const item of canonical.items) item.media.localFile = "operator-private";
    const digest = hash(canonical);
    const exists = (await client.query("SELECT digest FROM workshop_content WHERE version=$1", [TARGET_VERSION])).rows[0];
    if (exists) {
      if (exists.digest !== digest) throw new Error("immutable_version_conflict");
      await client.query("ROLLBACK");
      console.log("Identical immutable v2 content already exists; no audio was uploaded and no row was changed.");
      return;
    }
    if (mode === "--dry-run") {
      await client.query("ROLLBACK");
      console.log("PASS: 30 clips, five Longman-aligned groups, source A–D order/keys and public media lineage preserved; no written prompts; three optional real-audio activities; no uploads or database changes.");
      return;
    }
    await client.query("INSERT INTO workshop_content(id,version,activity_id,grouping_version,pedagogy_version,digest,content_json,media_json) VALUES($1,$2,$3,$4,$5,$6,$7,$8)", [randomUUID(), TARGET_VERSION, old.id, content.groupingVersion, content.pedagogyVersion, digest, JSON.stringify(content), JSON.stringify(base.media_json)]);
    await client.query("COMMIT");
    console.log("Published one immutable v2 content row. Existing v1 content, rooms, responses and all public media objects remain unchanged.");
  } catch {
    await client.query("ROLLBACK");
    throw new Error("part_a_revision_failed_without_changing_the_base_version");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(() => { console.error("Part A revision was not published; inspect operator configuration without logging private content or credentials."); process.exitCode = 1; });
