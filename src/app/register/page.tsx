import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { safeReturnTo } from "@/lib/auth-navigation";
import { BrandMark } from "@/components/brand-mark";

import { registerAction } from "@/app/auth-actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; reason?: string }>;
}) {
  const { error, next, reason } = await searchParams;
  const destination = safeReturnTo(next);
  if (await currentUser()) redirect(destination);
  const message =
    error === "exists"
      ? "That email is already registered. Please sign in."
      : error === "invalid"
        ? "Check your name and email. Use a password of at least 10 characters."
        : null;

  return (
    <main className="auth-shell">
      <BrandMark />
      <section className="auth-card">
        <p className="eyebrow">Learner account</p>
        <h1>Create your account.</h1>
        <p>
          Choose a nickname for each activity.</p>
        {message && (
          <div className="auth-error" role="alert">
            {message}
          </div>
        )}
        {reason === "expired" && (
          <p role="status">Your session ended. Create an account or sign in to continue.</p>
        )}
        <form action={registerAction} className="auth-form">
          <input type="hidden" name="next" value={destination} />
          <label>
            <span>Name</span>
            <input
              name="displayName"
              autoComplete="name"
              maxLength={80}
              required
            />
          </label>
          <label>
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            <span>Password</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              required
            />
            <small>
              Use at least 10 characters.</small>
          </label>
          <button className="button button-primary" type="submit">
            Create account<span aria-hidden="true">→</span>
          </button>
        </form>
        <p className="auth-switch">
          Already registered?{" "}
          <Link href={`/login?${new URLSearchParams({ next: destination })}`}>
            Sign in</Link>
        </p>
      </section>
    </main>
  );
}
