import { z } from "zod";
import { readS3MediaConfig } from "@/adapters/media/s3-config";
import { publicMediaStorageKey, S3CompatibleMediaStore } from "@/adapters/media/s3-media-store";
import { rooms, GameError } from "@/adapters/game/postgres-rooms";
import { currentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0, must-revalidate", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" };

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) throw new GameError(401, "Authentication required");
    if (!["teacher", "admin"].includes(user.role)) throw new GameError(403, "Teacher sign-in required");
    const query = new URL(request.url).searchParams;
    const pin = z.string().regex(/^\d{6}$/).safeParse(query.get("pin"));
    const roundIndex = z.coerce.number().int().nonnegative().safeParse(query.get("round"));
    if (!pin.success || !roundIndex.success) throw new GameError(404, "Media unavailable");
    const url = await rooms.media(pin.data, roundIndex.data, { userId: user.id });
    const config = readS3MediaConfig();
    const key = publicMediaStorageKey(config, url);
    const range = request.headers.get("range");
    if (range && !/^bytes=\d+-\d*$/.test(range)) throw new GameError(416, "Invalid range");
    const media = await new S3CompatibleMediaStore(config).readObject(key, range);
    return new Response(media.body, {
      status: range ? 206 : 200,
      headers: {
        ...privateHeaders,
        "Accept-Ranges": "bytes",
        "Content-Type": media.contentType ?? "audio/mpeg",
        ...(media.contentLength !== undefined ? { "Content-Length": String(media.contentLength) } : {}),
        ...(media.contentRange ? { "Content-Range": media.contentRange } : {}),
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof GameError ? error.message : "Media unavailable" }, {
      status: error instanceof GameError ? error.status : 404,
      headers: privateHeaders,
    });
  }
}
