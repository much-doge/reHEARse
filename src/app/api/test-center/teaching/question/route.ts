import { z } from "zod";

import { teacherDiagnosticReviewItem } from "@protefl/adapters/postgres-diagnostic";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie" };
const schema = z.object({
  resourceId: z.uuid(),
  candidateActorId: z.uuid(),
  attemptId: z.uuid(),
  section: z.enum(["listening", "structure", "reading"]),
  question: z.number().int().positive(),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "origin_rejected" }, { status: 403, headers });
  const user = await currentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers });
  if (user.role !== "teacher" && user.role !== "admin") return Response.json({ error: "not_found" }, { status: 404, headers });
  try {
    const raw = await request.text();
    if (raw.length > 1024) return Response.json({ error: "invalid_request" }, { status: 413, headers });
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400, headers });
    const item = await teacherDiagnosticReviewItem(
      user.id,
      user.role,
      parsed.data.resourceId,
      parsed.data.candidateActorId,
      parsed.data.attemptId,
      parsed.data.section,
      String(parsed.data.question),
    );
    return item ? Response.json({ item }, { headers }) : Response.json({ error: "not_found" }, { status: 404, headers });
  } catch {
    return Response.json({ error: "review_unavailable" }, { status: 503, headers });
  }
}
