import { readFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import { listeningPilotRepository } from "@protefl/adapters/postgres-listening";
import { ListeningPilotError } from "@protefl/domain/listening";
import { resolvePrivateMediaPath } from "@/lib/media-path";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) throw new ListeningPilotError("authentication_required", 401);
    const { itemId } = await params;
    const attemptId = new URL(request.url).searchParams.get("attempt");
    if (!z.uuid().safeParse(itemId).success || !z.uuid().safeParse(attemptId).success)
      throw new ListeningPilotError("media_not_found", 404);
    const media = await listeningPilotRepository.media(user.id, attemptId!, itemId);
    const root = process.env.PROTEFL_MEDIA_ROOT ?? path.join(process.cwd(), "apps/protefl-center/private/media");
    const filePath = resolvePrivateMediaPath(root, media.storageKey);
    if (!filePath) throw new ListeningPilotError("media_not_found", 404);
    const data = await readFile(filePath);
    const match = request.headers.get("range")?.match(/^bytes=(\d+)-(\d*)$/);
    const start = match ? Number(match[1]) : 0;
    const requestedEnd = match?.[2] ? Number(match[2]) : data.byteLength - 1;
    const end = Math.min(requestedEnd, data.byteLength - 1);
    if (match && (start > end || start >= data.byteLength))
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${data.byteLength}` } });
    const body = match ? data.subarray(start, end + 1) : data;
    return new Response(body, {
      status: match ? 206 : 200,
      headers: {
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=300",
        "Content-Length": String(body.byteLength),
        ...(match ? { "Content-Range": `bytes ${start}-${end}/${data.byteLength}` } : {}),
        "Content-Type": media.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const status = error instanceof ListeningPilotError ? error.status : 404;
    const code = error instanceof ListeningPilotError ? error.code : "media_not_found";
    return Response.json({ error: code }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}
