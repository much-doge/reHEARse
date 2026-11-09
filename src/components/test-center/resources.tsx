"use client";

import Link from "next/link";
import { useState } from "react";

import type { TestCenterResource } from "@protefl/adapters/postgres-resources";

export function ResourceClaim({ onClaimed }: { onClaimed: () => void }) {
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
      if (!response.ok) throw new Error("Kode tidak tersedia. Periksa kembali atau hubungi pengajar.");
      setCode("");
      setMessage("Akses berhasil ditambahkan.");
      onClaimed();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Akses belum dapat ditambahkan.");
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
      {items.length ? items.map((resource) => <article className="ptc-resource-card" key={resource.id}>
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
  createdAt: string; completedAt: string | null; result: AttemptResult | null;
  retakes: Array<{ section: string; number: number; status: string; createdAt: string; completedAt: string | null; result: AttemptResult | null }>;
};
type ManagedResource = { id: string; code: string; version: number; kind: string; title: string; status: string; assignedCount: number; candidates?: Array<{ name: string; email: string; deliveryScope: DeliveryScope; attempts: AttemptHistory[] }> };

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
  const [issuedCode, setIssuedCode] = useState<{ title: string; code: string; scope: DeliveryScope } | null>(null);
  const [listeningMode, setListeningMode] = useState<"autoplay" | "question_click">("autoplay");
  const [showListeningQuestionText, setShowListeningQuestionText] = useState(true);
  const [deliveryScope, setDeliveryScope] = useState<DeliveryScope>("full");
  async function mutate(resource: ManagedResource, action: "issue_invite" | "set_status") {
    setBusy(resource.id); setMessage(""); setIssuedCode(null);
    const status = resource.status === "published" ? "hidden" : "published";
    try {
      const response = await fetch("/api/test-center/teaching", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, resourceId: resource.id, status, listeningMode, showListeningQuestionText, deliveryScope }) });
      const data = await response.json() as { invite?: { code: string; deliveryScope: DeliveryScope }; resource?: { status: string }; error?: string };
      if (!response.ok) throw new Error("The change could not be saved.");
      if (data.invite) setIssuedCode({ title: resource.title, code: data.invite.code, scope: data.invite.deliveryScope });
      if (data.resource) setResources((current) => current.map((item) => item.id === resource.id ? { ...item, status: data.resource!.status } : item));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Something went wrong."); }
    finally { setBusy(null); }
  }
  return <main className="ptc-resources-shell">
    <header className="ptc-resources-header"><Link href="/test-center">← Candidate view</Link><strong>TOEFL-like Test Center</strong><Link href="/dashboard">Dashboard</Link></header>
    <section className="ptc-resources-intro"><p className="eyebrow">TEACHER / ADMIN WORKSPACE</p><h1>Assignments and results</h1><p>Review candidate progress, publish resources, and issue one-use access codes.</p></section>
    {message && <p role="alert" className="ptc-resource-notice">{message}</p>}
    {issuedCode && <section className="ptc-issued-code" role="status"><strong>Share this code once · {issuedCode.title}</strong><code>{issuedCode.code}</code><p>Scope: {issuedCode.scope === "full" ? "Full diagnostic" : issuedCode.scope === "structure" ? "Structure and Written Expression" : issuedCode.scope[0].toUpperCase() + issuedCode.scope.slice(1)}. This code expires in 7 days and is shown only now.</p><button onClick={() => { navigator.clipboard?.writeText(issuedCode.code); setMessage("Code copied."); }}>Copy code</button></section>}
    <section className="ptc-resource-list">{resources.map((resource) => <article className="ptc-resource-card" key={resource.id}>
      <div><span className="eyebrow">{resource.kind.replaceAll("_", " ").toUpperCase()} · VERSION {resource.version}</span><h2>{resource.title}</h2><p>Status: <strong>{resource.status}</strong> · {resource.assignedCount} active assignments</p></div>
      <div className="ptc-resource-actions">
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
        <button disabled={busy !== null || resource.status !== "published"} onClick={() => mutate(resource, "issue_invite")}>{busy === resource.id ? "Working…" : "Create access code"}</button>
        {(resource.status === "published" || resource.status === "hidden" || resource.status === "draft") && <button className="secondary" disabled={busy !== null} onClick={() => mutate(resource, "set_status")}>{resource.status === "published" ? "Hide resource" : "Publish resource"}</button>}
      </div>
      {resource.candidates?.length ? <section className="ptc-candidate-results">
        <div className="ptc-candidate-heading"><div><p className="eyebrow">ASSIGNED CANDIDATES</p><h3>Attempts and answer review</h3></div><span>{resource.candidates.length} candidates</span></div>
        {resource.candidates.map((candidate) => {
          const latest = candidate.attempts.at(-1);
          const retryCount = candidate.attempts.reduce((count, attempt) => count + attempt.retakes.length, 0);
          return <details className="ptc-candidate" key={candidate.email}>
            <summary>
              <span className="ptc-candidate-person"><strong>{candidate.name}</strong><small>{candidate.email}</small></span>
              <span className="ptc-candidate-state">{latest ? latest.status === "completed" ? `Latest · ${resultLabel(latest.result) ?? "Completed"}` : "Attempt in progress" : "Not started"}</span>
              <span className="ptc-candidate-scope">{candidate.deliveryScope === "full" ? "Full diagnostic" : `${candidate.deliveryScope} only`}</span>
              <span className="ptc-candidate-retries">{candidate.attempts.length} {candidate.attempts.length === 1 ? "attempt" : "attempts"} · {retryCount} section retakes</span>
              <span className="ptc-expand-label">View history</span>
            </summary>
            <div className="ptc-candidate-history">
              {candidate.attempts.length === 0 ? <p className="ptc-review-empty">This candidate has not started an attempt.</p> : candidate.attempts.map((attempt) => <section className="ptc-attempt-card" key={`attempt-${attempt.number}`}>
                <header><div><p className="eyebrow">{attempt.deliveryScope === "full" ? "FULL DIAGNOSTIC" : `${attempt.deliveryScope.toUpperCase()} ASSIGNMENT`} · ATTEMPT {attempt.number}</p><strong>{attempt.status === "completed" ? "Completed" : `In progress · ${attempt.scope}`}</strong></div><time dateTime={attempt.completedAt ?? attempt.createdAt}>{new Date(attempt.completedAt ?? attempt.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</time></header>
                <AttemptResultSummary result={attempt.result} />
                {attempt.result && <details className="ptc-answer-review"><summary>Missed questions and answer key</summary><MissedQuestions result={attempt.result} /></details>}
                {attempt.retakes.length > 0 && <div className="ptc-retake-history"><h4>Section retakes</h4>{attempt.retakes.map((retake) => <article key={`${retake.section}-${retake.number}`}>
                  <header><strong>{retake.section} retake {retake.number}</strong><span>{retake.status === "completed" ? resultLabel(retake.result) ?? "Completed" : "In progress"}</span><time dateTime={retake.completedAt ?? retake.createdAt}>{new Date(retake.completedAt ?? retake.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</time></header>
                  <AttemptResultSummary result={retake.result} />
                  {retake.result && <details className="ptc-answer-review"><summary>Missed questions and answer key</summary><MissedQuestions result={retake.result} /></details>}
                </article>)}</div>}
              </section>)}
            </div>
          </details>;
        })}
      </section> : null}
    </article>)}</section>
  </main>;
}
