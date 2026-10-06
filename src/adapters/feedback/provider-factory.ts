import type { FeedbackProvider } from "@/application/feedback-provider";
import { OpenAIResponsesFeedbackProvider } from "./openai-responses-provider";
import { TeacherTemplateFeedbackProvider } from "./template-provider";

export function createFeedbackProvider(environment: NodeJS.ProcessEnv = process.env): FeedbackProvider {
  const provider = (environment.FEEDBACK_PROVIDER ?? "template").trim().toLowerCase();
  if (provider === "template" || provider === "demo") return new TeacherTemplateFeedbackProvider();
  if (provider !== "openai") throw new Error(`Unsupported FEEDBACK_PROVIDER: ${provider}`);

  const apiKey = environment.OPENAI_API_KEY?.trim();
  const model = environment.OPENAI_MODEL?.trim();
  if (!apiKey || !model) {
    throw new Error("OPENAI_API_KEY and OPENAI_MODEL are required when FEEDBACK_PROVIDER=openai");
  }
  return new OpenAIResponsesFeedbackProvider({
    apiKey,
    model,
    apiUrl: environment.OPENAI_API_URL?.trim() || undefined,
    timeoutMs: parsePositiveInteger(environment.OPENAI_TIMEOUT_MS, 30_000, 300_000),
    maxOutputTokens: parsePositiveInteger(environment.OPENAI_MAX_OUTPUT_TOKENS, 1_200, 8_000),
    reasoningEffort: parseReasoningEffort(environment.OPENAI_REASONING_EFFORT),
  });
}

function parseReasoningEffort(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const effort = value.trim().toLowerCase();
  if (!["none", "minimal", "low", "medium", "high"].includes(effort))
    throw new Error("Unsupported OPENAI_REASONING_EFFORT");
  return effort as "none" | "minimal" | "low" | "medium" | "high";
}

function parsePositiveInteger(value: string | undefined, fallback: number, maximum: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new Error(`Expected an integer from 1 to ${maximum}`);
  }
  return parsed;
}
