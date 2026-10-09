import { z } from "zod";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";
import { ladderRepository } from "@/adapters/ladder/postgres-ladder";
import { LadderError } from "@/domain/ladder/model";
import { ladderFailure } from "@/lib/ladder-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) throw new LadderError("authentication_required", 401);
    const id = new URL(req.url).searchParams.get("runId");
    if (id && !z.uuid().safeParse(id).success)
      throw new LadderError("invalid_run");
    return Response.json(
      { view: await ladderRepository.view(user, id ?? undefined) },
      { headers },
    );
  } catch (e) {
    return ladderFailure(e);
  }
}
const action = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("choice"),
      item: z.number().int().min(0).max(11),
      choice: z.number().int().min(0).max(3).nullable(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("repair"),
      item: z.number().int().min(0).max(11),
      choice: z.number().int().min(0).max(2),
      explanation: z.string().trim().min(3).max(1200),
    })
    .strict(),
  z
    .object({
      kind: z.literal("support"),
      item: z.number().int().min(0).max(11),
      explanation: z.string().trim().min(3).max(1200),
    })
    .strict(),
  z.object({ kind: z.literal("help") }).strict(),
  z.object({ kind: z.literal("continue") }).strict(),
]);
const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("ready"), runId: z.uuid() }).strict(),
  z
    .object({
      kind: z.literal("start"),
      key: z.uuid(),
      pin: z
        .string()
        .regex(/^\d{6}$/)
        .optional(),
      activityId: z.string().trim().min(1).max(80).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("act"),
      key: z.uuid(),
      runId: z.uuid(),
      revision: z.number().int().nonnegative(),
      action,
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
    if (raw.length > 4096) throw new LadderError("request_too_large", 413);
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new LadderError("invalid_request");
    const a = parsed.data;
    const view =
      a.kind === "ready"
        ? await ladderRepository.ready(user, a.runId)
        : a.kind === "start"
        ? await ladderRepository.start(user, a.key, a.pin, a.activityId)
        : await ladderRepository.act(
            user,
            a.runId,
            a.revision,
            a.key,
            a.action,
          );
    return Response.json({ view }, { headers });
  } catch (e) {
    return ladderFailure(e);
  }
}
