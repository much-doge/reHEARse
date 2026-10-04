import Link from "next/link";

import { listLearnerActivities } from "@/adapters/db/listening-repository";
import { logoutAction } from "@/app/auth-actions";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const roleLabel = user.role === "learner" ? "Learner" : user.role === "teacher" ? "Teacher preview" : "Admin preview";
  const activities = await listLearnerActivities(user.id);
  const active = activities.filter((activity) => activity.attempts === 0);
  const revisited = activities.filter((activity) => activity.attempts > 0);

  return (
    <main className="app-shell">
      <header className="app-header">
        <Link href="/" className="brand-mark">
          <span className="brand-pulse" />
          <span>reHEARse</span>
        </Link>
        <div className="header-person">
          <span className="avatar">{user.displayName.slice(0, 2).toUpperCase()}</span>
          <span><strong>{user.displayName}</strong><small>{roleLabel}</small></span>
          <form action={logoutAction}><button className="text-button" type="submit">Sign out</button></form>
        </div>
      </header>

      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Your listening desk</p>
          <h1>Hello, {user.displayName}.</h1>
          <p>Take your time. These activities are for noticing, not proving.</p>
        </div>
        <div className="quiet-stat">
          <span>Learning contract</span>
          <strong>No scores here</strong>
          <small>Your attempts show evidence and change, never a rank.</small>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-row">
          <div><p className="eyebrow">Ready now</p><h2>Active activities</h2></div>
          <span className="plain-count">{active.length} waiting</span>
        </div>
        <div className="activity-list">
          {active.map((activity) => (
            <Link href={`/learn/${activity.slug}`} className="activity-card" key={activity.slug}>
              <div className="activity-index">B</div>
              <div className="activity-copy">
                <span>{activity.partLabel} · Self-paced</span>
                <h3>{activity.title}</h3>
                <p>Listen, externalize what you understood, and get one useful focus for your next listen.</p>
                <div className="activity-meta"><span>English + Indonesian guidance</span><span>No score</span></div>
              </div>
              <div className="activity-open">Begin <span aria-hidden="true">↗</span></div>
            </Link>
          ))}
          {active.length === 0 && <p className="empty-list">No untouched activities. You can revisit one below whenever you like.</p>}
        </div>
      </section>

      <section className="dashboard-section past-section">
        <div className="section-row">
          <div><p className="eyebrow">Your notebook</p><h2>Completed and revisited</h2></div>
          <span className="plain-count">{revisited.length} activities</span>
        </div>
        {revisited.map((activity) => (
          <Link href={`/learn/${activity.slug}`} className="history-row" key={activity.slug}>
            <span className="history-date">{activity.attempts}<br />TRIES</span>
            <div><strong>{activity.title}</strong><p>Your earlier notes and feedback are preserved.</p></div>
            <span className="neutral-state">Revisit</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
