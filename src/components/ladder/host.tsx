"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HostView } from "@/domain/ladder/model";
import type { HostJourney, JourneyTransition } from "@/domain/ladder/journey-contract";
import { ActivityPicker } from "./activity-picker";
import { HostAmbience } from "./host-ambience";
import { LadderBoard } from "./board";
import { Avatar } from "./avatar";
export function LadderHost({ initialPin }: { initialPin?: string }) {
  const [view, setView] = useState<HostView | null>(null),
    [pin, setPin] = useState(initialPin ?? ""),
    [activityId, setActivityId] = useState<string | null>("conversation-journey"),
    [creationPending, setCreationPending] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [project, setProject] = useState(false),
    [reason, setReason] = useState(""),
    [passageIndex, setPassageIndex] = useState(0);
  const session = view as (Omit<HostView, "players"> & { journey?: HostJourney; title?: string; players: Array<HostView["players"][number] & { lastTransition?: JourneyTransition | null; revision?: number }> }) | null;
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
  async function act(kind: "create" | "close" | "assist" | "begin", runId?: string) {
    if (kind === "create") {
      if (!createKey.current) createKey.current = crypto.randomUUID();
      setCreationPending(true);
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/ladder/host", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          ...(kind === "create" ? { key: createKey.current, ...(activityId ? { activityId } : {}) } : {}),
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
      if (kind === "create") { createKey.current = null; setCreationPending(false); }
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
      {session?.title && <p className="ladder-session-title">{session.title}</p>}
      {view?.lobby?.started && view?.passages && <nav className="ladder-passage-tabs" aria-label="Passage boards / Papan tiap rekaman">
        {view.passages.map((passage, index) => <button key={index} type="button" aria-pressed={passageIndex === index}
          onClick={() => setPassageIndex(index)}>
          <strong>{index + 1}. {passage.title.en}</strong><small lang="id">{passage.title.id}</small>
          <span>{view.players.filter((player) => player.passageIndex === index).length} here / peserta di sini</span>
        </button>)}
      </nav>}
      {!view ? (
        <section className="ladder-host-start">
          <h2>Open a listening session / Buka sesi menyimak</h2>
          <p>
            Students join, choose their name and character, then wait for you to start. Only game
            aliases and movement appear on the projected board.
            <br />
            Peserta bergabung, memilih nama dan karakter, lalu menunggu kamu memulai. Papan hanya
            menampilkan nama permainan dan pergerakan.
          </p>
          <ActivityPicker value={activityId} onChange={setActivityId} disabled={busy || creationPending} />
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
      ) : view.lobby && !view.lobby.started && !view.closed ? (
        <section className="ladder-lobby" aria-label="Class waiting room / Ruang tunggu kelas">
          <header><div><span className="ladder-kicker">WAITING ROOM / RUANG TUNGGU</span>
            <h2>{view.players.length} joined / sudah bergabung</h2>
            <p>{view.lobby.readyCount} ready / siap · Names and characters appear as students join.<br />Nama dan karakter muncul saat peserta bergabung.</p></div>
            <button className="ladder-primary" disabled={busy || view.players.length === 0} onClick={() => act("begin")}>
              Start game / Mulai permainan →
            </button>
          </header>
          <div className="ladder-lobby-grid">{view.players.map((p) => <article className="ladder-lobby-player" key={p.runId}>
            <span className="ladder-lobby-name">{p.alias}</span>
            <Avatar id={p.avatarId} paletteId={p.avatarPalette} size={112} />
            <strong>{p.ready ? "Ready / Siap" : "Choosing a character / Memilih karakter"}</strong>
          </article>)}</div>
          {view.players.length === 0 && <p className="ladder-lobby-empty">Share the PIN above. Your class will appear here.<br />Bagikan PIN di atas. Peserta akan muncul di sini.</p>}
          <p>You can start while others finish setting up. They can enter when ready.<br />Kamu bisa mulai saat peserta lain masih bersiap. Mereka bisa masuk setelah siap.</p>
          <button className="ladder-secondary" disabled={busy} onClick={() => act("close")}>End session / Akhiri sesi</button>
        </section>
      ) : (
        <div className="ladder-host-layout">
          <LadderBoard
            wide
            key={passageIndex}
            journeyMap={session?.passages?.[passageIndex]?.journey.map ?? session?.journey?.map}
            checkpointEnd={!!session?.passages && passageIndex < session.passages.length - 1}
            players={(session?.players ?? []).filter((player) => !session?.passages || player.passageIndex === passageIndex).map((x) => ({
              id: x.runId,
              alias: x.alias,
              position: x.position,
              avatarId: x.avatarId,
              avatarPalette: x.avatarPalette,
              lastTransition: x.lastTransition,
              revision: x.revision,
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
                  <Avatar id={p.avatarId} paletteId={p.avatarPalette} size={64} />
                  <strong>{p.alias}</strong>
                  <span>
                    {!p.ready ? "Setting up / Sedang bersiap" : p.finished
                      ? "Journey complete / Perjalanan selesai"
                      : view.passages ? `Recording ${(p.passageIndex ?? 0) + 1} / Rekaman ${(p.passageIndex ?? 0) + 1}` : "On the path / Dalam perjalanan"}
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
        quiet={!!view && !!view.lobby?.started && !view.closed && view.players.some((p) => p.ready && !p.finished)}
      />
    </main>
  );
}
