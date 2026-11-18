import { describe, expect, it } from "vitest";

import { assertClippyDoesNotRevealAnswer, parseClippyHint } from "./test-center-clippy";

const safeHint = {
  notice: "Respons tersebut memperlakukan kontras dari pembicara kedua sebagai persetujuan.",
  tryThis: "Lacak apa yang berubah setelah kata penanda kontras, lalu bandingkan perubahan itu dengan respons yang dipilih.",
  teacherPrompt: "Apa yang berubah tepat setelah pembicara kedua menandai sebuah kontras?",
};

describe("Ask Clippy guidance contract", () => {
  it("accepts concise show-don't-tell guidance", () => {
    expect(parseClippyHint(safeHint)).toEqual(safeHint);
    expect(() => assertClippyDoesNotRevealAnswer(safeHint, "B", "She needs to visit the museum")).not.toThrow();
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
    const withQuote = { ...safeHint, tryThis: "Dengarkan kembali frasa \"tomorrow would work better\", lalu tentukan perubahan rencananya." };
    expect(parseClippyHint(withQuote)).toEqual(withQuote);
  });
});
