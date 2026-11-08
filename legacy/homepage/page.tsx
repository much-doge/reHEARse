import Link from "next/link";

import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const user = await currentUser();
  return (
    <main className="landing-shell">
      <nav className="topbar landing-nav" aria-label="Primary navigation">
        <Link href="/" className="brand-mark" aria-label="reHEARse home">
          <span className="brand-pulse" />
          <span>reHEARse</span>
        </Link>
        <div className="landing-account">
          <Link
            href={user && user.role !== "learner" ? "/classroom" : "/play"}
            className="text-button"
          >
            Classroom</Link>
          <Link href={user ? "/dashboard" : "/login"} className="text-button">
            {user ? "My activities" : "Sign in"}
          </Link>
          <span className="prototype-chip">
            Listening practice</span>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Listening practice</p>
          <h1>
            Listen for meaning.
            <br />
            Build your understanding.
          </h1>
          <p className="hero-lede">
            Listen to a conversation, record what you understood, and replay
            with a clear focus.
            </p>
          <div className="hero-actions">
            <Link href="/dashboard" className="button button-primary">
              Open practice<span aria-hidden="true">→</span>
            </Link>
            <Link
              href={user ? "/ladder" : "/register"}
              className="button button-quiet"
            >
              {user
                ? "Play the listening ladder"
                : "Create account"}
            </Link>
          </div>
        </div>

        <div
          className="signal-art"
          aria-label="Abstract sound and note visualization"
        >
          <div className="signal-orbit orbit-one" />
          <div className="signal-orbit orbit-two" />
          <div className="signal-card">
            <span className="signal-label">
              Listening focus</span>
            <div className="wave-bars" aria-hidden="true">
              {[18, 38, 62, 28, 76, 46, 88, 34, 58, 22, 68, 42].map(
                (height, index) => (
                  <i key={index} style={{ height }} />
                ),
              )}
            </div>
            <p>
              Listen for what <em>however</em> changes in the speaker’s idea.
            </p>
          </div>
        </div>
      </section>

      <section className="loop-section" id="loop">
        <div className="section-heading">
          <p className="eyebrow">Practice sequence</p>
          <h2>Listen, reflect, and listen again.</h2>
        </div>
        <ol className="loop-grid">
          <li>
            <span>01</span>
            <strong>Listen</strong>
            <p>
              Identify the situation and the speakers’ purpose.
            </p>
          </li>
          <li>
            <span>02</span>
            <strong>Take notes</strong>
            <p>
              Record key ideas in words or a simple diagram.
            </p>
          </li>
          <li>
            <span>03</span>
            <strong>Reflect</strong>
            <p>
              Compare your interpretation with the feedback.
              </p>
          </li>
          <li>
            <span>04</span>
            <strong>Replay</strong>
            <p>
              Listen for a specific detail, then revise your explanation.
              </p>
          </li>
        </ol>
      </section>
    </main>
  );
}
