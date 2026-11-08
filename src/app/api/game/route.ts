import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { rooms, GameError } from "@/adapters/game/postgres-rooms";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0, must-revalidate", "Vary": "Cookie" };
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
async function actor(userId: string) {
  const token = (await cookies()).get("rehearse_game")?.value;
  return { userId, tokenHash: token ? hash(token) : undefined };
}
function error(error: unknown) {
  return Response.json({ error: error instanceof GameError ? error.message : "Request unavailable" }, {
    status: error instanceof GameError ? error.status : 400,
    headers: privateHeaders,
  });
}

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) throw new GameError(401, "Authentication required");
    const pin = z.string().regex(/^\d{6}$/).parse(new URL(request.url).searchParams.get("pin"));
    return Response.json(await rooms.view(pin, await actor(user.id)), { headers: privateHeaders });
  } catch (cause) {
    return error(cause);
  }
}

const actionSchema = z.object({
  kind: z.enum(["create", "join", "advance", "finish", "moderate", "cloud", "answer"]),
  pin: z.string().regex(/^\d{6}$/).optional(),
  revision: z.number().int().nonnegative().default(0),
  choice: z.number().int().min(0).max(3).optional(),
  term: z.string().max(40).optional(),
  cloudId: z.string().uuid().optional(),
  visible: z.boolean().optional(),
  duration: z.number().int().min(15).max(90).optional(),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Origin denied" }, { status: 403, headers: privateHeaders });
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 2048) throw new GameError(413, "Request too large");
    const raw = await request.text();
    if (raw.length > 2048) throw new GameError(413, "Request too large");
    const action = actionSchema.parse(JSON.parse(raw));
    const user = await currentUser();
    if (!user) throw new GameError(401, "Authentication required");

    if (action.kind === "create") {
      if (!["teacher", "admin"].includes(user.role)) throw new GameError(403, "Teacher sign-in required");
      return Response.json({ pin: await rooms.create(user.id) }, { headers: privateHeaders });
    }
    if (!action.pin) throw new GameError(400, "Room PIN required");
    if (action.kind === "join") {
      if (user.role !== "learner") throw new GameError(403, "Learner sign-in required");
      try {
        const existing = await rooms.view(action.pin, await actor(user.id));
        if (existing.alias) return Response.json({ pin: action.pin }, { headers: privateHeaders });
      } catch (cause) {
        if (!(cause instanceof GameError) || cause.status !== 401) throw cause;
      }
      const token = randomBytes(32).toString("hex");
      await rooms.join(action.pin, hash(token));
      (await cookies()).set("rehearse_game", token, {
        httpOnly: true, sameSite: "lax",
        secure: process.env.NODE_ENV === "production" && process.env.SESSION_COOKIE_SECURE !== "false",
        path: "/", maxAge: 86400,
      });
      return Response.json({ pin: action.pin }, { headers: privateHeaders });
    }
    await rooms.act(action.pin, await actor(user.id), action);
    return Response.json({ ok: true }, { headers: privateHeaders });
  } catch (cause) {
    return error(cause);
  }
}
