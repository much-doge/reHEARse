import { describe, expect, it } from "vitest";

import { assertClippyDoesNotRevealAnswer, parseClippyHint } from "./test-center-clippy";

const safeHint = {
  notice: { en: "The response treats the second speaker's contrast as agreement.", id: "Respons tersebut memperlakukan kontras dari pembicara kedua sebagai persetujuan." },
  tryThis: { en: "Track what changes after the contrast word, then compare that change with the selected response.", id: "Lacak apa yang berubah setelah kata penanda kontras, lalu bandingkan perubahan itu dengan respons yang dipilih." },
  teacherPrompt: { en: "What changes immediately after the second speaker signals a contrast?", id: "Apa yang berubah tepat setelah pembicara kedua menandai sebuah kontras?" },
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
  ])("rejects bilingual answer leakage: %s", (notice) => {
    expect(() => assertClippyDoesNotRevealAnswer({ ...safeHint, notice: { ...safeHint.notice, id: notice } }, "B", "She needs to visit the museum")).toThrow(/Guidance/);
  });

  it("requires an open teacher question", () => {
    expect(() => parseClippyHint({ ...safeHint, teacherPrompt: { en: "Listen for the contrast.", id: "Dengarkan kontrasnya." } })).toThrow();
  });

  it("rejects monolingual guidance", () => {
    expect(() => parseClippyHint({ ...safeHint, notice: { en: safeHint.notice.en } })).toThrow();
  });
});
