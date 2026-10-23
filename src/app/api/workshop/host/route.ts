import { z } from "zod";
import { currentUser } from "@/lib/session";
import { workshopRepository } from "@/adapters/workshop/postgres-workshop";
import { body, failure, headers, pinSchema } from "@/adapters/workshop/http";
import { WorkshopError } from "@/domain/workshop/state";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const schema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("create"),key:z.uuid(),version:z.string().min(1).max(61).optional()}).strict(),
 z.object({kind:z.literal("act"),pin:pinSchema,key:z.uuid(),revision:z.number().int().nonnegative(),action:z.discriminatedUnion("kind",[z.object({kind:z.literal("open_practice")}).strict(),z.object({kind:z.literal("next_group")}).strict(),z.object({kind:z.literal("select_group"),groupIndex:z.number().int().nonnegative().max(6)}).strict(),z.object({kind:z.literal("close")}).strict()])}).strict(),
]);
export async function GET(req:Request){try{const actor=await currentUser();if(!actor)throw new WorkshopError("authentication_required",401);const pin=pinSchema.safeParse(new URL(req.url).searchParams.get("pin"));if(!pin.success)throw new WorkshopError("invalid_pin",400);return Response.json(await workshopRepository.host(actor,pin.data),{headers});}catch(e){return failure(e);}}
export async function POST(req:Request){try{const a=await body(req,schema),actor=await currentUser();if(!actor)throw new WorkshopError("authentication_required",401);return Response.json(a.kind==="create"?await workshopRepository.create(actor,a.key,a.version):await workshopRepository.hostAction(actor,a.pin,a.revision,a.key,a.action),{headers});}catch(e){return failure(e);}}
