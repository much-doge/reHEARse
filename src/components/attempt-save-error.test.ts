import { describe, it, expect } from "vitest";
import { attemptSaveError } from "./attempt-save-error";
describe("save failure guidance", () => {
  it("explains role and authentication failures in English", () => {
    expect(attemptSaveError("learner_role_required")).toContain(
      "learner account",
    );
    expect(attemptSaveError("authentication_required")).toContain(
      "another tab",
    );
  });
  it("gives actionable validation and origin guidance", () => {
    expect(attemptSaveError("invalid_attempt")).toContain("12,000");
    expect(attemptSaveError("origin_rejected")).toContain(
      "rehearse.najala.org",
    );
  });
  it("does not invite blind retries when saving is uncertain or render arbitrary server text", () => {
    const shown = attemptSaveError("secret raw server error");
    expect(shown).toContain("Check your practice history");
    expect(shown).not.toContain("secret raw");
  });
});
