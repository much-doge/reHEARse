"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ListeningAction, ListeningView, Option } from "@protefl/domain/listening";
import { serverNowAt } from "./server-clock";

const options: Option[] = ["A", "B", "C", "D"];

async function mutate(action: ListeningAction): Promise<ListeningView> {
  const response = await fetch("/api/test-center/listening", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  });
  const payload = (await response.json()) as { view?: ListeningView; error?: string };
  if (!response.ok || !payload.view) throw new Error(payload.error ?? "test_center_unavailable");
  return payload.view;
}

const errorCopy: Record<string, string> = {
  answer_closed: "The response window has closed. Refreshing the item…",
  answer_not_open: "Wait until the recording finishes.",
  refresh_required: "This attempt changed in another tab. Refreshing…",
  test_center_unavailable: "The test could not be reached. Your accepted answers are still saved.",
};

export function ListeningTest({ initial, learnerName }: { initial: ListeningView; learnerName: string }) {
  const [view, setView] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(() => new Date(initial.serverTime).getTime());
  const audioRef = useRef<HTMLAudioElement>(null);
  const timeoutSent = useRef<string | null>(null);
  const current = view.attempt?.current;

  const acceptView = useCallback((next: ListeningView) => {
    setView(next);
    setNow(new Date(next.serverTime).getTime());
  }, []);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/test-center/listening", { cache: "no-store" });
    const payload = (await response.json()) as { view?: ListeningView };
    if (response.ok && payload.view) acceptView(payload.view);
  }, [acceptView]);

  const act = useCallback(async (action: ListeningAction) => {
    setBusy(true);
    setMessage("");
    try {
      const next = await mutate(action);
      acceptView(next);
      return next;
    } catch (error) {
      const code = error instanceof Error ? error.message : "test_center_unavailable";
      setMessage(errorCopy[code] ?? errorCopy.test_center_unavailable);
      if (["answer_closed", "refresh_required", "item_changed"].includes(code)) await refresh();
      return null;
    } finally {
      setBusy(false);
    }
  }, [acceptView, refresh]);

  useEffect(() => {
    if (!current?.deadline) return;
    const anchor = performance.now();
    const timer = window.setInterval(
      () => setNow(serverNowAt(view.serverTime, anchor, performance.now())),
      100,
    );
    return () => window.clearInterval(timer);
  }, [current?.deadline, view.serverTime]);

  const deadlineMs = current?.deadline ? new Date(current.deadline).getTime() : null;
  const opensMs = current?.answerOpensAt ? new Date(current.answerOpensAt).getTime() : null;
  const remainingMs = deadlineMs === null ? null : Math.max(0, deadlineMs - now);
  const canChoose = !!current?.startedAt && opensMs !== null && now >= opensMs && (remainingMs ?? 0) > 0;

  useEffect(() => {
    if (!current || !view.attempt || deadlineMs === null || remainingMs !== 0) return;
    if (timeoutSent.current === current.id) return;
    timeoutSent.current = current.id;
    void act({
      kind: "timeout",
      key: crypto.randomUUID(),
      attemptId: view.attempt.id,
      revision: view.attempt.revision,
      itemId: current.id,
    });
  }, [act, current, deadlineMs, remainingMs, view.attempt]);

  async function start(mode: "full" | "remedial") {
    const attempt = view.attempt;
    await act(
      mode === "full"
        ? { kind: "start", key: crypto.randomUUID(), mode }
        : { kind: "start", key: crypto.randomUUID(), mode, parentAttemptId: attempt!.id },
    );
  }

  async function play() {
    if (!view.attempt || !current || !audioRef.current) return;
    setBusy(true);
    setMessage("");
    try {
      if (current.startedAt) {
        const elapsedSeconds = Math.max(0, (now - new Date(current.startedAt).getTime()) / 1000);
        audioRef.current.currentTime = Math.min(elapsedSeconds, current.durationMs / 1000 - 0.1);
        await audioRef.current.play();
        setPlaying(true);
        return;
      }
      await audioRef.current.play();
      setPlaying(true);
      const next = await mutate({
        kind: "listen_start",
        key: crypto.randomUUID(),
        attemptId: view.attempt.id,
        revision: view.attempt.revision,
        itemId: current.id,
      });
      acceptView(next);
    } catch (error) {
      audioRef.current.pause();
      const code = error instanceof Error ? error.message : "test_center_unavailable";
      setMessage(errorCopy[code] ?? "Audio could not start. Try once more.");
    } finally {
      setBusy(false);
    }
  }

  async function choose(choice: Option) {
    if (!view.attempt || !current || !canChoose) return;
    await act({
      kind: "choose",
      key: crypto.randomUUID(),
      attemptId: view.attempt.id,
      revision: view.attempt.revision,
      itemId: current.id,
      choice,
    });
  }

  if (!view.attempt) {
    return (
      <section className="ptc-intro">
        <div className="ptc-kicker">Listening comprehension · Form 2000-10</div>
        <h1>50 questions. One uninterrupted listening run.</h1>
        <p className="ptc-lead">This is a closed classroom pilot for {learnerName}. Use headphones and choose a quiet place before you begin.</p>
        <div className="ptc-rules">
          <article><strong>Parts A–C</strong><span>Short conversations, longer conversations, and talks.</span></article>
          <article><strong>One play per item</strong><span>The recording cannot be replayed during the main run.</span></article>
          <article><strong>12 seconds</strong><span>Choose A, B, C, or D after the recording ends.</span></article>
        </div>
        <div className="ptc-notice"><strong>Pilot notice</strong><br />This is not an official TOEFL administration or converted TOEFL score. After submitting, you will see the raw item outcomes and can retry only missed items.</div>
        {message && <p className="ptc-error" role="alert">{message}</p>}
        <button className="ptc-primary" disabled={busy} onClick={() => void start("full")}>Begin the listening test</button>
      </section>
    );
  }

  if (view.attempt.status === "submitted" && view.attempt.result) {
    const result = view.attempt.result;
    return (
      <section className="ptc-results">
        <div className="ptc-kicker">Attempt submitted</div>
        <h1>{view.attempt.kind === "remedial" ? "Remedial review complete" : "Listening test complete"}</h1>
        <p>Your response record is locked. Review each item below before deciding whether to retry missed items.</p>
        <div className="ptc-totals" aria-label="Raw outcome counts">
          <div className="correct"><strong>{result.correct}</strong><span>Correct</span></div>
          <div className="wrong"><strong>{result.wrong}</strong><span>Wrong or omitted</span></div>
          <div><strong>{result.omitted}</strong><span>Omitted</span></div>
        </div>
        {result.canRemediate && (
          <button className="ptc-primary" disabled={busy} onClick={() => void start("remedial")}>
            Retry {result.wrong} missed item{result.wrong === 1 ? "" : "s"}</button>
        )}
        {message && <p className="ptc-error" role="alert">{message}</p>}
        <div className="ptc-review">
          {result.items.map((item) => (
            <article className={item.correct ? "is-correct" : "is-wrong"} key={item.number}>
              <header><strong>{item.number}</strong><span>Part {item.part}</span><b>{item.correct ? "Correct" : item.choice ? "Wrong" : "Omitted"}</b></header>
              <div className="ptc-review-options">
                {options.map((letter) => (
                  <p className={letter === item.answer ? "answer" : letter === item.choice ? "choice" : ""} key={letter}>
                    <span>{letter}</span>{item.options[letter]}
                    {letter === item.answer && <em>Correct answer</em>}
                    {letter === item.choice && letter !== item.answer && <em>Your choice</em>}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
        <LinkBack />
      </section>
    );
  }

  if (!current) return <section className="ptc-intro"><p>Loading the next item…</p></section>;

  const progress = Math.round((view.attempt.position / view.attempt.totalItems) * 100);
  return (
    <section className="ptc-test">
      <div className="ptc-progress-row">
        <span>Part {current.part}</span>
        <strong>Question {current.number}</strong>
        <span>{view.attempt.position + 1} of {view.attempt.totalItems}</span>
      </div>
      <div className="ptc-progress"><span style={{ width: `${progress}%` }} /></div>
      <div className="ptc-listening-panel">
        <div className={`ptc-disc ${playing ? "is-playing" : ""}`} aria-hidden="true"><span /></div>
        <div>
          <div className="ptc-kicker">Listen once</div>
          {!current.startedAt ? (
            <>
              <h1>Ready for question {current.number}?</h1>
              <p>The answer timer begins when the recording ends.</p>
              <button className="ptc-primary" disabled={busy} onClick={() => void play()}>▶ Play question {current.number}</button>
            </>
          ) : !canChoose && (remainingMs ?? 1) > 0 ? (
            <><h1>Listen to the complete recording.</h1><p>Options unlock when the audio ends.</p>{!playing && <button className="ptc-primary" disabled={busy} onClick={() => void play()}>▶ Resume audio</button>}</>
          ) : (
            <h1>Choose the best answer.</h1>
          )}
        </div>
      </div>
      <audio
        ref={audioRef}
        src={current.mediaUrl}
        preload="auto"
        onPlaying={() => setPlaying(true)}
        onEnded={() => setPlaying(false)}
        onError={() => setMessage("Audio could not be loaded. Your timer has not been reset.")}
      />
      <div className={`ptc-timer ${canChoose && (remainingMs ?? 0) < 4000 ? "urgent" : ""}`}>
        <strong>{current.startedAt ? (canChoose ? ((remainingMs ?? 0) / 1000).toFixed(1) : "LISTEN") : "READY"}</strong>
        <span>{canChoose ? "seconds remaining" : "response window"}</span>
      </div>
      <div className="ptc-options" aria-live="polite">
        {options.map((letter) => (
          <button key={letter} disabled={!canChoose || busy} onClick={() => void choose(letter)}>
            <span>{letter}</span><strong>{current.options[letter]}</strong>
          </button>
        ))}
      </div>
      {message && <p className="ptc-error" role="alert">{message}</p>}
      <p className="ptc-save">Every accepted answer is saved immediately.</p>
    </section>
  );
}

function LinkBack() {
  return <a className="ptc-dashboard-link" href="/dashboard">Return to dashboard</a>;
}
