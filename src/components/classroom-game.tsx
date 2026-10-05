"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { GameView } from "@/domain/game/contracts";
const labels = {
  lobby: ["Gather your teams", "Kumpulkan tim"],
  listen: ["Listen first", "Dengarkan dahulu"],
  comprehend: ["What did you hear?", "Apa yang kamu dengar?"],
  quiz: ["Choose the meaning", "Pilih maknanya"],
  review: ["Review • replay • notice", "Tinjau • dengar ulang • perhatikan"],
  finished: [
    "One more thing you noticed",
    "Satu hal baru yang kamu perhatikan",
  ],
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
  const [term, setTerm] = useState("");
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
        "Connection interrupted; reconnecting / Koneksi terputus; menghubungkan kembali",
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
      setMessage(e instanceof Error ? e.message : "Try again / Coba lagi");
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="game-shell">
      <header className="game-nav">
        <Link href="/dashboard">reHEARse</Link>
        <span>LISTENING LAB • PART A</span>
        <Link href={teacher ? "/play" : "/classroom"}>
          {teacher ? "Student entrance / Pintu siswa" : "Teacher / Guru"}
        </Link>
      </header>
      <p className="game-contract">
        Recreational game points only. No proficiency judgment. / Poin permainan
        saja. Bukan penilaian kemampuan.
      </p>
      {!room ? (
        <section className="game-welcome">
          <p className="eyebrow">Hear it. Share it. Play it.</p>
          <h1>
            {teacher
              ? "Bring the room to life."
              : "Listen together. Play together."}
          </h1>
          <p>
            {teacher
              ? "Your speaker. Your pace. Their discoveries. / Speaker dan tempo Anda, penemuan mereka."
              : "Use a team alias, not your real name. / Gunakan nama tim, bukan nama asli."}
          </p>
          {teacher && (
            <button disabled={busy} onClick={() => void act("create")}>
              Create classroom / Buat ruang
            </button>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (teacher) void refresh();
              else void act("join");
            }}
          >
            <label>
              Room PIN / PIN ruang
              <input
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
              {teacher ? "Resume room / Lanjutkan ruang" : "Join / Gabung"}
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className="game-status">
            <strong className="game-pin">{room.pin}</strong>
            <span>{room.players} teams / tim</span>
            <span>{room.alias ?? "Teacher / Guru"}</span>
            <span>
              Round {room.roundIndex + 1} / {room.total}
            </span>
          </div>
          <p className="game-join">
            Join / Gabung:{" "}
            <strong>
              {typeof location !== "undefined" ? location.origin : ""}/play?pin=
              {room.pin}
            </strong>
          </p>
          <section className={`game-stage phase-${room.phase}`}>
            <p className="eyebrow">{room.title}</p>
            <h1>{labels[room.phase][0]}</h1>
            <p>{labels[room.phase][1]}</p>
            {room.phase === "lobby" && (
              <p>
                One phone per team works well. Predict the situation, then
                listen. / Satu ponsel per tim cukup. Perkirakan situasinya, lalu
                dengarkan.
              </p>
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
                  Teacher playback: use the classroom speaker. Replay whenever
                  useful. / Putar melalui speaker kelas. Ulangi jika diperlukan.
                </p>
              </div>
            )}
            {room.phase === "listen" && !room.host && (
              <p>
                Listen to the classroom speaker. Keep a short note. / Dengarkan
                speaker kelas. Catat singkat.
              </p>
            )}
            {room.phase === "comprehend" && (
              <>
                <p>
                  Share one short meaning or uncertainty. No names. Discuss with
                  a partner before the quiz. / Bagikan makna atau keraguan
                  singkat. Tanpa nama. Diskusikan sebelum kuis.
                </p>
                {!room.host && !room.cloudSubmitted && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void act("cloud", { term });
                    }}
                  >
                    <input
                      aria-label="Meaning or uncertainty / Makna atau keraguan"
                      maxLength={40}
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      required
                      placeholder="1–40 characters"
                    />
                    <button disabled={busy}>
                      Send to teacher / Kirim ke guru
                    </button>
                  </form>
                )}
                {room.cloudSubmitted && (
                  <p>Preserved for this round / Tersimpan untuk putaran ini</p>
                )}
              </>
            )}
            {["comprehend", "review"].includes(room.phase) && (
              <div className="game-cloud" aria-label="Moderated word cloud">
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
                          aria-label={`Hide ${w.term}`}
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
                  <p>
                    Words appear after teacher approval. / Kata muncul setelah
                    disetujui guru.
                  </p>
                )}
              </div>
            )}
            {room.host && room.pending.length > 0 && (
              <details>
                <summary>Moderation / Moderasi ({room.pending.length})</summary>
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
                        Show / Tampilkan
                      </button>
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
                      ? "Answer window / Waktu menjawab"
                      : "Waiting for review / Menunggu tinjauan"}
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
                    Answer preserved. Talk about your evidence after review. /
                    Jawaban tersimpan. Bahas bukti setelah tinjauan.
                  </p>
                )}
              </>
            )}
            {room.phase === "review" && (
              <div className="game-review">
                <h3>Meaning / Makna</h3>
                <p>{room.round.explanation?.en}</p>
                <p>{room.round.explanation?.id}</p>
                <h3>Next listen / Dengar berikutnya</h3>
                <p>{room.round.cue?.en}</p>
                <p>{room.round.cue?.id}</p>
                <p>
                  What changed in your understanding? Tell a partner. / Apa yang
                  berubah dalam pemahamanmu? Ceritakan kepada pasangan.
                </p>
              </div>
            )}
            {room.phase === "finished" && (
              <p>
                Share one listening cue you will use next time. / Bagikan satu
                petunjuk yang akan digunakan saat mendengarkan berikutnya.
              </p>
            )}
          </section>
          {room.host && room.phase !== "finished" && (
            <div className="game-controls">
              <label>
                Quiz seconds / Detik kuis{" "}
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
                  setTerm("");
                  void act("advance");
                }}
              >
                {
                  (
                    {
                      lobby: "Start listening / Mulai mendengar",
                      listen: "Open comprehension / Buka pemahaman",
                      comprehend: "Open quiz / Buka kuis",
                      quiz: "Review / Tinjau",
                      review: "Next round / Putaran berikutnya",
                    } as Record<string, string>
                  )[room.phase]
                }
              </button>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => void act("finish")}
              >
                Finish session / Akhiri sesi
              </button>
            </div>
          )}
          {room.leaderboard.length > 0 && (
            <section className="game-board">
              <h2>Recreational leaderboard / Papan permainan</h2>
              <p>
                1000 for the matching answer + up to 200 speed bonus. No
                learning score. / 1000 untuk jawaban yang cocok + bonus
                kecepatan hingga 200. Bukan nilai belajar.
              </p>
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
