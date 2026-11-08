import Link from "next/link";
import "@/components/ladder/board.css";
import { logoutAction } from "@/app/auth-actions";
import { BrandMark } from "@/components/brand-mark";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const isStaff = user.role === "teacher" || user.role === "admin";
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
              <p className="eyebrow">ProTEFL Test Center</p>
              <h1>{user.role === "admin" ? "Administrator workspace" : "Teacher workspace"}</h1>
              <p>Manage course resources, control candidate access, and review the current Test Center setup.</p>
            </div>
          </section>

          <section className="ladder-dashboard-entry">
            <p className="eyebrow">COURSE ACCESS</p>
            <h2>Manage Test Center resources</h2>
            <p>Publish or hide resources and issue one-use access codes for candidates.</p>
            <Link href="/test-center/manage" className="ladder-primary">Open resource controls →</Link>
            <Link href="/test-center" className="ladder-secondary">View candidate resource page</Link>
          </section>

          <section className="ladder-dashboard-entry">
            <p className="eyebrow">ARCHIVED LEARNING TOOLS</p>
            <h2>Legacy reHEARse resources</h2>
            <p>Open the earlier listening activities, workshop, classroom tools, and listening ladder.</p>
            <Link href="/legacy" className="ladder-secondary">Browse legacy resources →</Link>
          </section>
        </>
      ) : (
        <>
          <section className="dashboard-intro">
            <div>
              <p className="eyebrow">ProTEFL Test Center</p>
              <h1>Your course space</h1>
              <p>Open the tests and course resources assigned to your account.</p>
            </div>
          </section>

          <section className="ladder-dashboard-entry">
            <p className="eyebrow">ASSIGNED COURSE MATERIAL</p>
            <h2>Your assigned resources</h2>
            <p>Only resources your teacher has assigned to your account appear in the Test Center.</p>
            <Link href="/test-center" className="ladder-primary">Open Test Center →</Link>
          </section>

          <section className="ladder-dashboard-entry">
            <p className="eyebrow">ARCHIVED LEARNING TOOLS</p>
            <h2>Earlier reHEARse activities</h2>
            <p>Listening practice and classroom tools from the earlier reHEARse workspace are kept separately.</p>
            <Link href="/legacy" className="ladder-secondary">Browse legacy resources →</Link>
          </section>
        </>
      )}
    </main>
  );
}
