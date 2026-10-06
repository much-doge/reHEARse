import { describe, it, expect } from "vitest";
import { advanceLadder, emptyLadder, ladderPosition } from "./model";
const keys = [
  { first: 0, repair: 2 },
  { first: 1, repair: 0 },
  { first: 2, repair: 1 },
  { first: 0, repair: 2 },
];
function allWrong() {
  let s = emptyLadder();
  keys.forEach((k, i) => {
    s = advanceLadder(
      s,
      { kind: "choice", item: i, choice: (k.first + 1) % 3 },
      keys,
    );
  });
  return s;
}
describe("bounded listening ladder", () => {
  it("reaches the destination after all matching interpretations", () => {
    let s = emptyLadder();
    keys.forEach((k, i) => {
      s = advanceLadder(s, { kind: "choice", item: i, choice: k.first }, keys);
    });
    expect(ladderPosition(s)).toBe(12);
  });
  it("bounds detours and never adds new debt on failed repair", () => {
    let s = allWrong();
    expect(ladderPosition(s)).toBe(4);
    s = advanceLadder(
      s,
      {
        kind: "repair",
        item: 0,
        choice: 0,
        explanation: "I am still checking this.",
      },
      keys,
    );
    expect(ladderPosition(s)).toBe(4);
    expect(s.choices).toHaveLength(4);
    s = advanceLadder(
      s,
      {
        kind: "repair",
        item: 0,
        choice: 0,
        explanation: "Another interpretation.",
      },
      keys,
    );
    expect(ladderPosition(s)).toBe(4);
    expect(() =>
      advanceLadder(
        s,
        { kind: "repair", item: 0, choice: 0, explanation: "Still unsure." },
        keys,
      ),
    ).toThrow("use_supported_review");
  });
  it("provides a finite supported exit without erasing earlier tasks", () => {
    let s = allWrong();
    keys.forEach((_, i) => {
      s = advanceLadder(
        s,
        {
          kind: "repair",
          item: i,
          choice: 2 - (i % 3),
          explanation: "My revised meaning.",
        },
        keys,
      );
      if (s.choices[i].outcome === "repair")
        s = advanceLadder(
          s,
          {
            kind: "support",
            item: i,
            explanation: "I worked through the guided connection.",
          },
          keys,
        );
    });
    expect(ladderPosition(s)).toBe(12);
    expect(s.choices.every((x) => x.outcome !== "repair")).toBe(true);
  });
  it("rejects out-of-order choices and repeated task closure", () => {
    expect(() =>
      advanceLadder(
        emptyLadder(),
        { kind: "choice", item: 2, choice: 0 },
        keys,
      ),
    ).toThrow("task_order");
    let s = allWrong();
    s = advanceLadder(
      s,
      {
        kind: "repair",
        item: 0,
        choice: 2,
        explanation: "Several separate assignments.",
      },
      keys,
    );
    expect(() =>
      advanceLadder(
        s,
        { kind: "repair", item: 0, choice: 2, explanation: "Again." },
        keys,
      ),
    ).toThrow("task_closed");
  });
  it("makes uncertainty replayable without a snake penalty", () => {
    let s = emptyLadder();
    s = advanceLadder(s, { kind: "choice", item: 0, choice: null }, keys);
    expect(s.choices[0].outcome).toBe("repair");
    expect(ladderPosition(s)).toBe(3);
  });
  it("requires listening sequence and an explanation before repair", () => {
    expect(() =>
      advanceLadder(
        emptyLadder(),
        { kind: "repair", item: 0, choice: 2, explanation: "test" },
        keys,
      ),
    ).toThrow("finish_listening_first");
    expect(() =>
      advanceLadder(
        allWrong(),
        { kind: "support", item: 0, explanation: "test" },
        keys,
      ),
    ).toThrow("try_replay_first");
    expect(() =>
      advanceLadder(
        allWrong(),
        { kind: "repair", item: 0, choice: 2, explanation: "" },
        keys,
      ),
    ).toThrow("explanation_required");
  });
});
