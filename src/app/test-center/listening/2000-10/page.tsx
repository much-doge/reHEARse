import Link from "next/link";
import { notFound } from "next/navigation";

import { listeningPilotRepository } from "@protefl/adapters/postgres-listening";
import { ListeningTest } from "@/components/test-center/listening-test";
import { requireUser } from "@/lib/session";
import { ListeningPilotError } from "@protefl/domain/listening";

import "@/components/test-center/listening-test.css";

export const dynamic = "force-dynamic";

export default async function ListeningTestPage() {
  const user = await requireUser("/test-center/listening/2000-10");
  let initial: Awaited<ReturnType<typeof listeningPilotRepository.view>>;
  try {
    initial = await listeningPilotRepository.view(user.id);
  } catch (error) {
    if (error instanceof ListeningPilotError && error.status === 404) notFound();
    throw error;
  }
  return (
    <main className="ptc-shell">
      <header className="ptc-header">
        <Link href="/dashboard" className="ptc-back">← Dashboard</Link>
        <span className="ptc-wordmark">TOEFL-like Test Center</span>
        <span className="ptc-pilot">Supervised pilot</span>
      </header>
      <ListeningTest initial={initial} learnerName={user.displayName} />
    </main>
  );
}
