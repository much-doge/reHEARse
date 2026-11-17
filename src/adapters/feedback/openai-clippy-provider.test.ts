import { describe, expect, it, vi } from "vitest";

import { OpenAIClippyProvider } from "./openai-clippy-provider";

const context = {
  section: "listening" as const,
  response: "A" as const,
  prompt: "What does the woman imply?",
  options: { A: "She agreed.", B: "She changed the plan.", C: "She was absent.", D: "She forgot." },
  sourceContext: "Man: We can meet today.\nWoman: Actually, tomorrow would work better.",
};

describe("OpenAIClippyProvider", () => {
  it("uses structured, non-stored output and returns validated guidance", async () => {
    const fetchImplementation = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body));
      expect(request.store).toBe(false);
      expect(request.text.format.name).toBe("test_center_clippy_hint");
      expect(request.input[1].content).not.toContain("correctAnswer");
      return new Response(JSON.stringify({ status: "completed", output: [{ content: [{ type: "output_text", text: JSON.stringify({ notice: { en: "The response misses a change after a contrast cue.", id: "Respons tersebut melewatkan perubahan setelah penanda kontras." }, tryThis: { en: "Mark the first plan, then mark the revised time and compare the relationship.", id: "Tandai rencana pertama, lalu tandai waktu yang direvisi dan bandingkan hubungannya." }, teacherPrompt: { en: "Which word signals that the original plan is being revised?", id: "Kata mana yang menandai bahwa rencana awal sedang direvisi?" } }) }] }] }), { status: 200 });
    });
    const provider = new OpenAIClippyProvider({ apiKey: "key", model: "model", fetchImplementation });
    const result = await provider.hint(context);
    expect(result.teacherPrompt.en).toMatch(/\?$/);
    expect(result.teacherPrompt.id).toMatch(/\?$/);
  });

  it("fails closed on malformed provider output", async () => {
    const provider = new OpenAIClippyProvider({ apiKey: "key", model: "model", fetchImplementation: vi.fn(async () => new Response(JSON.stringify({ status: "completed", output: [] }), { status: 200 })) });
    await expect(provider.hint(context)).rejects.toMatchObject({ safeCode: "provider_output_missing" });
  });
});
