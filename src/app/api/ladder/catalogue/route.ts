import { ladderRepository } from "@/adapters/ladder/postgres-ladder";
import { LadderError } from "@/domain/ladder/model";
import { ladderFailure } from "@/lib/ladder-response";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) throw new LadderError("authentication_required", 401);
    return Response.json(
      { activities: await ladderRepository.catalogue(user) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return ladderFailure(error);
  }
}
