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
          <h2>{resource.title}</h2><p>{canManage ? "This resource is assigned to your account." : resource.hasAttempt ? "Your previous attempt is available to continue or review." : "Assigned to your account"}</p></div>
        {resource.kind === "listening_form" && <Link className="ptc-resource-open" href="/test-center/listening/2000-10">Open resource →</Link>}
        {resource.kind === "diagnostic_package" && <Link className="ptc-resource-open" href="/test-center/diagnostic/ets-volume3-practice-test-a">Open diagnostic →</Link>}
      </article>) : <div className="ptc-resource-empty"><h2>No resources assigned yet</h2><p>When your teacher shares an access code, enter it above. Assigned resources will appear here.</p></div>}
    </section>
  </main>;
}

type ManagedResource = { id: string; code: string; version: number; kind: string; title: string; status: string; assignedCount: number; candidates?: Array<{ name: string; email: string; status: string | null; attempt: number | null; completedAt: string | null; result: { total?: { correct: number; questions: number }; sections?: Record<string, { correct: number; total: number }> } | null; retakes: number; retakeResults?: Array<{ section: string; number: number; status: string; result?: { summary?: { correct: number; total: number } } }> }> };
export function ResourceManager({ resources: initial }: { resources: ManagedResource[] }) {
  const [resources, setResources] = useState(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [issuedCode, setIssuedCode] = useState<{ title: string; code: string } | null>(null);
  const [listeningMode, setListeningMode] = useState<"autoplay" | "question_click">("autoplay");
  const [showListeningQuestionText, setShowListeningQuestionText] = useState(true);
  async function mutate(resource: ManagedResource, action: "issue_invite" | "set_status") {
    setBusy(resource.id); setMessage(""); setIssuedCode(null);
    const status = resource.status === "published" ? "hidden" : "published";
    try {
      const response = await fetch("/api/test-center/teaching", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, resourceId: resource.id, status, listeningMode, showListeningQuestionText }) });
      const data = await response.json() as { invite?: { code: string }; resource?: { status: string }; error?: string };
      if (!response.ok) throw new Error("Perubahan belum berhasil disimpan.");
      if (data.invite) setIssuedCode({ title: resource.title, code: data.invite.code });
      if (data.resource) setResources((current) => current.map((item) => item.id === resource.id ? { ...item, status: data.resource!.status } : item));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Terjadi kendala."); }
    finally { setBusy(null); }
  }
  return <main className="ptc-resources-shell">
    <header className="ptc-resources-header"><Link href="/test-center">← Candidate view</Link><strong>TOEFL-like Test Center</strong><Link href="/dashboard">Dashboard</Link></header>
    <section className="ptc-resources-intro"><p className="eyebrow">TEACHER / ADMIN WORKSPACE</p><h1>Assignments and results</h1><p>Review candidate progress, publish resources, and issue one-use access codes.</p></section>
    {message && <p role="alert" className="ptc-resource-notice">{message}</p>}
    {issuedCode && <section className="ptc-issued-code" role="status"><strong>Share this code once · {issuedCode.title}</strong><code>{issuedCode.code}</code><p>This 10-character code expires in 7 days. It is shown only now; create another if it is lost.</p><button onClick={() => { navigator.clipboard?.writeText(issuedCode.code); setMessage("Code copied."); }}>Copy code</button></section>}
    <section className="ptc-resource-list">{resources.map((resource) => <article className="ptc-resource-card" key={resource.id}>
      <div><span className="eyebrow">{resource.kind.replaceAll("_", " ").toUpperCase()} · VERSION {resource.version}</span><h2>{resource.title}</h2><p>Status: <strong>{resource.status}</strong> · {resource.assignedCount} active assignments</p></div>
      <div className="ptc-resource-actions">
        {resource.kind === "diagnostic_package" && <label className="ptc-listening-mode">Listening playback
          <select value={listeningMode} onChange={(event) => setListeningMode(event.target.value as "autoplay" | "question_click")}>
            <option value="autoplay">Autoplay</option><option value="question_click">Play each question</option>
          </select>
        </label>}
        {resource.kind === "diagnostic_package" && <label className="ptc-listening-mode"><span><input type="checkbox" checked={showListeningQuestionText} onChange={(event) => setShowListeningQuestionText(event.target.checked)} /> Show listening question text</span><small>This choice is pinned when each access code is issued.</small></label>}
        <button disabled={busy !== null || resource.status !== "published"} onClick={() => mutate(resource, "issue_invite")}>{busy === resource.id ? "Working…" : "Create access code"}</button>
        {(resource.status === "published" || resource.status === "hidden" || resource.status === "draft") && <button className="secondary" disabled={busy !== null} onClick={() => mutate(resource, "set_status")}>{resource.status === "published" ? "Hide resource" : "Publish resource"}</button>}
      </div>
      {resource.candidates?.length ? <section className="ptc-candidate-results"><h3>Candidate attempts</h3>{resource.candidates.map((candidate, index) => <article key={candidate.email + index}>
        <div><strong>{candidate.name}</strong><small>{candidate.email}</small></div>
        <span>{candidate.status === "completed" ? `Attempt ${candidate.attempt} · ${candidate.result?.total?.correct ?? "—"}/${candidate.result?.total?.questions ?? "—"}` : candidate.status === "in_progress" ? `Attempt ${candidate.attempt} · In progress` : "Not started"}</span>
        <span>{candidate.retakes} section retakes</span>
        {candidate.result && <small>{Object.entries(candidate.result.sections ?? {}).map(([name, value]) => `${name}: ${value.correct}/${value.total}`).join(" · ")}</small>}
        {candidate.retakeResults?.map((retake, index) => <small key={retake.section + index}>Retry {retake.number} · {retake.section}: {retake.result?.summary ? `${retake.result.summary.correct}/${retake.result.summary.total}` : retake.status}</small>)}
      </article>)}</section> : null}
    </article>)}</section>
  </main>;
}
