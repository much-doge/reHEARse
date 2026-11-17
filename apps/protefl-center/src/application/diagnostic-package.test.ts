import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { diagnosticPackage, diagnosticPackageCodes, diagnosticPackagePath, supportedDiagnosticPackage } from "./diagnostic-package";
import { convertedSectionRangeFromTable, type ScoreConversionTable } from "./diagnostic-scoring";

describe("diagnostic package catalogue", () => {
  it("exposes the Volume 1 Practice Test A descriptor", () => {
    const descriptor = diagnosticPackage("ets-volume1-practice-test-a");
    expect(descriptor?.supportedSections).toEqual(["listening", "structure", "reading"]);
    expect(descriptor?.questionCounts).toEqual({ listening: 50, structure: 40, reading: 50 });
    expect(descriptor?.privateSourceFiles).toEqual([
      "source/ets-toefl-itp-level1-volume1.pdf",
      "source/ets-toefl-itp-level1-volume1-layout.txt",
    ]);
    expect(diagnosticPackagePath(descriptor!.code)).toContain("apps/protefl-center/content/ets-volume1-practice-test-a-v1");
  });

  it("exposes the published Practice Test A descriptor", () => {
    const descriptor = diagnosticPackage("ets-volume3-practice-test-a");
    expect(descriptor?.supportedSections).toEqual(["listening", "structure", "reading"]);
    expect(descriptor?.questionCounts).toEqual({ listening: 50, structure: 40, reading: 50 });
    expect(descriptor?.privateSourceFiles).toEqual([
      "source/ets-toefl-itp-volume-3.pdf",
      "source/ets-toefl-itp-volume-3-layout.txt",
    ]);
    expect(diagnosticPackagePath(descriptor!.code)).toContain("apps/protefl-center/content/ets-volume3-practice-test-a-v1");
  });

  it("exposes the May 2005 Listening-only package without other sections", () => {
    const descriptor = diagnosticPackage("ets-toefl-pbt-2005-05-listening");
    expect(descriptor?.supportedSections).toEqual(["listening"]);
    expect(descriptor?.questionCounts).toEqual({ listening: 50, structure: 0, reading: 0 });
    expect(descriptor?.files.listeningAudio).toBe("source/listening.mp3");
    expect(descriptor?.resultVersions.sectionAssignment).toContain("section-assignment.v1");
    expect(diagnosticPackagePath(descriptor!.code)).toContain("apps/protefl-center/content/ets-toefl-pbt-2005-05-listening-v1");
  });

  it("starts each grouped conversation or talk at its mapped context cue", async () => {
    const directory = diagnosticPackagePath("ets-toefl-pbt-2005-05-listening");
    const map = JSON.parse(await readFile(join(directory!, "metadata/listening-question-map-v1.json"), "utf8")) as {
      questions: Array<{ question: number; groupId: string; groupType: string; questionAudioStartMs: number; contextStartMs: number }>;
    };
    const groups = new Map<string, typeof map.questions>();
    for (const item of map.questions.filter(({ groupType }) => groupType !== "question"))
      groups.set(item.groupId, [...(groups.get(item.groupId) ?? []), item]);

    expect(groups.size).toBe(5);
    for (const items of groups.values()) {
      expect(items[0].questionAudioStartMs).toBe(items[0].contextStartMs);
    }
  });

  it.each(["", "unknown-form", "ets-volume3-practice-test-b-listening"])("denies an unregistered package: %s", (code) => {
    expect(supportedDiagnosticPackage(code)).toBeNull();
  });

  it("keeps the catalogue enumerable for future package registration", () => {
    expect(diagnosticPackageCodes()).toEqual([
      "ets-volume1-practice-test-a",
      "ets-volume3-practice-test-a",
      "ets-toefl-pbt-2005-05-listening",
    ]);
  });

  it.each(["ets-volume1-practice-test-a", "ets-volume3-practice-test-a"])("can read every full package score table: %s", async (code) => {
    const descriptor = diagnosticPackage(code)!;
    const scoreTable = JSON.parse(await readFile(join(diagnosticPackagePath(code)!, descriptor.files.scoreConversion), "utf8")) as ScoreConversionTable;
    for (const section of ["listening", "structure", "reading"] as const) {
      expect(() => convertedSectionRangeFromTable(scoreTable, section, 0)).not.toThrow();
      expect(() => convertedSectionRangeFromTable(scoreTable, section, descriptor.questionCounts[section])).not.toThrow();
    }
  });

  it("converts Volume 1's source-faithful section maps at both score boundaries", async () => {
    const descriptor = diagnosticPackage("ets-volume1-practice-test-a")!;
    const scoreTable = JSON.parse(await readFile(join(diagnosticPackagePath(descriptor.code)!, descriptor.files.scoreConversion), "utf8")) as ScoreConversionTable;
    expect(convertedSectionRangeFromTable(scoreTable, "listening", 0)).toEqual([24, 26]);
    expect(convertedSectionRangeFromTable(scoreTable, "listening", 50)).toEqual([64, 68]);
    expect(convertedSectionRangeFromTable(scoreTable, "structure", 0)).toEqual([20, 22]);
    expect(convertedSectionRangeFromTable(scoreTable, "structure", 40)).toEqual([63, 68]);
    expect(convertedSectionRangeFromTable(scoreTable, "reading", 0)).toEqual([20, 22]);
    expect(convertedSectionRangeFromTable(scoreTable, "reading", 50)).toEqual([65, 67]);
  });
});
