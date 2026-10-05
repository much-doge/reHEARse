import { z } from "zod";

import { bilingualTextSchema, listeningFeedbackSchema } from "./feedback";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number().finite(),
    z.string(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

const extensionMapSchema = z.record(z.string().min(1).max(100), jsonValueSchema);

export const transcriptSegmentSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    speaker: z.string().trim().min(1).max(120).optional(),
    startMs: z.number().int().min(0).optional(),
    endMs: z.number().int().positive().optional(),
    text: z.string().trim().min(1).max(5_000),
    extensions: extensionMapSchema.optional(),
  })
  .strict()
  .refine(
    (value) => value.startMs === undefined || value.endMs === undefined || value.endMs > value.startMs,
    { message: "endMs must be greater than startMs" },
  );

const questionTextSchema = z
  .object({
    en: z.string().trim().min(1).max(2_000),
    id: z.string().trim().min(1).max(2_000).optional(),
  })
  .strict();

const questionOptionSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    text: questionTextSchema,
    extensions: extensionMapSchema.optional(),
  })
  .strict();

export const activityQuestionSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    number: z.number().int().positive().optional(),
    kind: z.string().trim().min(1).max(80),
    prompt: questionTextSchema,
    options: z.array(questionOptionSchema).max(20).optional(),
    answer: jsonValueSchema.optional(),
    rationale: questionTextSchema.optional(),
    transcriptSegmentIds: z.array(z.string().trim().min(1).max(80)).max(100).optional(),
    tags: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
    extensions: extensionMapSchema.optional(),
  })
  .strict();

export const activityPackageSchema = z
  .object({
    contractVersion: z.literal("listening-activity-package.v1"),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().trim().min(1).max(180),
    partLabel: z.string().trim().min(1).max(120),
    prompt: bilingualTextSchema.extend({
      en: z.string().trim().min(1).max(1_000),
      id: z.string().trim().min(1).max(1_000),
    }),
    transcript: z
      .object({
        text: z.string().trim().min(1).max(50_000),
        language: z.string().trim().min(2).max(35).default("en"),
        segments: z.array(transcriptSegmentSchema).max(1_000).default([]),
      })
      .strict(),
    teacherGuide: z.string().trim().min(1).max(12_000),
    questions: z.array(activityQuestionSchema).max(500).default([]),
    feedbackTemplate: listeningFeedbackSchema.optional(),
    media: z
      .object({
        originalFilename: z.string().trim().min(1).max(255),
        contentType: z.string().regex(/^audio\/[a-z0-9.+-]+$/i),
        sha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
        durationSeconds: z.number().positive().max(86_400).optional(),
        extensions: extensionMapSchema.optional(),
      })
      .strict()
      .optional(),
    source: extensionMapSchema.default({}),
    extensions: extensionMapSchema.default({}),
  })
  .strict()
  .superRefine((value, context) => {
    const segmentIds = new Set<string>();
    for (const [index, segment] of value.transcript.segments.entries()) {
      if (segmentIds.has(segment.id)) {
        context.addIssue({
          code: "custom",
          message: `duplicate transcript segment id: ${segment.id}`,
          path: ["transcript", "segments", index, "id"],
        });
      }
      segmentIds.add(segment.id);
    }
    const questionIds = new Set<string>();
    for (const [index, question] of value.questions.entries()) {
      if (questionIds.has(question.id)) {
        context.addIssue({
          code: "custom",
          message: `duplicate question id: ${question.id}`,
          path: ["questions", index, "id"],
        });
      }
      questionIds.add(question.id);
      for (const segmentId of question.transcriptSegmentIds ?? []) {
        if (!segmentIds.has(segmentId)) {
          context.addIssue({
            code: "custom",
            message: `unknown transcript segment id: ${segmentId}`,
            path: ["questions", index, "transcriptSegmentIds"],
          });
        }
      }
    }
  });

export type ActivityPackage = z.infer<typeof activityPackageSchema>;
