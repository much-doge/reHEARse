import { describe, it, expect } from "vitest";
import { advanceChapterJourney, advanceLadder, emptyLadder, ladderPosition } from "./model";
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

describe("chapter movement", () => {
  const originalKeys = keys.map((key) => ({ ...key, firstCount: 4, repairCount: 3 }));
  it("records exact match, mismatch and uncertainty paths", () => {
    const matched = advanceChapterJourney(emptyLadder(), 0, { kind: "choice", item: 0, choice: 0 }, originalKeys, "event-1", 1);
    expect(matched.position).toBe(3);
    expect(matched.transition.steps.map((step) => [step.kind, step.from, step.to])).toEqual([["walk", 0, 1], ["ladder", 1, 3]]);
    const mismatch = advanceChapterJourney(emptyLadder(), 0, { kind: "choice", item: 0, choice: 3 }, originalKeys, "event-2", 1);
    expect(mismatch.position).toBe(1);
    expect(mismatch.transition.steps.map((step) => [step.kind, step.from, step.to])).toEqual([["walk", 0, 2], ["snake", 2, 1]]);
    const uncertain = advanceChapterJourney(emptyLadder(), 0, { kind: "choice", item: 0, choice: null }, originalKeys, "event-3", 1);
    expect(uncertain.position).toBe(1);
    expect(uncertain.transition.steps).toHaveLength(1);
  });

  it("accepts D only for a four-option first choice and rejects repair overflow", () => {
    expect(() => advanceLadder(emptyLadder(), { kind: "choice", item: 0, choice: 3 }, keys)).toThrow("invalid_choice");
    expect(advanceLadder(emptyLadder(), { kind: "choice", item: 0, choice: 3 }, originalKeys).choices[0].choice).toBe(3);
    expect(() => advanceLadder(allWrong(), { kind: "repair", item: 0, choice: 3, explanation: "A bounded explanation." }, originalKeys)).toThrow("invalid_choice");
  });

  it("persists one recovery ladder and appends finish on final closure", () => {
    let state = emptyLadder();
    let position = 0;
    originalKeys.forEach((key, item) => {
      const result = advanceChapterJourney(state, position, { kind: "choice", item, choice: item === 0 ? 3 : key.first }, originalKeys, `first-${item}`, item + 1);
      state = result.state;
      position = result.position;
    });
    const repaired = advanceChapterJourney(state, position, { kind: "repair", item: 0, choice: originalKeys[0].repair, explanation: "I revised the relationship." }, originalKeys, "repair-0", 5);
    expect(repaired.position).toBe(13);
    expect(repaired.transition.steps.map((step) => step.kind)).toEqual(["walk", "ladder", "walk"]);
    expect(repaired.transition.steps.at(-1)?.cause).toBe("finish");
  });

  it("returns the same deterministic transition inputs and gives help no movement", () => {
    const first = advanceChapterJourney(emptyLadder(), 0, { kind: "choice", item: 0, choice: 3 }, originalKeys, "same-event", 1);
    const retry = advanceChapterJourney(emptyLadder(), 0, { kind: "choice", item: 0, choice: 3 }, originalKeys, "same-event", 1);
    expect(retry).toEqual(first);
    expect(advanceChapterJourney(emptyLadder(), 0, { kind: "help" }, originalKeys, "help-event", 1).transition.steps).toEqual([]);
  });

  it("finishes every mixed match, mismatch and uncertainty route with bounded support", () => {
    for (let mask = 0; mask < 3 ** 4; mask++) {
      let code = mask;
      let state = emptyLadder();
      let position = 0;
      let revision = 0;
      for (let item = 0; item < 4; item++) {
        const mode = code % 3;
        code = Math.floor(code / 3);
        const choice = mode === 0 ? originalKeys[item].first : mode === 1 ? (originalKeys[item].first + 1) % 4 : null;
        const moved = advanceChapterJourney(state, position, { kind: "choice", item, choice }, originalKeys, `route-${mask}-${revision}`, ++revision);
        state = moved.state;
        position = moved.position;
      }
      for (let item = 0; item < 4; item++) {
        if (state.choices[item].outcome !== "repair") continue;
        const tried = advanceChapterJourney(state, position, { kind: "repair", item, choice: (originalKeys[item].repair + 1) % 3, explanation: "I checked this relationship again." }, originalKeys, `route-${mask}-${revision}`, ++revision);
        state = tried.state;
        position = tried.position;
        if (state.choices[item].outcome === "repair") {
          const supported = advanceChapterJourney(state, position, { kind: "support", item, explanation: "I used the bounded review connection." }, originalKeys, `route-${mask}-${revision}`, ++revision);
          state = supported.state;
          position = supported.position;
        }
      }
      expect(position).toBe(13);
      expect(state.choices.every((choice) => choice.outcome !== "repair")).toBe(true);
    }
  });
});
