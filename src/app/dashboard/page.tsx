import Link from "next/link";

import { listLearnerActivities } from "@/adapters/db/listening-repository";
import { logoutAction } from "@/app/auth-actions";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const roleLabel =
    user.role === "learner"
      ? "Learner / Peserta"
      : user.role === "teacher"
        ? "Teacher / Guru"
        : "Administrator";
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
          <span className="avatar">
            {user.displayName.slice(0, 2).toUpperCase()}
          </span>
          <span>
            <strong>{user.displayName}</strong>
            <small>{roleLabel}</small>
          </span>
          <form action={logoutAction}>
            <button className="text-button" type="submit">
              Sign out / Keluar
            </button>
          </form>
        </div>
      </header>

      <p>
        <Link href={user.role === "learner" ? "/play" : "/classroom"}>
          Classroom sessions / Sesi kelas →
        </Link>
      </p>
      <section className="ladder-dashboard-entry">
        <p className="eyebrow">A listening journey / Perjalanan menyimak</p>
        <h2>Listen, take a detour, find a way forward.</h2>
        <p>
          Dengarkan, coba lagi di bagian yang belum jelas, lalu lanjutkan
          perjalananmu.
        </p>
        <Link href="/ladder" className="ladder-primary">
          Play the listening ladder / Main ular tangga menyimak →
        </Link>
        {user.role !== "learner" && (
          <Link href="/ladder/host" className="ladder-secondary">
            Open the live class board / Buka papan kelas langsung
          </Link>
        )}
      </section>
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Listening practice</p>
          <h1>Hello, {user.displayName}.</h1>
          <p>
            Listen, take notes, and use the feedback to guide your next listen.
            <br />
            Dengarkan, buat catatan, lalu gunakan umpan balik untuk menyimak
            kembali.
          </p>
        </div>
        <div className="quiet-stat">
          <span>Practice sequence / Urutan latihan</span>
          <strong>Listen · Summarize · Replay</strong>
          <small>Dengarkan · Ringkas · Dengarkan ulang</small>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-row">
          <div>
            <p className="eyebrow">Choose an activity</p>
            <h2>Listening activities / Aktivitas menyimak</h2>
          </div>
          <span className="plain-count">
            {active.length} activities / aktivitas
          </span>
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
                  {activity.partLabel} · Individual practice / Latihan mandiri
                </span>
                <h3>{activity.title}</h3>
                <p>
                  Listen, explain the meaning, then replay with a specific
                  focus.
                  <br />
                  Dengarkan, jelaskan maknanya, lalu dengarkan ulang dengan
                  fokus tertentu.
                </p>
                <div className="activity-meta">
                  <span>
                    Guidance in English and Indonesian / Panduan bahasa Inggris
                    dan Indonesia
                  </span>
                  <span>Notes and replay / Catatan dan dengar ulang</span>
                </div>
              </div>
              <div className="activity-open">
                Open / Buka <span aria-hidden="true">↗</span>
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
            <h2>Previous practice / Latihan sebelumnya</h2>
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
              RESPONSES / JAWABAN
            </span>
            <div>
              <strong>{activity.title}</strong>
              <p>
                Review your notes and feedback, then listen again. / Tinjau
                catatan dan umpan balik, lalu dengarkan ulang.
              </p>
            </div>
            <span className="neutral-state">
              Listen again / Dengarkan ulang
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
