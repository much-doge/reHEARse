import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getPool } from "@/adapters/db/client";
import { resolvePrivateMediaPath } from "@/lib/media-path";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });

  const { slug } = await params;
  const result = await getPool().query(
    `SELECT av.media_storage_key
     FROM activity a
     JOIN activity_version av
       ON av.activity_id = a.id AND av.version_number = a.current_version
     WHERE a.slug = $1 AND a.state = 'published'`,
    [slug],
  );
  const storageKey = result.rows[0]?.media_storage_key;
  if (!storageKey) return NextResponse.json({ error: "media_not_found" }, { status: 404 });

  const mediaRoot = process.env.MEDIA_ROOT ?? path.join(process.cwd(), "media");
  const mediaPath = resolvePrivateMediaPath(mediaRoot, storageKey);
  if (!mediaPath) return NextResponse.json({ error: "media_not_found" }, { status: 404 });

  try {
    const data = await readFile(mediaPath);
    const range = request.headers.get("range")?.match(/^bytes=(\d+)-(\d*)$/);
    const start = range ? Number(range[1]) : 0;
    const requestedEnd = range?.[2] ? Number(range[2]) : data.byteLength - 1;
    const end = Math.min(requestedEnd, data.byteLength - 1);
    if (range && (start > end || start >= data.byteLength)) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${data.byteLength}` },
      });
    }

    const body = range ? data.subarray(start, end + 1) : data;
    return new NextResponse(body, {
      status: range ? 206 : 200,
      headers: {
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=300",
        "Content-Length": String(body.byteLength),
        ...(range ? { "Content-Range": `bytes ${start}-${end}/${data.byteLength}` } : {}),
        "Content-Type": "audio/mpeg",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "media_not_found" }, { status: 404 });
  }
}
