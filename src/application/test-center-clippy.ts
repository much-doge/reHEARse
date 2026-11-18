export type ClippyHint = {
  text: string;
};

export type ClippyReviewContext = {
  section: "listening" | "structure" | "reading";
  response: "A" | "B" | "C" | "D" | null;
  selectedResponse: string | null;
  prompt: string;
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
  const hint = { text: boundedText(object.text, 6_000) };
  return hint;
}

function boundedText(value: unknown, maximum: number) {
  if (typeof value !== "string") throw new ClippyProviderError("Invalid guidance text", "provider_schema_invalid");
  const text = value.trim();
  if (!text || text.length > maximum) throw new ClippyProviderError("Invalid guidance length", "provider_schema_invalid");
  return text;
}
