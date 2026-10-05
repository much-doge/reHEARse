import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { ClassroomGame } from "@/components/classroom-game";
export const dynamic = "force-dynamic";
export default async function Classroom({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string }>;
}) {
  const u = await requireUser();
  if (!["teacher", "admin"].includes(u.role)) redirect("/play");
  const p = await searchParams;
  return <ClassroomGame teacher initialPin={p.pin ?? ""} />;
}
