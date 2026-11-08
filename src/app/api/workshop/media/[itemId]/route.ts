import { cookies } from "next/headers";
import { z } from "zod";
import { workshopRepository } from "@/adapters/workshop/postgres-workshop";
import { WorkshopError } from "@/domain/workshop/state";
import { readS3MediaConfig } from "@/adapters/media/s3-config";
import { publicMediaStorageKey, S3CompatibleMediaStore } from "@/adapters/media/s3-media-store";
import { currentUser } from "@/lib/session";
import { membershipHash, pinSchema } from "@/adapters/workshop/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0, must-revalidate", "Vary": "Cookie" };
const errorResponse = (error: unknown) => Response.json({ error: error instanceof WorkshopError ? error.code : "media_not_found" }, {
  status: error instanceof WorkshopError ? error.status : 404,
  headers: privateHeaders,
});

export async function GET(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const user = await currentUser();
    if (!user) throw new WorkshopError("authentication_required", 401);
    if (user.role !== "learner") throw new WorkshopError("learner_role_required", 403);

    const { itemId } = await params;
    if (!/^[A-Za-z0-9_-]{1,61}$/.test(itemId)) throw new WorkshopError("media_not_found", 404);
    const query = new URL(request.url).searchParams;
    const pin = pinSchema.safeParse(query.get("pin"));
    const kind = z.enum(["item", "passage"]).safeParse(query.get("kind"));
    if (!pin.success || !kind.success) throw new WorkshopError("media_not_found", 404);
    const token = (await cookies()).get("rehearse_workshop")?.value;
    if (!token) throw new WorkshopError("membership_required", 401);

    const publicUrl = await workshopRepository.media(user, pin.data, membershipHash(token), itemId, kind.data);
    const config = readS3MediaConfig();
    const storageKey = publicMediaStorageKey(config, publicUrl);
    const range = request.headers.get("range");
    if (range && !/^bytes=\d+-\d*$/.test(range)) throw new WorkshopError("invalid_request", 416);
    const object = await new S3CompatibleMediaStore(config).readObject(storageKey, range);
    return new Response(object.body, {
      status: range ? 206 : 200,
      headers: {
        ...privateHeaders,
        "Accept-Ranges": "bytes",
        "Content-Type": object.contentType ?? "audio/mpeg",
        "X-Content-Type-Options": "nosniff",
        ...(object.contentLength !== undefined ? { "Content-Length": String(object.contentLength) } : {}),
        ...(object.contentRange ? { "Content-Range": object.contentRange } : {}),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
