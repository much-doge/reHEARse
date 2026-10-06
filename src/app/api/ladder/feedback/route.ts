import { z } from "zod";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";
import { ladderRepository } from "@/adapters/ladder/postgres-ladder";
import { LadderError } from "@/domain/ladder/model";
import { ladderFailure } from "@/lib/ladder-response";
export async function POST(req: Request) {
  try {
    if (!isSameOriginRequest(req))
      throw new LadderError("origin_rejected", 403);
    if (!req.headers.get("content-type")?.startsWith("application/json"))
      throw new LadderError("content_type_required", 415);
    const user = await currentUser();
    if (!user) throw new LadderError("authentication_required", 401);
    const raw = await req.text();
    if (raw.length > 200) throw new LadderError("request_too_large", 413);
    const parsed = z
      .object({ eventId: z.uuid() })
      .strict()
      .safeParse(JSON.parse(raw));
    if (!parsed.success) throw new LadderError("invalid_request");
    return Response.json(
      { note: await ladderRepository.feedback(user, parsed.data.eventId) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return ladderFailure(e);
  }
}
