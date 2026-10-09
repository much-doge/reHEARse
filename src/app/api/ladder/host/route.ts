import { z } from "zod";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";
import { ladderRepository } from "@/adapters/ladder/postgres-ladder";
import { LadderError } from "@/domain/ladder/model";
import { ladderFailure } from "@/lib/ladder-response";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) throw new LadderError("authentication_required", 401);
    const pin = z
      .string()
      .regex(/^\d{6}$/)
      .parse(new URL(req.url).searchParams.get("pin"));
    return Response.json(await ladderRepository.host(user, pin), { headers });
  } catch (e) {
    return ladderFailure(e);
  }
}
const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("begin"), pin: z.string().regex(/^\d{6}$/) }).strict(),
  z
    .object({
      kind: z.literal("create"),
      key: z.uuid(),
      activityId: z.string().trim().min(1).max(80).optional(),
    })
    .strict(),
  z
    .object({ kind: z.literal("close"), pin: z.string().regex(/^\d{6}$/) })
    .strict(),
  z
    .object({
      kind: z.literal("assist"),
      pin: z.string().regex(/^\d{6}$/),
      runId: z.uuid(),
      key: z.uuid(),
      reason: z.string().trim().min(3).max(200),
    })
    .strict(),
]);
export async function POST(req: Request) {
  try {
    if (!isSameOriginRequest(req))
      throw new LadderError("origin_rejected", 403);
    if (!req.headers.get("content-type")?.startsWith("application/json"))
      throw new LadderError("content_type_required", 415);
    const user = await currentUser();
    if (!user) throw new LadderError("authentication_required", 401);
    const raw = await req.text();
    if (raw.length > 1024) throw new LadderError("request_too_large", 413);
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new LadderError("invalid_request");
    const a = parsed.data;
    return Response.json(
      a.kind === "create"
        ? await ladderRepository.createSession(user, a.key, a.activityId)
        : a.kind === "begin"
          ? await ladderRepository.beginSession(user, a.pin)
        : a.kind === "close"
          ? await ladderRepository.closeSession(user, a.pin)
          : await ladderRepository.assist(
              user,
              a.pin,
              a.runId,
              a.key,
              a.reason,
            ),
      { headers },
    );
  } catch (e) {
    return ladderFailure(e);
  }
}
