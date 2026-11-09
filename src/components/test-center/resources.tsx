"use client";

import Link from "next/link";
import { useState } from "react";

import type { TestCenterResource } from "@protefl/adapters/postgres-resources";

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
    <label htmlFor="resource-code">Punya kode akses dari pengajar?</label>
    <div><input id="resource-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" required maxLength={80} />
      <button type="submit" disabled={busy}>{busy ? "Memeriksa…" : "Tambahkan akses"}</button></div>
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
          <h2>{resource.title}</h2><p>{canManage ? "This resource is assigned to your account." : resource.hasAttempt ? "Your previous attempt is available to continue or review." : `Assigned scope: ${resource.deliveryScope === "full" ? "Full diagnostic" : resource.deliveryScope === "structure" ? "Structure and Written Expression" : resource.deliveryScope[0].toUpperCase() + resource.deliveryScope.slice(1)}`}</p></div>
        {resource.kind === "listening_form" && <Link className="ptc-resource-open" href="/test-center/listening/2000-10">Open resource →</Link>}
        {resource.kind === "diagnostic_package" && <Link className="ptc-resource-open" href="/test-center/diagnostic/ets-volume3-practice-test-a">Open diagnostic →</Link>}
      </article>) : <div className="ptc-resource-empty"><h2>No resources assigned yet</h2><p>When your teacher shares an access code, enter it above. Assigned resources will appear here.</p></div>}
    </section>
  </main>;
}

type DeliveryScope = "full" | "listening" | "structure" | "reading";
type ReviewItem = { section: string; question: number; selected: string | null; correctAnswer: string; correct: boolean };
type AttemptResult = {
  total?: { correct: number; incorrect: number; omitted: number; questions: number };
  sections?: Record<string, { correct: number; incorrect: number; omitted: number; total: number }>;
  summary?: { correct: number; incorrect: number; omitted: number; total: number };
  review?: ReviewItem[];
};
type AttemptHistory = {
  number: number; status: string; scope: string; deliveryScope: DeliveryScope;
  createdAt: string; completedAt: string | null; archivedAt: string | null; result: AttemptResult | null;
  retakes: Array<{ section: string; number: number; status: string; createdAt: string; completedAt: string | null; archivedAt: string | null; result: AttemptResult | null }>;
};
type ManagedResource = { id: string; code: string; version: number; kind: string; title: string; status: string; tags: string[]; assignedCount: number; candidates?: Array<{ actorId: string; name: string; email: string; deliveryScope: DeliveryScope; attempts: AttemptHistory[] }> };

function resultLabel(result: AttemptResult | null) {
  const correct = result?.total?.correct ?? result?.summary?.correct;
  const total = result?.total?.questions ?? result?.summary?.total;
  return correct === undefined || total === undefined ? null : `${correct} / ${total} correct`;
}

function MissedQuestions({ result }: { result: AttemptResult | null }) {
  const missed = result?.review?.filter((item) => !item.correct) ?? [];
  if (!result) return <p className="ptc-review-empty">No completed result is recorded for this attempt.</p>;
  if (!missed.length) return <p className="ptc-review-empty">No missed questions in this attempt.</p>;
  return <div className="ptc-missed-list" aria-label="Missed question review">
    {missed.map((item) => <div className="ptc-missed-item" key={`${item.section}-${item.question}`}>
      <span>{item.section} · Q{item.question}</span>
      <span>Response: <strong>{item.selected ?? "Omitted"}</strong></span>
      <span>Key: <strong>{item.correctAnswer}</strong></span>
    </div>)}
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
  const [listeningMode, setListeningMode] = useState<"autoplay" | "question_click">("autoplay");
  const [showListeningQuestionText, setShowListeningQuestionText] = useState(true);
  const [deliveryScope, setDeliveryScope] = useState<DeliveryScope>("full");
  const [inviteKind, setInviteKind] = useState<"private" | "classroom">("private");
  const [viewMode, setViewMode] = useState<"compact" | "expanded">("compact");
  const [resourceVisibility, setResourceVisibility] = useState<Record<string, boolean>>({});
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>(() => Object.fromEntries(initial.map((resource) => [resource.id, resource.tags.join(", ")])));
  function changeViewMode(mode: "compact" | "expanded") {
    setViewMode(mode);
    setResourceVisibility({});
  }
  function toggleResource(resourceId: string, isOpen: boolean) {
    setResourceVisibility((current) => ({ ...current, [resourceId]: !isOpen }));
  }
  async function mutate(resource: ManagedResource, action: "issue_invite" | "set_status") {
    setBusy(resource.id); setMessage(""); setIssuedCode(null);
    const status = resource.status === "published" ? "hidden" : "published";
    try {
      const response = await fetch("/api/test-center/teaching", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, resourceId: resource.id, status, listeningMode, showListeningQuestionText, deliveryScope, inviteKind }) });
      const data = await response.json() as { invite?: { code: string; deliveryScope: DeliveryScope; listeningMode: "autoplay" | "question_click"; inviteKind: "private" | "classroom" }; resource?: { status: string }; error?: string };
      if (!response.ok) throw new Error("The change could not be saved.");
      if (data.invite) setIssuedCode({ title: resource.title, code: data.invite.code, scope: data.invite.deliveryScope, listeningMode: data.invite.listeningMode, inviteKind: data.invite.inviteKind });
      if (data.resource) setResources((current) => current.map((item) => item.id === resource.id ? { ...item, status: data.resource!.status } : item));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Something went wrong."); }
    finally { setBusy(null); }
  }
  async function archiveCandidate(resource: ManagedResource, candidate: NonNullable<ManagedResource["candidates"]>[number]) {
    if (!window.confirm(`Archive ${candidate.name}'s current attempt history and let them start again from the beginning? Their answers and results will remain available here.`)) return;
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
  async function saveTags(resource: ManagedResource) {
    setBusy(`tags:${resource.id}`); setMessage("");
    try {
      const tags = (tagDrafts[resource.id] ?? "").split(",").map((tag) => tag.trim()).filter(Boolean);
      const response = await fetch("/api/test-center/teaching", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_tags", resourceId: resource.id, tags }),
      });
      const data = await response.json() as { resource?: { tags: string[] } };
      if (!response.ok || !data.resource) throw new Error("The tags could not be saved.");
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
    <div className="ptc-resource-view-controls" aria-label="Resource display"><span>{resources.length} activities</span><div><button className={viewMode === "compact" ? "active" : ""} onClick={() => changeViewMode("compact")} aria-pressed={viewMode === "compact"}>Compact</button><button className={viewMode === "expanded" ? "active" : ""} onClick={() => changeViewMode("expanded")} aria-pressed={viewMode === "expanded"}>Expanded</button></div></div>
    <section className={`ptc-resource-list is-${viewMode}`}>{resources.map((resource) => {
      const showDetails = resourceVisibility[resource.id] ?? viewMode === "expanded";
      return <article className={`ptc-resource-card${showDetails ? " is-open" : " is-compact"}`} key={resource.id}>
      <header className="ptc-resource-summary"><div><span className="eyebrow">{resource.kind.replaceAll("_", " ").toUpperCase()} · VERSION {resource.version}</span><h2>{resource.title}</h2>{resource.tags.length > 0 && <div className="ptc-resource-tags">{resource.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}</div><div className="ptc-resource-status"><span className={`status-${resource.status}`}>{resource.status}</span><small>{resource.assignedCount} active assignments</small><button className="ptc-resource-toggle" onClick={() => toggleResource(resource.id, showDetails)}>{showDetails ? "Collapse" : "Expand"}</button></div></header>
      {showDetails && <>
      <section className="ptc-tag-editor"><label htmlFor={`tags-${resource.id}`}><strong>Activity tags</strong><small>Separate multiple tags with commas.</small></label><input id={`tags-${resource.id}`} value={tagDrafts[resource.id] ?? ""} maxLength={320} placeholder="e.g. Full TOEFL Practice Test" onChange={(event) => setTagDrafts((current) => ({ ...current, [resource.id]: event.target.value }))} /><button disabled={busy !== null} onClick={() => void saveTags(resource)}>{busy === `tags:${resource.id}` ? "Saving…" : "Save tags"}</button></section>
      <section className="ptc-assignment-builder"><div className="ptc-control-heading"><span className="eyebrow">NEW ASSIGNMENT</span><h3>Configure one access code</h3><p>These choices are pinned when the candidate claims the code.</p></div><div className="ptc-resource-actions">
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
        <div className="ptc-primary-actions"><button disabled={busy !== null || resource.status !== "published"} onClick={() => mutate(resource, "issue_invite")}>{busy === resource.id ? "Creating…" : inviteKind === "classroom" ? "Create classroom code" : "Create private code"}</button>
        {(resource.status === "published" || resource.status === "hidden" || resource.status === "draft") && <button className="secondary" disabled={busy !== null} onClick={() => mutate(resource, "set_status")}>{resource.status === "published" ? "Hide resource" : "Publish resource"}</button>}</div>
      </div></section>
      {resource.candidates?.length ? <section className="ptc-candidate-results">
        <div className="ptc-candidate-heading"><div><p className="eyebrow">ASSIGNED CANDIDATES</p><h3>Attempts and answer review</h3></div><span>{resource.candidates.length} candidates</span></div>
        {resource.candidates.map((candidate) => {
          const currentAttempts = candidate.attempts.filter((attempt) => !attempt.archivedAt);
          const latest = currentAttempts.at(-1);
          const retryCount = candidate.attempts.reduce((count, attempt) => count + attempt.retakes.length, 0);
          return <details className="ptc-candidate" key={candidate.actorId}>
            <summary>
              <span className="ptc-candidate-person"><strong>{candidate.name}</strong><small>{candidate.email}</small></span>
              <span className="ptc-candidate-state">{latest ? latest.status === "completed" ? `Latest · ${resultLabel(latest.result) ?? "Completed"}` : "Attempt in progress" : "Not started"}</span>
              <span className="ptc-candidate-scope">{candidate.deliveryScope === "full" ? "Full diagnostic" : `${candidate.deliveryScope} only`}</span>
              <span className="ptc-candidate-retries">{candidate.attempts.length} historical {candidate.attempts.length === 1 ? "attempt" : "attempts"} · {retryCount} section retakes</span>
              <span className="ptc-expand-label">View history</span>
            </summary>
            <div className="ptc-candidate-history">
              {currentAttempts.length > 0 && <div className="ptc-candidate-reset"><div><strong>Restart from the beginning</strong><p>Archive the current attempt lineage. All answers and results remain visible in this history.</p></div><button className="danger" disabled={busy !== null} onClick={() => void archiveCandidate(resource, candidate)}>{busy === `archive:${candidate.actorId}` ? "Archiving…" : "Archive current attempt and restart"}</button></div>}
              {currentAttempts.length === 0 && candidate.attempts.length > 0 && <p className="ptc-restart-ready">Current attempt archived · candidate is ready to start again.</p>}
              {candidate.attempts.length === 0 ? <p className="ptc-review-empty">This candidate has not started an attempt.</p> : candidate.attempts.map((attempt) => <section className={`ptc-attempt-card${attempt.archivedAt ? " is-archived" : ""}`} key={`attempt-${attempt.number}`}>
                <header><div><p className="eyebrow">{attempt.deliveryScope === "full" ? "FULL DIAGNOSTIC" : `${attempt.deliveryScope.toUpperCase()} ASSIGNMENT`} · ATTEMPT {attempt.number}</p><strong>{attempt.archivedAt ? "Archived" : attempt.status === "completed" ? "Completed" : `In progress · ${attempt.scope}`}</strong></div><div className="ptc-attempt-dates"><time dateTime={attempt.completedAt ?? attempt.createdAt}>{new Date(attempt.completedAt ?? attempt.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</time>{attempt.archivedAt && <small>Archived {new Date(attempt.archivedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</small>}</div></header>
                <AttemptResultSummary result={attempt.result} />
                {attempt.result && <details className="ptc-answer-review"><summary>Missed questions and answer key</summary><MissedQuestions result={attempt.result} /></details>}
                {attempt.retakes.length > 0 && <div className="ptc-retake-history"><h4>Section retakes</h4>{attempt.retakes.map((retake) => <article className={retake.archivedAt ? "is-archived" : ""} key={`${retake.section}-${retake.number}`}>
                  <header><strong>{retake.section} retake {retake.number}</strong><span>{retake.archivedAt ? "Archived" : retake.status === "completed" ? resultLabel(retake.result) ?? "Completed" : "In progress"}</span><time dateTime={retake.archivedAt ?? retake.completedAt ?? retake.createdAt}>{retake.archivedAt ? `Archived ${new Date(retake.archivedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}` : new Date(retake.completedAt ?? retake.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</time></header>
                  <AttemptResultSummary result={retake.result} />
                  {retake.result && <details className="ptc-answer-review"><summary>Missed questions and answer key</summary><MissedQuestions result={retake.result} /></details>}
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
