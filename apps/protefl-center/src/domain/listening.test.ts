import { describe, expect, it } from "vitest";

import { selectRemedialItems, type RemedialSelectionItem } from "./listening";

const item = (
  ordinal: number,
  part: "A" | "B" | "C",
  passageGroup: string,
  correct: boolean,
): RemedialSelectionItem => ({ id: `item-${ordinal}`, ordinal, part, passageGroup, correct });

describe("passage-aware listening remediation", () => {
  it("keeps Part A item-based and expands missed Part B/C questions to complete passage groups", () => {
    const selected = selectRemedialItems([
      item(1, "A", "a-1", true),
      item(2, "A", "a-2", false),
      item(31, "B", "b-library", true),
      item(32, "B", "b-library", false),
      item(33, "B", "b-library", true),
      item(36, "B", "b-temple", true),
      item(40, "C", "c-aristotle", true),
      item(41, "C", "c-aristotle", false),
      item(42, "C", "c-aristotle", true),
    ]);

    expect(selected.map((entry) => entry.ordinal)).toEqual([2, 31, 32, 33, 40, 41, 42]);
  });

  it("returns nothing when the parent attempt has no missed item", () => {
    expect(selectRemedialItems([item(31, "B", "b-library", true)])).toEqual([]);
  });
});
