import { describe, expect, it } from "vitest";
import { PALETTES, isAvatarPaletteId, paletteFor, paletteDefinition } from "./appearance";
import { anonymousAlias, displayAliases } from "./anonymous-alias";

describe("cosmetic colours and anonymous game identity", () => {
  it("limits skin colours to thirteen named palettes and stable colourful defaults", () => {
    expect(new Set(PALETTES.map((p) => p.id)).size).toBe(13);
    expect(PALETTES.every((p) => /^#[0-9a-f]{6}$/i.test(p.hex))).toBe(true);
    expect(isAvatarPaletteId("violet")).toBe(true);
    expect(isAvatarPaletteId("url(https://example.test)")).toBe(false);
    expect(isAvatarPaletteId(null)).toBe(false);
    expect(paletteDefinition("unknown").id).toBe("original");
    expect(paletteFor("same-user")).toBe(paletteFor("same-user"));
    expect(paletteFor("same-user")).not.toBe("original");
    expect(new Set(Array.from({ length: 100 }, (_, i) => paletteFor(`actor-${i}`))).size).toBe(12);
  });
  it("generates varied stable animal names without personal details or UUID fragments", () => {
    expect(anonymousAlias("run-1")).toBe(anonymousAlias("run-1"));
    const names = Array.from({ length: 100 }, (_, i) => anonymousAlias(`run-${i}`));
    expect(names.every((name) => /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(name))).toBe(true);
    expect(new Set(names).size).toBeGreaterThan(80);
  });
  it("presents legacy aliases without changing stored rows and disambiguates collisions", () => {
    const rows = [{ id: "a", alias: "Listener ABCD" }, { id: "b", alias: "Curious Otter" }, { id: "c", alias: "Curious Otter" }, { id: "d", alias: "Curious Otter 2" }];
    const original = structuredClone(rows), names = displayAliases(rows);
    expect(names.get("a")).toBe(anonymousAlias("a"));
    expect(names.get("b")).toBe("Curious Otter");
    expect(names.get("c")).toBe("Curious Otter 3");
    expect(names.get("d")).toBe("Curious Otter 2");
    expect(new Set(names.values()).size).toBe(rows.length);
    expect(rows).toEqual(original);
  });
});
