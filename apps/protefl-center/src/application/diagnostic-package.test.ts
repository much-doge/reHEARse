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
