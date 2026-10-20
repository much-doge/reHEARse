import { describe, expect, it } from "vitest";
import { acknowledgeMutation, pendingMutation } from "./pending-mutation";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

describe("workshop pending mutations", () => {
  it("retains the original UUID, revision and action after a lost response", () => {
    const state = storage();
    const first = { key: "first", revision: 4, action: { kind: "choose", choice: "B" } };
    const changed = { key: "second", revision: 5, action: { kind: "choose", choice: "C" } };
    expect(pendingMutation(state, "learner", first)).toEqual(first);
    expect(pendingMutation(state, "learner", changed)).toEqual(first);
  });

  it("allows a fresh mutation only after acknowledgement", () => {
    const state = storage();
    pendingMutation(state, "host", { key: "first" });
    acknowledgeMutation(state, "host");
    expect(pendingMutation(state, "host", { key: "second" })).toEqual({ key: "second" });
  });
});

