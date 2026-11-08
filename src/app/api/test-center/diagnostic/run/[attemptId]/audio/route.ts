import { diagnosticAudio } from "@protefl/adapters/postgres-diagnostic";
import { currentUser } from "@/lib/session";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = await currentUser();
  const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "Accept-Ranges": "bytes" };
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers });
  const { attemptId } = await params;
  if (!z.uuid().safeParse(attemptId).success) return Response.json({ error: "not_found" }, { status: 404, headers });
  const data = await diagnosticAudio(user.id, attemptId);
  if (!data) return Response.json({ error: "not_found" }, { status: 404, headers });
  const range = request.headers.get("range")?.match(/^bytes=(\d+)-(\d*)$/);
  const start = range ? Number(range[1]) : 0;
  const end = Math.min(range?.[2] ? Number(range[2]) : data.byteLength - 1, data.byteLength - 1);
  if (range && (start > end || start >= data.byteLength)) return new Response(null, { status: 416, headers: { ...headers, "Content-Range": "bytes */" + data.byteLength } });
  const body = range ? data.subarray(start, end + 1) : data;
  return new Response(body, { status: range ? 206 : 200, headers: { ...headers, "Content-Type": "audio/mp4", "Content-Length": String(body.byteLength), ...(range ? { "Content-Range": "bytes " + start + "-" + end + "/" + data.byteLength } : {}) } });
}
