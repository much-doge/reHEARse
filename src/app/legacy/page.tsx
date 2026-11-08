import Link from "next/link";
import "@/components/ladder/board.css";
import { ladderRepository } from "@/adapters/ladder/postgres-ladder";
import { listLearnerActivities } from "@/adapters/db/listening-repository";
import { Avatar } from "@/components/ladder/avatar";
import type { LadderView } from "@/domain/ladder/model";
import { BrandMark } from "@/components/brand-mark";
import { logoutAction } from "@/app/auth-actions";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LegacyResourcesPage({ searchParams }: { searchParams: Promise<{ completed?: string }> }) {
  const user = await requireUser("/legacy");
  const { completed } = await searchParams;
  const isStaff = user.role === "teacher" || user.role === "admin";
  let recap: LadderView | null = null;
  if (completed && /^[0-9a-f-]{36}$/i.test(completed)) {
    try {
      const run = await ladderRepository.view(user, completed);
      if (run && run.items.length > 0 && run.state.choices.length === run.items.length && run.state.choices.every((choice) => choice.outcome !== "repair")) recap = run;
    } catch { /* An unavailable or unowned run must not expose another learner's recap. */ }
  }
  const activities = await listLearnerActivities(user.id);

  return (
    <main className="app-shell">
      <header className="app-header">
        <BrandMark />
        <div className="header-person">
          <span className="avatar">{user.displayName.slice(0, 2).toUpperCase()}</span>
          <span><strong>{user.displayName}</strong><small>{isStaff ? (user.role === "admin" ? "Administrator" : "Teacher") : "Learner"}</small></span>
          <form action={logoutAction}><button className="text-button" type="submit">Sign out</button></form>
        </div>
      </header>

      {recap && <section className="ladder-completion-recap" aria-label="Completed game">
        <Avatar id={recap.avatarId} paletteId={recap.avatarPalette} size={112} />
        <div><p className="eyebrow">JOURNEY COMPLETE</p><h1>{recap.title}</h1>
          <p>{recap.alias} · Your choices and replay work are saved.</p>
          <p>What became clearer when you listened again?</p>
          <Link href="/legacy/ladder?new=1" className="ladder-primary">Choose another game</Link>
        </div>
      </section>}

      <section className="dashboard-intro">
        <div><p className="eyebrow">LEGACY REHEARSE RESOURCES</p><h1>Earlier listening tools</h1>
          <p>These activities are kept for continuity. Your current course resources are in the ProTEFL Test Center.</p></div>
        <div className="quiet-stat"><span>Current course space</span><strong><Link href="/test-center">ProTEFL Test Center →</Link></strong></div>
      </section>

      <section className="ladder-dashboard-entry">
        <p className="eyebrow">LISTENING WORKSHOP</p><h2>TOEFL ITP listening workshop</h2>
        <p>Earlier teacher-led listening practice and classroom activities.</p>
        <Link href={isStaff ? "/legacy/workshop" : "/legacy/workshop/join"} className="ladder-primary">{isStaff ? "Open teacher workshop" : "Join with your teacher's PIN"} →</Link>
        {isStaff && <Link href="/legacy/classroom" className="ladder-secondary">Open classroom controls</Link>}
        {!isStaff && <Link href="/legacy/play" className="ladder-secondary">Join a classroom session</Link>}
      </section>

      <section className="ladder-dashboard-entry">
        <p className="eyebrow">LISTENING JOURNEY</p><h2>Listening ladder</h2>
        <p>Replay and reflect through the earlier guided listening activities.</p>
        <Link href="/legacy/ladder" className="ladder-primary">Open listening ladder →</Link>
        {isStaff && <Link href="/legacy/ladder/host" className="ladder-secondary">Open teacher board</Link>}
      </section>

      <section className="dashboard-section">
        <div className="section-row"><div><p className="eyebrow">ARCHIVED PRACTICE</p><h2>Listening activities</h2></div><span className="plain-count">{activities.length} activities</span></div>
        <div className="activity-list">
          {activities.map((activity) => <Link href={`/legacy/learn/${activity.slug}`} className="activity-card" key={activity.slug}>
            <div className="activity-index" aria-hidden="true">♫</div>
            <div className="activity-copy"><span>{activity.partLabel} · Individual practice</span><h3>{activity.title}</h3>
              <p>Listen, explain the meaning, then replay with a specific focus.</p>
              <div className="activity-meta"><span>Listening guidance</span><span>Notes and replay</span></div>
            </div><div className="activity-open">Open<span aria-hidden="true">↗</span></div>
          </Link>)}
          {activities.length === 0 && <p className="empty-list">No earlier listening activities are available to this account.</p>}
        </div>
      </section>

      <p><Link href="/dashboard">← Return to your workspace</Link></p>
    </main>
  );
}
