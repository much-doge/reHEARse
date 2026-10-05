import Link from "next/link";

import { registerAction } from "@/app/auth-actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    error === "exists"
      ? "That email is already registered. Please sign in. / Email sudah terdaftar. Silakan masuk."
      : error === "invalid"
        ? "Check your name and email. Use a password of at least 10 characters. / Periksa nama dan email. Gunakan kata sandi minimal 10 karakter."
        : null;

  return (
    <main className="auth-shell">
      <Link href="/" className="brand-mark">
        <span className="brand-pulse" />
        <span>reHEARse</span>
      </Link>
      <section className="auth-card">
        <p className="eyebrow">Learner account / Akun peserta</p>
        <h1>Create your account. / Buat akunmu.</h1>
        <p>
          Choose a nickname for each activity. / Pilih nama panggilan untuk
          setiap aktivitas.
        </p>
        {message && (
          <div className="auth-error" role="alert">
            {message}
          </div>
        )}
        <form action={registerAction} className="auth-form">
          <label>
            <span>Name / Nama</span>
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
            <span>Password / Kata sandi</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              required
            />
            <small>
              Use at least 10 characters. / Gunakan minimal 10 karakter.
            </small>
          </label>
          <button className="button button-primary" type="submit">
            Create account / Buat akun <span aria-hidden="true">→</span>
          </button>
        </form>
        <p className="auth-switch">
          Already registered? / Sudah terdaftar?{" "}
          <Link href="/login">Sign in / Masuk</Link>
        </p>
      </section>
    </main>
  );
}
