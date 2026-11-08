"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { GameView } from "@/domain/game/contracts";
const labels = {
  lobby: "Ready to listen",
  listen: "Listen to the conversation",
  comprehend: "Compare your understanding",
  quiz: "Choose the meaning",
  review: "Review and listen again",
  finished: "Reflect on your listening",
};
export function ClassroomGame({
  teacher = false,
  initialPin = "",
}: {
  teacher?: boolean;
  initialPin?: string;
}) {
  const [pin, setPin] = useState(initialPin);
  const [room, setRoom] = useState<GameView | null>(null);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({ roundIndex: -1, text: "" });
  const term = draft.roundIndex === room?.roundIndex ? draft.text : "";
  const [busy, setBusy] = useState(false);
  const [duration, setDuration] = useState(30);
  const [remaining, setRemaining] = useState(0);
  const refresh = useCallback(async () => {
    if (!/^\d{6}$/.test(pin)) return;
    try {
      const r = await fetch(`/api/game?pin=${pin}`, { cache: "no-store" });
      if (r.ok) {
        const v: GameView = await r.json();
        setRoom(v);
        setRemaining(
          v.deadline
            ? Math.max(0, Math.ceil((v.deadline - v.serverNow) / 1000))
            : 0,
        );
      }
    } catch {
      setMessage(
        "Connection interrupted; reconnecting",
      );
    }
  }, [pin]);
  useEffect(() => {
    const first = setTimeout(() => void refresh(), 0);
    const t = setInterval(() => void refresh(), 2000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [refresh]);
  useEffect(() => {
    const t = setInterval(() => setRemaining((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  async function act(kind: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          pin: pin || undefined,
          revision: room?.revision ?? 0,
          duration,
          ...extra,
        }),
      });
      const v = await r.json();
      if (!r.ok) throw new Error(v.error);
      if (v.pin) {
        setPin(v.pin);
        history.replaceState(null, "", `?pin=${v.pin}`);
      }
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Try again");
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="game-shell">
      <header className="game-nav">
        <Link href="/" aria-label="reHEARse home">reHEARse</Link>
        <span>CLASSROOM LISTENING</span>
        <Link href={teacher ? "/legacy/play" : "/legacy/classroom"}>
          {teacher ? "Join a session" : "Teacher"}
        </Link>
      </header>
      <p className="game-contract">
        Listen, discuss, and answer together.</p>
      {!room ? (
        <section className="game-welcome">
          <p className="eyebrow">Listening session</p>
          <h1>
            {teacher
              ? "Lead a listening session."
              : "Join a listening session."}
          </h1>
          <p>
            {teacher
              ? "Play each conversation, allow discussion, then open the question."
              : "Enter the PIN shared by your teacher. Your team name is assigned automatically."}
          </p>
          {teacher && (
            <button disabled={busy} onClick={() => void act("create")}>
              Create session</button>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (teacher) void refresh();
              else void act("join");
            }}
          >
            <label>
              Session PIN<input
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="6 digits"
                required
                pattern="[0-9]{6}"
              />
            </label>
            <button disabled={busy}>
              {teacher ? "Resume session" : "Join"}
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className="game-status">
            <strong className="game-pin">{room.pin}</strong>
            <span>{room.players} teams</span>
            <span>{room.host ? "Teacher" : room.alias}</span>
            <span>
              Round {room.roundIndex + 1} of {room.total}
            </span>
          </div>
          <p className="game-join">
            Join{" "}
            <strong>
              {typeof location !== "undefined" ? location.origin : ""}/legacy/play?pin=
              {room.pin}
            </strong>
          </p>
          <section className={`game-stage phase-${room.phase}`}>
            <p className="eyebrow">{room.title}</p>
            <h1>{labels[room.phase]}</h1>
            {room.phase === "lobby" && (
              <p>
                Use one phone per team. Listen for the situation and what each
                speaker means.</p>
            )}
            {room.round.audioUrl && (
              <div className="game-audio">
                <audio
                  key={room.round.audioUrl}
                  controls
                  preload="auto"
                  src={room.round.audioUrl}
                />
                <p>
                  Play the audio through the classroom speaker. Replay it when a
                  detail needs another listen.</p>
              </div>
            )}
            {room.phase === "listen" && !room.host && (
              <p>
                Listen to the conversation and note its main idea.</p>
            )}
            {room.phase === "comprehend" && (
              <>
                <p>
                  Discuss the conversation with your team. Submit one key idea
                  or a detail you want to check.</p>
                {!room.host && !room.cloudSubmitted && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void act("cloud", { term });
                    }}
                  >
                    <input
                      aria-label="Key idea or question"
                      maxLength={40}
                      value={term}
                      onChange={(e) =>
                        setDraft({
                          roundIndex: room.roundIndex,
                          text: e.target.value,
                        })
                      }
                      required
                      placeholder="Up to 40 characters"
                    />
                    <button disabled={busy}>
                      Send to teacher</button>
                  </form>
                )}
                {!room.host && room.cloudSubmitted && (
                  <p>Your phrase has been sent.</p>
                )}
              </>
            )}
            {["comprehend", "review"].includes(room.phase) && (
              <div
                className="game-cloud"
                aria-label="Class ideas"
              >
                {room.cloud.length ? (
                  room.cloud.map((w) => (
                    <span
                      key={w.id}
                      style={{
                        fontSize: `${Math.min(3, 1 + w.count * 0.18)}rem`,
                      }}
                    >
                      {w.term}
                      {room.host && (
                        <button
                          className="cloud-hide"
                          aria-label={`Hide phrase: ${w.term}`}
                          onClick={() =>
                            void act("moderate", {
                              cloudId: w.id,
                              visible: false,
                            })
                          }
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <p>The teacher will choose phrases for the class to discuss.</p>
                )}
              </div>
            )}
            {room.host && room.pending.length > 0 && (
              <details>
                <summary>
                  Review phrases{room.pending.length})
                </summary>
                <div className="moderation">
                  {room.pending.map((w) => (
                    <div key={w.id}>
                      <span>{w.term}</span>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void act("moderate", { cloudId: w.id, visible: true })
                        }
                      >
                        Show</button>
                    </div>
                  ))}
                </div>
              </details>
            )}
            {room.round.prompt && (
              <>
                <h2>{room.round.prompt}</h2>
                {room.phase === "quiz" && (
                  <p className="game-timer" role="timer">
                    {remaining}s ·{" "}
                    {remaining
                      ? "Time remaining"
                      : "Discuss the answer"}
                  </p>
                )}
                <div className="game-options">
                  {room.round.options?.map((o, i) => (
                    <button
                      key={o}
                      className={`option option-${i} ${room.phase === "review" && room.round.answer === i ? "revealed" : ""}`}
                      disabled={
                        busy ||
                        room.host ||
                        room.phase !== "quiz" ||
                        room.answered ||
                        remaining === 0
                      }
                      onClick={() => void act("answer", { choice: i })}
                    >
                      <b>{String.fromCharCode(65 + i)}</b>
                      {o}
                      {room.phase === "review" && room.round.answer === i && (
                        <strong> ✓</strong>
                      )}
                    </button>
                  ))}
                </div>
                {room.answered && room.phase === "quiz" && (
                  <p>
                    Answer submitted. Be ready to explain which part of the
                    audio helped you decide.</p>
                )}
              </>
            )}
            {room.phase === "review" && (
              <div className="game-review">
                <h3>Meaning</h3>
                <p>{room.round.explanation?.en}</p>
                <h3>Replay focus</h3>
                <p>{room.round.cue?.en}</p>
                <p>
                  Compare your first interpretation with what you hear now.
                  Explain any change to your team.</p>
              </div>
            )}
            {room.phase === "finished" && (
              <p>
                Which phrase or detail helped you understand a speaker’s
                meaning? Share it with your team.</p>
            )}
          </section>
          {room.host && room.phase !== "finished" && (
            <div className="game-controls">
              <label>
                Answer time{" "}
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  {[20, 30, 45, 60, 90].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <button
                disabled={busy}
                onClick={() => {
                  setDraft({ roundIndex: -1, text: "" });
                  void act("advance");
                }}
              >
                {
                  (
                    {
                      lobby: "Start listening",
                      listen:
                        "Discuss the conversation",
                      comprehend: "Open question",
                      quiz: "Review",
                      review: "Next round",
                    } as Record<string, string>
                  )[room.phase]
                }
              </button>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => void act("finish")}
              >
                Finish session</button>
            </div>
          )}
          {room.leaderboard.length > 0 && (
            <section className="game-board">
              <h2>Team standings</h2>
              <p>
                1000 points for a correct answer, plus up to 200 for responding
                quickly.</p>
              <ol>
                {room.leaderboard.map((p) => (
                  <li key={p.alias}>
                    <span>{p.alias}</span>
                    <strong>{p.points} pts</strong>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
      {message && (
        <p className="game-error" role="alert">
          {message}
        </p>
      )}
    </main>
  );
}
