import { z } from "zod";

import { createVocabularyCode, resetVocabularyAssignment, teacherVocabularyAssignments, teacherVocabularyReview, VocabularyError } from "@/adapters/vocabulary/postgres-vocabulary";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_code"), inviteKind: z.enum(["private", "classroom"]), title: z.string().trim().min(1).max(120) }).strict(),
  z.object({ action: z.literal("reset"), assignmentId: z.uuid() }).strict(),
]);
function failure(error: unknown) {
  return Response.json({ error: error instanceof VocabularyError ? error.code : "vocabulary_unavailable" }, { status: error instanceof VocabularyError ? error.status : 503, headers });
}
async function staff() {
  const user = await currentUser();
  if (!user) throw new VocabularyError("authentication_required", 401);
  if (user.role !== "teacher" && user.role !== "admin") throw new VocabularyError("not_found", 404);
  return { id: user.id, role: user.role as "teacher" | "admin" };
}
export async function GET(request: Request) {
  try {
    const user = await staff();
    const query = new URL(request.url).searchParams;
    const assignmentId = query.get("assignmentId"); const attemptId = query.get("attemptId");
    if (assignmentId || attemptId) {
      const validAssignment = z.uuid().safeParse(assignmentId); const validAttempt = z.uuid().safeParse(attemptId);
      if (!validAssignment.success || !validAttempt.success) throw new VocabularyError("invalid_request", 400);
      return Response.json(await teacherVocabularyReview(user.id, user.role, validAssignment.data, validAttempt.data), { headers });
    }
    return Response.json({ assignments: await teacherVocabularyAssignments(user.id, user.role) }, { headers });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) throw new VocabularyError("origin_rejected", 403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new VocabularyError("content_type_required", 415);
    const raw = await request.text(); if (raw.length > 4096) throw new VocabularyError("request_too_large", 413);
    let value: unknown; try { value = JSON.parse(raw); } catch { throw new VocabularyError("invalid_request", 400); }
    const parsed = schema.safeParse(value); if (!parsed.success) throw new VocabularyError("invalid_request", 400);
    const user = await staff();
    if (parsed.data.action === "create_code") return Response.json(await createVocabularyCode(user.id, "toefl-itp-full-frequency", parsed.data.inviteKind, parsed.data.title), { headers });
    return Response.json(await resetVocabularyAssignment(user.id, user.role, parsed.data.assignmentId), { headers });
  } catch (error) { return failure(error); }
}
