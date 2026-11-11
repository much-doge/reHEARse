"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { TestCenterResource } from "@protefl/adapters/postgres-resources";
import { assignmentTitleDraft, hasValidAssignmentTitleDraft, trimmedAssignmentTitleDraft, updateAssignmentTitleDraft } from "./assignment-title-drafts";

export function ResourceClaim({ onClaimed }: { onClaimed: () => void | Promise<void> }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/test-center/resources", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) throw new Error(response.status === 429 ? "rate_limited" : "invite_unavailable");
      setCode("");
      await onClaimed();
      setMessage("Access confirmed. Your assigned resource is listed below.");
    } catch (error) {
      setMessage(error instanceof Error && error.message === "rate_limited"
        ? "Too many attempts. Wait a little before trying again."
        : "This access code may be expired, revoked, or already used by another account. If you claimed it before, sign in to that same account and reopen your assigned resource.");
    } finally { setBusy(false); }
  }
  return <form className="ptc-resource-claim" onSubmit={submit}>
    <label htmlFor="resource-code">Have an access code from your teacher?</label>
    <div><input id="resource-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" required maxLength={80} />
      <button type="submit" disabled={busy}>{busy ? "Checking…" : "Add access"}</button></div>
    {message && <p role="status">{message}</p>}
  </form>;
}

export function AssignedResources({ resources, canManage }: { resources: TestCenterResource[]; canManage: boolean }) {
  const [items, setItems] = useState(resources);
  return <main className="ptc-resources-shell">
    <header className="ptc-resources-header"><Link href="/dashboard">← Dashboard</Link><strong>TOEFL-like Test Center</strong>
      {canManage && <Link href="/test-center/teaching">Teacher workspace</Link>}</header>
    <section className="ptc-resources-intro"><p className="eyebrow">{canManage ? "COURSE RESOURCE OVERVIEW" : "YOUR COURSE MATERIALS"}</p><h1>{canManage ? "Resources assigned to candidates" : "My assigned resources"}</h1>
      <p>{canManage ? "Review resources assigned to candidates and update visibility or access from the controls." : "Resources become available here when your teacher assigns access to your account."}</p></section>
    {!canManage && <ResourceClaim onClaimed={async () => {
      const response = await fetch("/api/test-center/resources", { cache: "no-store" });
      if (response.ok) { const data = await response.json() as { resources: TestCenterResource[] }; setItems(data.resources); }
    }} />}
    <section className="ptc-resource-list" aria-live="polite">
      {items.length ? items.map((resource) => <article className="ptc-assigned-resource-card" key={resource.id}>
        <div><span className="eyebrow">{resource.kind === "listening_form" ? "LISTENING PILOT" : "DIAGNOSTIC PACKAGE"} · VERSION {resource.version}</span>
          <h2>{resource.assignmentTitle}</h2>{resource.assignmentTitle !== resource.title && <p>{resource.title}</p>}<p>{canManage ? "This resource is assigned to your account." : resource.hasAttempt ? "Your previous attempt is available to continue or review." : `Assigned scope: ${resource.deliveryScope === "full" ? "Full diagnostic" : resource.deliveryScope === "structure" ? "Structure and Written Expression" : resource.deliveryScope[0].toUpperCase() + resource.deliveryScope.slice(1)}`}</p></div>
        {resource.kind === "listening_form" && <Link className="ptc-resource-open" href="/test-center/listening/2000-10">Open resource →</Link>}
        {resource.kind === "diagnostic_package" && <Link className="ptc-resource-open" href="/test-center/diagnostic/ets-volume3-practice-test-a">Open diagnostic →</Link>}
      </article>) : <div className="ptc-resource-empty"><h2>No resources assigned yet</h2><p>When your teacher shares an access code, enter it above. Assigned resources will appear here.</p></div>}
    </section>
  </main>;
}

type DeliveryScope = "full" | "listening" | "structure" | "reading";
type ReviewItem = { section: string; question: number; selected: string | null; correctAnswer?: string; correct?: boolean; answeredAt?: string };
type AttemptResult = {
  total?: { correct: number; incorrect: number; omitted: number; questions: number };
  sections?: Record<string, { correct: number; incorrect: number; omitted: number; total: number }>;
  summary?: { correct: number; incorrect: number; omitted: number; total: number };
  review?: ReviewItem[];
};
type AttemptHistory = {
  id: string; number: number; status: string; scope: string; deliveryScope: DeliveryScope; effectiveResult?: AttemptResult | null;
  createdAt: string; completedAt: string | null; archivedAt: string | null; result: AttemptResult | null;
  answeredQuestions?: Array<{ section: string; question: number; selected: string; answeredAt: string }>;
  retakes: Array<{ id: string; section: string; number: number; status: string; teacherIssuedRestart?: boolean; createdAt: string; completedAt: string | null; archivedAt: string | null; result: AttemptResult | null }>;
};
type ManagedResource = { id: string; code: string; version: number; kind: string; title: string; status: string; createdAt: string; tags: string[]; assignedCount: number; candidates?: Array<{ actorId: string; name: string; email: string; assignmentTitle: string; deliveryScope: DeliveryScope; attempts: AttemptHistory[]; canResetPassword: boolean }> };

function resultLabel(result: AttemptResult | null) {
  const correct = result?.total?.correct ?? result?.summary?.correct;
  const total = result?.total?.questions ?? result?.summary?.total;
  return correct === undefined || total === undefined ? null : `${correct} / ${total} correct`;
}

function MissedQuestions({ result, resourceId, candidateActorId, attemptId }: { result: AttemptResult | null; resourceId: string; candidateActorId: string; attemptId: string }) {
  const missed = result?.review?.filter((item) => !item.correct) ?? [];
  if (!result) return <p className="ptc-review-empty">No completed result is recorded for this attempt.</p>;
  if (!missed.length) return <p className="ptc-review-empty">No missed questions in this attempt.</p>;
  return <div className="ptc-missed-sections" aria-label="Missed question review">
    {(["listening", "structure", "reading"] as const).map((section) => {
      const sectionItems = missed.filter((item) => item.section === section);
      if (!sectionItems.length) return null;
      const title = section === "structure" ? "Structure and Written Expression" : section === "listening" ? "Listening Comprehension" : "Reading Comprehension";
      return <section className="ptc-missed-section" key={section}>
        <h4>{title}<span>{sectionItems.length} missed</span></h4>
        <div className="ptc-missed-list">{sectionItems.map((item) => <TeacherQuestionReveal key={`${item.section}-${item.question}`} item={item} resourceId={resourceId} candidateActorId={candidateActorId} attemptId={attemptId} />)}</div>
      </section>;
    })}
  </div>;
}

type TeacherQuestionPayload = {
  section: string;
  part?: string;
  question: ReviewItem;
  item: { prompt?: string; options: Record<string, string>; part?: string; tokens?: Array<{ text: string; choice?: string }> };
  passage?: { questions: [number, number]; lines: Array<{ text: string; line: number | null; paragraphStart: boolean }> };
  audio?: { groupId: string; groupType: "question" | "conversation" | "talk"; contextStartMs: number; contextEndMs: number; questionStartMs: number; questionEndMs: number };
};

function TeacherAudioButton({ label, startMs, endMs, resourceId, candidateActorId, attemptId }: { label: string; startMs: number; endMs: number; resourceId: string; candidateActorId: string; attemptId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const source = `/api/test-center/teaching/question?resourceId=${encodeURIComponent(resourceId)}&candidateActorId=${encodeURIComponent(candidateActorId)}&attemptId=${encodeURIComponent(attemptId)}`;
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (audio.currentTime >= endMs / 1000) {
        audio.pause();
        audio.currentTime = startMs / 1000;
        setPlaying(false);
      }
    };
    const onEnded = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => { audio.removeEventListener("timeupdate", onTime); audio.removeEventListener("ended", onEnded); };
  }, [endMs, startMs]);
  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); return; }
    const start = () => {
      audio.currentTime = startMs / 1000;
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    };
    if (audio.readyState >= 1) start();
    else audio.addEventListener("loadedmetadata", start, { once: true });
  }
  return <div className="ptc-teacher-audio-control">
    <button type="button" onClick={() => void toggle()}>{playing ? "Pause" : "Play"} {label}</button>
    <span>{(startMs / 1000).toFixed(1)}–{(endMs / 1000).toFixed(1)}s</span>
    <audio ref={audioRef} preload="metadata" src={source} />
  </div>;
}

function TeacherQuestionReveal({ item, resourceId, candidateActorId, attemptId }: { item: ReviewItem; resourceId: string; candidateActorId: string; attemptId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [payload, setPayload] = useState<TeacherQuestionPayload | null>(null);
  const [failed, setFailed] = useState(false);
  async function reveal() {
    if (!open && !payload && !busy) {
      setBusy(true); setFailed(false);
      try {
        const response = await fetch("/api/test-center/teaching/question", {
          method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId, candidateActorId, attemptId, section: item.section, question: item.question }),
        });
        const data = await response.json() as { item?: TeacherQuestionPayload };
        if (!response.ok || !data.item) throw new Error("question_unavailable");
        setPayload(data.item); setOpen(true);
      } catch { setFailed(true); }
      finally { setBusy(false); }
    } else setOpen(!open);
  }
  const groupedTokens = payload?.item.tokens?.reduce<Array<{ text: string; choice?: string }>>((groups, token) => {
    const previous = groups.at(-1);
    if (previous && previous.choice === token.choice) previous.text += " " + token.text;
    else groups.push({ ...token });
    return groups;
  }, []);
  return <article className={`ptc-missed-item${open ? " is-open" : ""}`}>
    <button className="ptc-missed-trigger" aria-expanded={open} onClick={() => void reveal()} disabled={busy}>
      <strong>{item.section} · Q{item.question}</strong><span>Response: <b>{item.selected ?? "Omitted"}</b></span><span>Key: <b>{item.correctAnswer ?? "—"}</b></span><small>{busy ? "Loading…" : failed ? "Could not load · click to retry" : open ? "Hide question −" : "Reveal question +"}</small>
    </button>
    {open && payload && <div className="ptc-teacher-question">
      {payload.audio && <div className="ptc-teacher-audio-controls" aria-label="Listening audio review">
        {payload.audio.groupType === "question" ? <TeacherAudioButton label="question" startMs={payload.audio.questionStartMs} endMs={payload.audio.questionEndMs} resourceId={resourceId} candidateActorId={candidateActorId} attemptId={attemptId} /> : <>
          <TeacherAudioButton label={payload.audio.groupType === "conversation" ? "dialogue" : "talk"} startMs={payload.audio.contextStartMs} endMs={payload.audio.contextEndMs} resourceId={resourceId} candidateActorId={candidateActorId} attemptId={attemptId} />
          <TeacherAudioButton label="question" startMs={payload.audio.questionStartMs} endMs={payload.audio.questionEndMs} resourceId={resourceId} candidateActorId={candidateActorId} attemptId={attemptId} />
        </>}
      </div>}
      {payload.passage && <article className="ptc-teacher-passage"><header>PASSAGE · Questions {payload.passage.questions[0]}–{payload.passage.questions[1]}</header>{payload.passage.lines.map((line, index) => <p className={line.paragraphStart ? "paragraph-start" : ""} key={index}>{line.line && <span>{line.line}</span>}{line.text}</p>)}</article>}
      <div className="ptc-teacher-question-card">
        <header><span>{item.section === "structure" ? `PART ${payload.part === "completion" ? "A · SENTENCE COMPLETION" : "B · ERROR IDENTIFICATION"}` : item.section === "listening" ? `PART ${payload.item.part ?? ""} · LISTENING` : "READING COMPREHENSION"}</span><b>Question {item.question}</b></header>
        {groupedTokens ? <p className="ptc-teacher-error-sentence">{groupedTokens.map((token, index) => <span className={token.choice ? "is-underlined" : ""} key={index}>{token.text}{index < groupedTokens.length - 1 ? " " : ""}</span>)}</p> : <h5>{payload.item.prompt?.replace("_____", "________")}</h5>}
        <div className="ptc-teacher-options">{(["A", "B", "C", "D"] as const).map((choice) => <div className={choice === payload.question.correctAnswer ? "is-key" : choice === payload.question.selected ? "is-response" : ""} key={choice}><b>{choice}</b><span>{payload.item.options[choice]}</span></div>)}</div>
      </div>
    </div>}
  </article>;
}

function AnsweredQuestions({ attempt, resourceId, candidateActorId }: { attempt: AttemptHistory; resourceId: string; candidateActorId: string }) {
  const fromEvents = attempt.answeredQuestions ?? [];
  const fromResult = (attempt.result?.review ?? []).filter((item) => item.selected).map((item) => ({ section: item.section, question: item.question, selected: item.selected as string, answeredAt: "" }));
  const answers = fromEvents.length ? fromEvents : fromResult;
  if (!answers.length) return <p className="ptc-review-empty">No submitted answers yet.</p>;
  return <div className="ptc-answered-sections" aria-label="Submitted answer review">
    {(["listening", "structure", "reading"] as const).map((section) => {
      const sectionItems = answers.filter((item) => item.section === section);
      if (!sectionItems.length) return null;
      return <section className="ptc-answered-section" key={section}>
        <h4>{section === "structure" ? "Structure and Written Expression" : section[0].toUpperCase() + section.slice(1)}<span>{sectionItems.length} answered</span></h4>
        <div className="ptc-missed-list">{sectionItems.map((item) => <TeacherQuestionReveal key={`${section}-${item.question}`} item={{ section, question: item.question, selected: item.selected }} resourceId={resourceId} candidateActorId={candidateActorId} attemptId={attempt.id} />)}</div>
      </section>;
    })}
  </div>;
}

function AttemptResultSummary({ result }: { result: AttemptResult | null }) {
  if (!result) return null;
  const sections = Object.entries(result.sections ?? {});
  return <>
    {result.total && <p className="ptc-attempt-total">{resultLabel(result)} <span>· {result.total.incorrect} incorrect · {result.total.omitted} omitted</span></p>}
    {result.summary && !result.total && <p className="ptc-attempt-total">{resultLabel(result)} <span>· {result.summary.incorrect} incorrect · {result.summary.omitted} omitted</span></p>}
    {sections.length > 0 && <div className="ptc-section-stats">{sections.map(([name, value]) => <span key={name}><b>{name}</b>{value.correct}/{value.total}<small>{value.incorrect} wrong · {value.omitted} omitted</small></span>)}</div>}
  </>;
}

export function ResourceManager({ resources: initial }: { resources: ManagedResource[] }) {
  const [resources, setResources] = useState(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [issuedCode, setIssuedCode] = useState<{ title: string; code: string; scope: DeliveryScope; listeningMode: "autoplay" | "question_click"; inviteKind: "private" | "classroom" } | null>(null);
  const [assignmentTitleDrafts, setAssignmentTitleDrafts] = useState<Record<string, string>>({});
  const [resetCredential, setResetCredential] = useState<{ name: string; email: string; temporaryPassword: string; revokedSessions: number } | null>(null);
  const [listeningMode, setListeningMode] = useState<"autoplay" | "question_click">("autoplay");
  const [showListeningQuestionText, setShowListeningQuestionText] = useState(true);
  const [deliveryScope, setDeliveryScope] = useState<DeliveryScope>("full");
  const [inviteKind, setInviteKind] = useState<"private" | "classroom">("private");
  const [viewMode, setViewMode] = useState<"compact" | "expanded">("compact");
  const [resourceSort, setResourceSort] = useState<"newest" | "title" | "status" | "assignments">("newest");
  const [candidateSort, setCandidateSort] = useState<"name" | "recent" | "status" | "score">("name");
  const [resourceVisibility, setResourceVisibility] = useState<Record<string, boolean>>({});
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>(() => Object.fromEntries(initial.map((resource) => [resource.id, resource.tags.join(", ")])));
  function changeViewMode(mode: "compact" | "expanded") {
    setViewMode(mode);
    setResourceVisibility({});
  }
  function toggleResource(resourceId: string, isOpen: boolean) {
    setResourceVisibility((current) => ({ ...current, [resourceId]: !isOpen }));
  }
  const orderedResources = useMemo(() => resources.slice().sort((left, right) => {
    if (resourceSort === "title") return left.title.localeCompare(right.title, "en");
    if (resourceSort === "status") return left.status.localeCompare(right.status, "en") || right.createdAt.localeCompare(left.createdAt);
    if (resourceSort === "assignments") return right.assignedCount - left.assignedCount || right.createdAt.localeCompare(left.createdAt);
    return right.createdAt.localeCompare(left.createdAt);
  }), [resourceSort, resources]);
  function orderedCandidates(candidates: NonNullable<ManagedResource["candidates"]>) {
    return candidates.slice().sort((left, right) => {
      const leftLatest = left.attempts.at(-1);
      const rightLatest = right.attempts.at(-1);
      if (candidateSort === "name") return left.name.localeCompare(right.name, "en") || left.email.localeCompare(right.email, "en");
      if (candidateSort === "status") return (leftLatest?.status ?? "not_started").localeCompare(rightLatest?.status ?? "not_started", "en") || left.name.localeCompare(right.name, "en");
      if (candidateSort === "score") {
        const leftScore = leftLatest?.effectiveResult?.total?.correct ?? leftLatest?.result?.total?.correct ?? -1;
        const rightScore = rightLatest?.effectiveResult?.total?.correct ?? rightLatest?.result?.total?.correct ?? -1;
        return rightScore - leftScore || left.name.localeCompare(right.name, "en");
      }
      const leftDate = leftLatest?.completedAt ?? leftLatest?.createdAt ?? "";
      const rightDate = rightLatest?.completedAt ?? rightLatest?.createdAt ?? "";
      return rightDate.localeCompare(leftDate) || left.name.localeCompare(right.name, "en");
    });
  }
  async function mutate(resource: ManagedResource, action: "issue_invite" | "set_status") {
    setBusy(resource.id); setMessage(""); setIssuedCode(null); setResetCredential(null);
    const status = resource.status === "published" ? "hidden" : "published";
    const assignmentTitle = action === "issue_invite" ? trimmedAssignmentTitleDraft(assignmentTitleDrafts, resource.id) : undefined;
    try {
      const response = await fetch("/api/test-center/teaching", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, resourceId: resource.id, status, assignmentTitle, listeningMode, showListeningQuestionText, deliveryScope, inviteKind }) });
      const data = await response.json() as { invite?: { code: string; assignmentTitle: string; deliveryScope: DeliveryScope; listeningMode: "autoplay" | "question_click"; inviteKind: "private" | "classroom" }; resource?: { status: string }; error?: string };
      if (!response.ok) throw new Error("The change could not be saved.");
      if (data.invite) setIssuedCode({ title: data.invite.assignmentTitle, code: data.invite.code, scope: data.invite.deliveryScope, listeningMode: data.invite.listeningMode, inviteKind: data.invite.inviteKind });
      if (data.resource) setResources((current) => current.map((item) => item.id === resource.id ? { ...item, status: data.resource!.status } : item));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Something went wrong."); }
    finally { setBusy(null); }
  }
  async function archiveCandidate(resource: ManagedResource, candidate: NonNullable<ManagedResource["candidates"]>[number]) {
    if (!window.confirm(`Archive ${candidate.name}'s current ${candidate.deliveryScope === "full" ? "full diagnostic" : `${candidate.deliveryScope}-only assignment`} attempt history and let them start again from the beginning? Their answers and results will remain available here.`)) return;
    setBusy(`archive:${candidate.actorId}`); setMessage("");
    try {
      const response = await fetch("/api/test-center/teaching", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive_candidate_attempts", resourceId: resource.id, candidateActorId: candidate.actorId }),
      });
      const data = await response.json() as { archive?: { archivedAttempts: number; archivedAt: string } };
      if (!response.ok || !data.archive) throw new Error("The attempt could not be archived.");
      setResources((current) => current.map((item) => item.id !== resource.id ? item : {
        ...item,
        candidates: item.candidates?.map((entry) => entry.actorId !== candidate.actorId ? entry : {
          ...entry,
          attempts: entry.attempts.map((attempt) => attempt.archivedAt ? attempt : {
            ...attempt, archivedAt: data.archive!.archivedAt,
            retakes: attempt.retakes.map((retake) => ({ ...retake, archivedAt: retake.archivedAt ?? data.archive!.archivedAt })),
          }),
        }),
      }));
      setMessage(`${candidate.name}'s current attempt was archived. They can now reopen the diagnostic and start again.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The attempt could not be archived."); }
    finally { setBusy(null); }
  }
  async function resetCandidateSection(resource: ManagedResource, candidate: NonNullable<ManagedResource["candidates"]>[number], attempt: AttemptHistory, section: "listening" | "structure" | "reading") {
    const label = section === "structure" ? "Structure and Written Expression" : section[0].toUpperCase() + section.slice(1);
    if (!window.confirm(`Reset ${label} for ${candidate.name}? They will redo the complete section. When completed, this section will be used in their recalculated current score; the original result remains in history.`)) return;
    setBusy(`section:${attempt.id}:${section}`); setMessage("");
    try {
      const response = await fetch("/api/test-center/teaching", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_candidate_section", resourceId: resource.id, candidateActorId: candidate.actorId, parentAttemptId: attempt.id, section }),
      });
      const data = await response.json() as { restart?: { attemptId: string; attemptNumber: number; sectionRetakeNumber: number; section: string; createdAt: string }; error?: string };
      if (!response.ok || !data.restart) throw new Error(data.error === "active_attempt_exists" ? "This learner already has an attempt in progress." : "The section could not be reset.");
      setResources((current) => current.map((item) => item.id !== resource.id ? item : {
        ...item,
        candidates: item.candidates?.map((entry) => entry.actorId !== candidate.actorId ? entry : {
          ...entry,
          attempts: entry.attempts.map((record) => record.id !== attempt.id ? record : {
            ...record,
            retakes: [...record.retakes, {
              id: data.restart!.attemptId,
              section, number: data.restart!.sectionRetakeNumber, status: "in_progress", teacherIssuedRestart: true,
              createdAt: data.restart!.createdAt, completedAt: null, archivedAt: null, result: null,
            }],
          }),
        }),
      }));
      setMessage(`${label} was reset for ${candidate.name}. Their next visit will open the complete section.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The section could not be reset."); }
    finally { setBusy(null); }
  }
  async function resetCandidatePassword(resource: ManagedResource, candidate: NonNullable<ManagedResource["candidates"]>[number]) {
    if (!window.confirm(`Reset ${candidate.name}'s sign-in password? Their existing signed-in sessions will end, but assignments, attempts, answers, and results will remain unchanged.`)) return;
    setBusy(`password:${candidate.actorId}`); setMessage(""); setResetCredential(null); setIssuedCode(null);
    try {
      const response = await fetch("/api/test-center/teaching", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_candidate_password", resourceId: resource.id, candidateActorId: candidate.actorId }),
      });
      const data = await response.json() as { reset?: { learner: { name: string; email: string }; temporaryPassword: string; revokedSessions: number } };
      if (!response.ok || !data.reset) throw new Error("The password could not be reset.");
      setResetCredential({
        name: data.reset.learner.name,
        email: data.reset.learner.email,
        temporaryPassword: data.reset.temporaryPassword,
        revokedSessions: data.reset.revokedSessions,
      });
    } catch (error) { setMessage(error instanceof Error ? error.message : "The password could not be reset."); }
    finally { setBusy(null); }
  }
  async function saveTags(resource: ManagedResource) {
    setBusy(`tags:${resource.id}`); setMessage("");
    try {
      const tags = (tagDrafts[resource.id] ?? "").split(",").map((tag) => tag.trim()).filter(Boolean);
      const response = await fetch("/api/test-center/teaching", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_tags", resourceId: resource.id, tags }),
      });
      const data = await response.json() as { resource?: { tags: string[] }; error?: string };
      if (!response.ok || !data.resource) throw new Error(data.error === "invalid_tags" ? "Use no more than 8 tags and keep each tag within 80 characters." : "The tags could not be saved.");
      setResources((current) => current.map((item) => item.id === resource.id ? { ...item, tags: data.resource!.tags } : item));
      setTagDrafts((current) => ({ ...current, [resource.id]: data.resource!.tags.join(", ") }));
      setMessage(`Tags saved for ${resource.title}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The tags could not be saved."); }
    finally { setBusy(null); }
  }
  return <main className="ptc-resources-shell">
    <header className="ptc-resources-header"><Link href="/test-center">← Candidate view</Link><strong>TOEFL-like Test Center</strong><Link href="/dashboard">Dashboard</Link></header>
    <section className="ptc-resources-intro"><p className="eyebrow">TEACHER / ADMIN WORKSPACE</p><h1>Assignments and results</h1><p>Review candidate progress, publish resources, and issue private or classroom access codes.</p></section>
    {message && <p role="alert" className="ptc-resource-notice">{message}</p>}
    {issuedCode && <section className="ptc-issued-code" role="status"><div><span className="eyebrow">{issuedCode.inviteKind === "classroom" ? "CLASSROOM CODE CREATED" : "PRIVATE CODE CREATED"}</span><strong>{issuedCode.title}</strong></div><code>{issuedCode.code}</code><p>{issuedCode.inviteKind === "classroom" ? "May be claimed by multiple signed-in learners." : "May be claimed by one signed-in learner."} Scope: {issuedCode.scope === "full" ? "Full diagnostic" : issuedCode.scope === "structure" ? "Structure and Written Expression" : issuedCode.scope[0].toUpperCase() + issuedCode.scope.slice(1)}{issuedCode.scope === "full" || issuedCode.scope === "listening" ? ` · Listening: ${issuedCode.listeningMode === "autoplay" ? "Autoplay" : "Manual, play each question"}` : ""}. Expires in 7 days and is shown only now.</p><button onClick={() => { navigator.clipboard?.writeText(issuedCode.code); setMessage("Code copied."); }}>Copy code</button></section>}
    {resetCredential && <section className="ptc-reset-credential" role="status"><div><span className="eyebrow">TEMPORARY PASSWORD CREATED</span><strong>{resetCredential.name}</strong><small>{resetCredential.email}</small></div><code>{resetCredential.temporaryPassword}</code><p>Copy and send this password securely. It is shown only here and is not stored in the audit record. {resetCredential.revokedSessions} existing {resetCredential.revokedSessions === 1 ? "session was" : "sessions were"} signed out.</p><div><button onClick={() => { navigator.clipboard?.writeText(resetCredential.temporaryPassword); setMessage("Temporary password copied."); }}>Copy password</button><button className="secondary" onClick={() => setResetCredential(null)}>Dismiss</button></div></section>}
    <div className="ptc-resource-view-controls" aria-label="Resource display"><span>{resources.length} activities</span><label>Sort activities <select value={resourceSort} onChange={(event) => setResourceSort(event.target.value as typeof resourceSort)}><option value="newest">Newest first</option><option value="title">Title A–Z</option><option value="status">Status</option><option value="assignments">Most assigned</option></select></label><div><button className={viewMode === "compact" ? "active" : ""} onClick={() => changeViewMode("compact")} aria-pressed={viewMode === "compact"}>Compact</button><button className={viewMode === "expanded" ? "active" : ""} onClick={() => changeViewMode("expanded")} aria-pressed={viewMode === "expanded"}>Expanded</button></div></div>
    <section className={`ptc-resource-list is-${viewMode}`}>{orderedResources.map((resource) => {
      const showDetails = resourceVisibility[resource.id] ?? viewMode === "expanded";
      return <article className={`ptc-resource-card${showDetails ? " is-open" : " is-compact"}`} key={resource.id}>
      <header className="ptc-resource-summary"><div><span className="eyebrow">{resource.kind.replaceAll("_", " ").toUpperCase()} · VERSION {resource.version}</span><h2>{resource.title}</h2>{resource.tags.length > 0 && <div className="ptc-resource-tags">{resource.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}</div><div className="ptc-resource-status"><span className={`status-${resource.status}`}>{resource.status}</span><small>{resource.assignedCount} active assignments</small><button className="ptc-resource-toggle" onClick={() => toggleResource(resource.id, showDetails)}>{showDetails ? "Collapse" : "Expand"}</button></div></header>
      {showDetails && <>
      <section className="ptc-tag-editor"><label htmlFor={`tags-${resource.id}`}><strong>Activity tags</strong><small>Separate tags with commas · maximum 8 tags, 80 characters each.</small></label><input id={`tags-${resource.id}`} value={tagDrafts[resource.id] ?? ""} maxLength={647} placeholder="e.g. Full TOEFL Practice Test" onChange={(event) => setTagDrafts((current) => ({ ...current, [resource.id]: event.target.value }))} /><button disabled={busy !== null} onClick={() => void saveTags(resource)}>{busy === `tags:${resource.id}` ? "Saving…" : "Save tags"}</button></section>
      <section className="ptc-assignment-builder"><div className="ptc-control-heading"><span className="eyebrow">NEW ASSIGNMENT</span><h3>Configure one access code</h3><p>These choices are pinned when the candidate claims the code.</p></div><div className="ptc-resource-actions">
        <label className="ptc-listening-mode">Assignment title
          <input value={assignmentTitleDraft(assignmentTitleDrafts, resource.id)} onChange={(event) => setAssignmentTitleDrafts((current) => updateAssignmentTitleDraft(current, resource.id, event.target.value))} maxLength={120} required placeholder="e.g. Class B · November diagnostic" />
          <small>Use a learner, class, or purpose label · 1–120 characters.</small>
        </label>
        <label className="ptc-listening-mode">Access code type
          <select value={inviteKind} onChange={(event) => setInviteKind(event.target.value as "private" | "classroom")}>
            <option value="private">Private · one learner</option><option value="classroom">Classroom · many learners</option>
          </select><small>{inviteKind === "classroom" ? "Share one code with the class; every signed-in learner receives a separate assignment." : "The code binds to the first signed-in learner who claims it."}</small>
        </label>
        {resource.kind === "diagnostic_package" && <label className="ptc-listening-mode">Assigned test scope
          <select value={deliveryScope} onChange={(event) => setDeliveryScope(event.target.value as DeliveryScope)}>
            <option value="full">Full diagnostic · all three sections</option><option value="listening">Listening only</option><option value="structure">Structure and Written Expression only</option><option value="reading">Reading only</option>
          </select>
        </label>}
        {resource.kind === "diagnostic_package" && (deliveryScope === "full" || deliveryScope === "listening") && <label className="ptc-listening-mode">Listening playback
          <select value={listeningMode} onChange={(event) => setListeningMode(event.target.value as "autoplay" | "question_click")}>
            <option value="autoplay">Autoplay</option><option value="question_click">Play each question</option>
          </select>
        </label>}
        {resource.kind === "diagnostic_package" && (deliveryScope === "full" || deliveryScope === "listening") && <label className="ptc-listening-mode"><span><input type="checkbox" checked={showListeningQuestionText} onChange={(event) => setShowListeningQuestionText(event.target.checked)} /> Show listening question text</span><small>This choice is pinned when each access code is issued.</small></label>}
        <div className="ptc-primary-actions"><button disabled={busy !== null || resource.status !== "published" || !hasValidAssignmentTitleDraft(assignmentTitleDrafts, resource.id)} onClick={() => mutate(resource, "issue_invite")}>{busy === resource.id ? "Creating…" : inviteKind === "classroom" ? "Create classroom code" : "Create private code"}</button>
        {(resource.status === "published" || resource.status === "hidden" || resource.status === "draft") && <button className="secondary" disabled={busy !== null} onClick={() => mutate(resource, "set_status")}>{resource.status === "published" ? "Hide resource" : "Publish resource"}</button>}</div>
      </div></section>
      {resource.candidates?.length ? <section className="ptc-candidate-results">
        <div className="ptc-candidate-heading"><div><p className="eyebrow">ASSIGNED CANDIDATES</p><h3>Attempts and answer review</h3></div><span>{resource.candidates.length} candidates</span></div>
        <div className="ptc-candidate-sort"><label>Sort candidates <select value={candidateSort} onChange={(event) => setCandidateSort(event.target.value as typeof candidateSort)}><option value="name">Name A–Z</option><option value="recent">Most recent activity</option><option value="status">Status</option><option value="score">Highest score</option></select></label></div>
        {orderedCandidates(resource.candidates).map((candidate) => {
          const currentAttempts = candidate.attempts.filter((attempt) => !attempt.archivedAt);
          const latest = currentAttempts.at(-1);
          const hasActiveAttempt = currentAttempts.some((attempt) => attempt.status === "in_progress" || attempt.retakes.some((retake) => !retake.archivedAt && retake.status === "in_progress"));
          const retryCount = candidate.attempts.reduce((count, attempt) => count + attempt.retakes.length, 0);
          return <details className="ptc-candidate" key={candidate.actorId}>
            <summary>
              <span className="ptc-candidate-person"><strong>{candidate.name}</strong><small>{candidate.email}</small><small>Assignment: {candidate.assignmentTitle}</small></span>
              <span className="ptc-candidate-state">{latest ? latest.status === "completed" ? `Latest · ${resultLabel(latest.effectiveResult ?? latest.result) ?? "Completed"}` : "Attempt in progress" : "Not started"}</span>
              <span className="ptc-candidate-scope">{candidate.deliveryScope === "full" ? "Full diagnostic" : `${candidate.deliveryScope} only`}</span>
              <span className="ptc-candidate-retries">{candidate.attempts.length} historical {candidate.attempts.length === 1 ? "attempt" : "attempts"} · {retryCount} section retakes</span>
              <span className="ptc-expand-label">View history</span>
            </summary>
            <div className="ptc-candidate-history">
              {candidate.canResetPassword && <div className="ptc-password-reset"><div><strong>Sign-in recovery</strong><p>Create a temporary password and sign this learner out of existing sessions. Their course records remain unchanged.</p></div><button disabled={busy !== null} onClick={() => void resetCandidatePassword(resource, candidate)}>{busy === `password:${candidate.actorId}` ? "Resetting…" : "Reset sign-in password"}</button></div>}
              {currentAttempts.length > 0 && <div className="ptc-candidate-reset"><div><strong>Restart {candidate.deliveryScope === "full" ? "the full diagnostic" : `${candidate.deliveryScope} only`}</strong><p>Archive this assignment’s current attempt lineage. All answers and results remain visible in this history.</p></div><button className="danger" disabled={busy !== null} onClick={() => void archiveCandidate(resource, candidate)}>{busy === `archive:${candidate.actorId}` ? "Archiving…" : "Archive current attempt and restart"}</button></div>}
              {currentAttempts.length === 0 && candidate.attempts.length > 0 && <p className="ptc-restart-ready">Current attempt archived · candidate is ready to start again.</p>}
              {candidate.attempts.length === 0 ? <p className="ptc-review-empty">This candidate has not started an attempt.</p> : candidate.attempts.map((attempt) => <section className={`ptc-attempt-card${attempt.archivedAt ? " is-archived" : ""}`} key={`attempt-${attempt.number}`}>
                <header><div><p className="eyebrow">{attempt.deliveryScope === "full" ? "FULL DIAGNOSTIC" : `${attempt.deliveryScope.toUpperCase()} ASSIGNMENT`} · ATTEMPT {attempt.number}</p><strong>{attempt.archivedAt ? "Archived" : attempt.status === "completed" ? "Completed" : `In progress · ${attempt.scope}`}</strong></div><div className="ptc-attempt-dates"><time dateTime={attempt.completedAt ?? attempt.createdAt}>{new Date(attempt.completedAt ?? attempt.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</time>{attempt.archivedAt && <small>Archived {new Date(attempt.archivedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</small>}</div></header>
                {attempt.effectiveResult && <p className="ptc-restart-ready">Current score recalculated from completed section resets. The original result remains below.</p>}
                <AttemptResultSummary result={attempt.effectiveResult ?? attempt.result} />
                <details className="ptc-answer-review" open={attempt.status === "in_progress"}>
                  <summary>Submitted answers · live review</summary>
                  <AnsweredQuestions attempt={attempt} resourceId={resource.id} candidateActorId={candidate.actorId} />
                </details>
                {attempt.effectiveResult && <details className="ptc-answer-review"><summary>Original completed result</summary><AttemptResultSummary result={attempt.result} /></details>}
                {(attempt.effectiveResult ?? attempt.result) && <details className="ptc-answer-review"><summary>Missed questions and answer key · current score</summary><MissedQuestions result={attempt.effectiveResult ?? attempt.result} resourceId={resource.id} candidateActorId={candidate.actorId} attemptId={attempt.id} /></details>}
                {!attempt.archivedAt && attempt.status === "completed" && attempt.scope === "full" && attempt.deliveryScope === "full" && <div className="ptc-section-reset"><div><strong>Reset one section</strong><p>The learner will redo every question in that section. Its completed result will update the current recalculated score; ordinary missed-item retakes never change it.</p></div><div>{(["listening", "structure", "reading"] as const).map((section) => <button className="secondary" disabled={busy !== null || hasActiveAttempt} key={section} onClick={() => void resetCandidateSection(resource, candidate, attempt, section)}>{busy === `section:${attempt.id}:${section}` ? "Resetting…" : `Reset ${section === "structure" ? "Structure" : section[0].toUpperCase() + section.slice(1)}`}</button>)}</div></div>}
                {attempt.retakes.length > 0 && <div className="ptc-retake-history"><h4>Section retakes</h4>{attempt.retakes.map((retake) => <article className={retake.archivedAt ? "is-archived" : ""} key={`${retake.section}-${retake.number}`}>
                  <header><strong>{retake.section} {retake.teacherIssuedRestart ? "reset" : "retake"} {retake.number}</strong><span>{retake.archivedAt ? "Archived" : retake.status === "completed" ? resultLabel(retake.result) ?? "Completed" : "In progress"}</span><time dateTime={retake.archivedAt ?? retake.completedAt ?? retake.createdAt}>{retake.archivedAt ? `Archived ${new Date(retake.archivedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}` : new Date(retake.completedAt ?? retake.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</time></header>
                  <AttemptResultSummary result={retake.result} />
                  {retake.result && <details className="ptc-answer-review"><summary>Missed questions and answer key</summary><MissedQuestions result={retake.result} resourceId={resource.id} candidateActorId={candidate.actorId} attemptId={retake.id} /></details>}
                </article>)}</div>}
              </section>)}
            </div>
          </details>;
        })}
      </section> : null}
      </>}
    </article>})}</section>
  </main>;
}
