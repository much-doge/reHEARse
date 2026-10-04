import Link from "next/link";

import { LearningWorkspace } from "@/components/learning-workspace";
import { sampleActivity, sampleFeedback } from "@/domain/sample";

export default function ActivityPage() {
  return (
    <main className="workspace-shell">
      <header className="app-header workspace-header">
        <Link href="/dashboard" className="back-link">← <span>Listening desk</span></Link>
        <div className="activity-title-mini">
          <span>Part B foundation</span>
          <strong>A change of plans</strong>
        </div>
        <span className="prototype-chip">Prototype data</span>
      </header>
      <LearningWorkspace activity={sampleActivity} feedback={sampleFeedback} />
    </main>
  );
}

