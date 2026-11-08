export type DiagnosticSection = "listening" | "structure" | "reading";
export type DiagnosticDeliveryScope = "full" | DiagnosticSection;
export type DiagnosticAttemptScope = "full" | DiagnosticSection;

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
