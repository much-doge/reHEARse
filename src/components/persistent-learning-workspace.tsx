"use client";

import { useRef, useState } from "react";
import {
  saveWithConfirmation,
  confirmAttempt,
  requestAttemptFeedback,
  AttemptSaveFailure,
} from "./attempt-confirmation";
import { attemptSaveError } from "./attempt-save-error";
import { FeedbackWait } from "./feedback-wait";

import type {
  LearnerActivity,
  StoredAttempt,
} from "@/adapters/db/listening-repository";
import type { ListeningFeedback, ObservationKind } from "@/domain/feedback";

const labels: Record<ObservationKind, string> = {
  captured: "Meaning identified",
  unclear: "Needs clarification",
  reconsider: "Check on replay",
  newly_noticed: "New detail",
  insufficient_evidence: "More detail needed",
};

export function PersistentLearningWorkspace({
  activity,
  canSubmit,
}: {
  activity: LearnerActivity;
  canSubmit: boolean;
}) {
  const [notes, setNotes] = useState("");
  const [reconstruction, setReconstruction] = useState("");
  const [pseudonym, setPseudonym] = useState(activity.pseudonym ?? "");
  const [attempts, setAttempts] = useState(activity.attempts);
  const [feedback, setFeedback] = useState<ListeningFeedback | null>(
    activity.attempts[0]?.feedback ?? null,
  );
  const [feedbackStatus, setFeedbackStatus] = useState<
    StoredAttempt["feedbackStatus"]
  >(activity.attempts[0]?.feedbackStatus ?? null);
  const [feedbackProvider, setFeedbackProvider] = useState(
    activity.attempts[0]?.feedbackProvider ?? null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listenCount, setListenCount] = useState(0);
  const submission = useRef<{ fingerprint: string; key: string } | null>(null);
  const [checking, setChecking] = useState(false);
  function showAttempt(attempt: StoredAttempt) {
    setAttempts((current) => [
      attempt,
      ...current.filter((x) => x.id !== attempt.id),
    ]);
    setFeedback(attempt.feedback);
    setFeedbackStatus(attempt.feedbackStatus);
    setFeedbackProvider(attempt.feedbackProvider);
  }
  async function checkFeedback() {
    if (checking || (!submission.current && !attempts[0])) return;
    setChecking(true);
    try {
      const saved = await confirmAttempt(
        submission.current?.key ?? attempts[0].id,
        fetch,
        !submission.current,
      );
      if (saved) {
        showAttempt(saved);
        setError(null);
        if (saved.feedbackStatus === "pending") await generateFeedback(saved.id);
      } else setError(attemptSaveError("confirmation_unavailable"));
    } catch {
      setError(attemptSaveError("confirmation_unavailable"));
    } finally {
      setChecking(false);
    }
  }

  async function generateFeedback(attemptId: string) {
    setGenerating(true);
    try {
      showAttempt(await requestAttemptFeedback(attemptId));
      setError(null);
    } catch {
      setFeedbackStatus("pending");
    } finally {
      setGenerating(false);
    }
  }

  async function submitAttempt() {
    if (
      !canSubmit ||
      !pseudonym.trim() ||
      !reconstruction.trim() ||
      submitting ||
      generating ||
      checking
    )
      return;
    setSubmitting(true);
    setError(null);
    const draft = {
      slug: activity.slug,
      pseudonym: pseudonym.trim(),
      notes,
      reconstruction: reconstruction.trim(),
    };
    const fingerprint = JSON.stringify(draft);
    if (submission.current?.fingerprint !== fingerprint)
      submission.current = { fingerprint, key: crypto.randomUUID() };
    try {
      const saved = await saveWithConfirmation({
        ...draft,
        submissionKey: submission.current.key,
      });
      showAttempt(saved);
      setSubmitting(false);
      if (saved.feedbackStatus === "pending") await generateFeedback(saved.id);
    } catch (failure) {
      setError(
        attemptSaveError(
          failure instanceof AttemptSaveFailure ? failure.code : null,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startRevision() {
    submission.current = null;
    setError(null);
    setFeedback(null);
    setFeedbackStatus(null);
    setFeedbackProvider(null);
    setNotes("");
    setReconstruction("");
  }

  return (
    <div className="learning-layout persistent-layout">
      <section className="listening-panel">
        <div className="activity-heading">
          <p className="eyebrow">{activity.partLabel}</p>
          <h1>{activity.title}</h1>
          <p>
            Listen for the situation, the problem, and the speakers’ intentions.
           </p>
        </div>

        <div className="audio-deck real-audio">
          {activity.audioUrl ? (
            <audio
              controls
              preload="metadata"
              onPlay={() => setListenCount((count) => count + 1)}
            >
              <source src={activity.audioUrl} type="audio/mpeg" />
            </audio>
          ) : (
            <p>
              Audio is temporarily unavailable. Please return later.</p>
          )}
          <div className="listen-count">
            <strong>{listenCount}</strong>
            <span>plays</span>
          </div>
        </div>

        {!canSubmit && (
          <p role="note" className="auth-error">
            Teacher and administrator preview. Listen to the audio and review
            the prompts here. To save responses and receive feedback, sign in
            with a learner account.</p>
        )}

        {canSubmit && !activity.pseudonym && (
          <label className="pseudonym-field">
            <span>Activity name</span>
            <input
              value={pseudonym}
              onChange={(event) => setPseudonym(event.target.value)}
              maxLength={40}
              placeholder="Choose a nickname"
            />
            <small>
              This nickname appears only in this activity.</small>
          </label>
        )}

        <div className="notebook-grid">
          <label className="notebook-field">
            <span>
              <strong>Listening notes</strong>

            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Note the key ideas in your own words."
              disabled={submitting || !canSubmit}
              maxLength={12_000}
            />
          </label>
          <label className="notebook-field reconstruction-field">
            <span>
              <strong>{activity.promptEn}</strong>
              <small>{activity.promptId}</small>
            </span>
            <textarea
              value={reconstruction}
              onChange={(event) => setReconstruction(event.target.value)}
              placeholder="Explain the conversation in your own words."
              disabled={submitting || !canSubmit}
              maxLength={12_000}
            />
          </label>
        </div>

        {error && (
          <div className="auth-error workspace-error" role="alert">
            {error}
          </div>
        )}
        {canSubmit && (
          <div className="workspace-actions">
            <p>
              <span className="privacy-dot" /> Each response is saved so you can
              compare it with earlier practice.</p>
            <button
              className="button button-primary"
              type="button"
              onClick={submitAttempt}
              disabled={
                !pseudonym.trim() ||
                !reconstruction.trim() ||
                submitting ||
                generating ||
                checking
              }
            >
              {submitting
                ? "Saving…"
                : "Save and get feedback"}{" "}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

        {attempts.length > 0 && (
          <section className="attempt-notebook">
            <p className="eyebrow">Practice history</p>
            <h2>Previous responses</h2>
            {attempts.map((attempt) => (
              <details key={attempt.id}>
                <summary>
                  Response {attempt.attemptNumber}{" "}
                  <span>{new Date(attempt.createdAt).toLocaleString()}</span>
                </summary>
                <p>{attempt.reconstruction}</p>
              </details>
            ))}
          </section>
        )}
      </section>

      <aside className="feedback-panel">
        {submitting || generating ? (
          <FeedbackWait />
        ) : feedback ? (
          <FeedbackView
            feedback={feedback}
            attemptNumber={attempts[0]?.attemptNumber ?? 1}
            provider={feedbackProvider}
            onRevise={startRevision}
          />
        ) : feedbackStatus === "pending" ? (
          <div className="feedback-empty">
            <p className="eyebrow">Response saved</p>
            <h2>Your response is safe.</h2>
            <p>
              Feedback isn’t available yet. You can replay the audio and check
              again.</p>
            <button
              className="button button-primary"
              type="button"
              onClick={checkFeedback}
              disabled={checking}
            >
              {checking
                ? "Checking…"
                : "Check feedback"}
            </button>
          </div>
        ) : feedbackStatus === "failed" ? (
          <div className="feedback-empty">
            <div className="empty-signal">
              <span />
              <span />
              <span />
            </div>
            <p className="eyebrow">Response saved</p>
            <h2>
              Feedback is temporarily unavailable.</h2>
            <p>
              Your notes and response have been saved. You can return to them
              while feedback is unavailable.
            </p>

            <p>
              Replay the conversation and check one detail you are unsure about.
              </p>
            <button
              className="button relisten-button"
              type="button"
              onClick={startRevision}
            >
              Write a new response{" "}
              <span aria-hidden="true">↻</span>
            </button>
          </div>
        ) : (
          <div className="feedback-empty">
            <div className="empty-signal">
              <span />
              <span />
              <span />
            </div>
            <p className="eyebrow">Listening feedback</p>
            <h2>
              {submitting
                ? "Saving your response…"
                : "Review your understanding."}
            </h2>
            <p>
              {canSubmit
                ? "Save your response to receive feedback and a specific focus for replay."
                : "Learners receive feedback on their saved responses and a focus for the next listen."}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function FeedbackView({
  feedback,
  attemptNumber,
  provider,
  onRevise,
}: {
  feedback: ListeningFeedback;
  attemptNumber: number;
  provider: string | null;
  onRevise: () => void;
}) {
  return (
    <div className="feedback-content">
      <div className="feedback-kicker">
        <span className="signal-icon">↗</span>
        <span>
          <small>Response {attemptNumber}</small>
          <strong>Listening feedback</strong>
        </span>
      </div>
      <h2>{feedback.summary.en}</h2>
      <div className="observations">
        {feedback.observations.map((observation, index) => (
          <article
            className={`observation observation-${observation.kind}`}
            key={`${observation.kind}-${index}`}
          >
            <span>{labels[observation.kind]}</span>
            <p>{observation.message.en}</p>
          </article>
        ))}
      </div>
      <div className="next-target">
        <span>Replay focus</span>
        <strong>{feedback.nextListeningTarget.en}</strong>
      </div>
      <button
        className="button relisten-button"
        type="button"
        onClick={onRevise}
      >
        Write a new response{" "}
        <span aria-hidden="true">↻</span>
      </button>
      <p className="provider-note">
        {provider === "openai"
          ? "AI-assisted listening feedback. Check the suggestions against the audio."
          : "Teacher-prepared listening guidance."}
      </p>
    </div>
  );
}
