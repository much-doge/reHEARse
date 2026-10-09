import Link from "next/link";
import "@/components/ladder/board.css";
import { ladderRepository } from "@/adapters/ladder/postgres-ladder";
import { Avatar } from "@/components/ladder/avatar";
import type { LadderView } from "@/domain/ladder/model";

import { listLearnerActivities } from "@/adapters/db/listening-repository";
import { logoutAction } from "@/app/auth-actions";
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

      {recap && <section className="ladder-completion-recap" aria-label="Completed game / Permainan selesai">
        <Avatar id={recap.avatarId} paletteId={recap.avatarPalette} size={112} />
        <div><p className="eyebrow">JOURNEY COMPLETE / PERJALANAN SELESAI</p>
          <h1>{recap.title}</h1><p>{recap.alias} · Your choices and replay work are saved.<br />Pilihan dan hasil dengar ulangmu sudah tersimpan.</p>
          <p>What became clearer when you listened again?<br />Apa yang jadi lebih jelas setelah kamu dengar lagi?</p>
          <Link href="/ladder?new=1" className="ladder-primary">Choose another game / Pilih permainan lain →</Link>
        </div>
      </section>}
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
        <Link href={recap ? "/ladder?new=1" : "/ladder"} className="ladder-primary">
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
