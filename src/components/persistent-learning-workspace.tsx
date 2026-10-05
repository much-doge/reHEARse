"use client";

import { useState } from "react";

import type {
  LearnerActivity,
  StoredAttempt,
} from "@/adapters/db/listening-repository";
import type { ListeningFeedback, ObservationKind } from "@/domain/feedback";

const labels: Record<ObservationKind, string> = {
  captured: "Meaning identified / Makna yang dikenali",
  unclear: "Needs clarification / Perlu diperjelas",
  reconsider: "Check on replay / Periksa saat mendengar ulang",
  newly_noticed: "New detail / Detail baru",
  insufficient_evidence: "More detail needed / Perlu detail tambahan",
};

export function PersistentLearningWorkspace({
  activity,
}: {
  activity: LearnerActivity;
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
        body: JSON.stringify({
          slug: activity.slug,
          pseudonym,
          notes,
          reconstruction,
        }),
      });
      if (!response.ok) throw new Error("attempt_not_saved");
      const payload = (await response.json()) as { attempt: StoredAttempt };
      setAttempts((current) => [payload.attempt, ...current]);
      setFeedback(payload.attempt.feedback);
      setFeedbackStatus(payload.attempt.feedbackStatus);
      setFeedbackProvider(payload.attempt.feedbackProvider);
    } catch {
      setError(
        "Your response could not be saved. Your text is still here; please try again. / Jawaban belum dapat disimpan. Teks tetap tersedia; coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startRevision() {
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
            / Dengarkan situasi, masalah, dan maksud para pembicara.
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
              Audio is temporarily unavailable. Please return later. / Audio
              sementara tidak tersedia. Silakan kembali nanti.
            </p>
          )}
          <div className="listen-count">
            <strong>{listenCount}</strong>
            <span>plays / pemutaran</span>
          </div>
        </div>

        {!activity.pseudonym && (
          <label className="pseudonym-field">
            <span>Activity name / Nama untuk aktivitas ini</span>
            <input
              value={pseudonym}
              onChange={(event) => setPseudonym(event.target.value)}
              maxLength={40}
              placeholder="Choose a nickname / Pilih nama panggilan"
            />
            <small>
              This nickname appears only in this activity. / Nama panggilan
              hanya digunakan dalam aktivitas ini.
            </small>
          </label>
        )}

        <div className="notebook-grid">
          <label className="notebook-field">
            <span>
              <strong>Listening notes</strong>
              <small>Catatan saat mendengarkan</small>
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Note key ideas in English or Indonesian. / Catat gagasan utama dalam bahasa Inggris atau Indonesia."
              disabled={submitting}
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
              placeholder="Explain the conversation in your own words. / Jelaskan percakapan dengan kata-katamu sendiri."
              disabled={submitting}
            />
          </label>
        </div>

        {error && (
          <div className="auth-error workspace-error" role="alert">
            {error}
          </div>
        )}
        <div className="workspace-actions">
          <p>
            <span className="privacy-dot" /> Each response is saved so you can
            compare it with earlier practice. / Setiap jawaban disimpan agar
            dapat dibandingkan dengan latihan sebelumnya.
          </p>
          <button
            className="button button-primary"
            type="button"
            onClick={submitAttempt}
            disabled={!pseudonym.trim() || !reconstruction.trim() || submitting}
          >
            {submitting
              ? "Saving… / Menyimpan…"
              : "Save and get feedback / Simpan dan lihat umpan balik"}{" "}
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {attempts.length > 0 && (
          <section className="attempt-notebook">
            <p className="eyebrow">Practice history / Riwayat latihan</p>
            <h2>Previous responses / Jawaban sebelumnya</h2>
            {attempts.map((attempt) => (
              <details key={attempt.id}>
                <summary>
                  Response / Jawaban {attempt.attemptNumber}{" "}
                  <span>{new Date(attempt.createdAt).toLocaleString()}</span>
                </summary>
                <p>{attempt.reconstruction}</p>
              </details>
            ))}
          </section>
        )}
      </section>

      <aside className="feedback-panel">
        {feedback ? (
          <FeedbackView
            feedback={feedback}
            attemptNumber={attempts[0]?.attemptNumber ?? 1}
            provider={feedbackProvider}
            onRevise={startRevision}
          />
        ) : feedbackStatus === "failed" ? (
          <div className="feedback-empty">
            <div className="empty-signal">
              <span />
              <span />
              <span />
            </div>
            <p className="eyebrow">Response saved / Jawaban tersimpan</p>
            <h2>
              Feedback is temporarily unavailable. / Umpan balik sementara tidak
              tersedia.
            </h2>
            <p>
              Your notes and response have been saved. You can return to them
              while feedback is unavailable.
            </p>
            <p className="translation">
              Catatan dan jawabanmu telah disimpan. Kamu dapat membukanya
              kembali selama umpan balik belum tersedia.
            </p>
            <p>
              Replay the conversation and check one detail you are unsure about.
              <br />
              Dengarkan ulang dan periksa satu detail yang belum kamu yakini.
            </p>
            <button
              className="button relisten-button"
              type="button"
              onClick={startRevision}
            >
              Write a new response / Tulis jawaban baru{" "}
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
            <p className="eyebrow">Listening feedback / Umpan balik menyimak</p>
            <h2>
              {submitting
                ? "Saving your response… / Menyimpan jawaban…"
                : "Review your understanding. / Tinjau pemahamanmu."}
            </h2>
            <p>
              Save your response to receive feedback and a specific focus for
              replay. / Simpan jawaban untuk memperoleh umpan balik dan fokus
              dengar ulang.
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
          <small>Response / Jawaban {attemptNumber}</small>
          <strong>Listening feedback / Umpan balik menyimak</strong>
        </span>
      </div>
      <h2>{feedback.summary.en}</h2>
      <p className="translation">{feedback.summary.id}</p>
      <div className="observations">
        {feedback.observations.map((observation, index) => (
          <article
            className={`observation observation-${observation.kind}`}
            key={`${observation.kind}-${index}`}
          >
            <span>{labels[observation.kind]}</span>
            <p>{observation.message.en}</p>
            <small>{observation.message.id}</small>
          </article>
        ))}
      </div>
      <div className="next-target">
        <span>Replay focus / Fokus dengar ulang</span>
        <strong>{feedback.nextListeningTarget.en}</strong>
        <p>{feedback.nextListeningTarget.id}</p>
      </div>
      <button
        className="button relisten-button"
        type="button"
        onClick={onRevise}
      >
        Write a new response / Tulis jawaban baru{" "}
        <span aria-hidden="true">↻</span>
      </button>
      <p className="provider-note">
        {provider === "openai"
          ? "AI-assisted listening feedback. Check the suggestions against the audio. / Umpan balik menyimak berbantuan AI. Periksa saran dengan mendengarkan audio."
          : "Teacher-prepared listening guidance. / Panduan menyimak yang disiapkan guru."}
      </p>
    </div>
  );
}
