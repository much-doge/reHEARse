import Link from "next/link";
import { notFound } from "next/navigation";

import { getLearnerActivity } from "@/adapters/db/listening-repository";
import { PersistentLearningWorkspace } from "@/components/persistent-learning-workspace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LearnerActivityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser(`/learn/${slug}`);
  const activity = await getLearnerActivity(slug, user.id);
  if (!activity) notFound();

  return (
    <main className="workspace-shell">
      <header className="app-header workspace-header">
        <Link href="/dashboard" className="back-link">
          ← <span>Listening practice / Latihan menyimak</span>
        </Link>
        <div className="activity-title-mini">
          <span>{activity.partLabel}</span>
          <strong>{activity.title}</strong>
        </div>
        <span className="prototype-chip">
          {user.role === "learner"
            ? "Individual practice / Latihan mandiri"
            : "Activity preview / Pratinjau aktivitas"}
        </span>
      </header>
      <PersistentLearningWorkspace
        activity={activity}
        canSubmit={user.role === "learner"}
      />
    </main>
  );
}
