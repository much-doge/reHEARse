import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <Link href="/" className="brand-mark">
          <span className="brand-pulse" />
          <span>Listening Lab</span>
        </Link>
        <div className="header-person">
          <span className="prototype-chip">Prototype</span>
          <span className="avatar">AR</span>
          <span><strong>Ari</strong><small>Learner view</small></span>
        </div>
      </header>

      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Sunday listening desk</p>
          <h1>Good morning, Ari.</h1>
          <p>One active activity is waiting. Take your time; this is practice for noticing.</p>
        </div>
        <div className="quiet-stat">
          <span>Recent change</span>
          <strong>Cause → consequence</strong>
          <small>became clearer on your last relisten</small>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-row">
          <div><p className="eyebrow">Ready now</p><h2>Active activity</h2></div>
          <span className="plain-count">1 activity</span>
        </div>
        <Link href="/activities/campus-radio" className="activity-card">
          <div className="activity-index">B</div>
          <div className="activity-copy">
            <span>Campus conversation · Self-paced</span>
            <h3>A change of plans</h3>
            <p>Listen for the situation, the possible solution, and the speakers’ final actions.</p>
            <div className="activity-meta"><span>1:28 audio</span><span>English + Indonesian guidance</span></div>
          </div>
          <div className="activity-open">Begin <span aria-hidden="true">↗</span></div>
        </Link>
      </section>

      <section className="dashboard-section past-section">
        <div className="section-row">
          <div><p className="eyebrow">Your notebook</p><h2>Earlier activity</h2></div>
          <button className="text-button" type="button">View all</button>
        </div>
        <div className="history-row">
          <span className="history-date">28 SEP</span>
          <div><strong>The origin of campus traditions</strong><p>2 attempts · One relationship newly noticed</p></div>
          <span className="neutral-state">Revisited</span>
        </div>
      </section>
    </main>
  );
}

