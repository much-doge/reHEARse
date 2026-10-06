"use client";

import { useRef, useState } from "react";
import {
  saveWithConfirmation,
  confirmAttempt,
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
  captured: "Meaning identified / Makna yang dikenali",
  unclear: "Needs clarification / Perlu diperjelas",
  reconsider: "Check on replay / Periksa saat mendengar ulang",
  newly_noticed: "New detail / Detail baru",
  insufficient_evidence: "More detail needed / Perlu detail tambahan",
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
      } else setError(attemptSaveError("confirmation_unavailable"));
    } catch {
      setError(attemptSaveError("confirmation_unavailable"));
    } finally {
      setChecking(false);
    }
  }

  async function submitAttempt() {
    if (
      !canSubmit ||
      !pseudonym.trim() ||
      !reconstruction.trim() ||
      submitting ||
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

        {!canSubmit && (
          <p role="note" className="auth-error">
            Teacher and administrator preview. Listen to the audio and review
            the prompts here. To save responses and receive feedback, sign in
            with a learner account. / Pratinjau guru dan administrator.
            Dengarkan audio dan tinjau pertanyaan di sini. Untuk menyimpan
            jawaban dan memperoleh umpan balik, masuk dengan akun peserta.
          </p>
        )}

        {canSubmit && !activity.pseudonym && (
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
              placeholder="Explain the conversation in your own words. / Jelaskan percakapan dengan kata-katamu sendiri."
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
              compare it with earlier practice. / Setiap jawaban disimpan agar
              dapat dibandingkan dengan latihan sebelumnya.
            </p>
            <button
              className="button button-primary"
              type="button"
              onClick={submitAttempt}
              disabled={
                !pseudonym.trim() ||
                !reconstruction.trim() ||
                submitting ||
                checking
              }
            >
              {submitting
                ? "Saving… / Menyimpan…"
                : "Save and get feedback / Simpan dan lihat umpan balik"}{" "}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

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
        {submitting ? (
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
            <p className="eyebrow">Response saved / Jawaban tersimpan</p>
            <h2>Your response is safe. / Jawabanmu sudah tersimpan.</h2>
            <p>
              Feedback isn’t available yet. You can replay the audio and check
              again. / Umpan balik belum tersedia. Kamu bisa memutar audio lagi
              lalu memeriksa kembali.
            </p>
            <button
              className="button button-primary"
              type="button"
              onClick={checkFeedback}
              disabled={checking}
            >
              {checking
                ? "Checking… / Memeriksa…"
                : "Check feedback / Periksa umpan balik"}
            </button>
          </div>
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
              {canSubmit
                ? "Save your response to receive feedback and a specific focus for replay. / Simpan jawaban untuk memperoleh umpan balik dan fokus dengar ulang."
                : "Learners receive feedback on their saved responses and a focus for the next listen. / Peserta memperoleh umpan balik atas jawaban yang disimpan dan fokus untuk menyimak kembali."}
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
