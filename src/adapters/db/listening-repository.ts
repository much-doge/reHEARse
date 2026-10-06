import { createHash } from "node:crypto";
import { feedbackPresentation } from "./feedback-presentation";
import {
  publicPartLabel,
  publicActivityTitle,
} from "@/domain/activity-presentation";
import { getPool } from "@/adapters/db/client";
import { readS3MediaConfig } from "@/adapters/media/s3-config";
import { createPublicMediaUrl } from "@/adapters/media/s3-media-store";
import { createFeedbackProvider } from "@/adapters/feedback/provider-factory";
import { FeedbackProviderError } from "@/application/feedback-provider";
import {
  parseListeningFeedback,
  type ListeningFeedback,
} from "@/domain/feedback";

export type DashboardActivity = {
  slug: string;
  title: string;
  partLabel: string;
  attempts: number;
  lastAttemptAt: string | null;
};

export type StoredAttempt = {
  id: string;
  attemptNumber: number;
  pseudonym: string;
  notes: string;
  reconstruction: string;
  createdAt: string;
  feedback: ListeningFeedback | null;
  feedbackStatus: "completed" | "failed" | "pending" | null;
  feedbackProvider: string | null;
  feedbackModel: string | null;
};

export type LearnerActivity = {
  id: string;
  versionId: string;
  slug: string;
  title: string;
  partLabel: string;
  promptEn: string;
  promptId: string;
  audioUrl: string | null;
  pseudonym: string | null;
  attempts: StoredAttempt[];
};

export async function listLearnerActivities(
  learnerId: string,
): Promise<DashboardActivity[]> {
  const result = await getPool().query(
    `SELECT a.slug, av.title, av.part_label,
            count(la.id)::int AS attempts,
            max(la.created_at) AS last_attempt_at
     FROM activity a
     JOIN activity_version av
       ON av.activity_id = a.id AND av.version_number = a.current_version
     LEFT JOIN listening_attempt la
       ON la.activity_id = a.id AND la.learner_id = $1
     WHERE a.state = 'published'
     GROUP BY a.id, a.slug, av.title, av.part_label
     ORDER BY a.created_at DESC`,
    [learnerId],
  );
  return result.rows.map((row) => ({
    slug: row.slug,
    title: publicActivityTitle(row.title),
    partLabel: publicPartLabel(row.part_label),
    attempts: row.attempts,
    lastAttemptAt: row.last_attempt_at?.toISOString() ?? null,
  }));
}

export async function getLearnerActivity(
  slug: string,
  learnerId: string,
): Promise<LearnerActivity | null> {
  const activityResult = await getPool().query(
    `SELECT a.id, a.slug, av.id AS version_id, av.title, av.part_label,
            av.prompt_en, av.prompt_id, av.media_storage_key, av.media_provider, av.media_bucket,
            ai.pseudonym
     FROM activity a
     JOIN activity_version av
       ON av.activity_id = a.id AND av.version_number = a.current_version
     LEFT JOIN activity_identity ai
       ON ai.activity_id = a.id AND ai.learner_id = $2
     WHERE a.slug = $1 AND a.state = 'published'`,
    [slug, learnerId],
  );
  const activity = activityResult.rows[0];
  if (!activity) return null;

  const attemptsResult = await getPool().query(
    `SELECT la.id, la.attempt_number, la.notes, la.reconstruction, la.created_at,
            ai.pseudonym, lf.status AS feedback_status, lf.result_json,
            lf.provider AS feedback_provider, lf.model AS feedback_model
     FROM listening_attempt la
     JOIN activity_identity ai
       ON ai.activity_id = la.activity_id AND ai.learner_id = la.learner_id
     LEFT JOIN listening_feedback lf ON lf.attempt_id = la.id
     WHERE la.activity_id = $1 AND la.learner_id = $2
     ORDER BY la.attempt_number DESC`,
    [activity.id, learnerId],
  );

  let audioUrl = activity.media_storage_key
    ? `/api/media/${activity.slug}`
    : null;
  if (activity.media_provider === "s3" && activity.media_storage_key) {
    const config = readS3MediaConfig();
    if (activity.media_bucket && activity.media_bucket !== config.bucket)
      throw new Error("media bucket configuration mismatch");
    if (config.deliveryMode === "public")
      audioUrl = createPublicMediaUrl(config, activity.media_storage_key);
  }
  return {
    id: activity.id,
    versionId: activity.version_id,
    slug: activity.slug,
    title: publicActivityTitle(activity.title),
    partLabel: publicPartLabel(activity.part_label),
    promptEn: activity.prompt_en,
    promptId: activity.prompt_id,
    audioUrl,
    pseudonym: activity.pseudonym,
    attempts: attemptsResult.rows.map((row) => ({
      id: row.id,
      attemptNumber: row.attempt_number,
      pseudonym: row.pseudonym,
      notes: row.notes,
      reconstruction: row.reconstruction,
      createdAt: row.created_at.toISOString(),
      feedback: row.result_json
        ? feedbackPresentation(parseListeningFeedback(row.result_json))
        : null,
      feedbackStatus: row.feedback_status ?? "pending",
      feedbackProvider: row.feedback_provider,
      feedbackModel: row.feedback_model,
    })),
  };
}

export class SubmissionConflict extends Error {}

function savedAttempt(row: Record<string, unknown>): StoredAttempt {
  return {
    id: String(row.id),
    attemptNumber: Number(row.attempt_number),
    pseudonym: String(row.pseudonym),
    notes: String(row.notes),
    reconstruction: String(row.reconstruction),
    createdAt: (row.created_at as Date).toISOString(),
    feedback: row.result_json
      ? feedbackPresentation(parseListeningFeedback(row.result_json))
      : null,
    feedbackStatus:
      (row.feedback_status as StoredAttempt["feedbackStatus"]) ?? "pending",
    feedbackProvider: (row.feedback_provider as string) ?? null,
    feedbackModel: (row.feedback_model as string) ?? null,
  };
}
const submissionQuery = `SELECT la.*, ai.pseudonym, lf.status AS feedback_status,
  lf.result_json, lf.provider AS feedback_provider, lf.model AS feedback_model
  FROM listening_attempt la
  JOIN activity_identity ai ON ai.activity_id=la.activity_id AND ai.learner_id=la.learner_id
  LEFT JOIN listening_feedback lf ON lf.attempt_id=la.id
  WHERE la.learner_id=$1 AND la.submission_key=$2`;

export async function findSubmittedAttempt(
  learnerId: string,
  key: string,
  byId = false,
): Promise<StoredAttempt | null> {
  const result = await getPool().query(
    byId
      ? submissionQuery.replace("la.submission_key=$2", "la.id=$2")
      : submissionQuery,
    [learnerId, key],
  );
  return result.rows[0] ? savedAttempt(result.rows[0]) : null;
}

export async function submitLearnerAttempt(input: {
  submissionKey?: string;
  slug: string;
  learnerId: string;
  pseudonym: string;
  notes: string;
  reconstruction: string;
}): Promise<StoredAttempt | null> {
  const client = await getPool().connect();
  let attempt: {
    id: string;
    number: number;
    createdAt: Date;
    pseudonym: string;
    activityVersionId: string;
    transcript: string;
    teacherGuide: string;
    template: unknown;
    previousReconstruction: string | null;
  } | null = null;

  try {
    await client.query("BEGIN");
    const digest = createHash("sha256")
      .update(
        JSON.stringify([
          input.slug,
          input.pseudonym,
          input.notes,
          input.reconstruction,
        ]),
      )
      .digest("hex");
    if (input.submissionKey) {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        `submission:${input.learnerId}:${input.submissionKey}`,
      ]);
      const existing = await client.query(submissionQuery, [
        input.learnerId,
        input.submissionKey,
      ]);
      if (existing.rows[0]) {
        if (existing.rows[0].submission_digest !== digest)
          throw new SubmissionConflict("submission_changed");
        await client.query("COMMIT");
        return savedAttempt(existing.rows[0]);
      }
    }
    const activityResult = await client.query(
      `SELECT a.id, av.id AS version_id, av.transcript, av.teacher_guide,
              av.feedback_template
       FROM activity a
       JOIN activity_version av
         ON av.activity_id = a.id AND av.version_number = a.current_version
       WHERE a.slug = $1 AND a.state = 'published'`,
      [input.slug],
    );
    const activity = activityResult.rows[0];
    if (!activity) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      `${activity.id}:${input.learnerId}`,
    ]);
    await client.query(
      `INSERT INTO activity_identity (activity_id, learner_id, pseudonym)
       VALUES ($1, $2, $3)
       ON CONFLICT (activity_id, learner_id) DO NOTHING`,
      [activity.id, input.learnerId, input.pseudonym],
    );
    const identityResult = await client.query(
      `SELECT pseudonym FROM activity_identity
       WHERE activity_id = $1 AND learner_id = $2`,
      [activity.id, input.learnerId],
    );
    const previousResult = await client.query(
      `SELECT id, attempt_number, reconstruction
       FROM listening_attempt
       WHERE activity_id = $1 AND learner_id = $2
       ORDER BY attempt_number DESC LIMIT 1`,
      [activity.id, input.learnerId],
    );
    const previous = previousResult.rows[0];
    const attemptNumber = (previous?.attempt_number ?? 0) + 1;
    const inserted = await client.query(
      `INSERT INTO listening_attempt (
         activity_id, activity_version_id, learner_id, attempt_number,
         previous_attempt_id, notes, reconstruction, submission_key, submission_digest
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, created_at`,
      [
        activity.id,
        activity.version_id,
        input.learnerId,
        attemptNumber,
        previous?.id ?? null,
        input.notes,
        input.reconstruction,
        input.submissionKey ?? null,
        input.submissionKey ? digest : null,
      ],
    );
    await client.query("COMMIT");
    attempt = {
      id: inserted.rows[0].id,
      number: attemptNumber,
      createdAt: inserted.rows[0].created_at,
      pseudonym: identityResult.rows[0].pseudonym,
      activityVersionId: activity.version_id,
      transcript: activity.transcript,
      teacherGuide: activity.teacher_guide,
      template: activity.feedback_template,
      previousReconstruction: previous?.reconstruction ?? null,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  if (!attempt) return null;
  let provider;
  try {
    provider = createFeedbackProvider();
    const result = await provider.review({
      activityVersionId: attempt.activityVersionId,
      transcript: attempt.transcript,
      teacherGuide: attempt.teacherGuide,
      notes: input.notes,
      reconstruction: input.reconstruction,
      previousReconstruction: attempt.previousReconstruction,
      template: attempt.template,
    });
    await getPool().query(
      `INSERT INTO listening_feedback (
         attempt_id, contract_version, status, provider, model,
         prompt_version, result_json, provider_response_id, usage_json
       ) VALUES ($1, $2, 'completed', $3, $4, $5, $6, $7, $8)`,
      [
        attempt.id,
        result.feedback.contractVersion,
        result.provider,
        result.model,
        result.promptVersion,
        result.feedback,
        result.providerResponseId ?? null,
        result.usage ?? {},
      ],
    );
    return {
      id: attempt.id,
      attemptNumber: attempt.number,
      pseudonym: attempt.pseudonym,
      notes: input.notes,
      reconstruction: input.reconstruction,
      createdAt: attempt.createdAt.toISOString(),
      feedback: feedbackPresentation(result.feedback),
      feedbackStatus: "completed",
      feedbackProvider: result.provider,
      feedbackModel: result.model,
    };
  } catch (error) {
    const configuredProvider = (process.env.FEEDBACK_PROVIDER ?? "template")
      .trim()
      .toLowerCase();
    const providerName =
      provider &&
      "provider" in provider &&
      typeof provider.provider === "string"
        ? provider.provider
        : configuredProvider === "openai"
          ? "openai"
          : "teacher_template";
    const safeCode =
      error instanceof FeedbackProviderError
        ? error.safeCode
        : "feedback_configuration_or_validation_failed";
    const responseId =
      error instanceof FeedbackProviderError ? error.providerResponseId : null;
    const usage = error instanceof FeedbackProviderError ? error.usage : {};
    await getPool().query(
      `INSERT INTO listening_feedback (
         attempt_id, contract_version, status, provider,
         model, prompt_version, safe_error_code, provider_response_id, usage_json
       ) VALUES ($1, 'listening-feedback.v1', 'failed', $2,
                 $3, $4, $5, $6, $7)`,
      [
        attempt.id,
        providerName,
        providerName === "openai" ? (process.env.OPENAI_MODEL ?? null) : null,
        providerName === "openai"
          ? "listening-review.2026-10-06.v3"
          : "teacher-template.v1",
        safeCode,
        responseId,
        usage,
      ],
    );
    return {
      id: attempt.id,
      attemptNumber: attempt.number,
      pseudonym: attempt.pseudonym,
      notes: input.notes,
      reconstruction: input.reconstruction,
      createdAt: attempt.createdAt.toISOString(),
      feedback: null,
      feedbackStatus: "failed",
      feedbackProvider: providerName,
      feedbackModel:
        providerName === "openai" ? (process.env.OPENAI_MODEL ?? null) : null,
    };
  }
}
