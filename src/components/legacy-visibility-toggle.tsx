"use client";

import { useEffect, useState } from "react";

export function LegacyVisibilityToggle() {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/legacy/visibility", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ enabled: boolean }> : Promise.reject())
      .then((data) => setEnabled(data.enabled))
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);
  async function toggle() {
    setBusy(true);
    try {
      const response = await fetch("/api/legacy/visibility", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !enabled }) });
      if (!response.ok) throw new Error();
      const result = await response.json() as { enabled: boolean };
      setEnabled(result.enabled);
    } catch { /* Keep the displayed state unchanged when saving fails. */ }
    finally { setBusy(false); }
  }
  return <div className="legacy-visibility-control">
    <p>{enabled ? "Learners can currently open legacy materials." : "Legacy materials are hidden from learners."}</p>
    <button type="button" className="ladder-secondary" disabled={!ready || busy} onClick={toggle}>{busy ? "Saving…" : enabled ? "Hide legacy materials from learners" : "Show legacy materials to learners"}</button>
  </div>;
}
