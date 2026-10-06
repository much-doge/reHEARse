"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { signInUrl } from "@/lib/auth-navigation";
/** Reauthenticate in another tab so an unsaved activity stays mounted. */
export function SessionNotice() {
  const path = usePathname();
  const search = useSearchParams();
  const [expired, setExpired] = useState(false);
  const protectedPage = /^\/(dashboard|ladder|classroom|learn)(\/|$)/.test(
    path,
  );
  useEffect(() => {
    if (!protectedPage) return;
    let active = true;
    async function check() {
      try {
        const response = await fetch("/api/session", {
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          const session = await response.json();
          if (active) setExpired(!session.authenticated);
        }
      } catch {
        /* A network gap is not proof of session expiry. */
      }
    }
    void check();
    const timer = setInterval(check, 15000);
    window.addEventListener("focus", check);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, [path, protectedPage]);
  if (!protectedPage || !expired) return null;
  return (
    <aside className="auth-error" role="alert">
      <p>
        Your session has ended. Keep this tab open; your unsaved text is still
        here. / Sesi kamu berakhir. Biarkan tab ini terbuka; teks yang belum
        tersimpan tetap ada.
      </p>
      <a
        href={signInUrl(`${path}${search.size ? `?${search}` : ""}`, true)}
        target="_blank"
        rel="noopener"
      >
        Sign in in another tab, then return here / Masuk di tab lain, lalu
        kembali ke sini ↗
      </a>
    </aside>
  );
}
