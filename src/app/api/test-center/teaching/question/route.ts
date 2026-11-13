import { z } from "zod";

import { teacherDiagnosticReviewItem, teacherDiagnosticAudio, teacherDiagnosticAudioContentType } from "@protefl/adapters/postgres-diagnostic";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headersBase = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie" };
const schema = z.object({
  resourceId: z.uuid(),
  candidateActorId: z.uuid(),
  attemptId: z.uuid(),
  section: z.enum(["listening", "structure", "reading"]),
  question: z.number().int().positive(),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "origin_rejected" }, { status: 403, headers: headersBase });
  const user = await currentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers: headersBase });
  if (user.role !== "teacher" && user.role !== "admin") return Response.json({ error: "not_found" }, { status: 404, headers: headersBase });
  try {
    const raw = await request.text();
    if (raw.length > 1024) return Response.json({ error: "invalid_request" }, { status: 413, headers: headersBase });
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400, headers: headersBase });
    const item = await teacherDiagnosticReviewItem(
      user.id,
      user.role,
      parsed.data.resourceId,
      parsed.data.candidateActorId,
      parsed.data.attemptId,
      parsed.data.section,
      String(parsed.data.question),
    );
    return item ? Response.json({ item }, { headers: headersBase }) : Response.json({ error: "not_found" }, { status: 404, headers: headersBase });
  } catch {
    return Response.json({ error: "review_unavailable" }, { status: 503, headers: headersBase });
  }
}

export async function GET(request: Request) {
  const headers = {
    ...headersBase,
    "Content-Type": "audio/mp4",
    "Accept-Ranges": "bytes",
    "Content-Disposition": "inline",
    "X-Content-Type-Options": "nosniff",
  };
  const user = await currentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers: headersBase });
  if (user.role !== "teacher" && user.role !== "admin") return Response.json({ error: "not_found" }, { status: 404, headers: headersBase });
  const params = new URL(request.url).searchParams;
  const parsed = z.object({ resourceId: z.uuid(), candidateActorId: z.uuid(), attemptId: z.uuid() }).safeParse({
    resourceId: params.get("resourceId"), candidateActorId: params.get("candidateActorId"), attemptId: params.get("attemptId"),
  });
  if (!parsed.success) return Response.json({ error: "not_found" }, { status: 404, headers: headersBase });
  const data = await teacherDiagnosticAudio(user.id, user.role, parsed.data.resourceId, parsed.data.candidateActorId, parsed.data.attemptId);
  if (!data) return Response.json({ error: "not_found" }, { status: 404, headers: headersBase });
  const contentType = (await teacherDiagnosticAudioContentType(user.id, user.role, parsed.data.resourceId, parsed.data.candidateActorId, parsed.data.attemptId)) ?? "audio/mp4";
  const range = request.headers.get("range")?.match(/^bytes=(\d+)-(\d*)$/);
  const start = range ? Number(range[1]) : 0;
  const end = Math.min(range?.[2] ? Number(range[2]) : data.byteLength - 1, data.byteLength - 1);
  if (range && (start > end || start >= data.byteLength)) {
    return new Response(null, { status: 416, headers: { ...headersBase, "Content-Range": `bytes */${data.byteLength}` } });
  }
  const body = range ? data.subarray(start, end + 1) : data;
  return new Response(body, {
    status: range ? 206 : 200,
    headers: {
      ...headers,
      "Content-Type": contentType,
      "Content-Length": String(body.byteLength),
      ...(range ? { "Content-Range": `bytes ${start}-${end}/${data.byteLength}` } : {}),
    },
  });
}
