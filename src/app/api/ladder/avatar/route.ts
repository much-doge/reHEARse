import { z } from "zod";

import { ladderRepository } from "@/adapters/ladder/postgres-ladder";
import { isAvatarId } from "@/domain/ladder/avatars";
import { LadderError } from "@/domain/ladder/model";
import { ladderFailure } from "@/lib/ladder-response";
import { isSameOriginRequest } from "@/lib/same-origin";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "private, no-store" };
const schema = z
  .object({ runId: z.uuid(), avatarId: z.string().min(1).max(40) })
  .strict();

export async function POST(req: Request) {
  try {
    if (!isSameOriginRequest(req))
      throw new LadderError("origin_rejected", 403);
    if (!req.headers.get("content-type")?.startsWith("application/json"))
      throw new LadderError("content_type_required", 415);
    const user = await currentUser();
    if (!user) throw new LadderError("authentication_required", 401);
    const raw = await req.text();
    if (raw.length > 256) throw new LadderError("request_too_large", 413);
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success || !isAvatarId(parsed.data.avatarId))
      throw new LadderError("invalid_request");
    const view = await ladderRepository.setAvatar(
      user,
      parsed.data.runId,
      parsed.data.avatarId,
    );
    return Response.json({ view }, { headers });
  } catch (error) {
    return ladderFailure(error);
  }
}
