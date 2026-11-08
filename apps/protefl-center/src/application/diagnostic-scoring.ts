export type ConvertedRange = [number, number] | null;
export type ScoreRangeRow = {
  raw: [number, number];
  section1: ConvertedRange;
  section2: ConvertedRange;
  section3: ConvertedRange;
};
export type DiagnosticSections = "listening" | "structure" | "reading";

export function convertedSectionRange(rows: ScoreRangeRow[], section: DiagnosticSections, raw: number): ConvertedRange {
  const field = section === "listening" ? "section1" : section === "structure" ? "section2" : "section3";
  return rows.find((row) => raw >= row.raw[0] && raw <= row.raw[1])?.[field] ?? null;
}

export function convertedTotalRange(ranges: ConvertedRange[]): ConvertedRange {
  if (ranges.length !== 3 || ranges.some((range) => range === null)) return null;
  const complete = ranges as Array<[number, number]>;
  const lower = complete.reduce((sum, range) => sum + range[0], 0);
  const upper = complete.reduce((sum, range) => sum + range[1], 0);
  return [Math.round(lower * 10 / 3), Math.round(upper * 10 / 3)];
}
