import { describe, expect, it } from "vitest";
import type { LadderItemView, LadderState } from "../../domain/ladder/model";
import { formatAudioTime, listeningSpan, listeningStage } from "./listening-stage";
const item = (startMs: number, endMs: number) => ({ startMs, endMs } as LadderItemView);
describe("version-safe listening controls", () => {
  it("uses the actual question count and keeps repair open until every task closes", () => {
    const state: LadderState = { choices: [{ choice: 3, outcome: "matched", tries: 0 }, { choice: null, outcome: "repair", tries: 0 }], helpRequested: false };
    expect(listeningStage(state, 3)).toEqual({ index: 2, repairing: false, finished: false });
    expect(listeningStage(state, 2)).toEqual({ index: 1, repairing: true, finished: false });
    expect(listeningStage({ ...state, choices: state.choices.map((choice) => ({ ...choice, outcome: "supported" })) }, 2).finished).toBe(true);
    expect(listeningStage({ choices: [], helpRequested: false }, 0).finished).toBe(false);
  });
  it("uses contextual bounds without assuming the final question is array index three", () => {
    const items = [item(8250, 26500), item(18000, 97001)];
    expect(listeningSpan(items, 1)).toEqual({ startMs: 18000, endMs: 97001 });
    expect(listeningSpan(items, 0, true)).toEqual({ startMs: 8250, endMs: 97001 });
    expect(listeningSpan(items, 3)).toBeNull();
    expect(listeningSpan([item(100, 50)], 0)).toBeNull();
    expect(listeningSpan([item(1.5, 50)], 0)).toBeNull();
  });
  it("displays exact millisecond boundaries without rounded-second ambiguity", () => {
    expect(formatAudioTime(8250)).toBe("0:08.250");
    expect(formatAudioTime(97001)).toBe("1:37.001");
  });
});
