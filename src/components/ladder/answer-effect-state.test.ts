import { describe, expect, it } from "vitest";
import type { LadderState } from "@/domain/ladder/model";
import { confirmedAnswerEffect } from "./answer-effect-state";

const empty = { runId: "run", revision: 0, state: { choices: [], helpRequested: false } };
const view = (outcome: LadderState["choices"][number]["outcome"], choice: number | null = 0, tries = 0, revision = 1) => ({
  runId: "run", revision, state: { choices: [{ choice, outcome, tries }], helpRequested: false },
});

describe("saved answer effects", () => {
  it("celebrates only a newly acknowledged matching choice", () => {
    const action = { kind: "choice" as const, item: 0, choice: 0 };
    expect(confirmedAnswerEffect(empty, view("matched"), action)?.kind).toBe("celebrate");
    expect(confirmedAnswerEffect(view("matched"), view("matched"), action)).toBeNull();
    expect(confirmedAnswerEffect(null, view("matched"), action)).toBeNull();
    expect(confirmedAnswerEffect(empty, view("matched"))).toBeNull();
    expect(confirmedAnswerEffect(empty, { ...view("matched"), runId: "another" }, action)).toBeNull();
  });
  it("uses red only for a saved wrong choice and keeps uncertainty neutral", () => {
    expect(confirmedAnswerEffect(empty, view("repair"), { kind: "choice", item: 0, choice: 0 })?.kind).toBe("revisit");
    expect(confirmedAnswerEffect(empty, view("repair", null), { kind: "choice", item: 0, choice: null })?.kind).toBe("neutral");
  });
  it("celebrates guided completion as fully as a revised matching choice", () => {
    const before = view("repair", 0, 1);
    const support = confirmedAnswerEffect(before, view("supported", 0, 2, 2), { kind: "support", item: 0, explanation: "My explanation" });
    const revision = confirmedAnswerEffect(before, view("revised", 0, 2, 2), { kind: "repair", item: 0, choice: 1, explanation: "My explanation" });
    expect(support?.kind).toBe("celebrate");
    expect(revision?.kind).toBe("celebrate");
    expect(support?.text.id).toBeTruthy();
  });
  it("does not replay a prior celebration when another event advances the run", () => {
    expect(confirmedAnswerEffect(view("matched"), view("matched", 0, 0, 2), { kind: "choice", item: 0, choice: 0 })).toBeNull();
    expect(confirmedAnswerEffect(view("repair"), view("repair", 0, 0, 2), { kind: "repair", item: 0, choice: 1, explanation: "Saved explanation" })).toBeNull();
    expect(confirmedAnswerEffect(empty, view("matched"), { kind: "help" })).toBeNull();
  });
  it("offers a replay nudge for a newly saved unresolved revision", () => {
    const effect = confirmedAnswerEffect(view("repair"), view("repair", 0, 1, 2), { kind: "repair", item: 0, choice: 2, explanation: "My explanation" });
    expect(effect?.kind).toBe("revisit");
    expect(effect?.text.en).toContain("replay checkpoint");
  });
});
