import { describe, expect, it } from "vitest";

import { convertedSectionRange, convertedSectionRangeFromTable, convertedTotalRange, type ScoreRangeRow } from "./diagnostic-scoring";

const rows: ScoreRangeRow[] = [
  { raw: [36, 38], section1: [52, 54], section2: [63, 68], section3: [55, 56] },
  { raw: [33, 35], section1: [51, 52], section2: [59, 61], section3: [53, 54] },
  { raw: [30, 32], section1: [49, 50], section2: [56, 58], section3: [51, 52] },
  { raw: [27, 29], section1: [48, 49], section2: [53, 55], section3: [49, 50] },
  { raw: [39, 41], section1: [54, 56], section2: null, section3: [57, 58] },
];

describe("Practice Test A score conversion", () => {
  it("matches the book's worked example and rounding rule", () => {
    const ranges = [
      convertedSectionRange(rows, "listening", 28),
      convertedSectionRange(rows, "structure", 30),
      convertedSectionRange(rows, "reading", 39),
    ];
    expect(ranges).toEqual([[48, 49], [56, 58], [57, 58]]);
    expect(convertedTotalRange(ranges)).toEqual([537, 550]);
  });

  it("does not invent a Structure conversion omitted by the source table", () => {
    expect(convertedSectionRange(rows, "structure", 39)).toBeNull();
    expect(convertedTotalRange([[54, 56], null, [57, 58]])).toBeNull();
  });

  it("reads the source-faithful section maps used by Volume 1", () => {
    const table = {
      sections: {
        listening: { "48-50": "64-68", "45-47": "59-62" },
        structure: { "36-40": "63-68", "33-35": "59-61" },
        reading: { "48-50": "65-67", "45-47": "62-64" },
      },
    };
    expect(convertedSectionRangeFromTable(table, "listening", 49)).toEqual([64, 68]);
    expect(convertedSectionRangeFromTable(table, "structure", 38)).toEqual([63, 68]);
    expect(convertedSectionRangeFromTable(table, "reading", 46)).toEqual([62, 64]);
  });

  it("fails closed for malformed or missing score-table shapes", () => {
    expect(() => convertedSectionRangeFromTable({}, "reading", 40)).toThrow("score_table_invalid");
    expect(() => convertedSectionRangeFromTable({ sections: {
      listening: { bad: "64-68" }, structure: {}, reading: {},
    } }, "listening", 49)).toThrow("score_table_invalid");
  });
});
