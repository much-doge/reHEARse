"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { serverNowAt } from "./server-clock";

type Section = "listening" | "structure" | "reading";
type Assignment = { id: string; code: string; version: number; title: string; listeningMode: "autoplay" | "question_click"; hasAttempt: boolean };
type Timing = {
  audioDurationMs: number;
  pauses: Array<{ question: number; answerWindowStartMs: number; answerWindowEndMs: number; durationMs: number }>;
  questions: Array<{ question: number; groupId: string; groupType: string; questionAudioStartMs: number; questionAudioEndMs: number; contextStartMs: number; answerWindowStartMs: number; answerWindowEndMs: number }>;
};
type SectionResult = { correct: number; incorrect: number; omitted: number; total: number; converted: [number, number] | null };
type ReviewItem = { section: Section; question: number; selected: string | null; correctAnswer: string; correct: boolean };
type Result = { sections: Record<Section, SectionResult>; total: { correct: number; incorrect: number; omitted: number; questions: number }; convertedTotal: [number, number] | null; review: ReviewItem[] };
type SectionRetakeResult = { section: Section; summary: SectionResult; review: ReviewItem[]; answers: Record<string, string> };
type SectionRetakeHistory = { id: string; section: Section; number: number; completedAt: string; result: SectionRetakeResult };
type DiagnosticState = {
  id: string; attemptNumber: number; isPrimary: boolean; status: "in_progress" | "completed";
  scope: "full" | Section; parentAttemptId: string | null; primaryAttemptId?: string; sectionRetakeNumber: number | null;
  currentSection: "listening" | "structure" | "reading" | "completed"; listeningMode: "autoplay" | "question_click";
  listeningStartedAt: string | null; structureStartedAt: string | null; structureDeadlineAt: string | null;
  readingStartedAt: string | null; readingDeadlineAt: string | null; serverTime: string;
  answers: Record<string, string>; heardListeningQuestions: number[]; lastListeningPositionMs: number;
  selectedQuestions?: number[] | null; showListeningQuestionText?: boolean;
  result?: Result; primaryResult?: Result; sectionRetakeResult?: SectionRetakeResult; sectionRetakes?: SectionRetakeHistory[];
};
type Directions = {
  listening: { overview: string; partA: string; partB: string; partC: string };
  structure: { overview: string; time: string; partA: string; partB: string };
  reading: { overview: string; time: string; basis: string };
};
type Props = {
  assignment: Assignment;
  instructions: Directions;
  timing: Timing;
  initial: Record<string, unknown> | null;
  history: Array<{ id: string; attemptNumber: number; status: string; scope: string; createdAt: string; completedAt: string | null; result: { total?: { correct: number; questions: number }; summary?: { correct: number; total: number } } | null }>;
};
type StandardItem = { number: number; prompt: string; options: Record<"A" | "B" | "C" | "D", string>; part?: "A" | "B" | "C" };
type ErrorItem = { number: number; tokens: Array<{ text: string; choice?: "A" | "B" | "C" | "D" }>; options: Record<"A" | "B" | "C" | "D", string> };
type Passage = { id: string; questions: [number, number]; lines: Array<{ text: string; line: number | null; paragraphStart: boolean }> };
type StructuredPayload = { section: Section; part?: "completion" | "errorIdentification"; item: StandardItem | ErrorItem; passage?: Passage };

const counts: Record<Section, number> = { listening: 50, structure: 40, reading: 50 };
const labels: Record<Section, string> = { listening: "Listening Comprehension", structure: "Structure and Written Expression", reading: "Reading Comprehension" };

function listeningDirectionStarts(state: DiagnosticState | null) {
  if (state?.scope !== "listening" || !state.selectedQuestions?.length) return [1, 31, 38];
  const starts = new Map<number, number>();
  for (const question of state.selectedQuestions) {
    const part = question <= 30 ? 1 : question <= 37 ? 31 : 38;
    if (!starts.has(part)) starts.set(part, question);
  }
  return [...starts.values()];
}

function answerKey(section: Section, question: number) { return section + ":" + question; }
function formatRemaining(ms: number) {
  const safe = Math.max(0, ms);
  const minutes = Math.floor(safe / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1000);
  const tenths = Math.floor((safe % 1000) / 100);
  return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0") + "." + tenths;
}

async function parsePayload<T>(response: Response): Promise<T & { error?: string }> {
  return response.json() as Promise<T & { error?: string }>;
}

export function DiagnosticTest({ assignment, instructions, timing, initial, history }: Props) {
  const initialState = initial as DiagnosticState | null;
  const [state, setState] = useState<DiagnosticState | null>(initialState);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [question, setQuestion] = useState(initialState?.selectedQuestions?.[0] ?? 1);
  const [serverTime, setServerTime] = useState(() => state?.serverTime ?? new Date().toISOString());
  const [now, setNow] = useState(() => new Date(serverTime).getTime());
  const [audioNow, setAudioNow] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"incorrect" | "all">("incorrect");
  const [activePart, setActivePart] = useState<"A" | "B">("A");
  const audioRef = useRef<HTMLAudioElement>(null);
  const segmentRef = useRef<{ endMs: number; question: number } | null>(null);
  const snappedListeningQuestion = useRef(0);
  const heardRef = useRef(new Set(state?.heardListeningQuestions ?? []));
  const timeoutSent = useRef<string | null>(null);
  const clockAnchor = useRef({ server: new Date(serverTime).getTime(), monotonic: 0 });
  const section = state?.currentSection;

  const acceptState = useCallback((next: DiagnosticState) => {
    setState(next);
    setServerTime(next.serverTime);
    clockAnchor.current = { server: new Date(next.serverTime).getTime(), monotonic: performance.now() };
    heardRef.current = new Set(next.heardListeningQuestions ?? []);
  }, []);

  const refresh = useCallback(async (attemptId: string) => {
    const response = await fetch("/api/test-center/diagnostic/run/" + attemptId, { cache: "no-store" });
    const data = await parsePayload<{ state?: DiagnosticState }>(response);
    if (response.ok && data.state) acceptState(data.state);
    return response.ok ? data.state : undefined;
  }, [acceptState]);

  const act = useCallback(async (action: Record<string, unknown>) => {
    if (!state) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/test-center/diagnostic/run/" + state.id, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...action, requestId: crypto.randomUUID() }),
      });
      const data = await parsePayload<{ state?: DiagnosticState }>(response);
      if (!response.ok || !data.state) throw new Error(data.error ?? "diagnostic_unavailable");
      acceptState(data.state);
      return data.state;
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setMessage(code === "listening_incomplete" ? "Finish the Listening audio sequence before continuing." : "Your change could not be saved. Reconnect and try again.");
      await refresh(state.id);
      return undefined;
    } finally {
      setBusy(false);
    }
  }, [acceptState, refresh, state]);

  async function createAttempt(action: "start" | "retake" | "retake_section", retakeSection?: Section, parentAttemptId?: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/test-center/diagnostic/attempt/" + assignment.code, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "retake_section" ? { action, section: retakeSection, sourceAttemptId: parentAttemptId } : { action }),
      });
      const data = await parsePayload<{ attemptId?: string }>(response);
      if (!response.ok || !data.attemptId) throw new Error(data.error ?? "attempt_unavailable");
      const opened = await refresh(data.attemptId);
      setQuestion(opened?.selectedQuestions?.[0] ?? 1); setReviewOpen(false);
    } catch (error) {
      setMessage(error instanceof Error && error.message === "no_missed_questions" ? "There are no missed questions in this section to retry." : "The diagnostic could not be opened. Check your assignment and try again.");
    } finally { setBusy(false); }
  }

  useEffect(() => {
    clockAnchor.current = { server: new Date(serverTime).getTime(), monotonic: performance.now() };
    const timer = window.setInterval(() => setNow(serverNowAt(serverTime, clockAnchor.current.monotonic, performance.now())), 100);
    return () => window.clearInterval(timer);
  }, [serverTime]);

  useEffect(() => {
    if (section === "listening") document.querySelector(".ptd-question-content")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [question, section]);

  useEffect(() => {
    if (!playing || !audioRef.current) return;
    const timer = window.setInterval(() => {
      const element = audioRef.current;
      if (element) setAudioNow(element.currentTime * 1000);
    }, 100);
    return () => window.clearInterval(timer);
  }, [playing]);

  const deadline = section === "structure" ? state?.structureDeadlineAt : section === "reading" ? state?.readingDeadlineAt : null;
  const remaining = deadline ? Math.max(0, new Date(deadline).getTime() - now) : null;

  useEffect(() => {
    if (!state || state.status !== "in_progress" || remaining !== 0 || !deadline) return;
    const key = state.currentSection + ":" + deadline;
    if (timeoutSent.current === key) return;
    timeoutSent.current = key;
    const timer = window.setTimeout(() => {
      if (state.currentSection === "structure") void act({ type: "finish_section" });
      else if (state.currentSection === "reading") void act({ type: "submit" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [act, deadline, remaining, state]);

  const activeListeningWindow = useMemo(
    () => timing.pauses.find((pause) => audioNow >= pause.answerWindowStartMs && audioNow < pause.answerWindowEndMs),
    [audioNow, timing.pauses],
  );
  const passedListeningQuestion = useMemo(
    () => timing.pauses.reduce((last, pause) => audioNow >= pause.answerWindowEndMs ? pause.question : last, 0),
    [audioNow, timing.pauses],
  );
  const canAnswerListening = state?.listeningMode === "autoplay"
    ? activeListeningWindow?.question === question && !!activeListeningWindow && activeListeningWindow.answerWindowEndMs > audioNow
    : !!state?.heardListeningQuestions.includes(question);

  async function beginSection() {
    await act({ type: "begin_section" });
    setQuestion(1);
    if (audioRef.current && state?.currentSection === "listening" && state.lastListeningPositionMs > 0)
      audioRef.current.currentTime = state.lastListeningPositionMs / 1000;
  }

  async function chooseAnswer(name: Section, number: number, choice: string) {
    if (!state || busy) return;
    const saved = await act({ type: "answer", section: name, question: number, choice });
    if (saved && name === "listening" && state.listeningMode === "question_click") {
      const eligible = state.selectedQuestions?.length ? state.selectedQuestions : Array.from({ length: 50 }, (_, i) => i + 1);
      const next = eligible[eligible.indexOf(number) + 1];
      if (next) setQuestion(next);
    }
  }

  async function reportAudio(number: number, positionMs: number) {
    if (heardRef.current.has(number)) return;
    heardRef.current.add(number);
    await act({ type: "audio_played", question: number, positionMs });
  }

  async function finishListening() {
    await act({ type: "audio_played", question: 50, positionMs: timing.audioDurationMs });
    await act({ type: "finish_section" });
    setQuestion(1);
  }

  function onAutoplayTime() {
    const element = audioRef.current;
    if (!element) return;
    const current = Math.round(element.currentTime * 1000);
    setAudioNow(current);
    const active = timing.questions.find((item) => {
      const spokenQuestionCue = Math.max(item.questionAudioStartMs, item.answerWindowStartMs - 7_000);
      return current >= spokenQuestionCue && current < item.answerWindowEndMs;
    });
    if (active && snappedListeningQuestion.current !== active.question) {
      snappedListeningQuestion.current = active.question;
      setQuestion(active.question);
    }
    const answerWindow = timing.pauses.find((pause) => current >= pause.answerWindowStartMs && current < pause.answerWindowEndMs);
    if (answerWindow) void reportAudio(answerWindow.question, answerWindow.answerWindowStartMs);
  }

  async function playRange(startMs: number, endMs: number, forQuestion: number) {
    const audio = audioRef.current;
    if (!audio) return;
    segmentRef.current = { endMs, question: forQuestion };
    if (audio.readyState < 1) await new Promise<void>((resolve) => audio.addEventListener("loadedmetadata", () => resolve(), { once: true }));
    audio.currentTime = startMs / 1000;
    await audio.play();
    setPlaying(true);
  }

  async function playQuestionAudio(withContext: boolean) {
    const segment = timing.questions[question - 1];
    if (!segment) return;
    const startMs = withContext ? segment.contextStartMs : segment.questionAudioStartMs;
    await playRange(startMs, segment.questionAudioEndMs, question);
  }

  function onSegmentTime() {
    const audio = audioRef.current;
    const segment = segmentRef.current;
    if (!audio || !segment) return;
    const position = audio.currentTime * 1000;
    setAudioNow(position);
    if (position >= segment.endMs) {
      audio.pause(); setPlaying(false); segmentRef.current = null;
      void reportAudio(segment.question, segment.endMs);
    }
  }

  const sectionInstruction = section === "listening" ? instructions.listening : section === "structure" ? instructions.structure : section === "reading" ? instructions.reading : null;
  const sectionStarted = section === "listening" ? !!state?.listeningStartedAt : section === "structure" ? !!state?.structureStartedAt : section === "reading" ? !!state?.readingStartedAt : false;

  function renderQuestionPanel(name: Section) {
    const allNumbers = Array.from({ length: counts[name] }, (_, i) => i + 1);
    const numbers = state?.scope === name && state.selectedQuestions?.length ? state.selectedQuestions : allNumbers;
    const answers = state?.answers ?? {};
    const answerDisabled = busy || (name === "listening" ? !canAnswerListening : remaining === 0);
    return <div className="ptd-workspace">
      <section className="ptd-question-content">
        <StructuredQuestionCard attemptId={state!.id} section={name} question={question} selected={answers[answerKey(name, question)]} disabled={answerDisabled} onChoose={(choice) => void chooseAnswer(name, question, choice)} />
      </section>
      <aside className="ptd-answer-panel">
        <div className="ptd-current-question"><span>QUESTION</span><strong>{String(question).padStart(2, "0")}</strong><small>of {counts[name]}</small></div>
        {name === "listening" && state?.listeningMode === "question_click" && <div className="ptd-audio-controls">
          <button onClick={() => void playQuestionAudio(false)} disabled={busy || playing}>{question >= 31 && timing.questions[question - 1]?.questionAudioStartMs === timing.questions[question - 1]?.contextStartMs ? "Play conversation or talk + question" : "Play this question"}</button>
          {question >= 31 && timing.questions[question - 1]?.contextStartMs < timing.questions[question - 1]?.questionAudioStartMs && <button className="ptd-subtle-button" onClick={() => void playQuestionAudio(true)} disabled={busy || playing}>Replay conversation or talk + question</button>}
        </div>}
        {name === "listening" && state?.listeningMode === "autoplay" && <div className="ptd-audio-window">
          {activeListeningWindow ? <>Answer window · <strong>{Math.max(0, (activeListeningWindow.answerWindowEndMs - audioNow) / 1000).toFixed(1)}s</strong></> : "Listen for the next question"}
        </div>}
        <div className="ptd-question-grid-wrap">{name === "structure" && <div className="ptd-part-tabs"><button className={activePart === "A" ? "active" : ""} disabled={!numbers.some((n) => n <= 15)} onClick={() => { const first = numbers.find((n) => n <= 15); if (first) { setActivePart("A"); setQuestion(first); } }}>Part A · Questions 1–15</button><button className={activePart === "B" ? "active" : ""} disabled={!numbers.some((n) => n >= 16)} onClick={() => { const first = numbers.find((n) => n >= 16); if (first) { setActivePart("B"); setQuestion(first); } }}>Part B · Questions 16–40</button></div>}<strong>Question navigator</strong><div className="ptd-question-grid">{numbers.filter((number) => name !== "structure" || (activePart === "A" ? number <= 15 : number >= 16)).map((number) => {
          const answered = !!answers[answerKey(name, number)];
          const heard = name === "listening" && state?.heardListeningQuestions.includes(number);
          const locked = name === "listening" && (state?.listeningMode === "autoplay" ? number <= passedListeningQuestion : answered);
          return <button key={number} disabled={locked} className={[number === question ? "current" : "", answered ? "answered" : "", heard ? "heard" : ""].filter(Boolean).join(" ")} aria-label={"Question " + number + (answered ? ", answered" : ", unanswered")} onClick={() => setQuestion(number)}>{number}</button>;
        })}</div>
          <div className="ptd-grid-key"><span>Answered</span><span>Unanswered</span>{name === "listening" && <span>Audio heard</span>}</div>
        </div>
      </aside>
    </div>;
  }

  if (!state) return <><section className="ptd-welcome">
    <p className="ptd-kicker">FULL TOEFL ITP DIAGNOSTIC</p><h1>{assignment.title}</h1>
    <p className="ptd-lead">Work through all three sections in order. Your answers are saved as you go, and the complete result appears after you submit the Reading section.</p>
    <div className="ptd-section-cards">
      <article><span>01</span><h2>Listening</h2><p>50 questions · follows the complete audio sequence</p><small>{assignment.listeningMode === "autoplay" ? "Autoplay with answer pauses" : "Play each question when ready"}</small></article>
      <article><span>02</span><h2>Structure and Written Expression</h2><p>40 questions · 25 minutes</p><small>Complete sentences, then identify underlined errors</small></article>
      <article><span>03</span><h2>Reading</h2><p>50 questions · 55 minutes</p><small>Five passages with the original page arrangement</small></article>
    </div>
    {message && <p className="ptd-error" role="alert">{message}</p>}
    <button className="ptd-primary" disabled={busy} onClick={() => void createAttempt("start")}>{busy ? "Opening…" : "Begin diagnostic"}</button>
  </section>{history.length > 0 && <section className="ptd-history"><p className="ptd-kicker">YOUR RECORD</p><h2>Previous attempts</h2>{history.map((attempt) => <article key={attempt.id}><div><strong>Attempt {attempt.attemptNumber}</strong><span>{attempt.status === "completed" ? "Completed" : "In progress"} · {new Date(attempt.createdAt).toLocaleDateString()}</span></div><span>{attempt.result?.total ? `${attempt.result.total.correct}/${attempt.result.total.questions} correct` : attempt.result?.summary ? `${attempt.result.summary.correct}/${attempt.result.summary.total} correct` : "Not completed"}</span><button className="ptd-secondary" onClick={() => void refresh(attempt.id)}>Open record</button></article>)}</section>}</>;

  if (state.status === "completed" && state.scope !== "full" && state.sectionRetakeResult) return <><SectionRetakeResults
    state={state}
    busy={busy}
    onAgain={() => void createAttempt("retake_section", state.scope as Section, state.id)}
    onBack={() => { if (state.parentAttemptId) { void refresh(state.parentAttemptId); setQuestion(1); setReviewOpen(false); } }}
  /><AttemptHistoryPanel history={history} currentId={state.id} onOpen={(id) => void refresh(id)} /></>;

  if (state.status === "completed" && state.result) return <DiagnosticResults
    state={state}
    busy={busy}
    reviewOpen={reviewOpen}
    setReviewOpen={setReviewOpen}
    reviewFilter={reviewFilter}
    setReviewFilter={setReviewFilter}
    onSectionRetake={(name) => void createAttempt("retake_section", name, state.id)}
    history={history}
    onOpenAttempt={(id) => { void refresh(id); setReviewOpen(false); }}
  />;

  if (section && section !== "completed" && !sectionStarted && sectionInstruction) return <section className="ptd-section-intro">
    <p className="ptd-kicker">{state.scope === "full" ? `SECTION ${section === "listening" ? "1" : section === "structure" ? "2" : "3"}` : `SECTION RETAKE ${state.sectionRetakeNumber}`} · {labels[section]}</p>
    <h1>{section === "listening" ? "Listen carefully and answer as you go." : section === "structure" ? "Read the directions, then begin when ready." : "Read each passage and answer its questions."}</h1>
    {section === "listening" ? <div className="ptd-directions">
      <p>{instructions.listening.overview}</p>{(state.scope === "listening" && state.selectedQuestions?.length ? [...new Set(state.selectedQuestions.map((number) => number <= 30 ? "A" : number <= 37 ? "B" : "C"))] : ["A"]).map((part) => <article key={part}><span>PART {part} · QUESTIONS {part === "A" ? "1–30" : part === "B" ? "31–37" : "38–50"}</span><p>{part === "A" ? instructions.listening.partA : part === "B" ? instructions.listening.partB : instructions.listening.partC}</p></article>)}
    </div> : section === "structure" ? <div className="ptd-directions">
      <p>{instructions.structure.overview}</p><article><span>PART A · QUESTIONS 1–15 · {instructions.structure.time}</span><p>{instructions.structure.partA}</p></article>
      <article><span>PART B · QUESTIONS 16–40</span><p>{instructions.structure.partB}</p></article>
    </div> : <div className="ptd-directions">
      <article><span>55 MINUTES</span><p>{instructions.reading.time}</p></article><p>{instructions.reading.overview}</p><p>{instructions.reading.basis}</p>
    </div>}
    {message && <p className="ptd-error" role="alert">{message}</p>}
    <button className="ptd-primary" disabled={busy} onClick={() => void beginSection()}>{busy ? "Saving…" : "Begin " + labels[section]}</button>
  </section>;

  if (section === "listening") return <section className="ptd-test-section">
    <div className="ptd-section-bar"><div><p className="ptd-kicker">{state.scope === "full" ? "SECTION 1 OF 3" : `LISTENING RETAKE ${state.sectionRetakeNumber}`}</p><h1>Listening Comprehension</h1></div><span className="ptd-mode-pill">{state.listeningMode === "autoplay" ? "Autoplay" : "Question-by-question audio"}</span></div>
    <AttemptHistoryPanel history={history} currentId={state.id} onOpen={(id) => void refresh(id)} />
    <audio ref={audioRef} src={"/api/test-center/diagnostic/run/" + state.id + "/audio"} preload="auto" onTimeUpdate={state.listeningMode === "autoplay" ? onAutoplayTime : onSegmentTime} onLoadedMetadata={() => { if (state.listeningMode === "autoplay" && state.lastListeningPositionMs > 0 && audioRef.current) audioRef.current.currentTime = state.lastListeningPositionMs / 1000; }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); if (state.listeningMode === "autoplay") void finishListening(); }} />
    {state.listeningMode === "autoplay" && <div className="ptd-player-bar"><button className="ptd-primary" disabled={busy} onClick={() => {
      if (!audioRef.current) return;
      if (playing) audioRef.current.pause();
      else { void audioRef.current.play().then(() => setPlaying(true)); }
    }}>{playing ? "Pause audio" : "Play / resume audio"}</button><span>{Math.floor(audioNow / 60_000)}:{String(Math.floor(audioNow / 1000) % 60).padStart(2, "0")}</span><span>Question {activeListeningWindow?.question ?? question} of 50</span></div>}
    {state.listeningMode === "question_click" && <div className="ptd-player-bar"><span>Audio heard · {state.heardListeningQuestions.filter((number) => !state.selectedQuestions?.length || state.selectedQuestions.includes(number)).length} of {state.selectedQuestions?.length ?? 50} questions</span>{state.heardListeningQuestions.filter((number) => !state.selectedQuestions?.length || state.selectedQuestions.includes(number)).length >= (state.selectedQuestions?.length ?? 50) && <button className="ptd-primary" disabled={busy} onClick={() => void act({ type: "finish_section" })}>{state.scope === "full" ? "Continue to Structure" : "Finish Listening retake"}</button>}</div>}
    {listeningDirectionStarts(state).includes(question) && <div className="ptd-part-direction"><span>PART {question <= 30 ? "A" : question <= 37 ? "B" : "C"} · DIRECTIONS</span><p>{question <= 30 ? instructions.listening.partA : question <= 37 ? instructions.listening.partB : instructions.listening.partC}</p></div>}
    {message && <p className="ptd-error" role="alert">{message}</p>}
    {renderQuestionPanel("listening")}
  </section>;

  if (section === "structure" || section === "reading") return <section className="ptd-test-section">
    <div className="ptd-section-bar"><div><p className="ptd-kicker">{state.scope === "full" ? `SECTION ${section === "structure" ? "2" : "3"} OF 3` : `${labels[section].toUpperCase()} RETAKE ${state.sectionRetakeNumber}`}</p><h1>{labels[section]}</h1></div>
      <div className={"ptd-countdown" + ((remaining ?? 0) < 60_000 ? " urgent" : "")}><span>TIME REMAINING</span><strong>{formatRemaining(remaining ?? 0)}</strong></div>
    </div>
    <AttemptHistoryPanel history={history} currentId={state.id} onOpen={(id) => void refresh(id)} />
    <div className="ptd-in-test-direction"><span>{section === "structure" ? question <= 15 ? "PART A · SENTENCE COMPLETION" : "PART B · WRITTEN EXPRESSION" : "READING DIRECTIONS"}</span><p>{section === "structure" ? question <= 15 ? instructions.structure.partA : instructions.structure.partB : instructions.reading.overview + " " + instructions.reading.basis}</p></div>
    {message && <p className="ptd-error" role="alert">{message}</p>}
    {renderQuestionPanel(section)}
    <div className="ptd-section-footer">
      <p>Answers save as you select them. You can return to any question in this section before continuing.</p>
      <button className="ptd-primary" disabled={busy} onClick={() => {
        const fullCount = section === "structure" ? 40 : 50;
        const sequence = state.scope === section && state.selectedQuestions?.length ? state.selectedQuestions : Array.from({ length: fullCount }, (_, i) => i + 1);
        const index = sequence.indexOf(question);
        if (index < sequence.length - 1) { const next = sequence[index + 1]; setQuestion(next); if (section === "structure") setActivePart(next <= 15 ? "A" : "B"); return; }
        if (section === "structure") { setQuestion(1); setActivePart("A"); void act({ type: "finish_section" }); }
        else if (window.confirm("Finish the diagnostic and open your results? You can review answers and retry missed items afterward.")) void act({ type: "submit" });
      }}>{question < (state.scope === section && state.selectedQuestions?.length ? state.selectedQuestions.at(-1)! : section === "structure" ? 40 : 50) ? "Next question" : section === "structure" ? "Continue to Reading · Question 1" : "Finish diagnostic"}</button>
    </div>
  </section>;

  return null;
}

function StructuredQuestionCard({ attemptId, section, question, selected, disabled, onChoose }: { attemptId: string; section: Section; question: number; selected?: string; disabled: boolean; onChoose: (choice: string) => void }) {
  const requestKey = `${attemptId}:${section}:${question}`;
  const [load, setLoad] = useState<{ key: string; content?: StructuredPayload; failed?: boolean }>({ key: "" });
  useEffect(() => {
    let active = true;
    fetch(`/api/test-center/diagnostic/run/${attemptId}/items/${section}/${question}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<StructuredPayload> : Promise.reject())
      .then((data) => { if (active) setLoad({ key: requestKey, content: data }); })
      .catch(() => { if (active) setLoad({ key: requestKey, failed: true }); });
    return () => { active = false; };
  }, [attemptId, question, requestKey, section]);
  const content = load.key === requestKey ? load.content : undefined;
  const failed = load.key === requestKey && load.failed;
  if (failed) return <div className="ptd-question-card"><p className="ptd-error">This question could not be loaded. Refresh to try again.</p></div>;
  if (!content) return <div className="ptd-question-card ptd-question-loading">Loading question {question}…</div>;
  const errorItem = content.part === "errorIdentification" ? content.item as ErrorItem : null;
  const standardItem = !errorItem ? content.item as StandardItem : null;
  const errorTokens = errorItem ? groupErrorTokens(errorItem.tokens) : [];
  return <div className={"ptd-question-stage" + (content.passage ? " has-passage" : "")}>
    {content.passage && <ReadingPassage passage={content.passage} />}
    <article className="ptd-question-card">
      <header><span>{section === "structure" ? content.part === "completion" ? "PART A · SENTENCE COMPLETION" : "PART B · ERROR IDENTIFICATION" : section === "listening" ? `PART ${standardItem?.part ?? ""} · LISTENING` : "READING COMPREHENSION"}</span><strong>Question {question}</strong></header>
      {errorItem ? <p className="ptd-error-sentence">{errorTokens.map((token, index) => <span className={token.choice ? "ptd-underlined" : undefined} data-choice={token.choice} key={index}>{token.text}{index < errorTokens.length - 1 ? " " : ""}</span>)}</p> : <h2 className={section === "structure" ? "ptd-completion-prompt" : ""}>{renderQuestionPrompt(standardItem!.prompt)}</h2>}
      <p className="ptd-select-prompt">{errorItem ? "Choose the underlined word or phrase that must be changed." : "Choose the best answer."}</p>
      <div className="ptd-option-cards">{(["A", "B", "C", "D"] as const).map((choice) => <button key={choice} aria-pressed={selected === choice} disabled={disabled} onClick={() => onChoose(choice)}><span>{choice}</span><strong>{content.item.options[choice]}</strong></button>)}</div>
    </article>
  </div>;
}

function groupErrorTokens(tokens: ErrorItem["tokens"]) {
  return tokens.reduce<Array<{ text: string; choice?: "A" | "B" | "C" | "D" }>>((groups, token) => {
    const previous = groups.at(-1);
    if (previous && previous.choice === token.choice) previous.text += " " + token.text;
    else groups.push({ text: token.text, choice: token.choice });
    return groups;
  }, []);
}

function renderQuestionPrompt(prompt: string) {
  const [before, after] = prompt.split("_____");
  if (after === undefined) return prompt;
  return <>{before}<span className="ptd-sentence-blank" aria-label="missing part"><span>missing part</span></span>{after}</>;
}

function ReadingPassage({ passage }: { passage: Passage }) {
  return <article className="ptd-reading-passage"><header><span>PASSAGE</span><strong>Questions {passage.questions[0]}–{passage.questions[1]}</strong></header><div>{passage.lines.map((line, index) => <p className={line.paragraphStart ? "paragraph-start" : ""} key={index}>{line.line && <span className="line-number">{line.line}</span>}{line.text}</p>)}</div></article>;
}

function ScoreSummary({ result, title }: { result: Result; title: string }) {
  return <section className="ptd-result-summary">
    <div className="ptd-result-total"><p className="ptd-kicker">{title}</p><h2>{result.convertedTotal ? result.convertedTotal[0] + "–" + result.convertedTotal[1] : "Score range unavailable"}</h2><p>Converted total · Practice Test A table</p><div className="ptd-total-stats"><span><strong>{result.total.correct}</strong> correct</span><span><strong>{result.total.incorrect}</strong> incorrect</span><span><strong>{result.total.omitted}</strong> omitted</span></div></div>
    <div className="ptd-result-sections">{(["listening", "structure", "reading"] as const).map((name) => {
      const sectionResult = result.sections[name];
      return <article key={name} className="ptd-result-section"><div><span>{labels[name]}</span><strong>{sectionResult.correct}/{sectionResult.total}</strong></div>
        <div className="ptd-result-bar" aria-label={sectionResult.correct + " correct of " + sectionResult.total}><span style={{ width: (sectionResult.correct / sectionResult.total * 100) + "%" }} /></div>
        <p>{sectionResult.incorrect} incorrect · {sectionResult.omitted} omitted</p>
        <small>{sectionResult.converted ? "Converted " + sectionResult.converted[0] + "–" + sectionResult.converted[1] : "The source table does not list this raw-count conversion."}</small>
      </article>;
    })}</div>
  </section>;
}

function AttemptHistoryPanel({ history, currentId, onOpen }: { history: Props["history"]; currentId: string; onOpen: (id: string) => void }) {
  if (history.length < 2) return null;
  return <details className="ptd-history-drawer"><summary>Previous attempts and records <span>{history.length}</span></summary><div>{history.map((attempt) => <article key={attempt.id}><div><strong>Attempt {attempt.attemptNumber}</strong><small>{attempt.status === "completed" ? "Completed" : "In progress"} · {new Date(attempt.createdAt).toLocaleDateString()}</small></div><span>{attempt.result?.total ? `${attempt.result.total.correct}/${attempt.result.total.questions}` : attempt.result?.summary ? `${attempt.result.summary.correct}/${attempt.result.summary.total}` : "—"}</span>{attempt.id !== currentId && <button className="ptd-secondary" onClick={() => onOpen(attempt.id)}>View record</button>}</article>)}</div></details>;
}

function DiagnosticResults({ state, busy, reviewOpen, setReviewOpen, reviewFilter, setReviewFilter, onSectionRetake, history, onOpenAttempt }: {
  state: DiagnosticState; busy: boolean; reviewOpen: boolean; setReviewOpen: (value: boolean) => void;
  reviewFilter: "incorrect" | "all"; setReviewFilter: (value: "incorrect" | "all") => void; onSectionRetake: (section: Section) => void;
  history: Props["history"];
  onOpenAttempt: (id: string) => void;
}) {
  const [selected, setSelected] = useState<ReviewItem | null>(null);
  const result = state.result!;
  const review = reviewFilter === "incorrect" ? result.review.filter((item) => !item.correct) : result.review;
  return <section className="ptd-results">
    <p className="ptd-kicker">DIAGNOSTIC COMPLETE · ATTEMPT {state.attemptNumber}</p>
    <h1>Your results</h1>
    {!state.isPrimary && state.primaryResult && <ScoreSummary result={state.primaryResult} title="Your first completed result · remains your primary result" />}
    <ScoreSummary result={result} title={state.isPrimary ? "Primary diagnostic result" : "This retake · shown separately"} />
    {result.convertedTotal === null && <p className="ptd-score-note">The ETS conversion table leaves at least one raw-count value without a converted range. That section and the combined range are shown as unavailable rather than estimated.</p>}
    <div className="ptd-result-actions">
      <button className="ptd-primary" onClick={() => setReviewOpen(!reviewOpen)}>{reviewOpen ? "Close answer review" : "Review answers"}</button>
    </div>
    <section className="ptd-section-retakes">
      <div><p className="ptd-kicker">FOCUSED RETAKES</p><h2>Try one section again</h2><p>Each retake is saved separately. It does not replace or increase the result above.</p></div>
      <div className="ptd-retake-buttons">{(["listening", "structure", "reading"] as const).map((name) => { const missed = result.review.filter((item) => item.section === name && !item.correct).length; return <button className="ptd-secondary" disabled={busy || missed === 0} key={name} onClick={() => onSectionRetake(name)}>Retry missed items · {labels[name]} ({missed})</button>; })}</div>
      {!!state.sectionRetakes?.length && <div className="ptd-retake-history">{state.sectionRetakes.map((retake) => <article key={retake.id}><span>{labels[retake.section]} · Retake {retake.number}</span><strong>{retake.result.summary.correct}/{retake.result.summary.total}</strong><small>{retake.result.summary.incorrect} incorrect · {retake.result.summary.omitted} omitted</small></article>)}</div>}
    </section>
    {history.length > 1 && <section className="ptd-history"><p className="ptd-kicker">YOUR RECORD</p><h2>Attempt history</h2>{history.map((attempt) => <article key={attempt.id}><div><strong>Attempt {attempt.attemptNumber}</strong><span>{attempt.status === "completed" ? "Completed" : "In progress"} · {new Date(attempt.createdAt).toLocaleDateString()}</span></div><span>{attempt.result?.total ? `${attempt.result.total.correct}/${attempt.result.total.questions} correct` : attempt.result?.summary ? `${attempt.result.summary.correct}/${attempt.result.summary.total} correct` : "Not completed"}</span>{attempt.id !== state.id && <button className="ptd-secondary" onClick={() => onOpenAttempt(attempt.id)}>Open record</button>}</article>)}</section>}
    {reviewOpen && <div className="ptd-review">
      <div className="ptd-review-toolbar"><div><h2>Answer review</h2><p>Correct answers are available now that all sections are submitted.</p></div>
        <label>Show <select value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value as "incorrect" | "all")}><option value="incorrect">Incorrect and omitted</option><option value="all">All questions</option></select></label>
      </div>
      <div className="ptd-review-list">{review.map((item) => <button key={item.section + ":" + item.question} className={selected?.section === item.section && selected.question === item.question ? "active" : ""} onClick={() => setSelected(item)}>
        <span>{labels[item.section]} · {item.question}</span><strong>{item.correct ? "Correct" : item.selected ? "Incorrect" : "Omitted"}</strong>
      </button>)}</div>
      {selected && <article className="ptd-review-detail">
        <StructuredQuestionCard attemptId={state.id} section={selected.section} question={selected.question} selected={selected.selected ?? undefined} disabled={true} onChoose={() => undefined} />
        <p>Your answer: <strong>{selected.selected ?? "No answer"}</strong> · Correct answer: <strong>{selected.correctAnswer}</strong></p>
      </article>}
    </div>}
  </section>;
}

function SectionRetakeResults({ state, busy, onAgain, onBack }: { state: DiagnosticState; busy: boolean; onAgain: () => void; onBack: () => void }) {
  const [filter, setFilter] = useState<"incorrect" | "all">("incorrect");
  const [selected, setSelected] = useState<ReviewItem | null>(null);
  const result = state.sectionRetakeResult!;
  const summary = result.summary;
  const review = filter === "incorrect" ? result.review.filter((item) => !item.correct) : result.review;
  const accuracy = Math.round(summary.correct / summary.total * 100);
  return <section className="ptd-results">
    <p className="ptd-kicker">{labels[result.section].toUpperCase()} · RETAKE {state.sectionRetakeNumber}</p>
    <h1>Section retake complete</h1>
    <section className="ptd-section-retake-score">
      <div><span>Correct answers</span><strong>{summary.correct}<small>/{summary.total}</small></strong><p>{accuracy}% accuracy on this retake</p></div>
      <div className="ptd-retake-stat-grid"><span><strong>{summary.incorrect}</strong> Incorrect</span><span><strong>{summary.omitted}</strong> Omitted</span><span><strong>{summary.converted ? `${summary.converted[0]}–${summary.converted[1]}` : "—"}</strong> Converted range</span></div>
    </section>
    <p className="ptd-score-note">This retake is recorded separately. Your completed full diagnostic result has not changed.</p>
    <div className="ptd-result-actions"><button className="ptd-primary" onClick={onBack}>Back to complete diagnostic</button><button className="ptd-secondary" disabled={busy} onClick={onAgain}>{busy ? "Starting…" : `Retake ${labels[result.section]} again`}</button></div>
    <div className="ptd-review">
      <div className="ptd-review-toolbar"><div><h2>Retake answer review</h2><p>Open any question to compare your response with the answer key.</p></div><label>Show <select value={filter} onChange={(event) => setFilter(event.target.value as "incorrect" | "all")}><option value="incorrect">Incorrect and omitted</option><option value="all">All questions</option></select></label></div>
      <div className="ptd-review-list">{review.map((item) => <button key={item.question} className={selected?.question === item.question ? "active" : ""} onClick={() => setSelected(item)}><span>Question {item.question}</span><strong>{item.correct ? "Correct" : item.selected ? "Incorrect" : "Omitted"}</strong></button>)}</div>
      {selected && <article className="ptd-review-detail"><StructuredQuestionCard attemptId={state.id} section={result.section} question={selected.question} selected={selected.selected ?? undefined} disabled={true} onChoose={() => undefined} /><p>Your answer: <strong>{selected.selected ?? "No answer"}</strong> · Correct answer: <strong>{selected.correctAnswer}</strong></p></article>}
    </div>
  </section>;
}
