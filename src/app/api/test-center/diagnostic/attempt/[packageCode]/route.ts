import { z } from "zod";

import { startOrResumeDiagnostic, startSectionRetake } from "@protefl/adapters/postgres-diagnostic";
import { supportedDiagnosticPackage } from "@protefl/application/diagnostic-package";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie" };
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.enum(["start", "retake"]), assignmentId: z.uuid() }),
  z.object({ action: z.literal("retake_section"), assignmentId: z.uuid(), sourceAttemptId: z.uuid(), section: z.enum(["listening", "structure", "reading"]) }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ packageCode: string }> }) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "origin_rejected" }, { status: 403, headers });
  const user = await currentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers });
  const { packageCode } = await params;
  if (!supportedDiagnosticPackage(packageCode)) return Response.json({ error: "not_found" }, { status: 404, headers });
  try {
    const raw = await request.text();
    if (raw.length > 512) return Response.json({ error: "invalid_request" }, { status: 400, headers });
    const parsed = bodySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400, headers });
    const result = parsed.data.action === "retake_section"
      ? await startSectionRetake(user.id, parsed.data.assignmentId, parsed.data.sourceAttemptId, parsed.data.section)
      : await startOrResumeDiagnostic(user.id, parsed.data.assignmentId, parsed.data.action === "retake");
    return Response.json(result, { headers });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "no_missed_questions" || code === "assignment_scope_conflict") return Response.json({ error: code }, { status: 409, headers });
    const limited = code === "attempt_unavailable";
    return Response.json({ error: limited ? "attempt_unavailable" : "resource_unavailable" }, { status: limited ? 409 : 404, headers });
  }
}
