import { OpenAIClippyProvider } from "./openai-clippy-provider";

export function createClippyProvider(environment: NodeJS.ProcessEnv = process.env) {
  if ((environment.FEEDBACK_PROVIDER ?? "template").trim().toLowerCase() !== "openai") throw new Error("Ask Clippy requires FEEDBACK_PROVIDER=openai");
  const apiKey = environment.OPENAI_API_KEY?.trim();
  const model = environment.OPENAI_MODEL?.trim();
  if (!apiKey || !model) throw new Error("Ask Clippy requires OPENAI_API_KEY and OPENAI_MODEL");
  return new OpenAIClippyProvider({
    apiKey,
    model,
    apiUrl: environment.OPENAI_API_URL?.trim() || undefined,
    timeoutMs: integer(environment.OPENAI_TIMEOUT_MS, 30_000, 300_000),
    maxOutputTokens: Math.min(integer(environment.OPENAI_MAX_OUTPUT_TOKENS, 700, 8_000), 1_200),
    reasoningEffort: reasoning(environment.OPENAI_REASONING_EFFORT),
  });
}

function integer(value: string | undefined, fallback: number, maximum: number) {
  if (!value) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > maximum) throw new Error("Invalid Ask Clippy provider limit");
  return number;
}

function reasoning(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!["none", "minimal", "low", "medium", "high"].includes(normalized)) throw new Error("Invalid Ask Clippy reasoning effort");
  return normalized as "none" | "minimal" | "low" | "medium" | "high";
}
