import type { BilingualText } from "@/domain/feedback";

export type LadderQuestionFormat = "diagnostic-three" | "original-four";

export type LadderContentItem = {
  id: string;
  title: BilingualText;
  startMs: number;
  endMs: number;
  prompt: BilingualText;
  options: BilingualText[];
  first: number;
  repairKey: number;
  repair: {
    prompt: BilingualText;
    options: BilingualText[];
    focus: BilingualText;
    hint: BilingualText;
    supportedMeaning: BilingualText;
  };
  transcript: string;
  reasons: string[];
};

export type LadderContent = {
  activityId: string;
  slug: string;
  title: BilingualText;
  version: string;
  questionFormat: LadderQuestionFormat;
  mechanicsVersion: "legacy-linear.v1" | "chapter-route.v1";
  durationMs: number;
  audioHash: string;
  items: LadderContentItem[];
};

export function validateLadderContent(content: LadderContent): LadderContent {
  if (content.items.length !== 4) throw new Error("content_item_count");
  for (const item of content.items) {
    const expected = content.questionFormat === "original-four" ? 4 : 3;
    if (item.options.length !== expected) throw new Error("first_option_count");
    if (item.repair.options.length !== 3)
      throw new Error("repair_option_count");
    if (!Number.isInteger(item.startMs) || !Number.isInteger(item.endMs))
      throw new Error("span_not_integer");
    if (item.startMs < 0 || item.endMs <= item.startMs || item.endMs > content.durationMs)
      throw new Error("invalid_span");
    if (!Number.isInteger(item.first) || item.first < 0 || item.first >= item.options.length)
      throw new Error("invalid_first_key");
    if (!Number.isInteger(item.repairKey) || item.repairKey < 0 || item.repairKey >= item.repair.options.length)
      throw new Error("invalid_repair_key");
    if (item.reasons.length !== item.options.length)
      throw new Error("reason_count");
  }
  return content;
}
