export type ConvertedRange = [number, number] | null;
export type ScoreRangeRow = {
  raw: [number, number];
  section1: ConvertedRange;
  section2: ConvertedRange;
  section3: ConvertedRange;
};
export type DiagnosticSections = "listening" | "structure" | "reading";
export type SectionScoreRanges = Record<DiagnosticSections, Record<string, string | null>>;
export type ScoreConversionTable = {
  ranges?: ScoreRangeRow[];
  sections?: SectionScoreRanges;
};

export function convertedSectionRange(rows: ScoreRangeRow[], section: DiagnosticSections, raw: number): ConvertedRange {
  const field = section === "listening" ? "section1" : section === "structure" ? "section2" : "section3";
  return rows.find((row) => raw >= row.raw[0] && raw <= row.raw[1])?.[field] ?? null;
}

function parseInclusiveRange(value: string): [number, number] | null {
  const match = /^(\d+)-(\d+)$/.exec(value);
  if (!match) return null;
  const lower = Number(match[1]);
  const upper = Number(match[2]);
  return Number.isInteger(lower) && Number.isInteger(upper) && lower <= upper ? [lower, upper] : null;
}

/**
 * Published packages use either the normalized cross-section rows or the
 * source-faithful section maps retained by Volume 1. Validate both shapes at
 * the adapter boundary; never guess a conversion that is absent from source.
 */
export function convertedSectionRangeFromTable(table: ScoreConversionTable, section: DiagnosticSections, raw: number): ConvertedRange {
  if (Array.isArray(table.ranges)) return convertedSectionRange(table.ranges, section, raw);
  const ranges = table.sections?.[section];
  if (!ranges || typeof ranges !== "object") throw new Error("score_table_invalid");
  for (const [rawLabel, convertedLabel] of Object.entries(ranges)) {
    const rawRange = parseInclusiveRange(rawLabel);
    if (!rawRange) throw new Error("score_table_invalid");
    if (raw < rawRange[0] || raw > rawRange[1]) continue;
    if (convertedLabel === null) return null;
    const converted = parseInclusiveRange(convertedLabel);
    if (!converted) throw new Error("score_table_invalid");
    return converted;
  }
  return null;
}

export function convertedTotalRange(ranges: ConvertedRange[]): ConvertedRange {
  if (ranges.length !== 3 || ranges.some((range) => range === null)) return null;
  const complete = ranges as Array<[number, number]>;
  const lower = complete.reduce((sum, range) => sum + range[0], 0);
  const upper = complete.reduce((sum, range) => sum + range[1], 0);
  return [Math.round(lower * 10 / 3), Math.round(upper * 10 / 3)];
}
