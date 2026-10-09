"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BilingualText } from "@/domain/feedback";
import type { LadderAction, LadderView } from "@/domain/ladder/model";
import { LadderBoard } from "./board";
import { AvatarControls } from "./avatar-controls";
import { ladderTaskKey, reconcileLadderView } from "./view-reconciliation";
import { AnswerEffect } from "./answer-effect";
import { confirmedAnswerEffect, type AnswerEffect as AnswerEffectState } from "./answer-effect-state";
function Words({ text }: { text: BilingualText }) {
  return (
    <>
      <span>{text.en}</span>
      <small lang="id">{text.id}</small>
    </>
  );
}
function message(code: string) {
  const messages: Record<string, BilingualText> = {
    refresh_progress: {
      en: "Your progress changed in another tab. It has been refreshed; check the current task.",
      id: "Progresmu berubah di tab lain. Sudah diperbarui; cek tugas saat ini.",
    },
    authentication_required: {
      en: "Sign in again in another tab. Keep your explanation here.",
      id: "Masuk lagi di tab lain. Simpan penjelasanmu di sini.",
    },
    session_closed: {
      en: "Your teacher has ended this session. Your progress is saved.",
      id: "Gurumu sudah mengakhiri sesi ini. Progresmu tersimpan.",
    },
    session_not_open: {
      en: "That session is not open. Check the PIN with your teacher.",
      id: "Sesi itu belum tersedia. Cek PIN dengan gurumu.",
    },
    game_unavailable: {
      en: "The connection was interrupted. Your text stays here; retry the same action.",
      id: "Koneksi terputus. Teksmu tetap di sini; coba tindakan yang sama lagi.",
    },
  };
  return messages[code] ?? messages.game_unavailable;
}
export function LadderGame({
  initial,
  initialPin,
  canJoin,
}: {
  initial: LadderView | null;
  initialPin?: string;
  canJoin: boolean;
}) {
  const [view, setView] = useState(initial),
    [pin, setPin] = useState(initialPin ?? ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<BilingualText | null>(null),
    [selection, setSelection] = useState<number | null>(null),
    [uncertain, setUncertain] = useState(false),
    [explanation, setExplanation] = useState(""),
    [played, setPlayed] = useState(false),
    [listening, setListening] = useState(false),
    [gist, setGist] = useState(false),
    [notice, setNotice] = useState<BilingualText | null>(null),
    [noteBusy, setNoteBusy] = useState(false),
    [answerEffect, setAnswerEffect] = useState<AnswerEffectState | null>(null);
  const audio = useRef<HTMLAudioElement>(null),
    boundary = useRef<number | null>(null),
    loadTarget = useRef<number | null>(null),
    pending = useRef<{ fingerprint: string; key: string } | null>(null),
    syncLock = useRef(false),
    celebrated = useRef(new Set<string>()),
    latestView = useRef(initial);
  const clearAnswerEffect = useCallback(() => setAnswerEffect(null), []);
  const choiceIndex = view?.state.choices.length ?? 0;
  const repairIndex =
    view?.state.choices.findIndex((x) => x.outcome === "repair") ?? -1;
  const index = choiceIndex < 4 ? choiceIndex : repairIndex;
  const item = index >= 0 ? view?.items[index] : null;
  const repairing = choiceIndex === 4 && repairIndex >= 0;
  const finished = choiceIndex === 4 && repairIndex < 0;
  const task = view && index >= 0 ? view.state.choices[index] : null;
  const receive = useCallback(
    (next: LadderView, allowNewRun = false) => {
      const previous = latestView.current;
      const accepted = reconcileLadderView(previous, next, allowNewRun);
      if (!accepted || accepted === previous) return;
      if (ladderTaskKey(previous) !== ladderTaskKey(accepted)) {
        setAnswerEffect(null);
        setSelection(null);
        setUncertain(false);
        setExplanation("");
        setPlayed(false);
        setListening(false);
        setGist(false);
        audio.current?.pause();
        boundary.current = null;
      }
      latestView.current = accepted;
      setView(accepted);
    },
    [],
  );
  useEffect(() => {
    if (!view?.runId) return;
    const id = view.runId;
    let active = true;
    const timer = setInterval(async () => {
      if (syncLock.current || document.visibilityState !== "visible") return;
      try {
        const r = await fetch(`/api/ladder?runId=${id}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        });
        if (r.ok) {
          const body = await r.json();
          if (
            active &&
            !syncLock.current &&
            (body.view.revision > view.revision ||
              body.view.sessionClosed !== view.sessionClosed ||
              body.view.avatarId !== view.avatarId || body.view.avatarPalette !== view.avatarPalette)
          )
            receive(body.view);
        }
      } catch {
        /* A network gap must not reset the task. */
      }
    }, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [view, receive]);
  async function send(action?: LadderAction, start = false) {
    if (busy) return;
    setBusy(true);
    syncLock.current = true;
    setError(null);
    setAnswerEffect(null);
    audio.current?.pause();
    setListening(false);
    const fingerprint = JSON.stringify(
      start ? { pin: pin.trim() } : { runId: view?.runId, action },
    );
    if (pending.current?.fingerprint !== fingerprint)
      pending.current = { fingerprint, key: crypto.randomUUID() };
    const key = pending.current.key;
    try {
      const r = await fetch("/api/ladder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          start
            ? { kind: "start", key, ...(pin.trim() ? { pin: pin.trim() } : {}) }
            : {
                kind: "act",
                key,
                runId: view!.runId,
                revision: view!.revision,
                action,
              },
        ),
        signal: AbortSignal.timeout(15000),
      });
      const body = await r.json();
      if (!r.ok) {
        if (body.error === "refresh_progress") {
          const fresh = await fetch(`/api/ladder?runId=${view!.runId}`, {
            cache: "no-store",
          });
          if (fresh.ok) receive((await fresh.json()).view);
        }
        throw new Error(body.error);
      }
      const next = body.view as LadderView;
      receive(next, start);
      const effect = confirmedAnswerEffect(view, next, action);
      if (effect && !celebrated.current.has(effect.id)) {
        celebrated.current.add(effect.id);
        setAnswerEffect(effect);
      }
      if (start) window.history.replaceState(null, "", "/ladder");
      pending.current = null;
      if (action?.kind === "choice")
        setNotice(
          next.state.choices[action.item].outcome === "repair"
            ? {
                en: "Keep listening. This part will be waiting at the replay checkpoint.",
                id: "Lanjutkan menyimak. Bagian ini akan menunggu di titik dengar ulang.",
              }
            : {
                en: "That interpretation fits. Continue with the next part.",
                id: "Penafsiran itu sesuai. Lanjutkan ke bagian berikutnya.",
              },
        );
      if (action?.kind === "repair") {
        const revised = next.state.choices[action.item].outcome !== "repair";
        setNotice(
          revised
            ? {
                en: "Your revision is saved. You can move forward.",
                id: "Revisimu tersimpan. Kamu bisa maju lagi.",
              }
            : {
                en: "Your explanation is saved. Try the focus cue, or open guided review.",
                id: "Penjelasanmu tersimpan. Coba petunjuk fokus, atau buka panduan.",
              },
        );
        if (revised) setExplanation("");
        if (next.latestEventId) {
          setNoteBusy(true);
          fetch("/api/ladder/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId: next.latestEventId }),
            signal: AbortSignal.timeout(16000),
          })
            .then(async (r) => {
              if (r.ok) {
                const x = await r.json();
                const current = latestView.current;
                if (current?.latestEventId === next.latestEventId) {
                  const updated = { ...current, latestNote: x.note };
                  latestView.current = updated;
                  setView(updated);
                }
              }
            })
            .catch(() => undefined)
            .finally(() => setNoteBusy(false));
        }
      }
      if (action?.kind === "support") {
        setExplanation("");
        setNotice({
          en: "Guided review completed. This part stays saved.",
          id: "Panduan selesai. Bagian ini tetap tersimpan.",
        });
      }
      if (action?.kind === "help")
        setNotice({
          en: "Your teacher can see your request. You can keep listening or use guided review.",
          id: "Gurumu bisa melihat permintaanmu. Kamu bisa lanjut menyimak atau memakai panduan.",
        });
    } catch (e) {
      setError(message(e instanceof Error ? e.message : "game_unavailable"));
    } finally {
      setBusy(false);
      syncLock.current = false;
    }
  }
  async function play(full = false) {
    setAnswerEffect(null);
    const el = audio.current;
    if (!el || !view) return;
    const start = full ? view.items[0].startMs : item!.startMs;
    boundary.current = full ? view.items[3].endMs : item!.endMs;
    loadTarget.current = start / 1000;
    setGist(full);
    setPlayed(false);
    try {
      el.currentTime = start / 1000;
      await el.play();
      setListening(true);
    } catch {
      setError({
        en: "Tap play again once the audio is ready.",
        id: "Tekan putar lagi setelah audio siap.",
      });
    }
  }
  const tick = useCallback(() => {
    const el = audio.current;
    if (!el) return;
    if (
      boundary.current !== null &&
      el.currentTime * 1000 >= boundary.current
    ) {
      el.pause();
      boundary.current = null;
      setPlayed(true);
      setListening(false);
      setGist(false);
    }
  }, []);
  useEffect(() => {
    if (!listening) return;
    let frame = 0;
    const sample = () => {
      tick();
      frame = requestAnimationFrame(sample);
    };
    frame = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(frame);
  }, [listening, tick]);
  function pause() {
    audio.current?.pause();
    setListening(false);
  }
  return (
    <main className="ladder-shell">
      {answerEffect && !listening && (
        <AnswerEffect key={answerEffect.id} effect={answerEffect} onDone={clearAnswerEffect} />
      )}
      <header className="ladder-header">
        <Link href="/" className="ladder-brand" aria-label="reHEARse home">
          <span className="brand-pulse" />
          reHEARse
        </Link>
        <span className="ladder-mode">
          LISTENING JOURNEY / PERJALANAN MENYIMAK
        </span>
        <Link href="/ladder/host">Teacher board / Papan guru ↗</Link>
      </header>
      <div className="ladder-heading">
        <div>
          <p className="eyebrow">Listen · Discover · Listen again</p>
          <h1>
            One more listen.
            <br />
            <em>A new way forward.</em>
          </h1>
          <p>Dengar lagi. Temukan hubungan yang belum kamu tangkap.</p>
        </div>
        <div className="ladder-badge">
          <Image
            src="/art/kenney/book_open.svg"
            width={30}
            height={30}
            alt=""
          />
          <span>
            {view?.title ?? "Three papers, one thread"}
            <small>
              One conversation · Individual play
              <br />
              Satu percakapan · Main mandiri
            </small>
          </span>
        </div>
      </div>
      <div className="ladder-layout">
        <aside className="ladder-map">
          <div className="ladder-map-top">
            <span>Your journey / Perjalananmu</span>
            <span className="ladder-alias">
              {view?.alias ?? "Your token / Tokenmu"}
            </span>
          </div>
          <LadderBoard
            players={[
              { id: view?.runId, alias: view?.alias ?? "YOU", position: view?.position ?? 0, avatarId: view?.avatarId, avatarPalette: view?.avatarPalette },
            ]}
            ownAlias={view?.alias ?? "YOU"}
            ownId={view?.runId}
            animate={!listening}
          />
          <div className="ladder-map-rule">
            <Image
              src="/art/kenney/campfire.svg"
              width={25}
              height={25}
              alt=""
            />
            <p>
              A detour is a chance to listen again.
              <small>
                Putar ulang, coba jelaskan, lalu lanjut. Bantuan selalu
                tersedia.
              </small>
            </p>
          </div>
          <p className="ladder-art-credit">
            Icons by{" "}
            <a
              href="https://kenney.nl/assets/board-game-icons"
              target="_blank"
              rel="noreferrer"
            >
              Kenney
            </a>{" "}
            · CC0
          </p>
          {view && (
            <details className="ladder-appearance-settings">
              <summary>Change your character / Ganti karaktermu</summary>
              <AvatarControls view={view} disabled={busy} animate={!listening} onView={receive} />
            </details>
          )}
        </aside>
        <section
          className="ladder-desk"
          aria-label="Listening activity / Aktivitas menyimak"
        >
          {error && (
            <p className="ladder-error" role="alert">
              <Words text={error} />
            </p>
          )}
          {!view ? (
            <div className="ladder-welcome">
              <span className="ladder-kicker">
                A SMALL ADVENTURE IN LISTENING
              </span>
              <h2>Follow the conversation.</h2>
              <p>
                Choose what you think is happening. If a part is unclear, replay
                it and explain it in your own words.
                <small>
                  Pilih makna yang kamu tangkap. Kalau belum jelas, dengarkan
                  bagiannya lagi dan jelaskan dengan kata-katamu sendiri.
                </small>
              </p>
              <ul>
                <li>
                  No countdown. Take time to listen.
                  <small>Tanpa hitung mundur. Dengarkan dengan tenang.</small>
                </li>
                <li>
                  Replays give you another route forward.
                  <small>
                    Dengar ulang membuka jalan untuk lanjut.
                  </small>
                </li>
                <li>
                  Your saved progress stays safe.
                  <small>Progres yang tersimpan tetap aman.</small>
                </li>
              </ul>
              {canJoin && (
                <label className="ladder-pin">
                  Class PIN, if you have one / PIN kelas jika ada
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Optional / Opsional"
                  />
                </label>
              )}
              <button
                className="ladder-primary"
                disabled={busy || (pin.length > 0 && pin.length !== 6)}
                onClick={() => send(undefined, true)}
              >
                {busy
                  ? "Opening / Membuka…"
                  : "Start listening / Mulai menyimak →"}
              </button>
            </div>
          ) : (
            <>
              {view.sessionClosed ? (
                <div className="ladder-finish">
                  <h2>The class session has ended.</h2>
                  <p>Sesi kelas sudah selesai. Progresmu tersimpan.</p>
                  <button
                    className="ladder-primary"
                    onClick={() => {
                      setPin("");
                      latestView.current = null;
                      setView(null);
                    }}
                  >
                    Start a new solo journey / Mulai perjalanan mandiri
                  </button>
                </div>
              ) : finished ? (
                <div className="ladder-finish">
                  <div className="ladder-finish-icon">✦</div>
                  <span className="ladder-kicker">
                    CHECKPOINT REACHED / TITIK AKHIR TERCAPAI
                  </span>
                  <h2>You found a way through.</h2>
                  <p>
                    Every part is now completed or explored with guidance.
                    <small>
                      Semua bagian sudah selesai atau dibahas dengan panduan.
                    </small>
                  </p>
                  <p>
                    What changed after you listened again?
                    <small>Apa yang berubah setelah kamu dengar lagi?</small>
                  </p>
                  <button
                    className="ladder-primary"
                    onClick={() => {
                      setPin("");
                      latestView.current = null;
                      setView(null);
                      setNotice(null);
                    }}
                  >
                    Listen from the beginning / Mulai lagi
                  </button>
                  <Link href="/dashboard" className="ladder-secondary">
                    Back to activities / Kembali ke aktivitas
                  </Link>
                </div>
              ) : (
                <>
                  <div className="ladder-step-heading">
                    <span className="ladder-kicker">
                      {repairing
                        ? "REPLAY CHECKPOINT / TITIK DENGAR ULANG"
                        : "GUIDED LISTEN / SIMAK DENGAN PANDUAN"}
                    </span>
                    <h2>
                      <Words text={item!.title} />
                    </h2>
                    <p className="ladder-task-count">
                      {repairing
                        ? "One part to revisit / Satu bagian untuk didengar lagi"
                        : `Part ${index + 1} of 4 / Bagian ${index + 1} dari 4`}
                    </p>
                  </div>
                  <div className="ladder-audio">
                    <button
                      className="ladder-play"
                      disabled={busy}
                      onClick={() => (listening ? pause() : play())}
                      aria-label={
                        listening
                          ? "Pause / Jeda"
                          : "Play this part / Putar bagian ini"
                      }
                    >
                      {listening ? "Ⅱ" : "▶"}
                    </button>
                    <div>
                      <strong>
                        {gist
                          ? "Whole conversation / Percakapan lengkap"
                          : repairing
                            ? "Replay this part / Dengar ulang bagian ini"
                            : "Listen to this part / Dengarkan bagian ini"}
                      </strong>
                      <small>
                        {(item!.startMs / 1000).toFixed(1)}–
                        {(item!.endMs / 1000).toFixed(1)} s · No rush / Santai
                        saja
                      </small>
                    </div>
                    <span
                      className={`ladder-signal ${listening ? "is-playing" : ""}`}
                      aria-hidden="true"
                    >
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                  <audio
                    ref={audio}
                    src={view.audioUrl}
                    preload="metadata"
                    onTimeUpdate={tick}
                    onEnded={() => {
                      setPlayed(true);
                      setListening(false);
                      setGist(false);
                    }}
                    onPause={() => setListening(false)}
                    onLoadedMetadata={() => {
                      if (loadTarget.current !== null)
                        audio.current!.currentTime = loadTarget.current;
                    }}
                    onError={() =>
                      setError({
                        en: "Audio could not load. Your progress is saved; check the connection and try again.",
                        id: "Audio belum bisa dimuat. Progresmu tersimpan; cek koneksi lalu coba lagi.",
                      })
                    }
                  />
                  <div className="ladder-audio-tools">
                    <button disabled={busy} onClick={() => play(true)}>
                      Hear the whole conversation / Dengar lengkap
                    </button>
                    <label>
                      Speed / Kecepatan
                      <select
                        defaultValue="1"
                        onChange={(e) => {
                          if (audio.current)
                            audio.current.playbackRate = Number(e.target.value);
                        }}
                      >
                        <option value="0.85">0.85×</option>
                        <option value="1">1×</option>
                        <option value="1.15">1.15×</option>
                      </select>
                    </label>
                  </div>
                  {repairing && (
                    <div className="ladder-cue">
                      <Words text={item!.repair!.focus} />
                      {task!.tries > 0 && (
                        <p>
                          <Words text={item!.repair!.hint} />
                        </p>
                      )}
                    </div>
                  )}
                  <h3 className="ladder-question">
                    <Words
                      text={repairing ? item!.repair!.prompt : item!.prompt}
                    />
                  </h3>
                  <div
                    className="ladder-options"
                    role="group"
                    aria-label="Choose an interpretation / Pilih penafsiran"
                  >
                    {(repairing ? item!.repair!.options : item!.options).map(
                      (option, i) => (
                        <button
                          key={i}
                          className={`ladder-option ${selection === i && !uncertain ? "selected" : ""}`}
                          aria-pressed={selection === i && !uncertain}
                          disabled={busy || (repairing && task!.tries >= 2)}
                          onClick={() => {
                            setSelection(i);
                            setUncertain(false);
                          }}
                        >
                          <b>{String.fromCharCode(65 + i)}</b>
                          <span>
                            <Words text={option} />
                          </span>
                          <span aria-hidden="true">
                            {selection === i && !uncertain ? "●" : "○"}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                  {!repairing ? (
                    <button
                      className={`ladder-unsure ${uncertain ? "selected" : ""}`}
                      aria-pressed={uncertain}
                      onClick={() => {
                        setUncertain(true);
                        setSelection(null);
                      }}
                    >
                      I’m not sure yet / Aku belum yakin
                    </button>
                  ) : (
                    <label className="ladder-explanation">
                      Explain what is happening / Jelaskan apa yang terjadi
                      <textarea
                        value={explanation}
                        maxLength={1200}
                        disabled={busy}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder="A short explanation is enough. Indonesian, English, or both. / Penjelasan singkat saja. Boleh bahasa Indonesia, Inggris, atau campuran."
                      />
                      <small>
                        This is about the meaning, not your grammar. / Fokus
                        pada makna, bukan tata bahasa.
                      </small>
                    </label>
                  )}
                  {!repairing ? (
                    <button
                      className="ladder-primary"
                      disabled={
                        busy || !played || (selection === null && !uncertain)
                      }
                      onClick={() =>
                        send({
                          kind: "choice",
                          item: index,
                          choice: uncertain ? null : selection,
                        })
                      }
                    >
                      {busy
                        ? "Saving / Menyimpan…"
                        : !played
                          ? "Listen to the end of this part / Dengarkan bagian ini sampai selesai"
                          : "Save choice and continue / Simpan pilihan dan lanjut →"}
                    </button>
                  ) : (
                    <>
                      <button
                        className="ladder-primary"
                        disabled={
                          busy ||
                          !played ||
                          selection === null ||
                          explanation.trim().length < 3 ||
                          task!.tries >= 2
                        }
                        onClick={() =>
                          send({
                            kind: "repair",
                            item: index,
                            choice: selection!,
                            explanation,
                          })
                        }
                      >
                        {busy
                          ? "Saving / Menyimpan…"
                          : !played
                            ? "Replay this part first / Dengar ulang bagian ini dulu"
                            : "Save my revision / Simpan revisiku ↗"}
                      </button>
                      {task!.tries > 0 && (
                        <details className="ladder-support">
                          <summary>Open guided review / Buka panduan</summary>
                          <p>
                            <Words text={item!.repair!.supportedMeaning!} />
                          </p>
                          <p>
                            Explain this connection in your own words in the box
                            above, then continue.
                            <small>
                              Jelaskan hubungan ini dengan kata-katamu di kotak
                              tadi, lalu lanjut.
                            </small>
                          </p>
                          <button
                            className="ladder-secondary"
                            disabled={
                              busy || explanation.trim().length < 3 || !played
                            }
                            onClick={() =>
                              send({
                                kind: "support",
                                item: index,
                                explanation,
                              })
                            }
                          >
                            Complete with guidance / Selesaikan dengan panduan
                          </button>
                        </details>
                      )}
                    </>
                  )}
                  {view.pin && (
                    <button
                      className="ladder-help"
                      disabled={busy || view.state.helpRequested}
                      onClick={() => send({ kind: "help" })}
                    >
                      {view.state.helpRequested
                        ? "Help requested / Bantuan diminta"
                        : "Ask my teacher for help / Minta bantuan guru"}
                    </button>
                  )}
                </>
              )}
              {notice && (
                <div className="ladder-notice" role="status">
                  <Words text={notice} />
                </div>
              )}
              {noteBusy ? (
                <p className="ladder-note-status" role="status">
                  Your explanation is saved. A listening nudge is on its way. /
                  Penjelasanmu tersimpan. Petunjuk menyimak sedang disiapkan.
                </p>
              ) : (
                view.latestNote && (
                  <div className="ladder-feedback">
                    <span className="ladder-kicker">
                      FROM YOUR LAST REPLAY / DARI DENGAR ULANG TERAKHIR
                    </span>
                    <p>
                      <Words text={view.latestNote} />
                    </p>
                  </div>
                )
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
