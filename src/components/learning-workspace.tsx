"use client";

import { useEffect, useRef, useState } from "react";

import type { ListeningFeedback, ObservationKind } from "@/domain/feedback";

type Activity = {
  id: string;
  eyebrow: string;
  title: string;
  prompt: string;
  promptId: string;
  duration: string;
  listens: number;
  syntheticScript: string;
};

const observationLabels: Record<ObservationKind, string> = {
  captured: "Captured",
  unclear: "Unclear",
  reconsider: "Reconsider",
  newly_noticed: "Newly noticed",
  insufficient_evidence: "Not enough evidence",
};

export function LearningWorkspace({ activity, feedback }: { activity: Activity; feedback: ListeningFeedback }) {
  const [notes, setNotes] = useState("");
  const [reconstruction, setReconstruction] = useState("");
  const [listenCount, setListenCount] = useState(activity.listens);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<"writing" | "reviewing" | "feedback">("writing");
  const reviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (reviewTimer.current) clearTimeout(reviewTimer.current);
    };
  }, []);

  function toggleAudio() {
    if (!("speechSynthesis" in window)) return;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(activity.syntheticScript);
    utterance.lang = "en-US";
    utterance.rate = 0.94;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
    setListenCount((count) => count + 1);
    setIsPlaying(true);
  }

  function requestFeedback() {
    if (!reconstruction.trim()) return;
    setPhase("reviewing");
    reviewTimer.current = setTimeout(() => setPhase("feedback"), 850);
  }

  function relisten() {
    setPhase("writing");
    toggleAudio();
  }

  return (
    <div className="learning-layout">
      <section className="listening-panel">
        <div className="activity-heading">
          <p className="eyebrow">{activity.eyebrow}</p>
          <h1>{activity.title}</h1>
          <p>First, listen for the whole situation. Your notes can be incomplete, mixed-language, or messy.</p>
        </div>

        <div className={`audio-deck ${isPlaying ? "is-playing" : ""}`}>
          <button className="play-button" type="button" onClick={toggleAudio} aria-label={isPlaying ? "Pause sample audio" : "Play sample audio"}>
            {isPlaying ? "Ⅱ" : "▶"}
          </button>
          <div className="audio-track">
            <div className="audio-track-top"><strong>{isPlaying ? "Listening…" : "Ready to listen"}</strong><span>{activity.duration}</span></div>
            <div className="mini-wave" aria-hidden="true">
              {[16, 30, 22, 40, 27, 48, 33, 19, 44, 25, 37, 17, 46, 28, 39, 22, 34, 15, 28, 20].map((height, index) => <i key={index} style={{ height }} />)}
            </div>
            <small>Synthetic voice for prototype review · Real activities use private uploaded audio</small>
          </div>
          <div className="listen-count"><strong>{listenCount}</strong><span>listens</span></div>
        </div>

        <div className="notebook-grid">
          <label className="notebook-field">
            <span><strong>Listening notes</strong><small>Catatan saat mendengarkan</small></span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="names? → schedule conflict / morning group maybe / email…" disabled={phase !== "writing"} />
          </label>
          <label className="notebook-field reconstruction-field">
            <span><strong>{activity.prompt}</strong><small>{activity.promptId}</small></span>
            <textarea value={reconstruction} onChange={(event) => setReconstruction(event.target.value)} placeholder="Explain what you understood in your own words…" disabled={phase !== "writing"} />
          </label>
        </div>

        <div className="workspace-actions">
          <p><span className="privacy-dot" /> Your attempt is private to you and your teacher.</p>
          <button className="button button-primary" type="button" onClick={requestFeedback} disabled={!reconstruction.trim() || phase !== "writing"}>
            Show me what to notice <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      <aside className={`feedback-panel phase-${phase}`} aria-live="polite">
        {phase === "writing" && (
          <div className="feedback-empty">
            <div className="empty-signal"><span /><span /><span /></div>
            <p className="eyebrow">Your next-listen signal</p>
            <h2>Feedback will meet you here.</h2>
            <p>It will describe what your reconstruction shows, what remains uncertain, and one useful focus for your next listen.</p>
            <div className="no-score-note"><strong>No score.</strong><span>No hidden percentage, band, or proficiency estimate.</span></div>
          </div>
        )}

        {phase === "reviewing" && (
          <div className="feedback-loading">
            <div className="listening-loader"><i /><i /><i /><i /><i /></div>
            <p className="eyebrow">Reading the evidence</p>
            <h2>Finding one useful next step…</h2>
            <p>Prototype feedback uses a fixed fixture. The live adapter will validate the same bilingual contract.</p>
          </div>
        )}

        {phase === "feedback" && (
          <div className="feedback-content">
            <div className="feedback-kicker"><span className="signal-icon">↗</span><span><small>Attempt 1</small><strong>Listening signal</strong></span></div>
            <h2>{feedback.summary.en}</h2>
            <p className="translation">{feedback.summary.id}</p>
            <div className="observations">
              {feedback.observations.map((observation, index) => (
                <article className={`observation observation-${observation.kind}`} key={`${observation.kind}-${index}`}>
                  <span>{observationLabels[observation.kind]}</span>
                  <p>{observation.message.en}</p>
                  <small>{observation.message.id}</small>
                </article>
              ))}
            </div>
            <div className="next-target">
              <span>Focus for listen {listenCount + 1}</span>
              <strong>{feedback.nextListeningTarget.en}</strong>
              <p>{feedback.nextListeningTarget.id}</p>
            </div>
            <button className="button relisten-button" type="button" onClick={relisten}>Relisten with this focus <span aria-hidden="true">↻</span></button>
            <p className="provider-note">Fixed prototype feedback · not a live AI review</p>
          </div>
        )}
      </aside>
    </div>
  );
}

