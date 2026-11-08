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
const bilingual = (text: Text) => <div className={styles.bilingual}><strong>{text.en}</strong></div>;
const DEFAULT_ACTIVITY_VERSION = "short-conversation-workshop-v2";
const BC_ACTIVITY_VERSION = "conversation-academic-talk-v1";
const skillLabel = (skill:string) => skill==="long-conversation" ? "Part B · Long conversation"
  : skill==="academic-talk" ? "Part C · Academic talk" : skill;

function PreparationCard({ preparation }: { preparation: Preparation }) {
  return <section className={styles.card} aria-labelledby="preparation-title">
    <p className={styles.eyebrow}>Preparation material</p>
    <h2 id="preparation-title">Prepare for this listening skill</h2>
    <h3>Skill focus</h3>{bilingual(preparation.questionTask)}
    <h3>Longman skill explanation</h3><div className={styles.longmanExplanation}>{bilingual(preparation.longmanReference)}</div>
    <h3>Listening target</h3>{bilingual(preparation.listeningTarget)}
    <div className={styles.materialGrid}>
      <section><h3>Decision process</h3><ol>{preparation.procedure.map((x, i) => <li key={i}>{x.en}</li>)}</ol></section>
      <section><h3>Distractors to inspect</h3><ul>{preparation.distractorPatterns.map((x, i) => <li key={i}>{x.en}</li>)}</ul></section>
      <section><h3>Ask yourself</h3><ul>{preparation.inquiryPrompts.map((x, i) => <li key={i}>{x.en}</li>)}</ul></section>
      {preparation.languageNotes.length > 0 && <section><h3>Language notes</h3><ul>{preparation.languageNotes.map((x, i) => <li key={i}>{x.en}</li>)}</ul></section>}
      <section className={styles.extensionOverview}>
        <h3>Optional listening work</h3>
        <p>After a clip is complete, three untimed activities unlock. They use the same real recording and original A–D choices; they do not add a score or replace your earlier response.</p>
        <ol>{preparation.extensionActivities.map((item) => <li key={item.id}><strong>{item.title.en}</strong><p>{item.instruction.en}</p></li>)}</ol>
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
  const [passagePlayed, setPassagePlayed] = useState<Record<string, boolean>>({});
  if (clips.length === 0) return null;
  return <section className={styles.card} aria-labelledby="enrichment-studio-title">
    <p className={styles.eyebrow}>For more practice</p>
    <h2 id="enrichment-studio-title">Replay the clips you have completed</h2>
    <p className={styles.enrichmentNote}>Optional, untimed, and unscored. Each response is saved separately from your first response and is not shown in the teacher’s live view. Activities use the real recording and A–D options only; no written source question or dialogue is shown.</p>
    <div className={styles.enrichmentClips}>{clips.map((clip) => <details className={styles.enrichmentClip} key={clip.id}>
          <summary>{clip.questionNumber ? `Question ${clip.questionNumber}` : `Clip ${clip.number}`} · optional replay</summary>
      {activities.map((activity) => {
        const key = `${clip.id}:${activity.id}`;
        const attempts = clip.attempts[activity.id] ?? [];
        const last = attempts.at(-1);
        const complete = last?.result === "correct" || attempts.length >= 4;
        return <article className={styles.enrichmentActivity} key={activity.id}>
          <h3>{activity.title.en}</h3>
          <p>{activity.instruction.en}</p>
          {activity.id === "delayed-replay" && played[key] && <p className={styles.enrichmentCue}>{clip.originalChoice ? `Your first response was ${clip.originalChoice}. Compare it with the choice you make after this replay.` : "You did not record a first choice for this clip. Use this replay to make a fresh choice."}</p>}
          {clip.passageAudioUrl && <label className={styles.enrichmentCue}>Replay the conversation or talk<audio className={styles.audio} src={clip.passageAudioUrl} preload="none" controls aria-label={`Shared passage recording, question ${clip.questionNumber}`} onPlay={() => { setPlayed((state) => ({ ...state, [key]: false })); setPassagePlayed((state) => ({ ...state, [key]: false })); }} onEnded={() => setPassagePlayed((state) => ({ ...state, [key]: true }))} />
          </label>}
          <label className={styles.enrichmentCue}>Replay the spoken question<audio className={styles.audio} src={clip.audioUrl} preload="none" controls aria-label={`Spoken question recording, question ${clip.questionNumber ?? clip.number}`} onPlay={() => setPlayed((state) => ({ ...state, [key]: false }))} onEnded={() => setPlayed((state) => ({ ...state, [key]: true }))} />
          </label>
          {last?.result === "correct" && <p className={styles.result} role="status">That choice fits the recording. Notice the spoken detail that supports it.</p>}
          {last?.result === "incorrect" && <>
            <p className={styles.notice} role="status">This choice is not yet supported by the recording. You can listen again without a timer.</p>
            {attempts.length >= 3 ? bilingual(clip.comparison) : bilingual(clip.tips[Math.min(attempts.length - 1, 1)])}
          </>}
          {!complete && <>
            <p className={styles.enrichmentCue}>{played[key] ? "Choose the option that fits what you heard." : "Listen to the full recording before opening the choices."}</p>
            {played[key] && (!clip.passageAudioUrl || passagePlayed[key]) && <div className={styles.options}>{(Object.entries(clip.options) as [Option, string][]).map(([option, text]) => <button key={option} className={styles.option} disabled={busy} onClick={() => { setPlayed((state) => ({ ...state, [key]: false })); setPassagePlayed((state) => ({ ...state, [key]: false })); onChoose(clip.id, activity.id, option); }}><b>{option}</b><span>{text}</span></button>)}</div>}
          </>}
          {complete && last?.result === "incorrect" && <p className={styles.enrichmentCue}>This activity is complete. Take the skill focus into another finished clip.</p>}
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
  const [selectedVersion, setSelectedVersion] = useState(DEFAULT_ACTIVITY_VERSION);
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
    try { const next = await savedMutation<HostView>(`host:create:${selectedVersion}`, { kind: "create", key: id(), version: selectedVersion }); setPin(next.pin); setView(next); history.replaceState(null, "", `?pin=${next.pin}`); }
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
  if (!view) return <WorkshopWelcome teacher pin={pin} setPin={setPin} busy={busy} message={message} onPrimary={() => void create()} onResume={() => void refresh()} selectedVersion={selectedVersion} setSelectedVersion={setSelectedVersion} />;
  const active = view.groups[view.activeGroup] ?? view.groups[0];
  return <WorkshopFrame teacher>
    <div className={styles.status}><span className={styles.pin}>{view.pin}</span><span>{view.phase}</span><span>Section {view.activeGroup + 1} of {view.groups.length}</span></div>
    {message && <p className={styles.notice} role="alert">{message}</p>}
    <div className={styles.layout}>
      <div>
        <header className={styles.heading}><p className={styles.eyebrow}>{skillLabel(active.skill)}</p><h1>{active.title.en}</h1></header>
        <PreparationCard preparation={view.preparation} />
        {view.phase === "practice" && <section className={styles.card}>
          <h2>Listening signals</h2>
          <p className={styles.enrichmentNote}>Only activity signals are shown: whether a first listen has started and whether a replay has been used. There are no correctness totals, participant counts, or unfinished indicators.</p>
          <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>{view.items[0]?.questionNumber ? "Question" : "Clip"}</th><th>First listen</th><th>Replay</th></tr></thead><tbody>{view.items.map((item, index) => item.firstListenStarted || item.replayUsed ? <tr key={item.id}><td>{item.questionNumber ?? index + 1}. {item.title.en}</td><td>{item.firstListenStarted ? "Started" : "—"}</td><td>{item.replayUsed ? "Used" : "—"}</td></tr> : null)}</tbody></table>{!view.items.some(item => item.firstListenStarted || item.replayUsed) && <p className={styles.enrichmentNote}>No activity signal yet.</p>}</div>
        </section>}
      </div>
      <aside>
        <section className={styles.card}><h2>Select a section</h2><div className={styles.groups}>{view.groups.map((group, index) => <div key={group.id} className={`${styles.group} ${index === view.activeGroup ? styles.groupActive : ""}`}><strong>{index + 1}. {group.title.en}</strong><br /><span>{group.questionStart ? `Questions ${group.questionStart}–${group.questionStart + group.itemCount - 1}` : `${group.itemCount} clips`}</span><button type="button" className={`${styles.button} ${styles.groupSelect}`} aria-current={index === view.activeGroup ? "step" : undefined} disabled={busy || index === view.activeGroup || ["closed", "finished"].includes(view.phase)} onClick={() => void act({ kind: "select_group", groupIndex: index })}>{index === view.activeGroup ? "Selected" : "Open this section"}</button></div>)}</div></section>
        <div className={styles.controls}>
          {view.phase === "preparation" && <button className={styles.button} disabled={busy} onClick={() => void act({ kind: "open_practice" })}>Open practice</button>}
          {view.phase === "practice" && <button className={styles.button} disabled={busy} onClick={() => void act({ kind: "next_group" })}>Open next section</button>}
          {!['closed', 'finished'].includes(view.phase) && <button className={`${styles.button} ${styles.danger}`} disabled={busy} onClick={() => void act({ kind: "close" })}>Close session</button>}
        </div>
      </aside>
    </div>
  </WorkshopFrame>;
}

function WorkshopWelcome({ teacher, pin, setPin, busy, message, onPrimary, onResume, selectedVersion, setSelectedVersion }: { teacher: boolean; pin: string; setPin: (x: string) => void; busy: boolean; message: string; onPrimary: () => void; onResume: () => void; selectedVersion?: string; setSelectedVersion?: (value: string) => void }) {
  return <WorkshopFrame teacher={teacher}><section className={styles.welcome}>
    <p className={styles.eyebrow}>TOEFL ITP listening workshop</p>
    <h1>{teacher ? "Prepare, listen, and examine each option." : "Join your class."}</h1>
    <p>{teacher ? "Learners use the Longman-aligned preparation, listen on their own headphones, and compare the original choices." : "Enter the six-digit PIN from your teacher."}</p>
    {message && <p className={styles.notice} role="alert">{message}</p>}
    {teacher && <label>Activity<select value={selectedVersion ?? DEFAULT_ACTIVITY_VERSION} onChange={(event) => setSelectedVersion?.(event.target.value)}>
      <option value={DEFAULT_ACTIVITY_VERSION}>Part A · Short dialogues</option>
      <option value={BC_ACTIVITY_VERSION}>Parts B and C · Conversations and talks</option>
    </select></label>}
    {teacher && <button className={styles.button} disabled={busy} onClick={onPrimary}>Create session</button>}
    <form className={styles.joinForm} onSubmit={(e) => { e.preventDefault(); onResume(); }}>
      <label>Session PIN<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} required /></label>
      <button className={`${styles.button} ${styles.secondary}`} disabled={busy}>{teacher ? "Resume" : "Join"}</button>
    </form>
  </section></WorkshopFrame>;
}

function WorkshopFrame({ teacher, children }: { teacher: boolean; children: React.ReactNode }) {
  return <div className={styles.shell}><nav className={styles.nav}><Link href="/legacy"><strong>reHEARse</strong></Link><span>TOEFL ITP LISTENING WORKSHOP</span><Link href={teacher ? "/legacy/workshop/join" : "/legacy/workshop"}>{teacher ? "Learner entry" : "Teacher"}</Link></nav><main className={styles.main}>{children}</main></div>;
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
  const audioSequence = useRef<string[]>([]);
  const accept = useCallback((next: LearnerView) => { setView(next); setReceivedAt(Date.now()); setTick(Date.now()); }, []);
  const currentId=view?.current?.id,startedAt=view?.current?.startedAt,replayStartedAt=view?.current?.replayStartedAt;
  const promptAudioUrl=view?.current?.audioUrl,passageAudioUrl=view?.current?.passageAudioUrl;
  useEffect(() => {
    const player=audio.current;
    if(!startedAt||!promptAudioUrl||!player)return;
    const sequence=[passageAudioUrl,promptAudioUrl].filter((url):url is string=>Boolean(url));
    if(player.src.endsWith(sequence[0]))return;
    audioSequence.current=sequence.slice(1);player.src=sequence[0];player.load();
  },[currentId,startedAt,replayStartedAt,promptAudioUrl,passageAudioUrl]);
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
    if (next?.current) {
      audioSequence.current = [next.current.passageAudioUrl, next.current.audioUrl].filter((url): url is string => Boolean(url));
      void playNextAudio();
    }
  }
  async function playNextAudio() {
    const player = audio.current, source = audioSequence.current.shift();
    if (!player || !source) return;
    player.src = source; player.load();
    try { await player.play(); } catch { setMessage("Press play in the audio control."); }
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
    <header className={styles.heading}><p className={styles.eyebrow}>{skillLabel(view.group.skill)}</p><h1>{view.group.title.en}</h1></header>
    {view.phase === "preparation" && <PreparationCard preparation={view.group.preparation} />}
    {view.phase === "practice" && current && <section className={styles.card}>
      <p className={styles.eyebrow}>{current.title.en}</p>
      <audio ref={audio} className={styles.audio} preload="auto" controls={current.startedAt !== null} aria-label={current.passageAudioUrl ? "Shared passage, followed by the spoken question" : "Original listening recording"} onEnded={() => void playNextAudio()} />
      {current.phase === "ready" && <><p className={styles.enrichmentCue}>{current.questionNumber ? "Take notes on paper. Listen to the full conversation or talk, then the spoken question. Choose from A–D within 12 seconds." : "Listen to the recording, then choose from A–D."}</p><button className={styles.button} disabled={busy} onClick={() => void listen()}>Start listening</button></>}
      {["relisten_1", "relisten_2"].includes(current.phase) && <><div className={styles.hint}>{current.hint && bilingual(current.hint)}</div><button className={styles.button} disabled={busy || current.replayEndsAt !== null} onClick={() => void listen()}>Relisten with this focus</button>{current.replayEndsAt && <p className={styles.timer} aria-live="polite">{replay && replay > 0 ? `Listen to the end — ${replay}s` : "Choose again"}</p>}</>}
      {current.phase === "guided_compare" && <div className={styles.hint}>{current.comparison && bilingual(current.comparison)}</div>}
      {current.phase === "timed_choice" && <p className={styles.timer} aria-live="polite">{opens && opens > 0 ? `Listen first — options open in ${opens}s` : `Choose now: ${closes}s`}</p>}
      {["timed_choice", "relisten_1", "relisten_2", "guided_compare"].includes(current.phase) && <div className={styles.options}>{(Object.entries(current.options) as [Option, string][]).map(([option, text]) => <button key={option} className={styles.option} disabled={busy || (current.phase === "timed_choice" && !timedOpen) || (current.phase.startsWith("relisten") && (current.replayEndsAt === null || replay !== 0))} onClick={() => void act({ kind: "choose", itemId: current.id, choice: option })}><b>{option}</b><span>{text}</span></button>)}</div>}
      {current.phase === "explain_distractors" && <>
        <p className={current.result?.result === "correct" ? styles.result : styles.hint} role="status">{current.result?.result === "correct" ? "Your choice fits the reviewed answer. Now account for every distractor." : "Your choice still differs from the reviewed answer. Compare the options with the audio before moving on."}</p>
        <div className={styles.options} aria-label="Original answer choices">{(Object.entries(current.options) as [Option, string][]).map(([option, text]) => <div key={option} className={styles.optionReadOnly}><b>{option}</b><span>{text}</span></div>)}</div>
        <p className={styles.enrichmentCue}>Use the choices above. For each distractor, name the specific change in meaning or detail—not only that it is incorrect.</p>
        {current.explanationOptions.map((option) => current.explanations[option] !== undefined ? <p key={option} className={styles.result}>Option {option}: {current.explanations[option]}</p> : <form key={option} className={styles.explanation} onSubmit={(e) => { e.preventDefault(); void act({ kind: "explain", itemId: current.id, option, text: drafts[option] ?? "" }); }}>
          <label htmlFor={`explain-${option}`}>Why option {option} does not fit</label>
          <p className={styles.enrichmentCue}>A useful start: “This option changes ___; the recording says ___.”</p>
          <textarea id={`explain-${option}`} minLength={3} maxLength={400} value={drafts[option] ?? ""} onChange={(e) => setDrafts({ ...drafts, [option]: e.target.value })} required />
          <div><button className={styles.button} disabled={busy}>Save explanation</button></div>
        </form>)}
      </>}
      {current.phase === "item_complete" && <><p className={styles.result}>Item complete. Optional replay activities are available below.</p><button className={styles.button} disabled={busy} onClick={() => { setDrafts({}); void act({ kind: "next_item", itemId: current.id }); }}>Continue</button></>}
    </section>}
    {view.phase === "practice" && !current && <section className={styles.card}><h2>Section complete</h2><p>Your teacher will decide when to open another section. Use the optional listening studio if you want more practice.</p></section>}
    {view.phase === "finished" && <section className={styles.card}><h2>{view.activity.title.en} complete</h2><p>Your responses and explanations have been saved.</p></section>}
    {showEnrichment && <EnrichmentStudio clips={view.enrichment} activities={view.group.preparation.extensionActivities} busy={busy} onChoose={(itemId, activityId, choice) => void act({ kind: "enrichment_choose", itemId, activityId, choice })} />}
  </WorkshopFrame>;
}
