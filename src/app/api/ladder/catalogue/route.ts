import { ladderRepository } from "@/adapters/ladder/postgres-ladder";
import { LadderError } from "@/domain/ladder/model";
import { ladderFailure } from "@/lib/ladder-response";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) throw new LadderError("authentication_required", 401);
    const format = new URL(request.url).searchParams.get("format");
    if (format !== null && format !== "passage-v1") throw new LadderError("invalid_catalogue_format");
    return Response.json(
      { contractVersion: format ? "ladder-catalogue.v2" : "ladder-catalogue.v1",
        activities: await ladderRepository.catalogue(user, format ? "passage" : "single") },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return ladderFailure(error);
  }
}
