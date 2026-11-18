import { describe, expect, it } from "vitest";

import { parseClippyHint } from "./test-center-clippy";

describe("Ask Clippy free-form guidance", () => {
  it.each([
    "Perhatikan bagaimana frasa \"tomorrow would work better\" mengubah arah percakapan.",
    "1) Bandingkan dua giliran bicara. 2) Ajukan pertanyaan balik kepada siswa?",
    "Clippy punya satu catatan kecil:\n\n- Dengarkan lagi, lalu minta siswa menjelaskan alasannya.",
  ])("accepts arbitrary non-empty text: %s", (text) => {
    expect(parseClippyHint({ text })).toEqual({ text });
  });

  it("preserves multiline text, quotes, and unconventional organization", () => {
    const text = "Clippy berhenti sejenak.\n\n\"What changes?\"\n\nCoba mulai dari giliran kedua.";
    expect(parseClippyHint({ text }).text).toBe(text);
  });

  it("rejects only empty, non-text, and oversized output", () => {
    expect(() => parseClippyHint({ text: "" })).toThrow();
    expect(() => parseClippyHint({ text: "   " })).toThrow();
    expect(() => parseClippyHint({ text: 42 })).toThrow();
    expect(() => parseClippyHint({ text: "x".repeat(6001) })).toThrow();
  });
});
