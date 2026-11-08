import { getPool } from "@/adapters/db/client";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };
const isStaff = (role: string) => role === "teacher" || role === "admin";

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers });
  if (!isStaff(user.role)) return Response.json({ error: "not_found" }, { status: 404, headers });
  const result = await getPool().query("SELECT enabled FROM legacy_student_visibility WHERE singleton=true");
  return Response.json({ enabled: result.rows[0]?.enabled === true }, { headers });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "origin_rejected" }, { status: 403, headers });
  const user = await currentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers });
  if (!isStaff(user.role)) return Response.json({ error: "not_found" }, { status: 404, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ error: "content_type_required" }, { status: 415, headers });
  try {
    const body = await request.json() as { enabled?: unknown };
    if (typeof body.enabled !== "boolean") return Response.json({ error: "invalid_request" }, { status: 400, headers });
    const result = await getPool().query("UPDATE legacy_student_visibility SET enabled=$1,changed_by=$2,changed_at=now() WHERE singleton=true RETURNING enabled", [body.enabled, user.id]);
    return Response.json({ enabled: result.rows[0]?.enabled === true }, { headers });
  } catch {
    return Response.json({ error: "visibility_update_failed" }, { status: 400, headers });
  }
}
