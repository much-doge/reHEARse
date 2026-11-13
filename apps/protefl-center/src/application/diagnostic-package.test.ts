import { describe, expect, it } from "vitest";

import { diagnosticPackage, diagnosticPackageCodes, diagnosticPackagePath, supportedDiagnosticPackage } from "./diagnostic-package";

describe("diagnostic package catalogue", () => {
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

  it.each(["", "unknown-form", "ets-volume3-practice-test-b-listening"])("denies an unregistered package: %s", (code) => {
    expect(supportedDiagnosticPackage(code)).toBeNull();
  });

  it("keeps the catalogue enumerable for future package registration", () => {
    expect(diagnosticPackageCodes()).toEqual(["ets-volume3-practice-test-a"]);
  });
});
