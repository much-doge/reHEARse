import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { rooms, GameError } from "@/adapters/game/postgres-rooms";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
async function actor() {
  const u = await currentUser();
  const token = (await cookies()).get("rehearse_game")?.value;
  return { userId: u?.id, tokenHash: token ? hash(token) : undefined };
}
function error(e: unknown) {
  return Response.json(
    {
      error:
        e instanceof GameError
          ? e.message
          : "Request unavailable / Permintaan tidak tersedia",
    },
    {
      status: e instanceof GameError ? e.status : 400,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
export async function GET(req: Request) {
  try {
    const pin = z
      .string()
      .regex(/^\d{6}$/)
      .parse(new URL(req.url).searchParams.get("pin"));
    return Response.json(await rooms.view(pin, await actor()), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return error(e);
  }
}
const actionSchema = z.object({
  kind: z.enum([
    "create",
    "join",
    "advance",
    "finish",
    "moderate",
    "cloud",
    "answer",
  ]),
  pin: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
  revision: z.number().int().nonnegative().default(0),
  choice: z.number().int().min(0).max(3).optional(),
  term: z.string().max(40).optional(),
  cloudId: z.string().uuid().optional(),
  visible: z.boolean().optional(),
  duration: z.number().int().min(15).max(90).optional(),
});
export async function POST(req: Request) {
  if (!isSameOriginRequest(req))
    return Response.json({ error: "Origin denied" }, { status: 403 });
  try {
    if (Number(req.headers.get("content-length") ?? 0) > 2048)
      throw new GameError(413, "Request too large");
    const raw = await req.text();
    if (raw.length > 2048) throw new GameError(413, "Request too large");
    const a = actionSchema.parse(JSON.parse(raw));
    if (a.kind === "create") {
      const u = await currentUser();
      if (!u || !["teacher", "admin"].includes(u.role))
        throw new GameError(
          403,
          "Teacher sign-in required / Masuk sebagai guru",
        );
      return Response.json({ pin: await rooms.create(u.id) });
    }
    if (!a.pin) throw new GameError(400, "Room PIN required");
    if (a.kind === "join") {
      try {
        const existing = await rooms.view(a.pin, await actor());
        if (existing.alias) return Response.json({ pin: a.pin });
      } catch (e) {
        if (!(e instanceof GameError) || e.status !== 401) throw e;
      }
      const token = randomBytes(32).toString("hex");
      await rooms.join(a.pin, hash(token));
      (await cookies()).set("rehearse_game", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 86400,
      });
      return Response.json({ pin: a.pin });
    }
    await rooms.act(a.pin, await actor(), a);
    return Response.json({ ok: true });
  } catch (e) {
    return error(e);
  }
}
