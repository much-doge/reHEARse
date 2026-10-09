import { describe, expect, it } from "vitest";
import { CHAPTER_JOURNEY_MAP, type JourneyStep } from "../../domain/ladder/journey-contract";
import { chapterGeometry, registeredChapterMap, routePoints } from "./chapter-layout";
import { movementFrames } from "./movement-animation";
import { boardGroups } from "./board-layout";

describe("executable chapter route presentation", () => {
  it("places fourteen distinct nodes and every registered connector endpoint in both layouts", () => {
    expect(registeredChapterMap(CHAPTER_JOURNEY_MAP)).toBe(true);
    expect(registeredChapterMap({ ...CHAPTER_JOURNEY_MAP, connections: [] })).toBe(false);
    for (const wide of [false, true]) {
      const geometry = chapterGeometry(wide);
      expect(geometry.coords).toHaveLength(14);
      expect(new Set(geometry.coords.map((p) => `${p.x}:${p.y}`)).size).toBe(14);
      for (const connection of CHAPTER_JOURNEY_MAP.connections) {
        const points = routePoints(connection, geometry.coords);
        expect(points[0]).toEqual(geometry.coords[connection.from]);
        expect(points.at(-1)?.x).toBeCloseTo(geometry.coords[connection.to].x);
        expect(points.at(-1)?.y).toBeCloseTo(geometry.coords[connection.to].y);
        expect(points.every((p) => p.x >= 0 && p.x <= geometry.width && p.y >= 0 && p.y <= geometry.height)).toBe(true);
      }
    }
  });
  it("keeps the distinct finish and all thirty grouped players on their real node", () => {
    const groups = boardGroups(Array.from({ length: 30 }, (_, i) => ({ id: `${i}`, alias: `Otter ${i}`, position: 13 })), "29", undefined, 14);
    expect(groups[0].tile).toBe(13);
    expect(groups[0].hidden).toBe(28);
    expect(groups[0].visible[1].id).toBe("29");
    expect(groups[0].members).toHaveLength(30);
  });
  const geometry = chapterGeometry(true);
  const steps: JourneyStep[] = [{ kind: "walk", from: 0, to: 2, chapter: 0, cause: "first_mismatch" }, { kind: "snake", from: 2, to: 1, chapter: 0, cause: "first_mismatch" }];
  const next = { revision: 1, position: 1, transition: { eventId: "saved-event", revision: 1, steps } };
  it("animates the saved ordered route with the same snake samples as the painted connector", () => {
    const frames = movementFrames({ revision: 0, position: 0 }, next, geometry)!;
    expect(frames.duration).toBe(970);
    expect(frames.keyframes[0].left).toBe(`${geometry.coords[0].x / geometry.width * 100}%`);
    expect(frames.keyframes.at(-1)?.top).toBe(`${geometry.coords[1].y / geometry.height * 100}%`);
    expect(frames.keyframes.every((frame, index, all) => index === 0 || frame.offset >= all[index - 1].offset)).toBe(true);
  });
  it("does not replay refresh, skipped revisions, stale events or unrecorded movement", () => {
    expect(movementFrames(undefined, next, geometry)).toBeNull();
    expect(movementFrames({ revision: 1, position: 1 }, next, geometry)).toBeNull();
    expect(movementFrames({ revision: 0, position: 0 }, { ...next, revision: 3 }, geometry)).toBeNull();
    expect(movementFrames({ revision: 0, position: 0 }, { ...next, position: 13 }, geometry)).toBeNull();
    expect(movementFrames({ revision: 0, position: 0 }, { ...next, transition: { ...next.transition, steps: [{ ...steps[0], from: 99 }] } }, geometry)).toBeNull();
  });
});
