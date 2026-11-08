import { z } from "zod";

import { applyDiagnosticAction, diagnosticAttemptState } from "@protefl/adapters/postgres-diagnostic";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie" };
const choice = z.enum(["A", "B", "C", "D"]);
const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("begin_section"), requestId: z.uuid() }),
  z.object({ type: z.literal("answer"), section: z.enum(["listening", "structure", "reading"]), question: z.number().int(), choice, requestId: z.uuid() }),
  z.object({ type: z.literal("audio_played"), question: z.number().int(), positionMs: z.number().int().nonnegative(), requestId: z.uuid() }),
  z.object({ type: z.literal("finish_section"), requestId: z.uuid() }),
  z.object({ type: z.literal("submit"), requestId: z.uuid() }),
]);

export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers });
  const { attemptId } = await params;
  if (!z.uuid().safeParse(attemptId).success) return Response.json({ error: "not_found" }, { status: 404, headers });
  const state = await diagnosticAttemptState(user.id, attemptId);
  return state ? Response.json({ state }, { headers }) : Response.json({ error: "not_found" }, { status: 404, headers });
}

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "origin_rejected" }, { status: 403, headers });
  const user = await currentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers });
  const { attemptId } = await params;
  if (!z.uuid().safeParse(attemptId).success) return Response.json({ error: "not_found" }, { status: 404, headers });
  try {
    const raw = await request.text();
    if (raw.length > 2048) return Response.json({ error: "invalid_request" }, { status: 413, headers });
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400, headers });
    await applyDiagnosticAction(user.id, attemptId, parsed.data);
    const state = await diagnosticAttemptState(user.id, attemptId);
    return state ? Response.json({ state }, { headers }) : Response.json({ error: "not_found" }, { status: 404, headers });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (["action_unavailable", "listening_incomplete", "attempt_unavailable"].includes(code))
      return Response.json({ error: code }, { status: code === "attempt_unavailable" ? 404 : 409, headers });
    return Response.json({ error: "diagnostic_unavailable" }, { status: 503, headers });
  }
}
