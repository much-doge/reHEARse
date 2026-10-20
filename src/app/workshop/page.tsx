import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { WorkshopHost } from "@/components/workshop/workshop";

export const dynamic = "force-dynamic";

export default async function WorkshopPage({ searchParams }: { searchParams: Promise<{ pin?: string }> }) {
  const query = await searchParams;
  const user = await requireUser(`/workshop${query.pin ? `?pin=${query.pin}` : ""}`);
  if (!['teacher','admin'].includes(user.role)) redirect(`/workshop/join${query.pin ? `?pin=${query.pin}` : ""}`);
  return <WorkshopHost initialPin={query.pin ?? ""} />;
}

