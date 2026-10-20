"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
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
const bilingual = (text: Text) => (
  <div className={styles.bilingual}>
    <strong>{text.en}</strong>
    <span>{text.id}</span>
  </div>
);

function PreparationCard({ preparation }: { preparation: Preparation }) {
  return (
    <section className={styles.card} aria-labelledby="preparation-title">
      <p className={styles.eyebrow}>Preparation material / Materi persiapan</p>
      <h2 id="preparation-title">What to do with this question type</h2>
      {bilingual(preparation.questionTask)}
      <h3>Listening target / Fokus menyimak</h3>
      {bilingual(preparation.listeningTarget)}
      <div className={styles.materialGrid}>
        <section>
          <h3>Decision process / Langkah menentukan jawaban</h3>
          <ol>{preparation.procedure.map((x, i) => <li key={i}>{x.en}<br /><small>{x.id}</small></li>)}</ol>
        </section>
        <section>
          <h3>Distractors to inspect / Pengecoh yang perlu diperiksa</h3>
          <ul>{preparation.distractorPatterns.map((x, i) => <li key={i}>{x.en}<br /><small>{x.id}</small></li>)}</ul>
        </section>
        <section className={styles.example}>
          <h3>Worked example / Contoh pembahasan</h3>
          <p>{preparation.example.dialogue.en}<br /><small>{preparation.example.dialogue.id}</small></p>
          <p><strong>{preparation.example.question.en}</strong><br /><small>{preparation.example.question.id}</small></p>
          <p>{preparation.example.discussion.en}<br /><small>{preparation.example.discussion.id}</small></p>
        </section>
        <section>
          <h3>Ask yourself / Tanyakan pada diri sendiri</h3>
          <ul>{preparation.inquiryPrompts.map((x, i) => <li key={i}>{x.en}<br /><small>{x.id}</small></li>)}</ul>
        </section>
        {preparation.languageNotes.length > 0 && <section>
          <h3>Language notes / Catatan bahasa</h3>
          <ul>{preparation.languageNotes.map((x, i) => <li key={i}>{x.en}<br /><small>{x.id}</small></li>)}</ul>
        </section>}
      </div>
    </section>
  );
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
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
    try {
      const next = await savedMutation<HostView>("host:create", { kind: "create", key: id() });
      setPin(next.pin); setView(next); history.replaceState(null, "", `?pin=${next.pin}`);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Unable to create session"); }
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
  const active = view.groups[view.activeGroup];
  return <WorkshopFrame teacher>
    <div className={styles.status}><span className={styles.pin}>{view.pin}</span><span>{view.participantCount} joined / bergabung</span><span>{view.phase}</span><span>Group {view.activeGroup + 1} / {view.groups.length}</span></div>
    {message && <p className={styles.notice} role="alert">{message}</p>}
    <div className={styles.layout}>
      <div>
        <header className={styles.heading}><p className={styles.eyebrow}>{active.skill}</p><h1>{active.title.en}</h1><p>{active.title.id}</p></header>
        <PreparationCard preparation={view.preparation} />
        {view.phase === "practice" && <section className={styles.card}>
          <h2>Current group / Kelompok saat ini</h2>
          <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Item</th><th>Not started</th><th>Correct first listen</th><th>Relistening</th><th>Completed</th></tr></thead><tbody>{view.items.map((item, index) => <tr key={item.id}><td>{index + 1}. {item.title.en}</td><td>{item.notStarted}</td><td>{item.firstListenCorrect}</td><td>{item.relistening}</td><td>{item.completed}</td></tr>)}</tbody></table></div>
        </section>}
      </div>
      <aside>
        <section className={styles.card}><h2>Skill groups / Kelompok keterampilan</h2><div className={styles.groups}>{view.groups.map((group, index) => <div key={group.id} className={`${styles.group} ${index === view.activeGroup ? styles.groupActive : ""}`}><strong>{index + 1}. {group.title.en}</strong><br /><span>{group.itemCount} items</span></div>)}</div></section>
        <section className={styles.card}><h2>Participants / Peserta</h2><ul className={styles.roster}>{view.participants.map((p, i) => <li key={`${p.alias}-${i}`}>{p.alias}</li>)}</ul>{view.participants.length === 0 && <p>No learners have joined yet. / Belum ada siswa yang bergabung.</p>}</section>
        <div className={styles.controls}>
          {view.phase === "preparation" && <button className={styles.button} disabled={busy} onClick={() => void act({ kind: "open_practice" })}>Open practice / Mulai latihan</button>}
          {view.phase === "practice" && <button className={styles.button} disabled={busy} onClick={() => void act({ kind: "next_group" })}>Open next material / Buka materi berikutnya</button>}
          {!['closed','finished'].includes(view.phase) && <button className={`${styles.button} ${styles.danger}`} disabled={busy} onClick={() => void act({ kind: "close" })}>Close session / Tutup sesi</button>}
        </div>
      </aside>
    </div>
  </WorkshopFrame>;
}

function WorkshopWelcome({ teacher, pin, setPin, busy, message, onPrimary, onResume }: { teacher: boolean; pin: string; setPin: (x:string)=>void; busy:boolean; message:string; onPrimary:()=>void; onResume:()=>void }) {
  return <WorkshopFrame teacher={teacher}><section className={styles.welcome}><p className={styles.eyebrow}>Part A listening workshop</p><h1>{teacher ? "Prepare, listen, and examine each option." : "Join your class."}</h1><p>{teacher ? "Students read the preparation material, listen on their own headphones, and explain why distractors do not fit. / Siswa membaca materi persiapan, menyimak dengan headphone masing-masing, dan menjelaskan mengapa pengecoh tidak sesuai." : "Enter the six-digit PIN from your teacher. / Masukkan PIN enam angka dari guru."}</p>{message && <p className={styles.notice} role="alert">{message}</p>}{teacher && <button className={styles.button} disabled={busy} onClick={onPrimary}>Create session / Buat sesi</button>}<form className={styles.joinForm} onSubmit={e=>{e.preventDefault();onResume();}}><label>Session PIN / PIN sesi<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,""))} required /></label><button className={`${styles.button} ${styles.secondary}`} disabled={busy}>{teacher ? "Resume / Lanjutkan" : "Join / Gabung"}</button></form></section></WorkshopFrame>;
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
  const [drafts, setDrafts] = useState<Partial<Record<Option,string>>>({});
  const [celebrate, setCelebrate] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const accept = useCallback((next: LearnerView) => { setView(next); setReceivedAt(Date.now()); setTick(Date.now()); }, []);
  const refresh = useCallback(async () => {
    if (!/^\d{6}$/.test(pin)) return;
    try { accept(await json<LearnerView>(`/api/workshop?pin=${pin}`)); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Unable to refresh"); }
  }, [pin, accept]);
  useEffect(() => { if (!view) return; const poll=setInterval(()=>void refresh(),2000), clock=setInterval(()=>setTick(Date.now()),250); return()=>{clearInterval(poll);clearInterval(clock);}; }, [view,refresh]);
  async function join() { setBusy(true);setMessage("");try{const next=await savedMutation<LearnerView>(`learner:join:${pin}`,{kind:"join",pin,key:id()});accept(next);history.replaceState(null,"",`?pin=${pin}`);}catch(e){setMessage(e instanceof Error?e.message:"Unable to join");}finally{setBusy(false);} }
  async function act(action: LearnerAction) { if(!view)return null;setBusy(true);setMessage("");try{const previous=view.current?.result;const next=await savedMutation<LearnerView>(`learner:act:${view.pin}`,{kind:"act",pin:view.pin,key:id(),revision:view.revision,action});accept(next);if(previous!==next.current?.result&&next.current?.result?.result==="correct"){setCelebrate(true);setTimeout(()=>setCelebrate(false),1800);}await refresh();return next;}catch(e){setMessage(e instanceof Error?e.message:"Unable to save");await refresh();return null;}finally{setBusy(false);} }
  async function listen() { const item=view?.current;if(!item)return;const next=await act({kind:"listen_start",itemId:item.id});if(next?.current&&audio.current){audio.current.currentTime=0;void audio.current.play().catch(()=>setMessage("Press play in the audio control. / Tekan putar pada kontrol audio."));} }
  if (!view) return <WorkshopWelcome teacher={false} pin={pin} setPin={setPin} busy={busy} message={message} onPrimary={()=>{}} onResume={()=>void join()} />;
  const current=view.current, now=workshopClock(view.serverTime,receivedAt,tick), opens=secondsUntil(current?.answerOpensAt??null,now), closes=secondsUntil(current?.deadline??null,now), replay=secondsUntil(current?.replayEndsAt??null,now);
  const timedOpen=current?.phase==="timed_choice"&&opens===0&&closes!==0;
  return <WorkshopFrame teacher={false}>{celebrate&&<div className={styles.confetti} aria-hidden>{Array.from({length:28},(_,i)=><i key={i} style={{left:`${(i*37)%100}%`,animationDelay:`${(i%7)*.06}s`,"--drift":`${(i%2?1:-1)*(20+i)}px`} as React.CSSProperties}/>)}</div>}<div className={styles.status}><span className={styles.pin}>{view.pin}</span><span>{view.alias}</span><span>{view.phase}</span><span>{view.group.title.en}</span></div>{message&&<p className={styles.notice} role="alert">{message}</p>}<header className={styles.heading}><p className={styles.eyebrow}>{view.group.skill}</p><h1>{view.group.title.en}</h1><p>{view.group.title.id}</p></header>
    {view.phase==="preparation"&&<PreparationCard preparation={view.group.preparation}/>} {view.phase==="practice"&&current&&<section className={styles.card}><p className={styles.eyebrow}>{current.title.en}</p><h2>{current.prompt.en}</h2><p>{current.prompt.id}</p><audio ref={audio} className={styles.audio} src={current.audioUrl} preload="auto" controls={current.startedAt!==null}/>{current.phase==="ready"&&<button className={styles.button} disabled={busy} onClick={()=>void listen()}>Start listening / Mulai menyimak</button>}{["relisten_1","relisten_2"].includes(current.phase)&&<><div className={styles.hint}>{current.hint&&bilingual(current.hint)}</div><button className={styles.button} disabled={busy||current.replayEndsAt!==null} onClick={()=>void listen()}>Relisten with this focus / Dengarkan ulang dengan fokus ini</button>{current.replayEndsAt&&<p className={styles.timer} aria-live="polite">{replay&&replay>0?`Listen to the end — ${replay}s / Dengarkan sampai selesai — ${replay} dtk`:"Choose again / Pilih kembali"}</p>}</>}{current.phase==="guided_compare"&&<div className={styles.hint}>{current.comparison&&bilingual(current.comparison)}</div>}{current.phase==="timed_choice"&&<p className={styles.timer} aria-live="polite">{opens&&opens>0?`Listen first — options open in ${opens}s / Dengarkan dahulu — pilihan terbuka dalam ${opens} dtk`:`Choose now: ${closes}s / Pilih sekarang: ${closes} dtk`}</p>}{["timed_choice","relisten_1","relisten_2","guided_compare"].includes(current.phase)&&<div className={styles.options}>{(Object.entries(current.options) as [Option,string][]).map(([option,text])=><button key={option} className={styles.option} disabled={busy||(current.phase==="timed_choice"&&!timedOpen)||(current.phase.startsWith("relisten")&&(current.replayEndsAt===null||replay!==0))} onClick={()=>void act({kind:"choose",itemId:current.id,choice:option})}><b>{option}</b><span>{text}</span></button>)}</div>}{current.phase==="explain_distractors"&&<><p className={styles.result} role="status">Correct. Now account for every distractor. / Benar. Sekarang jelaskan setiap pengecoh.</p>{current.explanationOptions.map(option=>current.explanations[option]!==undefined?<p key={option} className={styles.result}>Option {option}: {current.explanations[option]}</p>:<form key={option} className={styles.explanation} onSubmit={e=>{e.preventDefault();void act({kind:"explain",itemId:current.id,option,text:drafts[option]??""});}}><label htmlFor={`explain-${option}`}>Why option {option} does not fit / Mengapa pilihan {option} tidak sesuai</label><textarea id={`explain-${option}`} minLength={3} maxLength={400} value={drafts[option]??""} onChange={e=>setDrafts({...drafts,[option]:e.target.value})} required/><div><button className={styles.button} disabled={busy}>Save explanation / Simpan penjelasan</button></div></form>)}</>}{current.phase==="item_complete"&&<><p className={styles.result}>Item complete. / Butir selesai.</p><button className={styles.button} disabled={busy} onClick={()=>{setDrafts({});void act({kind:"next_item",itemId:current.id});}}>Continue / Lanjutkan</button></>}</section>}{view.phase==="practice"&&!current&&<section className={styles.card}><h2>Group complete / Kelompok selesai</h2><p>Wait for your teacher to open the next material. / Tunggu guru membuka materi berikutnya.</p></section>}{view.phase==="finished"&&<section className={styles.card}><h2>Part A workshop complete / Lokakarya Part A selesai</h2><p>Your responses and explanations have been saved. / Jawaban dan penjelasanmu telah disimpan.</p></section>}</WorkshopFrame>;
}
