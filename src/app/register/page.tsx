import Link from "next/link";

import { registerAction } from "@/app/auth-actions";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error === "exists"
    ? "An account already uses that email. Try signing in instead."
    : error === "invalid"
      ? "Check your name, email, and passphrase. The passphrase needs at least 10 characters."
      : null;

  return (
    <main className="auth-shell">
      <Link href="/" className="brand-mark"><span className="brand-pulse" /><span>reHEARse</span></Link>
      <section className="auth-card">
        <p className="eyebrow">Start a private notebook</p>
        <h1>Create your learner account.</h1>
        <p>Your login name stays separate from the pseudonym you choose inside each activity.</p>
        {message && <div className="auth-error" role="alert">{message}</div>}
        <form action={registerAction} className="auth-form">
          <label><span>Name</span><input name="displayName" autoComplete="name" maxLength={80} required /></label>
          <label><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
          <label><span>Passphrase</span><input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /><small>Use at least 10 characters.</small></label>
          <button className="button button-primary" type="submit">Create account <span aria-hidden="true">→</span></button>
        </form>
        <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
