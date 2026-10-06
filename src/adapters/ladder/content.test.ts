import { describe, it, expect } from "vitest";
import { ladderContent, publicItems } from "./content";
import { emptyLadder } from "../../domain/ladder/model";
describe("ladder public content", () => {
  it("does not expose keys, source text, distractor reasons or premature supported answers", () => {
    const dto = publicItems(emptyLadder());
    const raw = JSON.stringify(dto);
    expect(raw).not.toMatch(
      /first|repairKey|transcript|reasons|supportedMeaning|Romanticism|Romantisisme/,
    );
    expect(dto).toHaveLength(4);
  });
  it("reveals bounded guidance only after a recorded repair", () => {
    const s = emptyLadder();
    s.choices.push({ choice: 1, outcome: "repair", tries: 0 });
    expect(publicItems(s)[0].repair?.supportedMeaning).toBeUndefined();
    s.choices[0].tries = 1;
    expect(publicItems(s)[0].repair?.supportedMeaning).toBeDefined();
    expect(publicItems(s)[1].repair).toBeUndefined();
  });
  it("has continuous reviewed-boundary spans, parallel options and independent follow-up keys", () => {
    let end = 8250;
    for (const item of ladderContent.items) {
      expect(item.startMs).toBe(end);
      expect(item.endMs).toBeGreaterThan(item.startMs);
      end = item.endMs;
      expect(item.options).toHaveLength(3);
      expect(item.repair.options).toHaveLength(3);
      expect(item.reasons).toHaveLength(3);
      expect(item.first).not.toBe(item.repairKey);
    }
    expect(end).toBeLessThanOrEqual(97115);
  });
});
