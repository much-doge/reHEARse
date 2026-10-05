import { createHash, randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFile, mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";

import pg from "pg";

import { S3CompatibleMediaStore } from "../src/adapters/media/s3-media-store";
import { readS3MediaConfig } from "../src/adapters/media/s3-config";
import { activityPackageSchema, type ActivityPackage } from "../src/domain/activity-package";
import { parseListeningFeedback } from "../src/domain/feedback";

type Arguments = {
  manifestPath: string;
  mediaPath: string | null;
  ownerEmail: string;
  publish: boolean;
  dryRun: boolean;
};

type PreparedMedia = {
  provider: "local" | "s3";
  storageKey: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  cleanup: () => Promise<void>;
};

const defaultFeedback = parseListeningFeedback({
  contractVersion: "listening-feedback.v1",
  summary: {
    en: "Your reconstruction has been preserved. This activity is using a teacher-authored attention guide, so it does not yet make attempt-specific claims.",
    id: "Rekonstruksimu telah disimpan. Aktivitas ini masih menggunakan panduan perhatian dari guru, sehingga belum membuat klaim khusus tentang percobaanmu.",
  },
  observations: [{
    kind: "insufficient_evidence",
    message: {
      en: "Live review is not enabled, so the system cannot reliably distinguish captured meaning from uncertainty.",
      id: "Tinjauan langsung belum diaktifkan, sehingga sistem belum dapat membedakan makna yang tertangkap dari ketidakpastian secara andal.",
    },
  }],
  nextListeningTarget: {
    en: "Relisten using the teacher's central focus for this activity.",
    id: "Dengarkan kembali dengan menggunakan fokus utama guru untuk aktivitas ini.",
  },
});

const args = parseArguments(process.argv.slice(2));
const rawManifest = JSON.parse(await readFile(path.resolve(args.manifestPath), "utf8"));
const activityPackage = activityPackageSchema.parse(rawManifest);
if (args.mediaPath && !activityPackage.media) {
  throw new Error("The manifest must include media metadata when --media is supplied");
}

if (args.dryRun) {
  console.log(JSON.stringify({
    status: "valid",
    contractVersion: activityPackage.contractVersion,
    slug: activityPackage.slug,
    questions: activityPackage.questions.length,
    transcriptSegments: activityPackage.transcript.segments.length,
    mediaWillUpload: Boolean(args.mediaPath),
    willPublish: args.publish,
  }));
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const preparedMedia = args.mediaPath
  ? await prepareMedia(activityPackage, path.resolve(args.mediaPath))
  : null;
const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const ownerResult = await client.query(
    `SELECT id, role FROM app_user WHERE lower(email) = lower($1) FOR SHARE`,
    [args.ownerEmail],
  );
  const owner = ownerResult.rows[0];
  if (!owner || !["teacher", "admin"].includes(owner.role)) {
    throw new Error("--owner must identify an existing teacher or admin");
  }

  const activityResult = await client.query(
    `SELECT id, owner_id, state, current_version
     FROM activity WHERE slug = $1 FOR UPDATE`,
    [activityPackage.slug],
  );
  const existing = activityResult.rows[0];
  if (existing?.owner_id && existing.owner_id !== owner.id && owner.role !== "admin") {
    throw new Error("Only the activity owner or an admin may import a new version");
  }

  let activityId: string;
  let versionNumber: number;
  if (existing) {
    activityId = existing.id;
    const versionResult = await client.query(
      `SELECT coalesce(max(version_number), 0)::int + 1 AS next_version
       FROM activity_version WHERE activity_id = $1`,
      [activityId],
    );
    versionNumber = versionResult.rows[0].next_version;
  } else {
    const inserted = await client.query(
      `INSERT INTO activity (slug, owner_id, state, current_version)
       VALUES ($1, $2, $3, 1) RETURNING id`,
      [activityPackage.slug, owner.id, args.publish ? "published" : "draft"],
    );
    activityId = inserted.rows[0].id;
    versionNumber = 1;
  }

  const priorMedia = existing
    ? (await client.query(
        `SELECT media_provider, media_storage_key, original_media_name,
                media_content_type, media_size_bytes, media_sha256
         FROM activity_version WHERE activity_id = $1 AND version_number = $2`,
        [activityId, existing.current_version],
      )).rows[0]
    : null;
  const media = preparedMedia ?? (priorMedia?.media_storage_key ? {
    provider: priorMedia.media_provider,
    storageKey: priorMedia.media_storage_key,
    originalFilename: priorMedia.original_media_name,
    contentType: priorMedia.media_content_type,
    sizeBytes: priorMedia.media_size_bytes,
    sha256: priorMedia.media_sha256,
  } : null);
  if (args.publish && !media) throw new Error("A published activity requires media");

  await client.query(
    `INSERT INTO activity_version (
       activity_id, version_number, contract_version, title, part_label,
       prompt_en, prompt_id, transcript, teacher_guide, media_provider,
       media_storage_key, original_media_name, media_content_type,
       media_size_bytes, media_sha256, playback_mode, feedback_template,
       source_metadata, transcript_segments, question_set, import_manifest,
       published_at
     ) VALUES (
       $1, $2, 'listening-activity.v2', $3, $4,
       $5, $6, $7, $8, $9,
       $10, $11, $12, $13, $14, 'self_paced', $15,
       $16, $17, $18, $19, $20
     )`,
    [
      activityId,
      versionNumber,
      activityPackage.title,
      activityPackage.partLabel,
      activityPackage.prompt.en,
      activityPackage.prompt.id,
      activityPackage.transcript.text,
      activityPackage.teacherGuide,
      media?.provider ?? "local",
      media?.storageKey ?? null,
      media?.originalFilename ?? activityPackage.media?.originalFilename ?? null,
      media?.contentType ?? activityPackage.media?.contentType ?? null,
      media?.sizeBytes ?? null,
      media?.sha256 ?? activityPackage.media?.sha256 ?? null,
      JSON.stringify(activityPackage.feedbackTemplate ?? defaultFeedback),
      JSON.stringify(activityPackage.source),
      JSON.stringify(activityPackage.transcript.segments),
      JSON.stringify(activityPackage.questions),
      JSON.stringify(activityPackage),
      args.publish ? new Date() : null,
    ],
  );
  if (args.publish || !existing) {
    await client.query(
      `UPDATE activity
       SET current_version = $2, state = $3, owner_id = coalesce(owner_id, $4), updated_at = now()
       WHERE id = $1`,
      [activityId, versionNumber, args.publish ? "published" : "draft", owner.id],
    );
  }
  await client.query("COMMIT");
  console.log(JSON.stringify({
    status: "imported",
    slug: activityPackage.slug,
    versionNumber,
    state: args.publish ? "published" : "draft",
    mediaProvider: media?.provider ?? null,
    questions: activityPackage.questions.length,
    transcriptSegments: activityPackage.transcript.segments.length,
  }));
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  if (preparedMedia) await preparedMedia.cleanup().catch(() => undefined);
  throw error;
} finally {
  client.release();
  await pool.end();
}

async function prepareMedia(activityPackage: ActivityPackage, mediaPath: string): Promise<PreparedMedia> {
  const media = activityPackage.media;
  if (!media) throw new Error("media metadata is required");
  const source = await stat(mediaPath);
  if (!source.isFile() || source.size < 1) throw new Error("--media must point to a non-empty file");
  const sha256 = await hashFile(mediaPath);
  if (media.sha256 && media.sha256 !== sha256) throw new Error("media SHA-256 does not match the manifest");
  const safeName = media.originalFilename.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[-.]+/, "") || "audio";
  const storageKey = `activities/${activityPackage.slug}/${randomBytes(16).toString("hex")}-${safeName}`;
  const provider = (process.env.MEDIA_STORAGE_PROVIDER ?? "local").trim().toLowerCase();
  if (provider === "s3") {
    const store = new S3CompatibleMediaStore(readS3MediaConfig());
    await store.uploadFile({
      path: mediaPath,
      storageKey,
      contentType: media.contentType,
      sizeBytes: source.size,
      sha256,
      activitySlug: activityPackage.slug,
    });
    return {
      provider: "s3",
      storageKey,
      originalFilename: media.originalFilename,
      contentType: media.contentType,
      sizeBytes: source.size,
      sha256,
      cleanup: () => store.deleteObject(storageKey),
    };
  }
  if (provider !== "local") throw new Error("MEDIA_STORAGE_PROVIDER must be local or s3 for imports");
  const uploadRoot = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));
  const target = path.resolve(uploadRoot, storageKey);
  if (!target.startsWith(`${uploadRoot}${path.sep}`)) throw new Error("invalid local media target");
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(mediaPath, target);
  return {
    provider: "local",
    storageKey,
    originalFilename: media.originalFilename,
    contentType: media.contentType,
    sizeBytes: source.size,
    sha256,
    cleanup: () => rm(target, { force: true }),
  };
}

async function hashFile(filePath: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk as Buffer);
  return hash.digest("hex");
}

function parseArguments(values: string[]): Arguments {
  const valueFor = (name: string) => {
    const index = values.indexOf(name);
    return index >= 0 ? values[index + 1] : undefined;
  };
  const manifestPath = valueFor("--manifest");
  const ownerEmail = valueFor("--owner");
  if (!manifestPath || !ownerEmail) {
    throw new Error("Usage: pnpm activity:import -- --manifest FILE --owner EMAIL [--media FILE] [--publish] [--dry-run]");
  }
  return {
    manifestPath,
    mediaPath: valueFor("--media") ?? null,
    ownerEmail,
    publish: values.includes("--publish"),
    dryRun: values.includes("--dry-run"),
  };
}
