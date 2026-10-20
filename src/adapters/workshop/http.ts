import { createHash, createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/same-origin";
import { WorkshopError } from "@/domain/workshop/state";
export const headers={"Cache-Control":"private, no-store"};
export const pinSchema=z.string().regex(/^\d{6}$/);
export const optionSchema=z.enum(["A","B","C","D"]);
export const learnerActionSchema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("listen_start"),itemId:z.string().max(61)}).strict(),
 z.object({kind:z.literal("choose"),itemId:z.string().max(61),choice:optionSchema.nullable()}).strict(),
 z.object({kind:z.literal("explain"),itemId:z.string().max(61),option:optionSchema,text:z.string().trim().min(3).max(400)}).strict(),
 z.object({kind:z.literal("next_item"),itemId:z.string().max(61)}).strict(),
]);
export async function body<T>(request:Request,schema:z.ZodType<T>):Promise<T>{
 if(!isSameOriginRequest(request))throw new WorkshopError("origin_rejected",403);
 if(!request.headers.get("content-type")?.startsWith("application/json"))throw new WorkshopError("content_type_required",415);
 const raw=await request.text();if(raw.length>4096)throw new WorkshopError("request_too_large",413);
 let json;try{json=JSON.parse(raw);}catch{throw new WorkshopError("invalid_request",400);}
 const parsed=schema.safeParse(json);if(!parsed.success)throw new WorkshopError("invalid_request",400);return parsed.data;
}
export function failure(error:unknown){return Response.json({error:error instanceof WorkshopError?error.code:"workshop_unavailable"},{status:error instanceof WorkshopError?error.status:503,headers});}
export const membershipHash=(token:string)=>createHash("sha256").update(token).digest("hex");
export async function membership(){const token=(await cookies()).get("rehearse_workshop")?.value;if(!token)throw new WorkshopError("membership_required",401);return membershipHash(token);}
export function joinToken(pin:string,key:string){const secret=process.env.SESSION_SECRET;if(!secret||secret.length<20)throw new WorkshopError("membership_unavailable",503);return createHmac("sha256",secret).update(`workshop-join.v1:${pin}:${key}`).digest("base64url");}
