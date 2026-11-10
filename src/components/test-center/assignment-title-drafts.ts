export type AssignmentTitleDrafts = Record<string, string>;

export function assignmentTitleDraft(drafts: AssignmentTitleDrafts, resourceId: string) {
  return drafts[resourceId] ?? "";
}

export function updateAssignmentTitleDraft(drafts: AssignmentTitleDrafts, resourceId: string, value: string): AssignmentTitleDrafts {
  return { ...drafts, [resourceId]: value };
}

export function trimmedAssignmentTitleDraft(drafts: AssignmentTitleDrafts, resourceId: string) {
  return assignmentTitleDraft(drafts, resourceId).trim();
}

export function hasValidAssignmentTitleDraft(drafts: AssignmentTitleDrafts, resourceId: string) {
  const length = trimmedAssignmentTitleDraft(drafts, resourceId).length;
  return length >= 1 && length <= 120;
}
