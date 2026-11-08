import Link from "next/link";
import "@/components/ladder/board.css";
import { ladderRepository } from "@/adapters/ladder/postgres-ladder";
import { Avatar } from "@/components/ladder/avatar";
import type { LadderView } from "@/domain/ladder/model";

import { listLearnerActivities } from "@/adapters/db/listening-repository";
import { logoutAction } from "@/app/auth-actions";
import { BrandMark } from "@/components/brand-mark";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ completed?: string }> }) {
  const user = await requireUser();
  const { completed } = await searchParams;
  let recap: LadderView | null = null;
  if (completed && /^[0-9a-f-]{36}$/i.test(completed)) {
    try {
      const run = await ladderRepository.view(user, completed);
      if (run && run.items.length > 0 && run.state.choices.length === run.items.length && run.state.choices.every((choice) => choice.outcome !== "repair")) recap = run;
    } catch { /* An unavailable or unowned run must not expose another learner's recap. */ }
  }
  const roleLabel =
    user.role === "learner"
      ? "Learner"
      : user.role === "teacher"
        ? "Teacher"
        : "Administrator";
  const activities = await listLearnerActivities(user.id);
  const active = activities.filter((activity) => activity.attempts === 0);
  const revisited = activities.filter((activity) => activity.attempts > 0);

  return (
    <main className="app-shell">
      <header className="app-header">
        <BrandMark />
        <div className="header-person">
          <span className="avatar">
            {user.displayName.slice(0, 2).toUpperCase()}
          </span>
          <span>
            <strong>{user.displayName}</strong>
            <small>{roleLabel}</small>
          </span>
          <form action={logoutAction}>
            <button className="text-button" type="submit">
              Sign out</button>
          </form>
        </div>
      </header>

      {recap && <section className="ladder-completion-recap" aria-label="Completed game">
        <Avatar id={recap.avatarId} paletteId={recap.avatarPalette} size={112} />
        <div><p className="eyebrow">JOURNEY COMPLETE</p>
          <h1>{recap.title}</h1><p>{recap.alias} · Your choices and replay work are saved.</p>
          <p>What became clearer when you listened again?</p>
          <Link href="/ladder?new=1" className="ladder-primary">Choose another game</Link>
        </div>
      </section>}
      <p>
        <Link href={user.role === "learner" ? "/play" : "/classroom"}>
          Classroom sessions</Link>
      </p>
      <section className="ladder-dashboard-entry">
        <p className="eyebrow">ProTEFL Test Center · Supervised pilot</p>
        <h2>Listening test — Form 2000-10</h2>
        <p>Complete the 50-item Parts A–C listening form, review your raw item outcomes, then retry only missed items.</p>
        <Link href="/test-center/listening/2000-10" className="ladder-primary">
          Open the listening test</Link>
      </section>
      <section className="ladder-dashboard-entry">
        <p className="eyebrow">TOEFL ITP Listening · Parts A–C</p>
        <h2>TOEFL ITP listening workshop</h2>
        <p>Teacher-led practice with the original recordings and A–D choices. The teacher selects Part A or Parts B/C.</p>
        <Link href={user.role === "learner" ? "/workshop/join" : "/workshop"} className="ladder-primary">
          {user.role === "learner" ? "Join with your teacher's PIN" : "Open the teacher workshop"} →
        </Link>
      </section>
      <section className="ladder-dashboard-entry">
        <p className="eyebrow">A listening journey</p>
        <h2>Listen, take a detour, find a way forward.</h2>

        <Link href={recap ? "/ladder?new=1" : "/ladder"} className="ladder-primary">
          Play the listening ladder</Link>
        {user.role !== "learner" && (
          <Link href="/ladder/host" className="ladder-secondary">
            Open the live class board</Link>
        )}
      </section>
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Listening practice</p>
          <h1>Hello, {user.displayName}.</h1>
          <p>
            Listen, take notes, and use the feedback to guide your next listen.
            </p>
        </div>
        <div className="quiet-stat">
          <span>Practice sequence</span>
          <strong>Listen · Summarize · Replay</strong>

        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-row">
          <div>
            <p className="eyebrow">Choose an activity</p>
            <h2>Listening activities</h2>
          </div>
          <span className="plain-count">
            {active.length} activities</span>
        </div>
        <div className="activity-list">
          {active.map((activity) => (
            <Link
              href={`/learn/${activity.slug}`}
              className="activity-card"
              key={activity.slug}
            >
              <div className="activity-index" aria-hidden="true">
                ♫
              </div>
              <div className="activity-copy">
                <span>
                  {activity.partLabel} · Individual practice</span>
                <h3>{activity.title}</h3>
                <p>
                  Listen, explain the meaning, then replay with a specific
                  focus.
                  </p>
                <div className="activity-meta">
                  <span>
                    Listening guidance</span>
                  <span>Notes and replay</span>
                </div>
              </div>
              <div className="activity-open">
                Open<span aria-hidden="true">↗</span>
              </div>
            </Link>
          ))}
          {active.length === 0 && (
            <p className="empty-list">
              You have tried every activity. Choose one below to listen again.
            </p>
          )}
        </div>
      </section>

      <section className="dashboard-section past-section">
        <div className="section-row">
          <div>
            <p className="eyebrow">Practice history</p>
            <h2>Previous practice</h2>
          </div>
          <span className="plain-count">{revisited.length} activities</span>
        </div>
        {revisited.map((activity) => (
          <Link
            href={`/learn/${activity.slug}`}
            className="history-row"
            key={activity.slug}
          >
            <span className="history-date">
              {activity.attempts}
              <br />
              RESPONSES</span>
            <div>
              <strong>{activity.title}</strong>
              <p>
                Review your notes and feedback, then listen again.</p>
            </div>
            <span className="neutral-state">
              Listen again</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
