import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { diagnosticAssignment, diagnosticInstructions, diagnosticListeningTiming, latestDiagnosticAttemptState, type DiagnosticInstructions } from "@protefl/adapters/postgres-diagnostic";
import { DiagnosticTest } from "@/components/test-center/diagnostic-test";
import { requireUser } from "@/lib/session";
import "@/components/test-center/diagnostic-test.css";

export const dynamic = "force-dynamic";

export default async function DiagnosticTestPage({ params }: { params: Promise<{ packageCode: string }> }) {
  const { packageCode } = await params;
  if (packageCode !== "ets-volume3-practice-test-a") notFound();
  const user = await requireUser("/test-center/diagnostic/" + packageCode);
  if (user.role === "teacher" || user.role === "admin") redirect("/test-center/manage");
  const assignment = await diagnosticAssignment(user.id);
  if (!assignment) notFound();
  const [instructions, timing, initial] = await Promise.all([
    diagnosticInstructions(), diagnosticListeningTiming(), latestDiagnosticAttemptState(user.id),
  ]);
  return <main className="ptd-shell">
    <header className="ptd-header"><Link href="/test-center">← Test Center</Link><span>ProTEFL Test Center</span><Link href="/dashboard">Dashboard</Link></header>
    <DiagnosticTest assignment={assignment} instructions={instructions as DiagnosticInstructions} timing={timing} initial={initial} />
  </main>;
}
