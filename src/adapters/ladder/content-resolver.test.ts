import { validateLadderContent } from "./content-schema";
import { describe, expect, it } from "vitest";
import { ladderContents, legacyLadderContent, resolveLadderContent, resolveOriginalActivity, selectStartContent } from "./content-resolver";

describe("immutable ladder content registry", () => {
  it("retains the historical diagnostic reader and registers both original conversations", () => {
    expect(ladderContents).toHaveLength(5);
    expect(legacyLadderContent.version).toBe("three-papers-ladder.2026-10-06.v1");
    expect(legacyLadderContent.items.map((item) => item.options.length)).toEqual([3, 3, 3, 3]);
    expect(resolveLadderContent(legacyLadderContent.version)).toBe(legacyLadderContent);
    expect(resolveOriginalActivity("three-papers-one-thread")?.items.map((item) => item.options.length)).toEqual([4, 4, 4, 4]);
    expect(resolveOriginalActivity("ocean-currents-in-motion")?.items.map((item) => item.options.length)).toEqual([4, 4, 4, 4]);
  });

  it("switches only new starts while retaining every version reader", () => {
    expect(selectStartContent("legacy")?.version).toBe(legacyLadderContent.version);
    expect(selectStartContent("legacy", "ocean-currents-in-motion")).toBeNull();
    expect(selectStartContent("original")?.version).toBe("conversation-journey.2026-10-09.v1");
    expect(selectStartContent("original", "ocean-currents-in-motion")?.version).toBe("ocean-currents-original.2026-10-09.v1");
    expect(resolveLadderContent("ocean-currents-original.2026-10-09.v1")).not.toBeNull();
  });

  it("keeps keys, transcript and source lineage outside projected item shapes", () => {
    for (const content of ladderContents) {
      expect(content.items.length).toBe(content.passages ? content.passages.at(-1)!.toItem : 4);
      for (const item of content.items) {
        expect(item.startMs).toBeGreaterThanOrEqual(0);
        expect(item.endMs).toBeLessThanOrEqual(content.durationMs);
        expect(item.repair.options).toHaveLength(3);
      }
    }
    expect(resolveLadderContent("missing-version")).toBeNull();
    expect(resolveOriginalActivity("private-source-code")).toBeNull();
  });
});

describe("content acceptance boundaries", () => {
  it("rejects fractional or nonfinite stored answer keys", () => {
    for (const field of ["first", "repairKey"] as const) {
      for (const value of [0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
        const content = structuredClone(ladderContents[1]);
        content.items[0][field] = value;
        expect(() => validateLadderContent(content)).toThrow();
      }
    }
  });

  it("keeps the chemistry follow-up aligned with the reviewed reason", () => {
    const item = resolveOriginalActivity("three-papers-one-thread")!.items[3];
    expect(item.repair.options[item.repairKey].en).toMatch(/no experience/);
  });
});
