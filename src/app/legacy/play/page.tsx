import { ClassroomGame } from "@/components/classroom-game";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Play({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string }>;
}) {
  const p = await searchParams;
  await requireUser(`/legacy/play${p.pin ? `?pin=${p.pin}` : ""}`);
  return <ClassroomGame initialPin={p.pin ?? ""} />;
}
