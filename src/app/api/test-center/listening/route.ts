import { z } from "zod";

import { listeningPilotRepository } from "@protefl/adapters/postgres-listening";
import { ListeningPilotError } from "@protefl/domain/listening";
import { isSameOriginRequest } from "@/lib/same-origin";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "private, no-store" };
const common = {
  key: z.uuid(),
  attemptId: z.uuid(),
  revision: z.number().int().nonnegative(),
  itemId: z.uuid(),
};
const actionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("start"), key: z.uuid(), mode: z.literal("full") }).strict(),
  z
    .object({
      kind: z.literal("start"),
      key: z.uuid(),
      mode: z.literal("remedial"),
      parentAttemptId: z.uuid(),
    })
    .strict(),
  z.object({ kind: z.literal("listen_start"), ...common }).strict(),
  z.object({ kind: z.literal("choose"), ...common, choice: z.enum(["A", "B", "C", "D"]) }).strict(),
  z.object({ kind: z.literal("timeout"), ...common }).strict(),
]);

function failure(error: unknown) {
  if (error instanceof ListeningPilotError)
    return Response.json({ error: error.code }, { status: error.status, headers });
  console.error("Test Center request failed", error instanceof Error ? error.message : "unknown_error");
  return Response.json({ error: "test_center_unavailable" }, { status: 503, headers });
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) throw new ListeningPilotError("authentication_required", 401);
    return Response.json({ view: await listeningPilotRepository.view(user.id) }, { headers });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) throw new ListeningPilotError("origin_rejected", 403);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new ListeningPilotError("content_type_required", 415);
    const user = await currentUser();
    if (!user) throw new ListeningPilotError("authentication_required", 401);
    const raw = await request.text();
    if (raw.length > 4096) throw new ListeningPilotError("request_too_large", 413);
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new ListeningPilotError("invalid_request", 400);
    }
    const parsed = actionSchema.safeParse(json);
    if (!parsed.success) throw new ListeningPilotError("invalid_request", 400);
    return Response.json({ view: await listeningPilotRepository.act(user.id, parsed.data) }, { headers });
  } catch (error) {
    return failure(error);
  }
}
