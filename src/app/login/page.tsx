import Link from "next/link";

import { loginAction } from "@/app/auth-actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error === "credentials"
    ? "That email and passphrase do not match."
    : error === "invalid"
      ? "Enter a valid email and a passphrase of at least 10 characters."
      : null;

  return (
    <main className="auth-shell">
      <Link href="/" className="brand-mark"><span className="brand-pulse" /><span>reHEARse</span></Link>
      <section className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Return to your listening desk.</h1>
        <p>Your earlier attempts remain exactly as you left them.</p>
        {message && <div className="auth-error" role="alert">{message}</div>}
        <form action={loginAction} className="auth-form">
          <label><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
          <label><span>Passphrase</span><input name="password" type="password" autoComplete="current-password" minLength={10} maxLength={128} required /></label>
          <button className="button button-primary" type="submit">Sign in <span aria-hidden="true">→</span></button>
        </form>
        <p className="auth-switch">New here? <Link href="/register">Create a learner account</Link></p>
      </section>
    </main>
  );
}
