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

export type LadderPassage = {
  slug: string; title: BilingualText; durationMs: number; audioHash: string; fromItem: number; toItem: number;
};

export type LadderContent = {
  activityId: string;
  slug: string;
  title: BilingualText;
  version: string;
  questionFormat: LadderQuestionFormat;
  mechanicsVersion: "legacy-linear.v1" | "chapter-route.v1" | "passage-route.v1";
  durationMs: number;
  audioHash: string;
  items: LadderContentItem[];
  passages?: LadderPassage[];
};

export function validateLadderContent(content: LadderContent): LadderContent {
  if (!content.passages && ![3, 4, 5].includes(content.items.length)) throw new Error("content_item_count");
  if (content.passages) {
    let end = 0;
    if (content.mechanicsVersion !== "passage-route.v1" || content.passages.length < 2 || content.passages.length > 3)
      throw new Error("invalid_passages");
    for (const passage of content.passages) {
      if (passage.fromItem !== end || ![3, 4, 5].includes(passage.toItem - passage.fromItem) ||
        !Number.isInteger(passage.durationMs) || passage.durationMs <= 0 || !/^[a-f0-9]{64}$/.test(passage.audioHash)) throw new Error("invalid_passages");
      end = passage.toItem;
    }
    if (end !== content.items.length || content.durationMs !== content.passages.reduce((sum, passage) => sum + passage.durationMs, 0)) throw new Error("invalid_passages");
  }
  for (const [index, item] of content.items.entries()) {
    const duration = content.passages?.find((passage) => index >= passage.fromItem && index < passage.toItem)?.durationMs ?? content.durationMs;
    const expected = content.questionFormat === "original-four" ? 4 : 3;
    if (item.options.length !== expected) throw new Error("first_option_count");
    if (item.repair.options.length !== 3)
      throw new Error("repair_option_count");
    if (!Number.isInteger(item.startMs) || !Number.isInteger(item.endMs))
      throw new Error("span_not_integer");
    if (item.startMs < 0 || item.endMs <= item.startMs || item.endMs > duration)
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
