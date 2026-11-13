import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { diagnosticAssignment, diagnosticAssignmentHistory, diagnosticInstructions, diagnosticListeningTiming, latestDiagnosticAttemptState, type DiagnosticInstructions } from "@protefl/adapters/postgres-diagnostic";
import { supportedDiagnosticPackage } from "@protefl/application/diagnostic-package";
import { DiagnosticTest } from "@/components/test-center/diagnostic-test";
import { requireUser } from "@/lib/session";
import "@/components/test-center/diagnostic-test.css";

export const dynamic = "force-dynamic";

export default async function DiagnosticTestPage({ params, searchParams }: { params: Promise<{ packageCode: string }>; searchParams: Promise<{ assignment?: string }> }) {
  const { packageCode } = await params;
  const { assignment: assignmentId } = await searchParams;
  if (!supportedDiagnosticPackage(packageCode)) notFound();
  const user = await requireUser("/test-center/diagnostic/" + packageCode);
  if (user.role === "teacher" || user.role === "admin") redirect("/test-center/teaching");
  const assignment = await diagnosticAssignment(user.id, assignmentId && /^[0-9a-f-]{36}$/i.test(assignmentId) ? assignmentId : undefined);
  if (!assignment) notFound();
  const [instructions, timing, initial, history] = await Promise.all([
    diagnosticInstructions(), diagnosticListeningTiming(), latestDiagnosticAttemptState(user.id, assignment.id), diagnosticAssignmentHistory(user.id, assignment.id),
  ]);
  return <main className="ptd-shell">
    <header className="ptd-header"><Link href="/test-center">← Test Center</Link><span>TOEFL-like Test Center</span><Link href="/dashboard">Dashboard</Link></header>
    <DiagnosticTest assignment={assignment} instructions={instructions as DiagnosticInstructions} timing={timing} initial={initial} history={history} />
  </main>;
}
