import { z } from "zod";

export const bilingualTextSchema = z
  .object({
    en: z.string().trim().min(1).max(600),
    id: z.string().trim().min(1).max(600),
  })
  .strict();

export const observationKindSchema = z.enum([
  "captured",
  "unclear",
  "reconsider",
  "newly_noticed",
  "insufficient_evidence",
]);

export const listeningFeedbackSchema = z
  .object({
    contractVersion: z.literal("listening-feedback.v1"),
    summary: bilingualTextSchema,
    observations: z
      .array(
        z
          .object({
            kind: observationKindSchema,
            message: bilingualTextSchema,
          })
          .strict(),
      )
      .min(1)
      .max(6),
    nextListeningTarget: bilingualTextSchema,
  })
  .strict();

export type BilingualText = z.infer<typeof bilingualTextSchema>;
export type ListeningFeedback = z.infer<typeof listeningFeedbackSchema>;
export type ObservationKind = z.infer<typeof observationKindSchema>;

export const forbiddenAssessmentKeys = new Set([
  "score",
  "percentage",
  "percent",
  "grade",
  "band",
  "level",
  "mastery",
  "rank",
  "rating",
]);

export function assertNoAssessmentMetrics(value: unknown, path = "feedback"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoAssessmentMetrics(item, `${path}[${index}]`),
    );
    return;
  }

  if (value === null || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    if (forbiddenAssessmentKeys.has(key.toLowerCase())) {
      throw new Error(`Assessment metric '${key}' is forbidden at ${path}`);
    }
    assertNoAssessmentMetrics(child, `${path}.${key}`);
  }
}

export function parseListeningFeedback(value: unknown): ListeningFeedback {
  assertNoAssessmentMetrics(value);
  return listeningFeedbackSchema.parse(value);
}

