import { WorkshopLearner } from "@/components/workshop/workshop";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function WorkshopJoinPage({ searchParams }: { searchParams: Promise<{ pin?: string }> }) {
  const query = await searchParams;
  await requireUser(`/legacy/workshop/join${query.pin ? `?pin=${query.pin}` : ""}`);
  return <WorkshopLearner initialPin={query.pin ?? ""} />;
}

