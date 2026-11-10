"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Part = "Noun" | "Verb" | "Adjective" | "Adverb";
const parts: Part[] = ["Noun", "Verb", "Adjective", "Adverb"];
type Assignment = { id: string; title: string; latestStatus: string | null; createdAt: string };
type Card = { id: string; headword: string; partsOfSpeech: Part[]; classification: string[]; priority: string[]; frequencyBand: string[]; wordForms: string[]; bookOccurrences: number | null; skillOccurrences: { listening: number; structure: number; reading: number }; sourceRows: number; example?: { sentence: string; highlightStart: number; highlightLength: number; source: "wordnet-3.0" | "rehearse-original" | "rehearse-authored" } | null };
type AnswerState = { selectedParts: Part[]; isCorrect: boolean; answeredAt?: string };
type RunData = { assignment: { id: string; title: string }; attempt: { id: string; number: number; status: string; cardOrder: string[] }; cards: Card[]; answers: Record<string, AnswerState>; openCounts: Record<string, number>; prompt: string };
type ReviewAssignment = { id: string; type: "private" | "classroom"; title: string; expiresAt: string; revoked: boolean; candidates: Array<{ id: string; learnerId: string; name: string; email: string; attempts: Array<{ id: string; number: number; status: string; createdAt: string; completedAt: string | null; archivedAt: string | null }> }> };
type ReviewCard = { id: string; headword: string; sourcePartsOfSpeech: Part[]; opened: boolean; openEvents: number; selectedParts: Part[] | null; isCorrect: boolean | null; responseTrail: Array<{ selectedParts: Part[]; isCorrect: boolean; answeredAt: string }>; lastSeen: string | null };

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "request_failed");
  return data;
}

export function VocabularyHome() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    const response = await fetch("/api/vocabulary", { cache: "no-store" });
    if (response.ok) setAssignments(((await response.json()) as { assignments: Assignment[] }).assignments);
  }, []);
  useEffect(() => {
    let current = true;
    void fetch("/api/vocabulary", { cache: "no-store" }).then(async (response) => response.ok ? (await response.json() as { assignments: Assignment[] }).assignments : []).then((items) => { if (current) setAssignments(items); });
    return () => { current = false; };
  }, []);
  async function claim(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await postJson("/api/vocabulary", { kind: "claim", code }); setCode(""); await refresh(); setMessage("Access added. Your word deck is ready.");
    } catch { setMessage("That code is unavailable. Check it with your teacher and try again."); }
    finally { setBusy(false); }
  }
  return <main className="vocab-shell">
    <header className="vocab-topbar"><Link href="/dashboard">← Dashboard</Link><span>reHEARse · WORD STUDIO</span><span>VOCABULARY PRACTICE</span></header>
    <section className="vocab-hero">
      <div className="vocab-hero-copy"><p className="vocab-kicker">WORD CLASS · QUICK ROUNDS</p><h1>Make every word<br /><em>stick.</em></h1><p>Small, focused rounds turn a long word list into something you can work through, one card at a time.</p></div>
      <div className="vocab-orbit" aria-hidden="true"><span className="orbit-word orbit-word-a">verb</span><span className="orbit-word orbit-word-b">noun</span><span className="orbit-word orbit-word-c">idea</span><span className="orbit-core">word<br /><i>✳</i></span></div>
    </section>
    <section className="vocab-content-grid">
      <div className="vocab-assignments"><div className="vocab-section-heading"><div><p className="vocab-kicker">YOUR LEARNING DESK</p><h2>Assigned word sets</h2></div><span>{assignments.length.toString().padStart(2, "0")}</span></div>
        {assignments.length ? assignments.map((assignment) => <article className="vocab-assignment-card" key={assignment.id}><div className="vocab-card-mark">Aa</div><div className="vocab-assignment-info"><span className="vocab-tag">TOEFL ITP · FREQUENCY REVIEW</span><h3>{assignment.title}</h3><p>{assignment.latestStatus === "completed" ? "Your last round is ready to review or continue." : "A fresh set of word cards is ready."}</p></div><Link className="vocab-open-link" href={`/vocabulary/${assignment.id}`}>Open cards <span>↗</span></Link></article>) : <div className="vocab-empty"><span className="vocab-empty-spark">✳</span><h3>Your next word set will land here.</h3><p>When your teacher shares a private or classroom code, add it below.</p></div>}
      </div>
      <aside className="vocab-code-panel"><p className="vocab-kicker">A CODE FROM YOUR TEACHER?</p><h2>Let’s get you in.</h2><p>Enter your access code to add the assigned word set to your desk.</p><form onSubmit={claim}><label htmlFor="vocab-code">Access code</label><input id="vocab-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} maxLength={24} autoComplete="off" placeholder="LEX-XXXXXXXXXX" required /><button disabled={busy}>{busy ? "Checking…" : "Add word set →"}</button>{message && <p className="vocab-status" role="status">{message}</p>}</form><div className="vocab-note"><b>About this deck</b><p>Choose the roles that fit each word. Your choice gets immediate feedback, and an example sentence shows the word in context.</p></div></aside>
    </section>
  </main>;
}

export function VocabularyPlay({ assignmentId }: { assignmentId: string }) {
  const [run, setRun] = useState<RunData | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Part[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; partial: boolean; expected: Part[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const openedRef = useRef("");
  const fetchRun = useCallback(async (attemptId?: string) => {
    const query = new URLSearchParams({ assignmentId });
    if (attemptId) query.set("attemptId", attemptId);
    const response = await fetch(`/api/vocabulary?${query}`, { cache: "no-store" });
    if (!response.ok) throw new Error("This assignment is not available to your account. Return to Word desk and ask your teacher to check your access code.");
    return response.json() as Promise<RunData>;
  }, [assignmentId]);
  const applyRun = useCallback((data: RunData) => {
    setRun(data);
    const currentAnswer = data.cards[0] ? data.answers[data.cards[0].id] : null;
    const expected = data.cards[0]?.partsOfSpeech ?? [];
    const saved = currentAnswer?.selectedParts ?? [];
    setSelected(saved); setFeedback(currentAnswer ? { correct: currentAnswer.isCorrect, partial: !currentAnswer.isCorrect && saved.length > 0 && saved.every((part) => expected.includes(part)), expected } : null); setIndex(0);
  }, []);
  useEffect(() => {
    let current = true;
    void fetchRun().then((data) => { if (current) applyRun(data); }).catch((error) => { if (current) setMessage(error instanceof Error ? error.message : "The word deck could not be opened."); });
    return () => { current = false; };
  }, [applyRun, fetchRun]);
  const card = run?.cards[index];
  const isDone = run?.attempt.status === "completed";
  useEffect(() => {
    if (!run || !card || isDone || openedRef.current === `${run.attempt.id}:${card.id}`) return;
    openedRef.current = `${run.attempt.id}:${card.id}`;
    void postJson("/api/vocabulary", { kind: "open", attemptId: run.attempt.id, cardId: card.id }).then(() => setRun((current) => current ? { ...current, openCounts: { ...current.openCounts, [card.id]: (current.openCounts[card.id] ?? 0) + 1 } } : current)).catch(() => { openedRef.current = ""; });
  }, [run?.attempt.id, card?.id, isDone, run, card]);
  useEffect(() => {
    if (!run || isDone) return;
    function onKey(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLButtonElement || event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowLeft") go(index - 1);
      if (event.key === "ArrowRight") go(index + 1);
    }
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  });
  function go(nextIndex: number) {
    if (!run || nextIndex < 0 || nextIndex >= run.cards.length) return;
    setIndex(nextIndex); const nextCard = run.cards[nextIndex]; const previous = run.answers[nextCard.id];
    const saved = previous?.selectedParts ?? [];
    setSelected(saved); setFeedback(previous ? { correct: previous.isCorrect, partial: !previous.isCorrect && saved.length > 0 && saved.every((part) => nextCard.partsOfSpeech.includes(part)), expected: nextCard.partsOfSpeech } : null); setMessage(""); setCelebrate(false);
  }
  async function togglePart(part: Part) {
    if (!run || !card || busy || isDone || !run.openCounts[card.id]) return;
    const next = selected.includes(part) ? selected.filter((value) => value !== part) : [...selected, part];
    if (!next.length) return;
    setSelected(next); setFeedback(null); setCelebrate(false); setMessage("");
    setBusy(true); setMessage("");
    try {
      const result = await postJson<{ isCorrect: boolean; expectedParts: Part[] }>("/api/vocabulary", { kind: "answer", attemptId: run.attempt.id, cardId: card.id, selectedParts: next });
      const partial = !result.isCorrect && next.every((value) => result.expectedParts.includes(value));
      const answer = { selectedParts: next, isCorrect: result.isCorrect };
      setRun((current) => current ? { ...current, answers: { ...current.answers, [card.id]: answer } } : current);
      setFeedback({ correct: result.isCorrect, partial, expected: result.expectedParts }); setCelebrate(result.isCorrect);
    } catch { setMessage("Your response did not save. Please try again."); }
    finally { setBusy(false); }
  }
  async function finish() {
    if (!run) return; setBusy(true);
    try { await postJson("/api/vocabulary", { kind: "complete", attemptId: run.attempt.id }); setRun((current) => current ? { ...current, attempt: { ...current.attempt, status: "completed" } } : current); }
    catch { setMessage("This round could not be completed yet."); }
    finally { setBusy(false); }
  }
  async function nextRound(missedOnly: boolean) {
    if (!run) return; setBusy(true); setMessage("");
    try { const next = await postJson<{ attemptId: string }>("/api/vocabulary", { kind: "next", assignmentId, previousAttemptId: run.attempt.id, missedOnly }); openedRef.current = ""; applyRun(await fetchRun(next.attemptId)); }
    catch (error) { setMessage(error instanceof Error && error.message === "no_missed_cards" ? "There are no missed cards to repeat in this round." : "The next round could not be started."); }
    finally { setBusy(false); }
  }
  if (!run || !card) return <main className="vocab-play-shell"><header className="vocab-topbar"><Link href="/vocabulary">← Word desk</Link><span>reHEARse · WORD STUDIO</span></header><p className="vocab-load-message">{message || "Opening your word cards…"}</p></main>;
  const cardStatus = (id: string) => run.answers[id]?.isCorrect === true ? "right" : run.answers[id]?.isCorrect === false ? "wrong" : run.openCounts[id] ? "opened" : "new";
  return <main className="vocab-play-shell">
    <header className="vocab-topbar"><Link href="/vocabulary">← Word desk</Link><span>reHEARse · WORD STUDIO</span><Link href="/dashboard">Dashboard</Link></header>
    <section className="vocab-play-heading"><div><p className="vocab-kicker">TOEFL ITP · FREQUENCY REVIEW</p><h1>{run.assignment.title}</h1><p>Tap every role that fits the word. Each choice gives you instant feedback.</p></div><div className="vocab-round-mark"><span>ROUND</span><b>{String(run.attempt.number).padStart(2, "0")}</b></div></section>
    <div className="vocab-progress-row"><span>WORD CARD <b>{String(index + 1).padStart(2, "0")}</b> <i>OF</i> {String(run.cards.length).padStart(2, "0")}</span><span>{card.classification.slice(0, 2).join(" · ")}</span></div>
    <div className="vocab-play-layout">
      <section className={`vocab-flashcard${feedback ? feedback.correct || feedback.partial ? " is-correct" : " is-wrong" : ""}`}>
        {celebrate && <div className="vocab-confetti" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <span key={i} style={{ "--confetti-i": i } as React.CSSProperties} />)}</div>}
        <div className="vocab-card-topline"><span className="vocab-card-category">{card.priority[0]?.split(" — ")[0] ?? "WORD"}</span><span className="vocab-card-count">{card.bookOccurrences?.toLocaleString("en-US") ?? "—"} <small>source occurrences</small></span></div>
        <div className="vocab-card-word-wrap"><span className="vocab-word-spark spark-one">✳</span><span className="vocab-word-spark spark-two">✦</span><h2>{card.headword}</h2><p>{card.wordForms.length > 1 ? `Word forms: ${card.wordForms.slice(0, 5).join(" · ")}` : "One word, many ways to use it."}</p>{card.partsOfSpeech.length > 1 && card.example && <div className="vocab-clue-example" aria-label="Example clue">“{card.example.sentence.slice(0, card.example.highlightStart)}<strong>{card.example.sentence.slice(card.example.highlightStart, card.example.highlightStart + card.example.highlightLength)}</strong>{card.example.sentence.slice(card.example.highlightStart + card.example.highlightLength)}”{card.example.source === "wordnet-3.0" && <small>WordNet 3.0 · Princeton University</small>}</div>}</div>
        <div className="vocab-card-bottomline"><span>LISTED IN</span><div>{card.classification.slice(0, 3).map((tag) => <i key={tag}>{tag}</i>)}</div></div>
      </section>
      <aside className="vocab-answer-panel">
        <p className="vocab-kicker">YOUR MOVE</p><h2>Which roles fit?</h2><p>Tap each part of speech this word can play.</p>
        <div className="vocab-part-buttons">{parts.map((part) => <button key={part} aria-pressed={selected.includes(part)} onClick={() => void togglePart(part)} disabled={isDone || busy} className={`${selected.includes(part) ? "selected" : ""}${feedback?.expected.includes(part) ? " expected" : ""}`}>{part}<span>{part === "Noun" ? "a person, place, thing, or idea" : part === "Verb" ? "an action or state" : part === "Adjective" ? "describes a noun" : "adds detail to an action or statement"}</span></button>)}</div>
        <div className="vocab-inline-nav" aria-label="Card actions"><button disabled={index === 0 || busy} onClick={() => go(index - 1)}>← Previous</button>{index < run.cards.length - 1 ? <button className="next" disabled={busy} onClick={() => go(index + 1)}>Next →</button> : isDone ? <button className="next" disabled={busy} onClick={() => void nextRound(false)}>Next 12 words →</button> : <button className="finish" disabled={busy} onClick={() => void finish()}>{busy ? "Saving…" : "Finish round ✓"}</button>}</div>
        {feedback && <div className={`vocab-feedback${feedback.correct || feedback.partial ? " right" : " wrong"}`} role="status" aria-live="polite"><span className="vocab-feedback-icon">{feedback.correct ? "✦" : feedback.partial ? "＋" : "↻"}</span><div><strong>{feedback.correct ? "That’s it. Nice read." : feedback.partial ? "That role fits." : "Not quite — try another role."}</strong><p>{feedback.correct ? <>Exactly: <b>{feedback.expected.join(" + ")}</b>. Keep the rhythm going.</> : feedback.partial ? "There’s another role to find. Tap it to complete your answer." : "Change your selection and try again."}</p></div></div>}
        {feedback && card.example && card.partsOfSpeech.length === 1 && <div className="vocab-example"><p className="vocab-kicker">WORD IN CONTEXT</p><p>{card.example.sentence.slice(0, card.example.highlightStart)}<strong>{card.example.sentence.slice(card.example.highlightStart, card.example.highlightStart + card.example.highlightLength)}</strong>{card.example.sentence.slice(card.example.highlightStart + card.example.highlightLength)}</p>{card.example.source === "wordnet-3.0" && <small>WordNet 3.0 · Princeton University · <a href="/WORDNET-3.0-LICENSE.txt" target="_blank" rel="noreferrer">license</a></small>}</div>}
        {message && <p className="vocab-status" role="status">{message}</p>}
        <p className="vocab-reference-note">Examples show the word in context. A clue appears on cards with more than one role.</p>
      </aside>
    </div>
    <nav className="vocab-card-nav" aria-label="Word cards"><div className="vocab-nav-dots">{run.cards.map((item, i) => <button aria-label={`Card ${i + 1}: ${cardStatus(item.id)}`} aria-current={i === index ? "step" : undefined} className={`status-${cardStatus(item.id)}${i === index ? " current" : ""}`} key={item.id} onClick={() => go(i)}>{String(i + 1).padStart(2, "0")}</button>)}</div></nav>
    {isDone && <section className="vocab-finish-panel"><div><p className="vocab-kicker">ROUND {run.attempt.number} · SAVED</p><h2>Your cards are ready to revisit.</h2><p>Open any card above to review its word roles and example. Your teacher can see which cards you opened and your latest response for each.</p></div><div>{Object.values(run.answers).some((answer) => !answer.isCorrect) && <button className="vocab-retry-button" onClick={() => void nextRound(true)} disabled={busy}>Repeat missed cards ↻</button>}<button onClick={() => void nextRound(false)} disabled={busy}>Deal the next 12 ✦</button></div></section>}
  </main>;
}

export function VocabularyTeaching() {
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [type, setType] = useState<"private" | "classroom">("private");
  const [title, setTitle] = useState("");
  const [issued, setIssued] = useState<{ code: string; inviteKind: string; title: string; expiresAt: string } | null>(null);
  const [selectedReview, setSelectedReview] = useState<{ assignmentId: string; attemptId: string; learnerName: string } | null>(null);
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const reload = useCallback(async () => { const response = await fetch("/api/vocabulary/teaching", { cache: "no-store" }); if (response.ok) setAssignments(((await response.json()) as { assignments: ReviewAssignment[] }).assignments); }, []);
  useEffect(() => {
    let current = true;
    void fetch("/api/vocabulary/teaching", { cache: "no-store" }).then(async (response) => response.ok ? (await response.json() as { assignments: ReviewAssignment[] }).assignments : []).then((items) => { if (current) setAssignments(items); });
    return () => { current = false; };
  }, []);
  async function issueCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try { const result = await postJson<{ code: string; inviteKind: string; title: string; expiresAt: string }>("/api/vocabulary/teaching", { action: "create_code", inviteKind: type, title }); setIssued(result); setTitle(""); await reload(); }
    catch { setMessage("The access code could not be created. Add an assignment title and try again."); }
    finally { setBusy(false); }
  }
  async function review(assignmentId: string, attemptId: string) {
    setBusy(true); setMessage("");
    try { const response = await fetch(`/api/vocabulary/teaching?assignmentId=${assignmentId}&attemptId=${attemptId}`, { cache: "no-store" }); if (!response.ok) throw new Error(); const data = await response.json() as { learnerName: string; cards: ReviewCard[] }; setReviewCards(data.cards); setSelectedReview({ assignmentId, attemptId, learnerName: data.learnerName }); }
    catch { setMessage("That learner’s card history could not be loaded."); }
    finally { setBusy(false); }
  }
  async function reset(assignmentId: string, learnerName: string) {
    if (!window.confirm(`Archive the current vocabulary round for ${learnerName}? Their card history will remain visible and a new round will start next time.`)) return;
    setBusy(true); setMessage("");
    try { await postJson("/api/vocabulary/teaching", { action: "reset", assignmentId }); setMessage(`A new round is ready for ${learnerName}. Previous card history is archived.`); await reload(); }
    catch { setMessage("This learner’s round could not be archived."); }
    finally { setBusy(false); }
  }
  const visibleCards = useMemo(() => reviewCards.filter((card) => card.headword.toLowerCase().includes(filter.toLowerCase())), [reviewCards, filter]);
  return <main className="vocab-teacher-shell">
    <header className="vocab-topbar"><Link href="/dashboard">← Dashboard</Link><span>reHEARse · TEACHER WORKSPACE</span><Link href="/vocabulary">Learner view</Link></header>
    <section className="vocab-teacher-hero"><p className="vocab-kicker">WORD STUDIO · TEACHER CONTROL</p><h1>Give words<br /><em>a little play.</em></h1><p>Issue a private or classroom code, then follow each learner’s card trail without reducing it to a score.</p></section>
    <section className="vocab-builder"><div><p className="vocab-kicker">NEW ASSIGNMENT</p><h2>Share a word set</h2><p>Codes expire in seven days. A classroom code gives every learner a separate history.</p></div><form onSubmit={(event) => void issueCode(event)}><label htmlFor="vocab-assignment-title">Assignment title</label><input id="vocab-assignment-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="e.g. Monday TOEFL review" required /><div className="vocab-code-kind"><button type="button" aria-pressed={type === "private"} onClick={() => setType("private")}>Private <small>one learner</small></button><button type="button" aria-pressed={type === "classroom"} onClick={() => setType("classroom")}>Classroom <small>one cohort code</small></button></div><button className="vocab-issue-button" disabled={busy || !title.trim()}>{busy ? "Creating…" : `Create ${type} code →`}</button></form></section>
    {issued && <section className="vocab-issued"><div><p className="vocab-kicker">{issued.inviteKind.toUpperCase()} CODE · SHOWN ONCE</p><h3>{issued.title}</h3><p>Expires {new Date(issued.expiresAt).toLocaleDateString("en-US", { dateStyle: "medium" })}. Share only with the assigned learner or class.</p></div><code>{issued.code}</code><button onClick={() => { void navigator.clipboard?.writeText(issued.code); setMessage("Code copied."); }}>Copy code</button></section>}
    {message && <p className="vocab-status" role="status">{message}</p>}
    <section className="vocab-assignment-list"><div className="vocab-section-heading"><div><p className="vocab-kicker">YOUR ASSIGNMENTS</p><h2>Card trails</h2></div><span>{assignments.length.toString().padStart(2, "0")}</span></div><p className="vocab-quality-note"><b>Source note</b> · The 2,844 headwords are machine-extracted and teacher-reviewable. Some spellings have multiple labels. Examples appear after you check a card; they illustrate one use and are not definitions.</p>
      {!assignments.length && <div className="vocab-empty"><h3>No word sets assigned yet.</h3><p>Create a private or classroom code above to get started.</p></div>}
      {assignments.map((assignment) => <article className="vocab-teacher-assignment" key={assignment.id}><header><div><span className="vocab-tag">{assignment.type.toUpperCase()} · {assignment.revoked ? "REVOKED" : "CODE ACTIVE"}</span><h3>{assignment.title}</h3></div><small>Claim window ends {new Date(assignment.expiresAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</small></header>{assignment.candidates.length ? assignment.candidates.map((candidate) => <details className="vocab-candidate" key={candidate.id}><summary><span><b>{candidate.name}</b><small>{candidate.email}</small></span><span>{candidate.attempts.length ? `${candidate.attempts.length} round${candidate.attempts.length === 1 ? "" : "s"}` : "Not started"}</span><span className="vocab-summary-open">Open learner history ⌄</span></summary><div className="vocab-attempt-list">{candidate.attempts.length ? candidate.attempts.map((attempt) => <div className="vocab-attempt-row" key={attempt.id}><span>Round {attempt.number} · {attempt.status}{attempt.archivedAt ? " · archived" : ""}</span><div><button disabled={busy} onClick={() => void review(assignment.id, attempt.id)}>Review cards →</button>{!attempt.archivedAt && <button className="vocab-reset-small" disabled={busy} onClick={() => void reset(assignment.id, candidate.name)}>Archive and reset ↻</button>}</div></div>) : <p className="vocab-empty-small">No cards opened yet.</p>}</div></details>) : <p className="vocab-empty-small">Waiting for the first learner to claim this code.</p>}</article>)}
    </section>
    {selectedReview && <section className="vocab-review-panel"><header><div><p className="vocab-kicker">ITEM-LEVEL HISTORY · {selectedReview.learnerName}</p><h2>Each card, as it happened.</h2></div><button onClick={() => setSelectedReview(null)}>Close ×</button></header><p>Opened cards and answer sequence for this round. This view intentionally has no combined score.</p><label className="vocab-filter-label">Find a word<input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search this round" /></label><div className="vocab-review-list">{visibleCards.map((card) => <article className="vocab-review-row" key={card.id}><div><b>{card.headword}</b><small>{card.sourcePartsOfSpeech.join(" + ")}</small></div><span className={`vocab-item-state ${!card.opened ? "unopened" : card.isCorrect === true ? "right" : card.isCorrect === false ? "wrong" : "opened"}`}>{!card.opened ? "Not opened" : card.isCorrect === true ? "Latest response · right" : card.isCorrect === false ? "Latest response · revisit" : "Opened · no response"}</span><span>{card.opened ? `Opened ${card.openEvents} time${card.openEvents === 1 ? "" : "s"}` : "—"}</span>{card.responseTrail.length > 0 && <small className="vocab-response-line">Response history: {card.responseTrail.map((answer) => answer.isCorrect ? "Right" : "Revisit").join(" → ")} · Last choice: {card.selectedParts?.join(" + ")}</small>}</article>)}{!visibleCards.length && <p className="vocab-empty-small">No cards match this search.</p>}</div></section>}
    <footer className="vocab-teacher-foot">TOEFL ITP Vocabulary · Source labels are evidence from the reviewed list, not context-free definitions.</footer>
  </main>;
}
