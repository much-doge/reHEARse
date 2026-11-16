import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { diagnosticPackage, diagnosticPackageCodes, diagnosticPackagePath, supportedDiagnosticPackage } from "./diagnostic-package";

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
});
