import { describe, expect, it } from "vitest";
import { advancePassageJourney, passageComplete } from "./passage-journey";
import { emptyLadder, type LadderAction, type LadderState } from "./model";
const sizes = [5, 3, 4];
const keys = Array.from({ length: 12 }, () => ({ first: 3, repair: 1, firstCount: 4, repairCount: 3 }));
describe("durable passage checkpoints", () => {
  it("keeps every earlier choice and changes boards only through a valid checkpoint", () => {
    let state: LadderState = { ...emptyLadder(), passageIndex: 0 }, position = 0, revision = 0;
    const act = (action: LadderAction) => {
      const next = advancePassageJourney(state, position, action, keys, sizes, `event-${++revision}`, revision);
      state = next.state; position = next.position; return next;
    };
    expect(() => act({ kind: "continue" })).toThrow("checkpoint_not_ready");
    expect(() => act({ kind: "choice", item: 5, choice: 3 })).toThrow("invalid_task");
    for (let i = 0; i < 5; i++) act({ kind: "choice", item: i, choice: i === 2 ? 0 : 3 });
    expect(passageComplete(state, sizes)).toBe(false);
    expect(() => act({ kind: "continue" })).toThrow("checkpoint_not_ready");
    expect(() => act({ kind: "support", item: 2, explanation: "My reading" })).toThrow("try_replay_first");
    act({ kind: "repair", item: 2, choice: 0, explanation: "I compared the ideas." });
    expect(position).toBe(7);
    act({ kind: "support", item: 2, explanation: "I used the guide to compare the ideas." });
    expect(position).toBe(16);
    expect(passageComplete(state, sizes)).toBe(true);
    const earlier = structuredClone(state.choices);
    expect(act({ kind: "continue" }).transition.steps).toEqual([]);
    expect(state.passageIndex).toBe(1); expect(position).toBe(0);
    expect(state.choices).toEqual(earlier);
    expect(() => act({ kind: "repair", item: 2, choice: 1, explanation: "Old task" })).toThrow("invalid_task");
    expect(() => act({ kind: "continue" })).toThrow("checkpoint_not_ready");
    for (let i = 5; i < 8; i++) act({ kind: "choice", item: i, choice: 3 });
    expect(position).toBe(10);
    act({ kind: "continue" });
    for (let i = 8; i < 12; i++) act({ kind: "choice", item: i, choice: 3 });
    expect(position).toBe(13); expect(state.choices).toHaveLength(12);
    expect(state.choices.slice(0, 5)).toEqual(earlier);
    expect(() => act({ kind: "continue" })).toThrow("checkpoint_not_ready");
  });
  it("scopes teacher assistance and repair readiness to the current passage", () => {
    const state: LadderState = { choices: keys.slice(0, 5).map(() => ({ choice: 3, outcome: "matched", tries: 0 })), helpRequested: false, passageIndex: 1 };
    const next = advancePassageJourney(state, 0, { kind: "choice", item: 5, choice: null }, keys, sizes, "a", 7);
    expect(next.position).toBe(1);
    expect(() => advancePassageJourney(next.state, 1, { kind: "teacher_close", item: 5, explanation: "Discussed" }, keys, sizes, "b", 8)).toThrow("finish_listening_first");
    expect(() => advancePassageJourney({ ...state, passageIndex: 9 }, 0, { kind: "help" }, keys, sizes, "b", 8)).toThrow("invalid_passage");
  });
});
