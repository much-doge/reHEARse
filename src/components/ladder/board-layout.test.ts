import { describe, expect, it } from "vitest";
import { boardGeometry, boardGroups, boardTile } from "./board-layout";

describe("readable shared board positions", () => {
  const classmates = Array.from({ length: 30 }, (_, i) => ({
    id: `run-${i}`, alias: `Listener ${i}`, position: 0,
  }));
  it("keeps all 30 classmates at the real tile, with explicit overflow", () => {
    const [group] = boardGroups(classmates);
    expect(group.tile).toBe(0);
    expect(group.members).toHaveLength(30);
    expect(group.visible).toHaveLength(2);
    expect(group.hidden).toBe(28);
    expect(group.members.map((p) => p.key)).toEqual(classmates.map((p) => p.id));
  });
  it("keeps the local player visible without changing anyone's progress", () => {
    const [group] = boardGroups(classmates, "run-29");
    expect(group.visible.map((p) => p.id)).toEqual(["run-0", "run-29"]);
    expect(group.members).toHaveLength(30);
    expect(classmates.every((p) => p.position === 0)).toBe(true);
  });
  it("never merges different positions or loses duplicate aliases", () => {
    const groups = boardGroups([
      { id: "a", alias: "Listener ABCD", position: 3 },
      { id: "b", alias: "Listener ABCD", position: 3 },
      { id: "c", alias: "Listener ABCD", position: 12 },
    ]);
    expect(groups.map((g) => [g.tile, g.members.length])).toEqual([[3, 2], [12, 1]]);
    expect(new Set(groups.flatMap((g) => g.members.map((p) => p.key))).size).toBe(3);
  });
  it("bounds malformed visual positions without changing the supplied data", () => {
    expect([-1, 20, NaN, Infinity, 3.4].map(boardTile)).toEqual([0, 12, 0, 0, 3]);
  });
  it("places all route endpoints within both layouts with room for large markers", () => {
    for (const wide of [true, false]) {
      const { width, height, coords } = boardGeometry(wide);
      expect(coords).toHaveLength(13);
      expect(new Set(coords.map((p) => `${p.x}:${p.y}`)).size).toBe(13);
      expect(coords.every((p) => p.x >= 60 && p.x <= width - 60 && p.y >= 100 && p.y <= height - 60)).toBe(true);
    }
  });
  it("does not manufacture players on an empty board", () => {
    expect(boardGroups([])).toEqual([]);
  });
});
