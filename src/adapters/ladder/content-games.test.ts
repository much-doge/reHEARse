import { describe, expect, it } from "vitest";
import { gameContents } from "./content-games";
import { validateLadderContent } from "./content-schema";
import { publicItems } from "./content";
import { emptyLadder } from "../../domain/ladder/model";
import { chapterGeometry, registeredChapterMap } from "../../components/ladder/chapter-layout";
import { passageJourneyMap } from "../../domain/ladder/journey-contract";
import { listeningStage } from "../../components/ladder/listening-stage";
describe("complete game content", () => {
  it("registers the full two-conversation and three-talk journeys without leaking guides", () => {
    expect(gameContents.map((game) => game.passages!.map((p) => p.toItem - p.fromItem))).toEqual([[4, 4], [5, 3, 4]]);
    for (const game of gameContents) {
      expect(validateLadderContent(game)).toBe(game);
      for (const item of game.items) expect(item.options).toHaveLength(4);
      expect(JSON.stringify(publicItems(emptyLadder(), game))).not.toMatch(/repairKey|transcript|reasons|supportedMeaning|audioHash|contefl|1163/i);
    }
    expect(gameContents[1].items.map((item) => item.first)).toEqual([1, 3, 3, 0, 2, 3, 1, 3, 0, 1, 2, 3]);
  });
  it("rejects gaps and spans outside the relevant recording", () => {
    const broken = structuredClone(gameContents[0]);
    broken.passages![1].fromItem++;
    expect(() => validateLadderContent(broken)).toThrow("invalid_passages");
    const span = structuredClone(gameContents[1]);
    span.items[5].endMs = span.passages![1].durationMs + 1;
    expect(() => validateLadderContent(span)).toThrow("invalid_span");
  });
  it("uses exactly the current passage for repairs and complete-game finish", () => {
    const state = { choices: Array.from({ length: 5 }, () => ({ choice: 0, outcome: "matched" as const, tries: 0 })), helpRequested: false, passageIndex: 0 };
    expect(listeningStage(state, 12, { fromItem: 0, toItem: 5 })).toEqual({ index: -1, repairing: false, finished: false });
    expect(listeningStage({ ...state, passageIndex: 1 }, 12, { fromItem: 5, toItem: 8 }).index).toBe(5);
  });
  it("builds functional 3, 4 and 5-question boards in both orientations", () => {
    for (const count of [3, 4, 5]) {
      const map = passageJourneyMap(count);
      expect(registeredChapterMap(map)).toBe(true);
      for (const wide of [false, true]) {
        const geometry = chapterGeometry(wide, count);
        expect(geometry.coords).toHaveLength(map.nodeCount);
        for (const point of geometry.coords) {
          expect(point.x).toBeGreaterThan(0); expect(point.x).toBeLessThan(geometry.width);
          expect(point.y).toBeGreaterThan(0); expect(point.y).toBeLessThan(geometry.height);
        }
      }
      map.connections[0].to++;
      expect(registeredChapterMap(map)).toBe(false);
    }
  });
});
