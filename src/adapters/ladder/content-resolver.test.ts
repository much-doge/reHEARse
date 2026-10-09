import { describe, expect, it } from "vitest";
import { ladderContents, legacyLadderContent, resolveLadderContent, resolveOriginalActivity, selectStartContent } from "./content-resolver";

describe("immutable ladder content registry", () => {
  it("retains the historical diagnostic reader and registers both original conversations", () => {
    expect(ladderContents).toHaveLength(3);
    expect(legacyLadderContent.version).toBe("three-papers-ladder.2026-10-06.v1");
    expect(legacyLadderContent.items.map((item) => item.options.length)).toEqual([3, 3, 3, 3]);
    expect(resolveLadderContent(legacyLadderContent.version)).toBe(legacyLadderContent);
    expect(resolveOriginalActivity("three-papers-one-thread")?.items.map((item) => item.options.length)).toEqual([4, 4, 4, 4]);
    expect(resolveOriginalActivity("ocean-currents-in-motion")?.items.map((item) => item.options.length)).toEqual([4, 4, 4, 4]);
  });

  it("switches only new starts while retaining every version reader", () => {
    expect(selectStartContent("legacy")?.version).toBe(legacyLadderContent.version);
    expect(selectStartContent("legacy", "ocean-currents-in-motion")).toBeNull();
    expect(selectStartContent("original")?.version).toBe("three-papers-original.2026-10-09.v1");
    expect(selectStartContent("original", "ocean-currents-in-motion")?.version).toBe("ocean-currents-original.2026-10-09.v1");
    expect(resolveLadderContent("ocean-currents-original.2026-10-09.v1")).not.toBeNull();
  });

  it("keeps keys, transcript and source lineage outside projected item shapes", () => {
    for (const content of ladderContents) {
      expect(content.items).toHaveLength(4);
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
