import { describe, expect, it } from "vitest";
import { lobbyPhase, validGameAlias } from "./lobby";
describe("pre-game lobby", () => {
  it("requires both personal readiness and teacher release", () => {
    expect(lobbyPhase(false, false)).toBe("setup");
    expect(lobbyPhase(false, true)).toBe("setup");
    expect(lobbyPhase(true, false)).toBe("waiting");
    expect(lobbyPhase(true, true)).toBe("playing");
  });
  it("allows readable pseudonyms and rejects markup, controls and oversized names", () => {
    for (const name of ["Sunny Otter", "Bima 7", "Éléphant", "Kupu-kupu"]) expect(validGameAlias(name)).toBe(true);
    for (const name of ["a", "a".repeat(29), "<script>", "line\nbreak", "😎"]) expect(validGameAlias(name)).toBe(false);
  });
});
