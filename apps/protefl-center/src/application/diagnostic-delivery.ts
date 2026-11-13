export type DiagnosticSection = "listening" | "structure" | "reading";
export type DiagnosticDeliveryScope = "full" | DiagnosticSection;
export type DiagnosticAttemptScope = "full" | DiagnosticSection;

/**
 * An attempt is reusable only inside the delivery scope that created it.
 * This is deliberately separate from `attempt.scope`: a full/root attempt
 * can belong to a single-section assignment, while a focused retake can have
 * a section attempt scope under a full assignment.
 */
export function attemptMatchesAssignmentScope(
  attemptDeliveryScope: DiagnosticDeliveryScope,
  assignmentDeliveryScope: DiagnosticDeliveryScope,
) {
  return attemptDeliveryScope === assignmentDeliveryScope;
}

export function completesAfterSection(
  attemptScope: DiagnosticAttemptScope,
  deliveryScope: DiagnosticDeliveryScope,
  section: DiagnosticSection,
) {
  return attemptScope === section || deliveryScope === section;
}

export function nextFullDiagnosticSection(section: DiagnosticSection): DiagnosticSection | "completed" {
  if (section === "listening") return "structure";
  if (section === "structure") return "reading";
  return "completed";
}
