import { describe, expect, it } from "vitest";
import type { LadderView } from "@/domain/ladder/model";
import { ladderTaskKey, reconcileLadderView } from "./view-reconciliation";

const base: LadderView = {
  contractVersion: "listening-ladder.v2", runId: "run-a", revision: 2,
  title: "Conversation", audioUrl: "/audio", alias: "Listener ABCD", avatarId: "moss",
  pin: null, sessionClosed: false, state: { choices: [{ choice: 0, outcome: "repair", tries: 1 }], helpRequested: false },
  position: 1, items: [], latestNote: null, latestEventId: "event-a",
};
describe("appearance and task reconciliation", () => {
  it("ignores delayed cosmetic responses after a newer gameplay save", () => {
    expect(reconcileLadderView({ ...base, revision: 3 }, { ...base, avatarId: "fern" })?.revision).toBe(3);
  });
  it("accepts appearance changes without treating them as a new task", () => {
    const changed = reconcileLadderView(base, { ...base, avatarId: "fern" });
    expect(changed?.avatarId).toBe("fern");
    expect(ladderTaskKey(changed)).toBe(ladderTaskKey(base));
    expect(changed?.state).toEqual(base.state);
  });
  it("ignores an old run response unless a new run was explicitly started", () => {
    const next = { ...base, runId: "run-b" };
    expect(reconcileLadderView(base, next)).toBe(base);
    expect(reconcileLadderView(base, next, true)).toBe(next);
    expect(reconcileLadderView(null, next)).toBeNull();
    expect(reconcileLadderView(null, next, true)).toBe(next);
  });
  it("retains completed feedback when an earlier cosmetic read arrives without it", () => {
    const previous = { ...base, latestNote: { en: "Replay the suggestion.", id: "Dengar lagi sarannya." } };
    expect(reconcileLadderView(previous, { ...base, avatarId: "fern" })?.latestNote).toEqual(previous.latestNote);
    expect(reconcileLadderView(previous, { ...base, latestEventId: "event-b" })?.latestNote).toBeNull();
  });
});
