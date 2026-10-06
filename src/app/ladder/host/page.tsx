import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { LadderHost } from "@/components/ladder/host";
export const dynamic = "force-dynamic";
export default async function LadderHostPage({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string }>;
}) {
  const user = await requireUser();
  if (user.role === "learner") redirect("/ladder");
  const { pin } = await searchParams;
  return <LadderHost initialPin={pin?.match(/^\d{6}$/) ? pin : undefined} />;
}
