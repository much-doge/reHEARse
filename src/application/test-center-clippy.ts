export type ClippyHint = {
  notice: string;
  tryThis: string;
  teacherPrompt: string;
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
    notice: boundedText(object.notice, 420),
    tryThis: boundedText(object.tryThis, 420),
    teacherPrompt: boundedText(object.teacherPrompt, 320),
  };
  if (!hint.teacherPrompt.endsWith("?")) throw new ClippyProviderError("Invalid teacher prompt", "provider_schema_invalid");
  const combined = Object.values(hint).join(" ");
  if (/\b(?:en|id)-?\d+\b|abstain-not-reveal|answoguage|placeholder/i.test(combined)) {
    throw new ClippyProviderError("Guidance contained placeholder output", "provider_placeholder_rejected");
  }
  return hint;
}

export function assertClippyDoesNotRevealAnswer(
  hint: ClippyHint,
  correctAnswer: "A" | "B" | "C" | "D",
  correctOption: string,
) {
  const output = normalize(Object.values(hint).join(" "));
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

function boundedText(value: unknown, maximum: number) {
  if (typeof value !== "string") throw new ClippyProviderError("Invalid guidance text", "provider_schema_invalid");
  const text = value.trim().replace(/\s+/g, " ");
  if (!text || text.length > maximum) throw new ClippyProviderError("Invalid guidance length", "provider_schema_invalid");
  return text;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
