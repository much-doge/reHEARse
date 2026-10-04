"use client";

import { useState } from "react";

import type { LearnerActivity, StoredAttempt } from "@/adapters/db/listening-repository";
import type { ListeningFeedback, ObservationKind } from "@/domain/feedback";

const labels: Record<ObservationKind, string> = {
  captured: "Captured",
  unclear: "Unclear",
  reconsider: "Reconsider",
  newly_noticed: "Newly noticed",
  insufficient_evidence: "Not enough evidence",
};

export function PersistentLearningWorkspace({ activity }: { activity: LearnerActivity }) {
  const [notes, setNotes] = useState("");
  const [reconstruction, setReconstruction] = useState("");
  const [pseudonym, setPseudonym] = useState(activity.pseudonym ?? "");
  const [attempts, setAttempts] = useState(activity.attempts);
  const [feedback, setFeedback] = useState<ListeningFeedback | null>(activity.attempts[0]?.feedback ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listenCount, setListenCount] = useState(0);

  async function submitAttempt() {
    if (!pseudonym.trim() || !reconstruction.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: activity.slug, pseudonym, notes, reconstruction }),
      });
      if (!response.ok) throw new Error("attempt_not_saved");
      const payload = await response.json() as { attempt: StoredAttempt };
      setAttempts((current) => [payload.attempt, ...current]);
      setFeedback(payload.attempt.feedback);
    } catch {
      setError("Your attempt could not be saved. Your writing is still here—please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function startRevision() {
    setFeedback(null);
    setNotes("");
    setReconstruction("");
  }

  return (
    <div className="learning-layout persistent-layout">
      <section className="listening-panel">
        <div className="activity-heading">
          <p className="eyebrow">{activity.partLabel}</p>
          <h1>{activity.title}</h1>
          <p>Listen for the whole situation. Notes may be incomplete, mixed-language, or messy.</p>
        </div>

        <div className="audio-deck real-audio">
          {activity.audioUrl ? (
            <audio controls preload="metadata" onPlay={() => setListenCount((count) => count + 1)}>
              <source src={activity.audioUrl} type="audio/mpeg" />
            </audio>
          ) : <p>Audio is not available for this activity.</p>}
          <div className="listen-count"><strong>{listenCount}</strong><span>listens now</span></div>
        </div>

        {!activity.pseudonym && (
          <label className="pseudonym-field"><span>Activity pseudonym</span><input value={pseudonym} onChange={(event) => setPseudonym(event.target.value)} maxLength={40} placeholder="e.g. Blue Comet" /><small>This name is used only inside this activity.</small></label>
        )}

        <div className="notebook-grid">
          <label className="notebook-field">
            <span><strong>Listening notes</strong><small>Catatan saat mendengarkan</small></span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Fragments, arrows, Bahasa Indonesia—anything useful…" disabled={submitting} />
          </label>
          <label className="notebook-field reconstruction-field">
            <span><strong>{activity.promptEn}</strong><small>{activity.promptId}</small></span>
            <textarea value={reconstruction} onChange={(event) => setReconstruction(event.target.value)} placeholder="Explain what you understood in your own words…" disabled={submitting} />
          </label>
        </div>

        {error && <div className="auth-error workspace-error" role="alert">{error}</div>}
        <div className="workspace-actions">
          <p><span className="privacy-dot" /> Saved as a new attempt. Earlier versions stay unchanged.</p>
          <button className="button button-primary" type="button" onClick={submitAttempt} disabled={!pseudonym.trim() || !reconstruction.trim() || submitting}>
            {submitting ? "Saving your attempt…" : "Show me what to notice"} <span aria-hidden="true">→</span>
          </button>
        </div>

        {attempts.length > 0 && (
          <section className="attempt-notebook">
            <p className="eyebrow">Attempt notebook</p>
            <h2>Your earlier reconstructions</h2>
            {attempts.map((attempt) => (
              <details key={attempt.id}>
                <summary>Attempt {attempt.attemptNumber} <span>{new Date(attempt.createdAt).toLocaleString()}</span></summary>
                <p>{attempt.reconstruction}</p>
              </details>
            ))}
          </section>
        )}
      </section>

      <aside className="feedback-panel">
        {feedback ? (
          <FeedbackView feedback={feedback} attemptNumber={attempts[0]?.attemptNumber ?? 1} onRevise={startRevision} />
        ) : (
          <div className="feedback-empty">
            <div className="empty-signal"><span /><span /><span /></div>
            <p className="eyebrow">Your next-listen signal</p>
            <h2>{submitting ? "Preserving your attempt…" : "Feedback will meet you here."}</h2>
            <p>It will describe evidence and uncertainty, then offer one bounded next-listen target.</p>
            <div className="no-score-note"><strong>No score.</strong><span>No percentage, band, rank, or proficiency estimate.</span></div>
          </div>
        )}
      </aside>
    </div>
  );
}

function FeedbackView({ feedback, attemptNumber, onRevise }: { feedback: ListeningFeedback; attemptNumber: number; onRevise: () => void }) {
  return (
    <div className="feedback-content">
      <div className="feedback-kicker"><span className="signal-icon">↗</span><span><small>Attempt {attemptNumber}</small><strong>Listening signal</strong></span></div>
      <h2>{feedback.summary.en}</h2>
      <p className="translation">{feedback.summary.id}</p>
      <div className="observations">
        {feedback.observations.map((observation, index) => (
          <article className={`observation observation-${observation.kind}`} key={`${observation.kind}-${index}`}>
            <span>{labels[observation.kind]}</span><p>{observation.message.en}</p><small>{observation.message.id}</small>
          </article>
        ))}
      </div>
      <div className="next-target"><span>Focus for your next listen</span><strong>{feedback.nextListeningTarget.en}</strong><p>{feedback.nextListeningTarget.id}</p></div>
      <button className="button relisten-button" type="button" onClick={onRevise}>Start a new attempt <span aria-hidden="true">↻</span></button>
      <p className="provider-note">Teacher-approved template feedback · live AI is not enabled</p>
    </div>
  );
}

