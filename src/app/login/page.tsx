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
      ? "The email or password is incorrect."
      : error === "invalid"
        ? "Enter your email and a password of at least 10 characters."
        : null;

  return (
    <main className="auth-shell">
      <Link href="/" className="brand-mark">
        <span className="brand-pulse" />
        <span>reHEARse</span>
      </Link>
      <section className="auth-card">
        <p className="eyebrow">Sign in</p>
        <h1>Continue your listening practice.</h1>
        <p>
          Open your activities and review your previous responses.</p>
        {message && (
          <div className="auth-error" role="alert">
            {message}
          </div>
        )}
        {reason === "expired" && (
          <p role="status">Your session ended. Sign in to continue your activity.</p>
        )}
        <form action={loginAction} className="auth-form">
          <input type="hidden" name="next" value={destination} />
          <label>
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            <span>Password</span>
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
            Sign in<span aria-hidden="true">→</span>
          </button>
        </form>
        <p className="auth-switch">
          New here?{" "}
          <Link
            href={`/register?${new URLSearchParams({ next: destination })}`}
          >
            Create an account</Link>
        </p>
      </section>
    </main>
  );
}
