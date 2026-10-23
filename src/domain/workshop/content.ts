import { z } from "zod";
import type { EnrichmentActivity, Preparation, Skill, Text } from "./contracts";
const text = z.object({ en: z.string().trim().min(1).max(1400), id: z.string().trim().min(1).max(1600) }).strict();
const neutral = z.string().regex(/^[a-z][a-z0-9-]{2,60}$/);
export const skills = ["restatement", "inference", "negatives", "functional-expressions", "passives", "idioms", "distractor-recognition"] as const;
const legacyPreparationSchema = z.object({
  questionTask: text, listeningTarget: text, procedure: z.array(text).min(2).max(5),
  distractorPatterns: z.array(text).min(2).max(5),
  example: z.object({ dialogue: text, question: text, discussion: text }).strict(),
  inquiryPrompts: z.tuple([text, text]), languageNotes: z.array(text).max(4),
}).strict();
const enrichmentActivity = z.object({
  id: z.enum(["cold-replay", "focus-replay", "delayed-replay"]), title: text, instruction: text,
}).strict();
export const preparationSchema = z.union([
  legacyPreparationSchema,
  z.object({
    questionTask: text, listeningTarget: text, procedure: z.array(text).min(2).max(5),
    distractorPatterns: z.array(text).min(2).max(5), longmanReference: text,
    extensionActivities: z.array(enrichmentActivity).length(3),
    inquiryPrompts: z.tuple([text, text]), languageNotes: z.array(text).max(4),
  }).strict(),
]);
export const itemSchema = z.object({
  id: neutral, title: text, groupId: neutral, primarySkill: z.enum(skills), secondarySkills: z.array(z.enum(skills)).max(6),
  questionTask: text.optional(), prompt: text.optional(), options: z.tuple([z.string().min(1).max(500),z.string().min(1).max(500),z.string().min(1).max(500),z.string().min(1).max(500)]),
  answer: z.enum(["A","B","C","D"]),
  tips: z.tuple([text,text]), guidedComparison: text,
  media: z.object({ localFile: z.string().min(1), sha256: z.string().regex(/^[a-f0-9]{64}$/), durationMs: z.number().int().positive().max(120000), sizeBytes: z.number().int().positive(), contentType: z.literal("audio/mpeg"), storageKey: z.string().optional(), publicUrl: z.url().optional() }).strict(),
  review: z.object({ verified: z.literal(true), decisiveEvidence: z.string().min(10), optionReasons: z.tuple([z.string().min(5),z.string().min(5),z.string().min(5),z.string().min(5)]), privateSourceReference: z.string().min(1) }).strict(),
}).strict();
export const workshopSchema = z.object({
  contractVersion: z.enum(["part-a-workshop.v1", "part-a-workshop.v2"]), id: neutral, version: neutral, title: text,
  groupingVersion: neutral, pedagogyVersion: neutral,
  groups: z.array(z.object({ id: neutral, title: text, skill: z.enum(skills), preparation: preparationSchema }).strict()).min(1).max(7),
  items: z.array(itemSchema).length(30),
}).strict().superRefine((content, ctx) => {
  const ids = new Set(content.items.map(i => i.id)), groups = new Set(content.groups.map(g => g.id));
  if (ids.size !== 30 || groups.size !== content.groups.length) ctx.addIssue({ code:"custom", message:"duplicate_neutral_id" });
  if (new Set(content.items.map(i => i.media.sha256)).size !== 30) ctx.addIssue({code:"custom",message:"duplicate_media"});
  for (const item of content.items) if (!groups.has(item.groupId) || content.groups.find(g=>g.id===item.groupId)?.skill !== item.primarySkill) ctx.addIssue({code:"custom",message:"invalid_skill_group"});
  for (const group of groups) if (!content.items.some(i=>i.groupId===group)) ctx.addIssue({code:"custom",message:"empty_group"});
  if (content.contractVersion === "part-a-workshop.v2") {
    if (content.groups.some(group => "example" in group.preparation)) ctx.addIssue({code:"custom",message:"written_example_not_allowed"});
    if (content.items.some(item => item.prompt !== undefined || item.questionTask !== undefined)) ctx.addIssue({code:"custom",message:"written_item_prompt_not_allowed"});
  }
});
export type WorkshopContent = z.infer<typeof workshopSchema>;
export type WorkshopItem = z.infer<typeof itemSchema>;
export type { EnrichmentActivity, Preparation, Skill, Text };
