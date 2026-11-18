import { describe, expect, it } from "vitest";

import { assertClippyDoesNotRevealAnswer, assertClippyIsSourceGrounded, parseClippyHint } from "./test-center-clippy";

const safeHint = {
  notice: "Respons yang dipilih menganggap kedua rencana tetap sama, padahal frasa \"tomorrow would work better\" menandai revisi.",
  tryThis: "1) Tandai fungsi koreksi pada \"tomorrow would work better\". 2) Uji apakah respons yang dipilih mengakui perubahan itu.",
  teacherPrompt: "Setelah mendengar \"tomorrow would work better\", bagian mana dari rencana awal yang tidak lagi berlaku?",
};
const context = { response: "A" as const, prompt: "What does the woman imply?", sourceContext: "Woman: Actually, tomorrow would work better." };

describe("Ask Clippy guidance contract", () => {
  it("accepts concise show-don't-tell guidance", () => {
    expect(parseClippyHint(safeHint)).toEqual(safeHint);
    expect(() => assertClippyDoesNotRevealAnswer(safeHint, "B", "She needs to visit the museum")).not.toThrow();
    expect(() => assertClippyIsSourceGrounded(safeHint, context)).not.toThrow();
  });

  it.each([
    "The answer is B.",
    "Choose option B after comparing the speakers.",
    "B is correct because of the contrast.",
    "The source shows that she needs to visit the museum.",
    "Jawabannya adalah B.",
    "Pilih opsi B setelah membandingkan para pembicara.",
  ])("rejects answer leakage in either language: %s", (notice) => {
    expect(() => assertClippyDoesNotRevealAnswer({ ...safeHint, notice }, "B", "She needs to visit the museum")).toThrow(/Guidance/);
  });

  it("requires an open teacher question", () => {
    expect(() => parseClippyHint({ ...safeHint, teacherPrompt: "Dengarkan penanda kontrasnya." })).toThrow();
  });

  it.each(["en-01", "id02", "abstain-not-reveal-answoguage?"])("rejects placeholder artifacts: %s", (notice) => {
    expect(() => parseClippyHint({ ...safeHint, notice })).toThrow(/placeholder/i);
  });

  it("preserves a quoted English source phrase inside Indonesian guidance", () => {
    const withQuote = { ...safeHint, tryThis: "1) Dengarkan frasa \"tomorrow would work better\" sebagai koreksi. 2) Uji respons yang dipilih terhadap koreksi itu." };
    expect(parseClippyHint(withQuote)).toEqual(withQuote);
  });

  it("rejects generic guidance without an exact source cue", () => {
    expect(() => assertClippyIsSourceGrounded({ notice: "Respons yang dipilih tidak sesuai dengan konteks.", tryThis: "1) Perhatikan konteks. 2) Bandingkan dengan respons yang dipilih.", teacherPrompt: "Apa implikasinya?" }, context)).toThrow(/source cue/i);
  });

  it("rejects invented and option-only quotations", () => {
    expect(() => assertClippyIsSourceGrounded({ ...safeHint, notice: "Respons yang dipilih tidak cocok dengan \"use a computer in the lab\"." }, context)).toThrow(/invented/i);
  });

  it("requires an explicit diagnosis of the selected response", () => {
    expect(() => assertClippyIsSourceGrounded({ ...safeHint, notice: "Frasa \"tomorrow would work better\" adalah penanda revisi." }, context)).toThrow(/selected response/i);
  });

  it("requires a visible two-step teaching move", () => {
    expect(() => parseClippyHint({ ...safeHint, tryThis: "Bandingkan petunjuk dengan respons yang dipilih." })).toThrow(/two-step/i);
  });
});
