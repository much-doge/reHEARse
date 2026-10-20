import { cookies } from "next/headers";
import { z } from "zod";
import { workshopRepository } from "@/adapters/workshop/postgres-workshop";
import { body, failure, headers, joinToken, learnerActionSchema, membership, membershipHash, pinSchema } from "@/adapters/workshop/http";
import { WorkshopError } from "@/domain/workshop/state";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const schema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("join"),pin:pinSchema,key:z.uuid()}).strict(),
 z.object({kind:z.literal("act"),pin:pinSchema,key:z.uuid(),revision:z.number().int().nonnegative(),action:learnerActionSchema}).strict(),
]);
export async function GET(req:Request){try{const pin=pinSchema.safeParse(new URL(req.url).searchParams.get("pin"));if(!pin.success)throw new WorkshopError("invalid_pin",400);return Response.json(await workshopRepository.learner(pin.data,await membership()),{headers});}catch(e){return failure(e);}}
export async function POST(req:Request){try{const a=await body(req,schema);
 if(a.kind==="join"){
  const token=joinToken(a.pin,a.key),view=await workshopRepository.join(a.pin,a.key,membershipHash(token));
  (await cookies()).set("rehearse_workshop",token,{httpOnly:true,secure:process.env.SESSION_COOKIE_SECURE!=="false",sameSite:"lax",path:"/",maxAge:86400});
  return Response.json(view,{headers});
 }
 return Response.json(await workshopRepository.learnerAction(a.pin,await membership(),a.revision,a.key,a.action),{headers});
}catch(e){return failure(e);}}
