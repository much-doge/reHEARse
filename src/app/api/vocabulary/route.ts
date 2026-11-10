import { z } from "zod";

import { answerVocabularyCard, claimVocabularyCode, finishVocabularyRound, getVocabularyRun, learnerAssignments, nextVocabularyRound, recordVocabularyOpen, VocabularyError } from "@/adapters/vocabulary/postgres-vocabulary";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };
const part = z.enum(["Noun", "Verb", "Adjective", "Adverb"]);
const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("claim"), code: z.string().trim().min(8).max(24) }).strict(),
  z.object({ kind: z.literal("open"), attemptId: z.uuid(), cardId: z.string().regex(/^word-[a-f0-9]{16}$/) }).strict(),
  z.object({ kind: z.literal("answer"), attemptId: z.uuid(), cardId: z.string().regex(/^word-[a-f0-9]{16}$/), selectedParts: z.array(part).min(1).max(4) }).strict(),
  z.object({ kind: z.literal("complete"), attemptId: z.uuid() }).strict(),
  z.object({ kind: z.literal("next"), assignmentId: z.uuid(), previousAttemptId: z.uuid(), missedOnly: z.boolean() }).strict(),
]);

function failure(error: unknown) {
  return Response.json({ error: error instanceof VocabularyError ? error.code : "vocabulary_unavailable" }, { status: error instanceof VocabularyError ? error.status : 503, headers });
}

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) throw new VocabularyError("authentication_required", 401);
    if (user.role !== "learner") throw new VocabularyError("learner_role_required", 403);
    const assignmentId = new URL(request.url).searchParams.get("assignmentId");
    if (!assignmentId) return Response.json({ assignments: await learnerAssignments(user.id) }, { headers });
    const parsed = z.uuid().safeParse(assignmentId);
    if (!parsed.success) throw new VocabularyError("invalid_request", 400);
    const attemptValue = new URL(request.url).searchParams.get("attemptId");
    const attemptId = attemptValue ? z.uuid().safeParse(attemptValue) : null;
    if (attemptId && !attemptId.success) throw new VocabularyError("invalid_request", 400);
    return Response.json(await getVocabularyRun(user.id, parsed.data, attemptId?.success ? attemptId.data : undefined), { headers });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) throw new VocabularyError("origin_rejected", 403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new VocabularyError("content_type_required", 415);
    const raw = await request.text();
    if (raw.length > 4096) throw new VocabularyError("request_too_large", 413);
    let json: unknown; try { json = JSON.parse(raw); } catch { throw new VocabularyError("invalid_request", 400); }
    const action = schema.safeParse(json); if (!action.success) throw new VocabularyError("invalid_request", 400);
    const user = await currentUser();
    if (!user) throw new VocabularyError("authentication_required", 401);
    if (user.role !== "learner") throw new VocabularyError("learner_role_required", 403);
    switch (action.data.kind) {
      case "claim": return Response.json(await claimVocabularyCode(user.id, action.data.code), { headers });
      case "open": await recordVocabularyOpen(user.id, action.data.attemptId, action.data.cardId); return Response.json({ opened: true }, { headers });
      case "answer": return Response.json(await answerVocabularyCard(user.id, action.data.attemptId, action.data.cardId, action.data.selectedParts), { headers });
      case "complete": return Response.json(await finishVocabularyRound(user.id, action.data.attemptId), { headers });
      case "next": return Response.json(await nextVocabularyRound(user.id, action.data.assignmentId, action.data.previousAttemptId, action.data.missedOnly), { headers });
    }
  } catch (error) { return failure(error); }
}
