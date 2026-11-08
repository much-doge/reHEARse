import { cookies } from "next/headers";
import { z } from "zod";
import { workshopRepository } from "@/adapters/workshop/postgres-workshop";
import { body, failure, headers, joinRecordKey, joinToken, learnerActionSchema, membershipHash, pinSchema } from "@/adapters/workshop/http";
import { WorkshopError } from "@/domain/workshop/state";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("join"), pin: pinSchema, key: z.uuid() }).strict(),
  z.object({ kind: z.literal("act"), pin: pinSchema, key: z.uuid(), revision: z.number().int().nonnegative(), action: learnerActionSchema }).strict(),
]);

async function requireLearner() {
  const user = await currentUser();
  if (!user) throw new WorkshopError("authentication_required", 401);
  if (user.role !== "learner") throw new WorkshopError("learner_role_required", 403);
  return user;
}

export async function GET(request: Request) {
  try {
    await requireLearner();
    const pin = pinSchema.safeParse(new URL(request.url).searchParams.get("pin"));
    if (!pin.success) throw new WorkshopError("invalid_pin", 400);
    const token = (await cookies()).get("rehearse_workshop")?.value;
    if (!token) throw new WorkshopError("membership_required", 401);
    return Response.json(await workshopRepository.learner(pin.data, membershipHash(token)), { headers });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const action = await body(request, schema);
    await requireLearner();
    if (action.kind === "join") {
      const token = joinToken(action.pin, action.key);
      const view = await workshopRepository.join(action.pin, joinRecordKey(action.pin, action.key), membershipHash(token));
      (await cookies()).set("rehearse_workshop", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" && process.env.SESSION_COOKIE_SECURE !== "false",
        sameSite: "lax",
        path: "/",
        maxAge: 86400,
      });
      return Response.json(view, { headers });
    }
    const token = (await cookies()).get("rehearse_workshop")?.value;
    if (!token) throw new WorkshopError("membership_required", 401);
    return Response.json(await workshopRepository.learnerAction(action.pin, membershipHash(token), action.revision, action.key, action.action), { headers });
  } catch (error) {
    return failure(error);
  }
}
