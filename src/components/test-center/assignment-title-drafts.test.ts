import { describe, expect, it } from "vitest";

import { assignmentTitleDraft, hasValidAssignmentTitleDraft, trimmedAssignmentTitleDraft, updateAssignmentTitleDraft } from "./assignment-title-drafts";

describe("resource-specific assignment title drafts", () => {
  it("keeps each resource title isolated and submits its trimmed value", () => {
    const drafts = updateAssignmentTitleDraft(
      updateAssignmentTitleDraft({}, "resource-a", "  Class A · Reading  "),
      "resource-b",
      "Class B · Listening",
    );

    expect(assignmentTitleDraft(drafts, "resource-a")).toBe("  Class A · Reading  ");
    expect(assignmentTitleDraft(drafts, "resource-b")).toBe("Class B · Listening");
    expect(trimmedAssignmentTitleDraft(drafts, "resource-a")).toBe("Class A · Reading");
    expect(trimmedAssignmentTitleDraft(drafts, "resource-b")).toBe("Class B · Listening");
  });

  it("validates the title length independently for each resource", () => {
    const drafts = updateAssignmentTitleDraft(updateAssignmentTitleDraft({}, "resource-a", "  "), "resource-b", "B".repeat(121));

    expect(hasValidAssignmentTitleDraft(drafts, "resource-a")).toBe(false);
    expect(hasValidAssignmentTitleDraft(drafts, "resource-b")).toBe(false);
    expect(hasValidAssignmentTitleDraft(updateAssignmentTitleDraft(drafts, "resource-a", "Group A"), "resource-a")).toBe(true);
  });
});
