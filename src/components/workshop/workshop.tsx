"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  EnrichmentActivityId,
  EnrichmentClip,
  HostAction,
  HostView,
  LearnerAction,
  LearnerView,
  Option,
  Preparation,
  Text,
} from "@/domain/workshop/contracts";
import { secondsUntil, workshopClock } from "./time";
import { acknowledgeMutation, pendingMutation } from "./pending-mutation";
import styles from "./workshop.module.css";

const id = () => crypto.randomUUID();
const bilingual = (text: Text) => <div className={styles.bilingual}><strong>{text.en}</strong><span>{text.id}</span></div>;

function PreparationCard({ preparation }: { preparation: Preparation }) {
  return <section className={styles.card} aria-labelledby="preparation-title">
    <p className={styles.eyebrow}>Preparation material / Materi persiapan</p>
    <h2 id="preparation-title">Prepare for this listening skill / Persiapkan keterampilan menyimak ini</h2>
    <h3>Skill focus / Fokus keterampilan</h3>{bilingual(preparation.questionTask)}
    <h3>Longman skill explanation / Penjelasan keterampilan Longman</h3><div className={styles.longmanExplanation}>{bilingual(preparation.longmanReference)}</div>
    <h3>Listening target / Fokus menyimak</h3>{bilingual(preparation.listeningTarget)}
    <div className={styles.materialGrid}>
      <section><h3>Decision process / Langkah menentukan jawaban</h3><ol>{preparation.procedure.map((x, i) => <li key={i}>{x.en}<br /><small>{x.id}</small></li>)}</ol></section>
      <section><h3>Distractors to inspect / Pengecoh yang perlu diperiksa</h3><ul>{preparation.distractorPatterns.map((x, i) => <li key={i}>{x.en}<br /><small>{x.id}</small></li>)}</ul></section>
      <section><h3>Ask yourself / Tanyakan pada diri sendiri</h3><ul>{preparation.inquiryPrompts.map((x, i) => <li key={i}>{x.en}<br /><small>{x.id}</small></li>)}</ul></section>
      {preparation.languageNotes.length > 0 && <section><h3>Language notes / Catatan bahasa</h3><ul>{preparation.languageNotes.map((x, i) => <li key={i}>{x.en}<br /><small>{x.id}</small></li>)}</ul></section>}
      <section className={styles.extensionOverview}>
        <h3>Optional listening work / Latihan menyimak opsional</h3>
        <p>After a clip is complete, three untimed activities unlock. They use the same real recording and original A–D choices; they do not add a score or replace your earlier response.</p>
        <p>Setelah sebuah klip selesai, tiga kegiatan tanpa batas waktu akan terbuka. Kegiatan memakai rekaman asli dan pilihan A–D; kegiatan ini tidak memberi skor atau mengganti jawaban sebelumnya.</p>
        <ol>{preparation.extensionActivities.map((item) => <li key={item.id}><strong>{item.title.en}</strong><br /><small>{item.title.id}</small><p>{item.instruction.en}<br /><small>{item.instruction.id}</small></p></li>)}</ol>
      </section>
    </div>
  </section>;
}

function EnrichmentStudio({ clips, activities, busy, onChoose }: {
  clips: EnrichmentClip[];
  activities: Preparation["extensionActivities"];
  busy: boolean;
  onChoose: (itemId: string, activityId: EnrichmentActivityId, choice: Option) => void;
}) {
  const [played, setPlayed] = useState<Record<string, boolean>>({});
  if (clips.length === 0) return null;
  return <section className={styles.card} aria-labelledby="enrichment-studio-title">
    <p className={styles.eyebrow}>For more practice / Untuk latihan tambahan</p>
    <h2 id="enrichment-studio-title">Replay the clips you have completed / Putar ulang klip yang sudah selesai</h2>
    <p className={styles.enrichmentNote}>Optional, untimed, and unscored. Each response is saved separately from your first response and is not shown in the teacher’s live view. Activities use the real recording and A–D options only; no written source question or dialogue is shown.</p>
    <p className={styles.enrichmentNote}>Opsional, tanpa batas waktu, dan tanpa skor. Setiap jawaban disimpan terpisah dari jawaban pertamamu dan tidak ditampilkan pada tampilan langsung guru. Kegiatan memakai rekaman asli dan pilihan A–D saja; pertanyaan sumber atau dialog tidak ditampilkan secara tertulis.</p>
    <div className={styles.enrichmentClips}>{clips.map((clip) => <details className={styles.enrichmentClip} key={clip.id}>
      <summary>Clip {clip.number} · optional replay / Klip {clip.number} · dengar ulang opsional</summary>
      {activities.map((activity) => {
        const key = `${clip.id}:${activity.id}`;
        const attempts = clip.attempts[activity.id] ?? [];
        const last = attempts.at(-1);
        const complete = last?.result === "correct" || attempts.length >= 4;
        return <article className={styles.enrichmentActivity} key={activity.id}>
          <h3>{activity.title.en}<br /><small>{activity.title.id}</small></h3>
          <p>{activity.instruction.en}<br /><small>{activity.instruction.id}</small></p>
          {activity.id === "delayed-replay" && played[key] && <p className={styles.enrichmentCue}>{clip.originalChoice ? `Your first response was ${clip.originalChoice}. Compare it with the choice you make after this replay.` : "You did not record a first choice for this clip. Use this replay to make a fresh choice."}<br />{clip.originalChoice ? `Jawaban pertamamu adalah ${clip.originalChoice}. Bandingkan dengan pilihan setelah mendengarkan ulang.` : "Kamu belum mencatat pilihan pertama untuk klip ini. Gunakan pemutaran ulang untuk menentukan pilihan baru."}</p>}
          <audio className={styles.audio} src={clip.audioUrl} preload="none" controls aria-label={`Original listening recording, clip ${clip.number} / Rekaman menyimak asli, klip ${clip.number}`} onPlay={() => setPlayed((state) => ({ ...state, [key]: false }))} onEnded={() => setPlayed((state) => ({ ...state, [key]: true }))} />
          {last?.result === "correct" && <p className={styles.result} role="status">That choice fits the recording. Notice the spoken detail that supports it.<br />Pilihan itu sesuai dengan rekaman. Perhatikan detail lisan yang mendukungnya.</p>}
          {last?.result === "incorrect" && <>
            <p className={styles.notice} role="status">This choice is not yet supported by the recording. You can listen again without a timer.<br />Pilihan ini belum didukung oleh rekaman. Kamu dapat mendengarkan lagi tanpa batas waktu.</p>
            {attempts.length >= 3 ? bilingual(clip.comparison) : bilingual(clip.tips[Math.min(attempts.length - 1, 1)])}
          </>}
          {!complete && <>
            <p className={styles.enrichmentCue}>{played[key] ? "Choose the option that fits what you heard. / Pilih opsi yang sesuai dengan yang kamu dengar." : "Listen to the full recording before opening the choices. / Dengarkan seluruh rekaman sebelum membuka pilihan."}</p>
            {played[key] && <div className={styles.options}>{(Object.entries(clip.options) as [Option, string][]).map(([option, text]) => <button key={option} className={styles.option} disabled={busy} onClick={() => { setPlayed((state) => ({ ...state, [key]: false })); onChoose(clip.id, activity.id, option); }}><b>{option}</b><span>{text}</span></button>)}</div>}
          </>}
          {complete && last?.result === "incorrect" && <p className={styles.enrichmentCue}>This activity is complete. Take the skill focus into another finished clip.<br />Kegiatan ini selesai. Gunakan fokus keterampilan pada klip lain yang sudah selesai.</p>}
        </article>;
      })}
    </details>)}</div>
  </section>;
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error ?? "Request failed");
  return value as T;
}

async function savedMutation<T>(slot: string, freshBody: object): Promise<T> {
  const body = pendingMutation(sessionStorage, slot, freshBody);
  const result = await json<T>(slot.startsWith("host:") ? "/api/workshop/host" : "/api/workshop", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  acknowledgeMutation(sessionStorage, slot);
  return result;
}

export function WorkshopHost({ initialPin = "" }: { initialPin?: string }) {
  const [pin, setPin] = useState(initialPin);
  const [view, setView] = useState<HostView | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const refresh = useCallback(async () => {
    if (!/^\d{6}$/.test(pin)) return;
    try { setView(await json<HostView>(`/api/workshop/host?pin=${pin}`)); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Unable to refresh"); }
  }, [pin]);
  useEffect(() => {
    if (!view) return;
    const timer = setInterval(() => void refresh(), 2000);
    return () => clearInterval(timer);
  }, [view, refresh]);
  async function create() {
    setBusy(true); setMessage("");
    try { const next = await savedMutation<HostView>("host:create", { kind: "create", key: id() }); setPin(next.pin); setView(next); history.replaceState(null, "", `?pin=${next.pin}`); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Unable to create session"); }
    finally { setBusy(false); }
  }
  async function act(action: HostAction) {
    if (!view) return;
    setBusy(true); setMessage("");
    try { setView(await savedMutation<HostView>(`host:act:${view.pin}`, { kind: "act", pin: view.pin, key: id(), revision: view.revision, action })); await refresh(); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Unable to update session"); await refresh(); }
    finally { setBusy(false); }
  }
  if (!view) return <WorkshopWelcome teacher pin={pin} setPin={setPin} busy={busy} message={message} onPrimary={() => void create()} onResume={() => void refresh()} />;
  const active = view.groups[view.activeGroup] ?? view.groups[0];
  return <WorkshopFrame teacher>
    <div className={styles.status}><span className={styles.pin}>{view.pin}</span><span>{view.phase}</span><span>Section {view.activeGroup + 1} of {view.groups.length} / Bagian {view.activeGroup + 1} dari {view.groups.length}</span></div>
    {message && <p className={styles.notice} role="alert">{message}</p>}
    <div className={styles.layout}>
      <div>
        <header className={styles.heading}><p className={styles.eyebrow}>{active.skill}</p><h1>{active.title.en}</h1><p>{active.title.id}</p></header>
        <PreparationCard preparation={view.preparation} />
        {view.phase === "practice" && <section className={styles.card}>
          <h2>Listening signals / Sinyal kegiatan menyimak</h2>
          <p className={styles.enrichmentNote}>Only activity signals are shown: whether a first listen has started and whether a replay has been used. There are no correctness totals, participant counts, or unfinished indicators.<br />Yang ditampilkan hanya sinyal aktivitas: apakah sesi menyimak pertama telah dimulai dan apakah rekaman telah diputar ulang. Tidak ada jumlah jawaban benar, jumlah peserta, atau indikator peserta yang belum selesai.</p>
          <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Clip / Klip</th><th>First listen / Sesi pertama</th><th>Replay / Dengar ulang</th></tr></thead><tbody>{view.items.map((item, index) => item.firstListenStarted || item.replayUsed ? <tr key={item.id}><td>{index + 1}. {item.title.en}</td><td>{item.firstListenStarted ? "Started / Dimulai" : "—"}</td><td>{item.replayUsed ? "Used / Digunakan" : "—"}</td></tr> : null)}</tbody></table>{!view.items.some(item => item.firstListenStarted || item.replayUsed) && <p className={styles.enrichmentNote}>No clip activity signal yet. / Belum ada sinyal aktivitas klip.</p>}</div>
        </section>}
      </div>
      <aside>
        <section className={styles.card}><h2>Select a section / Pilih bagian</h2><div className={styles.groups}>{view.groups.map((group, index) => <div key={group.id} className={`${styles.group} ${index === view.activeGroup ? styles.groupActive : ""}`}><strong>{index + 1}. {group.title.en}</strong><br /><small>{group.title.id}</small><br /><span>{group.itemCount} clips / klip</span><button type="button" className={`${styles.button} ${styles.groupSelect}`} aria-current={index === view.activeGroup ? "step" : undefined} disabled={busy || index === view.activeGroup || ["closed", "finished"].includes(view.phase)} onClick={() => void act({ kind: "select_group", groupIndex: index })}>{index === view.activeGroup ? "Selected / Dipilih" : "Open this section / Buka bagian ini"}</button></div>)}</div></section>
        <div className={styles.controls}>
          {view.phase === "preparation" && <button className={styles.button} disabled={busy} onClick={() => void act({ kind: "open_practice" })}>Open practice / Mulai latihan</button>}
          {view.phase === "practice" && <button className={styles.button} disabled={busy} onClick={() => void act({ kind: "next_group" })}>Open next section / Buka bagian berikutnya</button>}
          {!['closed', 'finished'].includes(view.phase) && <button className={`${styles.button} ${styles.danger}`} disabled={busy} onClick={() => void act({ kind: "close" })}>Close session / Tutup sesi</button>}
        </div>
      </aside>
    </div>
  </WorkshopFrame>;
}

function WorkshopWelcome({ teacher, pin, setPin, busy, message, onPrimary, onResume }: { teacher: boolean; pin: string; setPin: (x: string) => void; busy: boolean; message: string; onPrimary: () => void; onResume: () => void }) {
  return <WorkshopFrame teacher={teacher}><section className={styles.welcome}>
    <p className={styles.eyebrow}>Part A listening workshop / Lokakarya menyimak Bagian A</p>
    <h1>{teacher ? "Prepare, listen, and examine each option." : "Join your class."}</h1>
    <p>{teacher ? "Learners use the Longman-aligned preparation, listen on their own headphones, and compare the original choices. / Siswa menggunakan materi persiapan yang mengacu pada Longman, menyimak dengan headphone masing-masing, dan membandingkan pilihan asli." : "Enter the six-digit PIN from your teacher. / Masukkan PIN enam angka dari guru."}</p>
    {message && <p className={styles.notice} role="alert">{message}</p>}
    {teacher && <button className={styles.button} disabled={busy} onClick={onPrimary}>Create session / Buat sesi</button>}
    <form className={styles.joinForm} onSubmit={(e) => { e.preventDefault(); onResume(); }}>
      <label>Session PIN / PIN sesi<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} required /></label>
      <button className={`${styles.button} ${styles.secondary}`} disabled={busy}>{teacher ? "Resume / Lanjutkan" : "Join / Gabung"}</button>
    </form>
  </section></WorkshopFrame>;
}

function WorkshopFrame({ teacher, children }: { teacher: boolean; children: React.ReactNode }) {
  return <div className={styles.shell}><nav className={styles.nav}><Link href="/"><strong>reHEARse</strong></Link><span>PART A LISTENING WORKSHOP</span><Link href={teacher ? "/workshop/join" : "/workshop"}>{teacher ? "Learner entry / Masuk siswa" : "Teacher / Guru"}</Link></nav><main className={styles.main}>{children}</main></div>;
}

export function WorkshopLearner({ initialPin = "" }: { initialPin?: string }) {
  const [pin, setPin] = useState(initialPin);
  const [view, setView] = useState<LearnerView | null>(null);
  const [receivedAt, setReceivedAt] = useState(0);
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<Partial<Record<Option, string>>>({});
  const [celebrate, setCelebrate] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const accept = useCallback((next: LearnerView) => { setView(next); setReceivedAt(Date.now()); setTick(Date.now()); }, []);
  const refresh = useCallback(async () => {
    if (!/^\d{6}$/.test(pin)) return;
    try { accept(await json<LearnerView>(`/api/workshop?pin=${pin}`)); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Unable to refresh"); }
  }, [pin, accept]);
  useEffect(() => {
    if (!view) return;
    const poll = setInterval(() => void refresh(), 2000);
    const clock = setInterval(() => setTick(Date.now()), 250);
    return () => { clearInterval(poll); clearInterval(clock); };
  }, [view, refresh]);
  async function join() {
    setBusy(true); setMessage("");
    try { const next = await savedMutation<LearnerView>(`learner:join:${pin}`, { kind: "join", pin, key: id() }); accept(next); history.replaceState(null, "", `?pin=${pin}`); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Unable to join"); }
    finally { setBusy(false); }
  }
  async function act(action: LearnerAction) {
    if (!view) return null;
    setBusy(true); setMessage("");
    try {
      const previous = view.current?.result;
      const next = await savedMutation<LearnerView>(`learner:act:${view.pin}`, { kind: "act", pin: view.pin, key: id(), revision: view.revision, action });
      accept(next);
      if (action.kind === "choose" && previous !== next.current?.result && next.current?.result?.result === "correct") { setCelebrate(true); setTimeout(() => setCelebrate(false), 1800); }
      await refresh(); return next;
    } catch (e) { setMessage(e instanceof Error ? e.message : "Unable to save"); await refresh(); return null; }
    finally { setBusy(false); }
  }
  async function listen() {
    const item = view?.current; if (!item) return;
    const next = await act({ kind: "listen_start", itemId: item.id });
    if (next?.current && audio.current) { audio.current.currentTime = 0; void audio.current.play().catch(() => setMessage("Press play in the audio control. / Tekan putar pada kontrol audio.")); }
  }
  if (!view) return <WorkshopWelcome teacher={false} pin={pin} setPin={setPin} busy={busy} message={message} onPrimary={() => {}} onResume={() => void join()} />;
  const current = view.current;
  const now = workshopClock(view.serverTime, receivedAt, tick);
  const opens = secondsUntil(current?.answerOpensAt ?? null, now);
  const closes = secondsUntil(current?.deadline ?? null, now);
  const replay = secondsUntil(current?.replayEndsAt ?? null, now);
  const timedOpen = current?.phase === "timed_choice" && opens === 0 && closes !== 0;
  const showEnrichment = ["practice", "finished"].includes(view.phase) && (current === null || current.phase === "item_complete");
  return <WorkshopFrame teacher={false}>
    {celebrate && <div className={styles.confetti} aria-hidden>{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * .06}s`, "--drift": `${(i % 2 ? 1 : -1) * (20 + i)}px` } as React.CSSProperties} />)}</div>}
    <div className={styles.status}><span className={styles.pin}>{view.pin}</span><span>{view.alias}</span><span>{view.phase}</span><span>{view.group.title.en}</span></div>
    {message && <p className={styles.notice} role="alert">{message}</p>}
    <header className={styles.heading}><p className={styles.eyebrow}>{view.group.skill}</p><h1>{view.group.title.en}</h1><p>{view.group.title.id}</p></header>
    {view.phase === "preparation" && <PreparationCard preparation={view.group.preparation} />}
    {view.phase === "practice" && current && <section className={styles.card}>
      <p className={styles.eyebrow}>{current.title.en} / {current.title.id}</p>
      <audio ref={audio} className={styles.audio} src={current.audioUrl} preload="auto" controls={current.startedAt !== null} aria-label="Original listening recording / Rekaman menyimak asli" />
      {current.phase === "ready" && <><p className={styles.enrichmentCue}>Listen to the recording, then choose from A–D. / Dengarkan rekaman, lalu pilih A–D.</p><button className={styles.button} disabled={busy} onClick={() => void listen()}>Start listening / Mulai menyimak</button></>}
      {["relisten_1", "relisten_2"].includes(current.phase) && <><div className={styles.hint}>{current.hint && bilingual(current.hint)}</div><button className={styles.button} disabled={busy || current.replayEndsAt !== null} onClick={() => void listen()}>Relisten with this focus / Dengarkan ulang dengan fokus ini</button>{current.replayEndsAt && <p className={styles.timer} aria-live="polite">{replay && replay > 0 ? `Listen to the end — ${replay}s / Dengarkan sampai selesai — ${replay} dtk` : "Choose again / Pilih kembali"}</p>}</>}
      {current.phase === "guided_compare" && <div className={styles.hint}>{current.comparison && bilingual(current.comparison)}</div>}
      {current.phase === "timed_choice" && <p className={styles.timer} aria-live="polite">{opens && opens > 0 ? `Listen first — options open in ${opens}s / Dengarkan dahulu — pilihan terbuka dalam ${opens} dtk` : `Choose now: ${closes}s / Pilih sekarang: ${closes} dtk`}</p>}
      {["timed_choice", "relisten_1", "relisten_2", "guided_compare"].includes(current.phase) && <div className={styles.options}>{(Object.entries(current.options) as [Option, string][]).map(([option, text]) => <button key={option} className={styles.option} disabled={busy || (current.phase === "timed_choice" && !timedOpen) || (current.phase.startsWith("relisten") && (current.replayEndsAt === null || replay !== 0))} onClick={() => void act({ kind: "choose", itemId: current.id, choice: option })}><b>{option}</b><span>{text}</span></button>)}</div>}
      {current.phase === "explain_distractors" && <>
        <p className={current.result?.result === "correct" ? styles.result : styles.hint} role="status">{current.result?.result === "correct" ? "Your choice fits the reviewed answer. Now account for every distractor. / Pilihanmu sesuai dengan jawaban yang ditinjau. Sekarang jelaskan setiap pengecoh." : "Your choice still differs from the reviewed answer. Compare the options with the audio before moving on. / Pilihanmu masih berbeda dari jawaban yang ditinjau. Bandingkan pilihan dengan audio sebelum melanjutkan."}</p>
        <div className={styles.options} aria-label="Original answer choices / Pilihan jawaban asli">{(Object.entries(current.options) as [Option, string][]).map(([option, text]) => <div key={option} className={styles.optionReadOnly}><b>{option}</b><span>{text}</span></div>)}</div>
        <p className={styles.enrichmentCue}>Use the choices above. For each distractor, name the specific change in meaning or detail—not only that it is incorrect.<br />Gunakan pilihan di atas. Untuk setiap pengecoh, sebutkan perubahan makna atau detail yang spesifik—bukan hanya bahwa pilihan itu salah.</p>
        {current.explanationOptions.map((option) => current.explanations[option] !== undefined ? <p key={option} className={styles.result}>Option {option}: {current.explanations[option]}</p> : <form key={option} className={styles.explanation} onSubmit={(e) => { e.preventDefault(); void act({ kind: "explain", itemId: current.id, option, text: drafts[option] ?? "" }); }}>
          <label htmlFor={`explain-${option}`}>Why option {option} does not fit / Mengapa pilihan {option} tidak sesuai</label>
          <p className={styles.enrichmentCue}>A useful start: “This option changes ___; the recording says ___.”<br />Awal kalimat: “Pilihan ini mengubah ___; rekamannya menyebut ___.”</p>
          <textarea id={`explain-${option}`} minLength={3} maxLength={400} value={drafts[option] ?? ""} onChange={(e) => setDrafts({ ...drafts, [option]: e.target.value })} required />
          <div><button className={styles.button} disabled={busy}>Save explanation / Simpan penjelasan</button></div>
        </form>)}
      </>}
      {current.phase === "item_complete" && <><p className={styles.result}>Item complete. Optional replay activities are available below. / Butir selesai. Kegiatan dengar ulang opsional tersedia di bawah.</p><button className={styles.button} disabled={busy} onClick={() => { setDrafts({}); void act({ kind: "next_item", itemId: current.id }); }}>Continue / Lanjutkan</button></>}
    </section>}
    {view.phase === "practice" && !current && <section className={styles.card}><h2>Section complete / Bagian selesai</h2><p>Your teacher will decide when to open another section. Use the optional listening studio if you want more practice.<br />Guru akan menentukan kapan membuka bagian berikutnya. Gunakan studio menyimak opsional jika ingin berlatih lagi.</p></section>}
    {view.phase === "finished" && <section className={styles.card}><h2>Part A workshop complete / Lokakarya Part A selesai</h2><p>Your responses and explanations have been saved. / Jawaban dan penjelasanmu telah tersimpan.</p></section>}
    {showEnrichment && <EnrichmentStudio clips={view.enrichment} activities={view.group.preparation.extensionActivities} busy={busy} onChoose={(itemId, activityId, choice) => void act({ kind: "enrichment_choose", itemId, activityId, choice })} />}
  </WorkshopFrame>;
}
