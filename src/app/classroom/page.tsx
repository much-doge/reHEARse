import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { ClassroomGame } from "@/components/classroom-game";
export const dynamic = "force-dynamic";
export default async function Classroom({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string }>;
}) {
  const p = await searchParams;
  const u = await requireUser(`/classroom${p.pin ? `?pin=${p.pin}` : ""}`);
  if (!["teacher", "admin"].includes(u.role)) redirect("/play");
  return <ClassroomGame teacher initialPin={p.pin ?? ""} />;
}
