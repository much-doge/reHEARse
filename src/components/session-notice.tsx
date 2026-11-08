"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { signInUrl } from "@/lib/auth-navigation";
/** Reauthenticate in another tab so an unsaved activity stays mounted. */
export function SessionNotice() {
  const path = usePathname();
  const search = useSearchParams();
  const [expired, setExpired] = useState(false);
  const [checking, setChecking] = useState(false);
  const protectedPage = /^\/(dashboard|test-center|legacy)(\/|$)/.test(
    path,
  );
  useEffect(() => {
    if (!protectedPage) return;
    let active = true;
    async function check(lockUntilVerified = false) {
      if (lockUntilVerified && active) setChecking(true);
      try {
        const response = await fetch("/api/session", {
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          const session = await response.json();
          if (active) {
            setExpired(!session.authenticated);
            setChecking(false);
          }
        } else if (active) {
          setExpired(true);
          setChecking(false);
        }
      } catch {
        if (active) {
          setExpired(true);
          setChecking(false);
        }
      }
    }
    void check();
    const timer = setInterval(() => { void check(); }, 15000);
    const verifyOnReturn = () => { void check(true); };
    window.addEventListener("focus", verifyOnReturn);
    window.addEventListener("pageshow", verifyOnReturn);
    const visible = () => { if (document.visibilityState === "visible") verifyOnReturn(); };
    document.addEventListener("visibilitychange", visible);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", verifyOnReturn);
      window.removeEventListener("pageshow", verifyOnReturn);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [path, protectedPage]);
  if (!protectedPage || (!expired && !checking)) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "grid", placeItems: "center", padding: 24, background: "var(--canvas, #f3f0e8)" }}>
      <aside className="auth-error" role="alert" style={{ width: "min(520px, 100%)", margin: 0, boxShadow: "0 18px 60px #17202a22" }}>
        <p>{checking ? "Checking your sign-in…" : "Your session has ended or could not be verified. This page is locked."}</p>
        {!checking && <a href={signInUrl(`${path}${search.size ? `?${search}` : ""}`, true)} target="_blank" rel="noopener">Sign in in another tab, then return here</a>}
      </aside>
    </div>
  );
}
