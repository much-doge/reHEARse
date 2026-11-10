import { redirect } from "next/navigation";

import { VocabularyPlay } from "@/components/vocabulary/vocabulary";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function VocabularyAssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const user = await requireUser("/vocabulary");
  if (user.role !== "learner") redirect("/vocabulary/teaching");
  const { assignmentId } = await params;
  return <VocabularyPlay assignmentId={assignmentId} />;
}
