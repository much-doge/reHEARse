import { describe, it, expect } from "vitest";
import { gamePoints, nextPhase, publicRound, type Round } from "./contracts";
const r: Round = {
  number: 1,
  audioUrl: "https://example.org/1.mp3",
  prompt: "Meaning?",
  options: ["a", "b", "c", "d"],
  answer: 2,
  cue: { en: "Listen", id: "Dengar" },
  explanation: { en: "Meaning", id: "Makna" },
};
describe("isolated recreational contract", () => {
  it("requires listen and externalization before quiz, review before next", () => {
    expect(nextPhase("lobby", 0, 2)).toEqual({ phase: "listen", index: 0 });
    expect(nextPhase("listen", 0, 2).phase).toBe("comprehend");
    expect(nextPhase("comprehend", 0, 2).phase).toBe("quiz");
    expect(nextPhase("quiz", 0, 2).phase).toBe("review");
    expect(nextPhase("review", 0, 2)).toEqual({ phase: "listen", index: 1 });
    expect(nextPhase("review", 1, 2).phase).toBe("finished");
    expect(() => nextPhase("finished", 1, 2)).toThrow();
  });
  it("hides keys, options, cues and media before the appropriate phase", () => {
    for (const p of [
      "lobby",
      "listen",
      "comprehend",
      "quiz",
      "finished",
    ] as const) {
      expect(publicRound(r, p)).not.toHaveProperty("answer");
      expect(publicRound(r, p)).not.toHaveProperty("cue");
      expect(publicRound(r, p)).not.toHaveProperty("audioUrl");
    }
    expect(publicRound(r, "listen")).not.toHaveProperty("options");
    expect(publicRound(r, "quiz")).toHaveProperty("options");
    expect(publicRound(r, "review")).toHaveProperty("answer", 2);
  });
  it("bounds the server-timed bonus and never rewards a nonmatching answer", () => {
    expect(gamePoints(false, 0, 30000)).toBe(0);
    expect(gamePoints(true, 0, 30000)).toBe(1200);
    expect(gamePoints(true, 15000, 30000)).toBe(1100);
    expect(gamePoints(true, 30000, 30000)).toBe(1000);
    expect(gamePoints(true, -100, 30000)).toBe(1200);
  });
});
