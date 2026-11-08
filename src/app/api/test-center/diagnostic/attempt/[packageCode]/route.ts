import { z } from "zod";

import { startOrResumeDiagnostic, startSectionRetake } from "@protefl/adapters/postgres-diagnostic";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie" };
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.enum(["start", "retake"]) }),
  z.object({ action: z.literal("retake_section"), parentAttemptId: z.uuid(), section: z.enum(["listening", "structure", "reading"]) }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ packageCode: string }> }) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "origin_rejected" }, { status: 403, headers });
  const user = await currentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers });
  const { packageCode } = await params;
  if (packageCode !== "ets-volume3-practice-test-a") return Response.json({ error: "not_found" }, { status: 404, headers });
  try {
    const raw = await request.text();
    if (raw.length > 512) return Response.json({ error: "invalid_request" }, { status: 400, headers });
    const parsed = bodySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400, headers });
    const result = parsed.data.action === "retake_section"
      ? await startSectionRetake(user.id, parsed.data.parentAttemptId, parsed.data.section)
      : await startOrResumeDiagnostic(user.id, parsed.data.action === "retake");
    return Response.json(result, { headers });
  } catch (error) {
    const limited = error instanceof Error && error.message === "attempt_unavailable";
    return Response.json({ error: limited ? "attempt_unavailable" : "resource_unavailable" }, { status: limited ? 409 : 404, headers });
  }
}
