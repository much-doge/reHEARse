export type ClippyBilingualText = { en: string; id: string };

export type ClippyHint = {
  notice: ClippyBilingualText;
  tryThis: ClippyBilingualText;
  teacherPrompt: ClippyBilingualText;
};

export type ClippyReviewContext = {
  section: "listening" | "structure" | "reading";
  response: "A" | "B" | "C" | "D" | null;
  prompt: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  sourceContext: string | null;
};

export interface ClippyProvider {
  hint(context: ClippyReviewContext): Promise<ClippyHint>;
}

export class ClippyProviderError extends Error {
  constructor(message: string, readonly safeCode: string) {
    super(message);
    this.name = "ClippyProviderError";
  }
}

export function parseClippyHint(value: unknown): ClippyHint {
  if (!value || typeof value !== "object") throw new ClippyProviderError("Invalid guidance", "provider_schema_invalid");
  const object = value as Record<string, unknown>;
  const hint = {
    notice: bilingualText(object.notice, 360),
    tryThis: bilingualText(object.tryThis, 360),
    teacherPrompt: bilingualText(object.teacherPrompt, 280),
  };
  if (!hint.teacherPrompt.en.endsWith("?") || !hint.teacherPrompt.id.endsWith("?")) throw new ClippyProviderError("Invalid teacher prompt", "provider_schema_invalid");
  return hint;
}

export function assertClippyDoesNotRevealAnswer(
  hint: ClippyHint,
  correctAnswer: "A" | "B" | "C" | "D",
  correctOption: string,
) {
  const output = normalize(Object.values(hint).flatMap((field) => [field.en, field.id]).join(" "));
  const directAnswer = new RegExp(`\\b(?:answer|option|choice)\\s*(?:is|:|=)?\\s*${correctAnswer.toLowerCase()}\\b|\\b${correctAnswer.toLowerCase()}\\s+is\\s+(?:correct|right)\\b`, "i");
  if (directAnswer.test(output)) throw new ClippyProviderError("Guidance disclosed the key", "answer_leak_rejected");
  const keyedText = normalize(correctOption);
  if (keyedText.length >= 4 && output.includes(keyedText)) {
    throw new ClippyProviderError("Guidance reproduced the keyed option", "answer_leak_rejected");
  }
  if (/\b(?:the )?correct answer\b|\bthe answer is\b|\bchoose (?:option |choice )?[a-d]\b|\bselect (?:option |choice )?[a-d]\b|\bjawaban(?: yang)? benar\b|\bjawabannya (?:adalah|ialah)\b|\bpilih(?:lah)? (?:opsi |jawaban )?[a-d]\b/i.test(output)) {
    throw new ClippyProviderError("Guidance answered directly", "answer_leak_rejected");
  }
}

function bilingualText(value: unknown, maximum: number): ClippyBilingualText {
  if (!value || typeof value !== "object") throw new ClippyProviderError("Invalid bilingual guidance", "provider_schema_invalid");
  const object = value as Record<string, unknown>;
  return { en: boundedText(object.en, maximum), id: boundedText(object.id, maximum) };
}

function boundedText(value: unknown, maximum: number) {
  if (typeof value !== "string") throw new ClippyProviderError("Invalid guidance text", "provider_schema_invalid");
  const text = value.trim().replace(/\s+/g, " ");
  if (!text || text.length > maximum) throw new ClippyProviderError("Invalid guidance length", "provider_schema_invalid");
  return text;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
