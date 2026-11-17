import { describe, expect, it } from "vitest";

import { assertClippyDoesNotRevealAnswer, parseClippyHint } from "./test-center-clippy";

const safeHint = {
  notice: "The response treats the second speaker's contrast as agreement.",
  tryThis: "Track what changes after the contrast word, then compare that change with the selected response.",
  teacherPrompt: "What changes immediately after the second speaker signals a contrast?",
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
  ])("rejects answer leakage: %s", (notice) => {
    expect(() => assertClippyDoesNotRevealAnswer({ ...safeHint, notice }, "B", "She needs to visit the museum")).toThrow(/Guidance/);
  });

  it("requires an open teacher question", () => {
    expect(() => parseClippyHint({ ...safeHint, teacherPrompt: "Listen for the contrast." })).toThrow();
  });
});
