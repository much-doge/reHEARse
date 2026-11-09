import { archiveCandidateDiagnostic, issueResourceInvite, setResourceStatus } from "@protefl/adapters/postgres-resources";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
const staff = (role: string) => role === "teacher" || role === "admin";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "origin_rejected" }, { status: 403, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "content_type_required" }, { status: 415, headers });
  const user = await currentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers });
  if (!staff(user.role)) return Response.json({ error: "not_found" }, { status: 404, headers });
  try {
    const raw = await request.text();
    if (raw.length > 1024) return Response.json({ error: "invalid_request" }, { status: 400, headers });
    const body = JSON.parse(raw) as { action?: unknown; resourceId?: unknown; candidateActorId?: unknown; status?: unknown; listeningMode?: unknown; showListeningQuestionText?: unknown; deliveryScope?: unknown; inviteKind?: unknown };
    if (typeof body.resourceId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.resourceId))
      return Response.json({ error: "invalid_request" }, { status: 400, headers });
    if (body.action === "issue_invite") {
      if (body.listeningMode !== undefined && body.listeningMode !== "autoplay" && body.listeningMode !== "question_click")
        return Response.json({ error: "invalid_request" }, { status: 400, headers });
      const listeningMode = body.listeningMode === "autoplay" ? "autoplay" : "question_click";
      if (body.showListeningQuestionText !== undefined && typeof body.showListeningQuestionText !== "boolean")
        return Response.json({ error: "invalid_request" }, { status: 400, headers });
      if (body.deliveryScope !== undefined && !["full", "listening", "structure", "reading"].includes(String(body.deliveryScope)))
        return Response.json({ error: "invalid_request" }, { status: 400, headers });
      if (body.inviteKind !== undefined && body.inviteKind !== "private" && body.inviteKind !== "classroom")
        return Response.json({ error: "invalid_request" }, { status: 400, headers });
      const deliveryScope = body.deliveryScope === "listening" || body.deliveryScope === "structure" || body.deliveryScope === "reading" ? body.deliveryScope : "full";
      const inviteKind = body.inviteKind === "classroom" ? "classroom" : "private";
      const invite = await issueResourceInvite(body.resourceId, user.id, listeningMode, body.showListeningQuestionText !== false, deliveryScope, inviteKind);
      return Response.json({ invite }, { headers });
    }
    if (body.action === "set_status" && (body.status === "published" || body.status === "hidden")) {
      const resource = await setResourceStatus(body.resourceId, body.status, user.id);
      return Response.json({ resource }, { headers });
    }
    if (body.action === "archive_candidate_attempts") {
      if (typeof body.candidateActorId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.candidateActorId))
        return Response.json({ error: "invalid_request" }, { status: 400, headers });
      const archive = await archiveCandidateDiagnostic(body.resourceId, body.candidateActorId, user.id);
      return Response.json({ archive }, { headers });
    }
    return Response.json({ error: "invalid_request" }, { status: 400, headers });
  } catch {
    return Response.json({ error: "resource_unavailable" }, { status: 404, headers });
  }
}
