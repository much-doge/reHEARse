import Link from "next/link";
import "@/components/ladder/board.css";
import { getPool } from "@/adapters/db/client";
import { logoutAction } from "@/app/auth-actions";
import { BrandMark } from "@/components/brand-mark";
import { LegacyVisibilityToggle } from "@/components/legacy-visibility-toggle";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const isStaff = user.role === "teacher" || user.role === "admin";
  const legacyVisible = !isStaff && (await getPool().query("SELECT enabled FROM legacy_student_visibility WHERE singleton=true")).rows[0]?.enabled === true;
  const roleLabel = user.role === "admin" ? "Administrator" : isStaff ? "Teacher" : "Learner";

  return (
    <main className="app-shell">
      <header className="app-header">
        <BrandMark />
        <div className="header-person">
          <span className="avatar">{user.displayName.slice(0, 2).toUpperCase()}</span>
          <span><strong>{user.displayName}</strong><small>{roleLabel}</small></span>
          <form action={logoutAction}><button className="text-button" type="submit">Sign out</button></form>
        </div>
      </header>

      {isStaff ? (
        <>
          <section className="dashboard-intro">
            <div>
              <p className="eyebrow">TOEFL-like Test Center</p>
              <h1>{user.role === "admin" ? "Administrator workspace" : "Teacher workspace"}</h1>
              <p>Assign learning resources, control candidate access, and review test progress.</p>
            </div>
          </section>

          <section className="ladder-dashboard-entry">
            <p className="eyebrow">COURSE ACCESS</p>
            <h2>Teaching workspace</h2>
            <p>Review candidate attempts, publish resources, and issue one-use access codes.</p>
            <Link href="/test-center/teaching" className="ladder-primary">Open teaching workspace →</Link>
            <Link href="/test-center" className="ladder-secondary">View candidate resource page</Link>
          </section>

          <section className="ladder-dashboard-entry">
            <p className="eyebrow">VOCABULARY PRACTICE</p>
            <h2>Word Studio</h2>
            <p>Share private or classroom word rounds and review each learner’s card activity.</p>
            <Link href="/vocabulary/teaching" className="ladder-primary">Open Word Studio →</Link>
          </section>

          <section className="ladder-dashboard-entry">
            <p className="eyebrow">ARCHIVED LEARNING TOOLS</p>
            <h2>Legacy reHEARse resources</h2>
            <p>Archived listening tools stay hidden from learners until you enable access for them.</p>
            <Link href="/legacy" className="ladder-secondary">Open staff legacy resources →</Link>
            <LegacyVisibilityToggle />
          </section>
        </>
      ) : (
        <>
          <section className="dashboard-intro">
            <div>
              <p className="eyebrow">TOEFL-like Test Center</p>
              <h1>Your course space</h1>
              <p>Open the tests and course resources assigned to your account.</p>
            </div>
          </section>

          <section className="ladder-dashboard-entry">
            <p className="eyebrow">ASSIGNED COURSE MATERIAL</p>
            <h2>Your assigned resources</h2>
            <p>Only resources your teacher has assigned to your account appear here.</p>
            <Link href="/test-center" className="ladder-primary">Open TOEFL-like Test Center →</Link>
          </section>

          <section className="ladder-dashboard-entry">
            <p className="eyebrow">VOCABULARY PRACTICE</p>
            <h2>Word Studio</h2>
            <p>Play the word rounds assigned to your account by your teacher.</p>
            <Link href="/vocabulary" className="ladder-primary">Open assigned word sets →</Link>
          </section>

          {legacyVisible && <section className="ladder-dashboard-entry">
            <p className="eyebrow">ADDITIONAL LISTENING MATERIALS</p>
            <h2>Earlier reHEARse resources</h2>
            <p>Your teacher has enabled access to these archived listening activities.</p>
            <Link href="/legacy" className="ladder-secondary">Open listening materials →</Link>
          </section>}

        </>
      )}
    </main>
  );
}
