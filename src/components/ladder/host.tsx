"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HostView } from "@/domain/ladder/model";
import { HostAmbience } from "./host-ambience";
import { LadderBoard } from "./board";
export function LadderHost({ initialPin }: { initialPin?: string }) {
  const [view, setView] = useState<HostView | null>(null),
    [pin, setPin] = useState(initialPin ?? ""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [project, setProject] = useState(false),
    [reason, setReason] = useState("");
  const stage = useRef<HTMLElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const changed = () =>
      setFullscreen(document.fullscreenElement === stage.current);
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.current?.requestFullscreen();
    } catch {
      setError(
        "Fullscreen is unavailable here. Use projector mode or maximize your browser. / Layar penuh belum tersedia. Gunakan mode proyektor atau perbesar browser.",
      );
    }
  }
  const createKey = useRef<string | null>(null);
  useEffect(() => {
    if (pin.length !== 6) return;
    let active = true;
    async function read() {
      try {
        const r = await fetch(`/api/ladder/host?pin=${pin}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        });
        if (!r.ok) throw new Error();
        const result = await r.json();
        if (active) {
          setView(result);
          setError("");
        }
      } catch {
        if (active)
          setError(
            "The board could not refresh. Existing progress is safe. / Papan belum bisa diperbarui. Progres tetap tersimpan.",
          );
      }
    }
    read();
    const timer = setInterval(read, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [pin]);
  async function act(kind: "create" | "close" | "assist", runId?: string) {
    if (kind === "create" && !createKey.current)
      createKey.current = crypto.randomUUID();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/ladder/host", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          ...(kind === "create" ? { key: createKey.current } : {}),
          ...(kind !== "create" ? { pin } : {}),
          ...(kind === "assist"
            ? { runId, key: crypto.randomUUID(), reason }
            : {}),
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) throw new Error();
      const result = await r.json();
      setView(result);
      setPin(result.pin);
      if (kind === "create") createKey.current = null;
      window.history.replaceState(null, "", `/ladder/host?pin=${result.pin}`);
    } catch {
      setError(
        "That action could not be confirmed. Refresh this board before trying again. / Tindakan belum bisa dipastikan. Perbarui papan sebelum mencoba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main
      ref={stage}
      className={`ladder-host-shell ${project ? "is-projecting" : ""}`}
    >
      <header className="ladder-header">
        <Link href="/" className="ladder-brand" aria-label="reHEARse home">
          reHEARse
        </Link>
        <span className="ladder-mode">
          LIVE LISTENING BOARD / PAPAN MENYIMAK LANGSUNG
        </span>
        <div className="ladder-stage-tools">
          <button onClick={toggleFullscreen}>
            {fullscreen
              ? "Exit fullscreen / Keluar layar penuh"
              : "Fullscreen / Layar penuh"}
          </button>
          <button onClick={() => setProject((x) => !x)}>
            {project
              ? "Teacher controls / Kontrol guru"
              : "Project board / Tampilkan papan"}
          </button>
        </div>
      </header>
      <div className="ladder-host-heading">
        <div>
          <p className="eyebrow">Everyone has a way forward</p>
          <h1>
            A shared journey.
            <br />
            <em>Each at their own pace.</em>
          </h1>
          <p>Perjalanan bersama. Masing-masing dengan waktunya sendiri.</p>
        </div>
        {view && (
          <div className="ladder-host-pin">
            <small>JOIN AT / GABUNG DI</small>
            <strong>rehearse.najala.org/ladder</strong>
            <span>{view.pin}</span>
            <small>
              {view.closed
                ? "SESSION ENDED / SESI SELESAI"
                : "CLASS PIN / PIN KELAS"}
            </small>
          </div>
        )}
      </div>
      {!view ? (
        <section className="ladder-host-start">
          <h2>Open a listening session / Buka sesi menyimak</h2>
          <p>
            Students sign in, enter the PIN, and play individually. Only game
            aliases and movement appear on the projected board.
            <br />
            Peserta masuk, memasukkan PIN, lalu bermain mandiri. Papan hanya
            menampilkan nama permainan dan pergerakan.
          </p>
          <button
            className="ladder-primary"
            disabled={busy}
            onClick={() => act("create")}
          >
            Create a class session / Buat sesi kelas
          </button>
          <label>
            Reopen your board / Buka papanmu lagi
            <input
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />
          </label>
        </section>
      ) : (
        <div className="ladder-host-layout">
          <LadderBoard
            wide
            players={view.players.map((x) => ({
              alias: x.alias,
              position: x.position,
            }))}
          />
          <section className="ladder-host-roster">
            <h2>On the journey / Dalam perjalanan</h2>
            <p>
              Positions are part of the game. They do not measure listening
              ability.
              <small>
                Posisi adalah bagian permainan, bukan ukuran kemampuan menyimak.
              </small>
            </p>
            {view.players.length === 0 ? (
              <p>Waiting for listeners / Menunggu peserta…</p>
            ) : (
              view.players.map((p) => (
                <div className="ladder-host-player" key={p.runId}>
                  <span className="ladder-player-dot" />
                  <strong>{p.alias}</strong>
                  <span>
                    {p.finished
                      ? "At the checkpoint / Di titik akhir"
                      : "On the path / Dalam perjalanan"}
                  </span>
                  {!project && p.needsHelp && (
                    <button
                      className="ladder-help"
                      disabled={busy || reason.trim().length < 3}
                      onClick={() => act("assist", p.runId)}
                    >
                      Close next repair with guidance / Tutup bagian berikutnya
                      dengan panduan
                    </button>
                  )}
                </div>
              ))
            )}
            {!project && (
              <div className="ladder-teacher-controls">
                <label>
                  Note for assisted closure / Catatan pendampingan
                  <input
                    maxLength={200}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="For example: discussed the relevant audio together"
                  />
                </label>
                <p>
                  Help requests are private to this view. Closure is available
                  after the learner finishes the passage.
                  <small>
                    Permintaan bantuan hanya terlihat di sini. Penutupan
                    tersedia setelah peserta menyelesaikan audio.
                  </small>
                </p>
                <button
                  className="ladder-secondary"
                  disabled={busy || view.closed}
                  onClick={() => act("close")}
                >
                  End this session / Akhiri sesi ini
                </button>
              </div>
            )}
          </section>
        </div>
      )}
      {error && (
        <p className="ladder-error" role="alert">
          {error}
        </p>
      )}
      <HostAmbience
        quiet={!!view && !view.closed && view.players.some((p) => !p.finished)}
      />
    </main>
  );
}
