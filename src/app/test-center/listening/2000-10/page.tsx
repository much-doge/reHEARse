import Link from "next/link";

import { listeningPilotRepository } from "@protefl/adapters/postgres-listening";
import { ListeningTest } from "@/components/test-center/listening-test";
import { requireUser } from "@/lib/session";

import "@/components/test-center/listening-test.css";

export const dynamic = "force-dynamic";

export default async function ListeningTestPage() {
  const user = await requireUser("/test-center/listening/2000-10");
  const initial = await listeningPilotRepository.view(user.id);
  return (
    <main className="ptc-shell">
      <header className="ptc-header">
        <Link href="/dashboard" className="ptc-back">← Dashboard</Link>
        <span className="ptc-wordmark">ProTEFL Test Center</span>
        <span className="ptc-pilot">Supervised pilot / Uji coba terbimbing</span>
      </header>
      <ListeningTest initial={initial} learnerName={user.displayName} />
    </main>
  );
}
