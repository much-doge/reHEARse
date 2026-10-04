import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-shell">
      <nav className="topbar landing-nav" aria-label="Primary navigation">
        <Link href="/" className="brand-mark" aria-label="reHEARse home">
          <span className="brand-pulse" />
          <span>reHEARse</span>
        </Link>
        <div className="landing-account">
          <Link href="/login" className="text-button">Sign in</Link>
          <span className="prototype-chip">No-score learning</span>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Build listening before testing it</p>
          <h1>Listen for meaning.<br />Notice what changed.</h1>
          <p className="hero-lede">
            A bilingual classroom space where messy notes become a starting point
            for a more purposeful next listen—not a score.
          </p>
          <div className="hero-actions">
            <Link href="/dashboard" className="button button-primary">
              Open listening desk <span aria-hidden="true">→</span>
            </Link>
            <Link href="/register" className="button button-quiet">Create learner account</Link>
          </div>
        </div>

        <div className="signal-art" aria-label="Abstract sound and note visualization">
          <div className="signal-orbit orbit-one" />
          <div className="signal-orbit orbit-two" />
          <div className="signal-card">
            <span className="signal-label">Next-listen signal</span>
            <div className="wave-bars" aria-hidden="true">
              {[18, 38, 62, 28, 76, 46, 88, 34, 58, 22, 68, 42].map((height, index) => (
                <i key={index} style={{ height }} />
              ))}
            </div>
            <p>Listen for what <em>however</em> changes in the speaker’s idea.</p>
            <small>Dengarkan perubahan gagasan setelah kata <em>however</em>.</small>
          </div>
        </div>
      </section>

      <section className="loop-section" id="loop">
        <div className="section-heading">
          <p className="eyebrow">One small, repeatable loop</p>
          <h2>No grades hiding in the furniture.</h2>
        </div>
        <ol className="loop-grid">
          <li><span>01</span><strong>Listen</strong><p>Hear the whole situation before chasing test answers.</p></li>
          <li><span>02</span><strong>Externalize</strong><p>Jot fragments, arrows, Indonesian, or whatever helps you think.</p></li>
          <li><span>03</span><strong>Notice</strong><p>See what your reconstruction evidences, contradicts, or leaves uncertain.</p></li>
          <li><span>04</span><strong>Relisten</strong><p>Return with one precise attention target and revise your understanding.</p></li>
        </ol>
      </section>
    </main>
  );
}
