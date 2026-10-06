import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { safeReturnTo } from "@/lib/auth-navigation";

import { loginAction } from "@/app/auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; reason?: string }>;
}) {
  const { error, next, reason } = await searchParams;
  const destination = safeReturnTo(next);
  if (await currentUser()) redirect(destination);
  const message =
    error === "credentials"
      ? "The email or password is incorrect. / Email atau kata sandi tidak sesuai."
      : error === "invalid"
        ? "Enter your email and a password of at least 10 characters. / Masukkan email dan kata sandi minimal 10 karakter."
        : null;

  return (
    <main className="auth-shell">
      <Link href="/" className="brand-mark">
        <span className="brand-pulse" />
        <span>reHEARse</span>
      </Link>
      <section className="auth-card">
        <p className="eyebrow">Sign in / Masuk</p>
        <h1>Continue your listening practice.</h1>
        <p>
          Open your activities and review your previous responses. / Buka
          aktivitas dan tinjau jawaban sebelumnya.
        </p>
        {message && (
          <div className="auth-error" role="alert">
            {message}
          </div>
        )}
        {reason === "expired" && (
          <p role="status">
            Your session has ended. Sign in to continue where you left off. /
            Sesi kamu berakhir. Masuk untuk melanjutkan aktivitasmu.
          </p>
        )}
        <form action={loginAction} className="auth-form">
          <input type="hidden" name="next" value={destination} />
          <label>
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            <span>Password / Kata sandi</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={10}
              maxLength={128}
              required
            />
          </label>
          <button className="button button-primary" type="submit">
            Sign in / Masuk <span aria-hidden="true">→</span>
          </button>
        </form>
        <p className="auth-switch">
          New here? / Belum punya akun?{" "}
          <Link
            href={`/register?${new URLSearchParams({ next: destination })}`}
          >
            Create an account / Buat akun
          </Link>
        </p>
      </section>
    </main>
  );
}
