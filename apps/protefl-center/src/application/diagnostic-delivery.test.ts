import { describe, expect, it } from "vitest";

import { attemptMatchesAssignmentScope, completesAfterSection, nextFullDiagnosticSection } from "./diagnostic-delivery";

describe("diagnostic delivery scope", () => {
  it("keeps the full diagnostic in its ordered three-section sequence", () => {
    expect(completesAfterSection("full", "full", "listening")).toBe(false);
    expect(nextFullDiagnosticSection("listening")).toBe("structure");
    expect(nextFullDiagnosticSection("structure")).toBe("reading");
    expect(nextFullDiagnosticSection("reading")).toBe("completed");
  });

  it.each(["listening", "structure", "reading"] as const)("completes a %s-only assignment after its assigned section", (section) => {
    expect(completesAfterSection("full", section, section)).toBe(true);
  });

  it.each(["listening", "structure", "reading"] as const)("completes a focused %s retake independently", (section) => {
    expect(completesAfterSection(section, "full", section)).toBe(true);
  });

  it.each(["listening", "structure", "reading"] as const)("reuses a %s attempt only for the same assignment scope", (section) => {
    expect(attemptMatchesAssignmentScope(section, section)).toBe(true);
    expect(attemptMatchesAssignmentScope("full", section)).toBe(false);
    expect(attemptMatchesAssignmentScope(section, "full")).toBe(false);
  });
});
