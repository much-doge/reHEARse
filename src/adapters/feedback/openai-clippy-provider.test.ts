import { describe, expect, it, vi } from "vitest";

import { OpenAIClippyProvider } from "./openai-clippy-provider";

const context = {
  section: "listening" as const,
  response: "A" as const,
  selectedResponse: "She agreed.",
  prompt: "What does the woman imply?",
  sourceContext: "Man: We can meet today.\nWoman: Actually, tomorrow would work better.",
};

describe("OpenAIClippyProvider", () => {
  it("uses structured, non-stored output and returns validated guidance", async () => {
    const fetchImplementation = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body));
      expect(request.store).toBe(false);
      expect(request.text.format.name).toBe("test_center_clippy_hint");
      expect(request.text.format.schema.properties.teacherPrompt.pattern).toBe(".*\\?$");
      expect(request.input[1].content).not.toContain("correctAnswer");
      expect(request.input[1].content).not.toContain("She changed the plan.");
      return new Response(JSON.stringify({ status: "completed", output: [{ content: [{ type: "output_text", text: JSON.stringify({ notice: "Respons yang dipilih melewatkan revisi pada \"tomorrow would work better\".", tryThis: "1) Tandai fungsi koreksi pada \"tomorrow would work better\". 2) Uji respons yang dipilih terhadap perubahan itu.", teacherPrompt: "Apa yang berubah setelah \"tomorrow would work better\"?" }) }] }] }), { status: 200 });
    });
    const provider = new OpenAIClippyProvider({ apiKey: "key", model: "model", fetchImplementation });
    const result = await provider.hint(context);
    expect(result.teacherPrompt).toMatch(/\?$/);
  });

  it("fails closed on malformed provider output", async () => {
    const provider = new OpenAIClippyProvider({ apiKey: "key", model: "model", fetchImplementation: vi.fn(async () => new Response(JSON.stringify({ status: "completed", output: [] }), { status: 200 })) });
    await expect(provider.hint(context)).rejects.toMatchObject({ safeCode: "provider_output_missing" });
  });
});
