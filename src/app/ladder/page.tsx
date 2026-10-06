import { requireUser } from "@/lib/session";
import { ladderRepository } from "@/adapters/ladder/postgres-ladder";
import { LadderGame } from "@/components/ladder/game";
export const dynamic = "force-dynamic";
export default async function LadderPage({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string; new?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser(
    `/ladder?${new URLSearchParams({ ...params })}`,
  );
  const initial =
    params.pin || params.new ? null : await ladderRepository.view(user);
  return (
    <LadderGame
      initial={initial}
      initialPin={params.pin?.match(/^\d{6}$/) ? params.pin : undefined}
      canJoin={user.role === "learner"}
    />
  );
}
