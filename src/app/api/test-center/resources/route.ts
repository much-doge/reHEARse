import { assignedResources, claimResource } from "@protefl/adapters/postgres-resources";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers });
  try {
    return Response.json({ resources: await assignedResources(user.id) }, { headers });
  } catch {
    return Response.json({ error: "test_center_unavailable" }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "origin_rejected" }, { status: 403, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "content_type_required" }, { status: 415, headers });
  const user = await currentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers });
  try {
    const raw = await request.text();
    if (raw.length > 1024) return Response.json({ error: "invalid_request" }, { status: 400, headers });
    const body = JSON.parse(raw) as { code?: unknown };
    if (typeof body.code !== "string") return Response.json({ error: "invalid_request" }, { status: 400, headers });
    await claimResource(user.id, body.code);
    return Response.json({ ok: true }, { headers });
  } catch (error) {
    if (error instanceof Error && error.message === "invite_rate_limited")
      return Response.json({ error: "invite_rate_limited" }, { status: 429, headers });
    return Response.json({ error: "invite_unavailable" }, { status: 404, headers });
  }
}
