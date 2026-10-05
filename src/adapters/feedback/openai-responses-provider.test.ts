import { describe, expect, it, vi } from "vitest";

import { FeedbackProviderError } from "../../application/feedback-provider";
import { OpenAIResponsesFeedbackProvider } from "./openai-responses-provider";

const request = {
  activityVersionId: "version-1",
  transcript: "A speaker changes the plan.",
  teacherGuide: "Focus on the reason and the new plan.",
  notes: "plan changed",
  reconstruction: "They choose a different plan because of a conflict.",
  previousReconstruction: null,
  template: {},
};

const feedback = {
  contractVersion: "listening-feedback.v1",
  summary: {
    en: "Your reconstruction evidences the changed plan.",
    id: "Rekonstruksimu menunjukkan perubahan rencana.",
  },
  observations: [
    {
      kind: "captured",
      message: {
        en: "You identified the change.",
        id: "Kamu mengenali perubahannya.",
      },
    },
  ],
  nextListeningTarget: {
    en: "Listen for the reason.",
    id: "Dengarkan alasannya.",
  },
};

describe("OpenAIResponsesFeedbackProvider", () => {
  it("uses strict non-stored output and validates bilingual feedback", async () => {
    const fetchImplementation = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body));
        expect(body.store).toBe(false);
        expect(body.input[0].content).toContain("Use plain teaching language");
        expect(body.input[0].content).toContain(
          "Do not mention source suppliers",
        );
        expect(body.input[0].content).toContain("kamu/-mu");
        expect(body.input[0].content).toContain(
          "Do not spoon-feed missing meaning",
        );
        expect(body.input[0].content).toContain(
          "Every field, including summary and observations",
        );
        expect(body.input[0].content).toContain("one or two short sentences");
        expect(body.input[0].content).toContain(
          "do not add an observation about missing comparison history",
        );
        expect(body.text.format.strict).toBe(true);
        expect(body.text.format.schema.properties.observations.maxItems).toBe(
          6,
        );
        return new Response(
          JSON.stringify({
            id: "resp_test",
            status: "completed",
            output: [
              {
                type: "message",
                content: [
                  { type: "output_text", text: JSON.stringify(feedback) },
                ],
              },
            ],
            usage: { input_tokens: 100, output_tokens: 80, total_tokens: 180 },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    );
    const provider = new OpenAIResponsesFeedbackProvider({
      apiKey: "test-key",
      model: "test-model",
      fetchImplementation: fetchImplementation as typeof fetch,
    });
    const result = await provider.review(request);
    expect(result.feedback.summary.id).toContain("Rekonstruksimu");
    expect(result.providerResponseId).toBe("resp_test");
    expect(result.promptVersion).toBe("listening-review.2026-10-06.v3");
    expect(result.usage?.total_tokens).toBe(180);
  });

  it("rejects output that adds a forbidden assessment metric", async () => {
    const fetchImplementation = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: "resp_bad",
            status: "completed",
            output: [
              {
                type: "message",
                content: [
                  {
                    type: "output_text",
                    text: JSON.stringify({ ...feedback, score: 90 }),
                  },
                ],
              },
            ],
          }),
          { status: 200 },
        ),
    );
    const provider = new OpenAIResponsesFeedbackProvider({
      apiKey: "test-key",
      model: "test-model",
      fetchImplementation: fetchImplementation as typeof fetch,
    });
    await expect(provider.review(request)).rejects.toMatchObject({
      safeCode: "provider_schema_validation_failed",
    } satisfies Partial<FeedbackProviderError>);
  });
});
