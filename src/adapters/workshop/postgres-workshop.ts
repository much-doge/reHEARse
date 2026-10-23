import { createHash, randomInt } from "node:crypto";
import type { PoolClient } from "pg";
import { getPool } from "@/adapters/db/client";
import type { WorkshopActor, WorkshopRepository } from "@/application/workshop/repository";
import type { HostAction, LearnerAction } from "@/domain/workshop/contracts";
import { advanceParticipant, itemAt, workshopPlaybackTiming, WorkshopError } from "@/domain/workshop/state";
import { anonymousAlias } from "@/domain/ladder/anonymous-alias";
import { hostProjection, learnerProjection, type RoomRow, type ParticipantRow } from "./projection";
const teacher=(actor:WorkshopActor)=>{if(!["teacher","admin"].includes(actor.role))throw new WorkshopError("teacher_required",403);};
const digest=(body:unknown)=>createHash("sha256").update(JSON.stringify(body)).digest("hex");
const live=(room:RoomRow|null,now:number)=>{if(!room)throw new WorkshopError("room_not_found",404);if(room.expires_at.getTime()<=now)throw new WorkshopError("room_expired",410);};
async function time(c:PoolClient){return Math.floor(Number((await c.query("SELECT extract(epoch FROM clock_timestamp())*1000 AS now")).rows[0].now));}
async function loadRoom(c:PoolClient,pin:string,lock=false):Promise<RoomRow&{owner_id:string}> {
  return (await c.query(`SELECT r.*,c.content_json FROM workshop_room r JOIN workshop_content c ON c.id=r.content_id WHERE r.pin=$1 ${lock?"FOR UPDATE OF r":""}`,[pin])).rows[0];
}
async function participants(c:PoolClient,roomId:string):Promise<ParticipantRow[]>{return(await c.query("SELECT id,alias,revision,state_json FROM workshop_participant WHERE room_id=$1 ORDER BY joined_at,id",[roomId])).rows;}
async function transaction<T>(work:(c:PoolClient)=>Promise<T>){const c=await getPool().connect();try{await c.query("BEGIN");const result=await work(c);await c.query("COMMIT");return result;}catch(e){await c.query("ROLLBACK");throw e;}finally{c.release();}}
export class PostgresWorkshopRepository implements WorkshopRepository {
  async create(actor:WorkshopActor,key:string,version?:string){teacher(actor);return transaction(async c=>{
    await c.query("SELECT pg_advisory_xact_lock(hashtext($1))",[`workshop-create:${key}`]);
    await c.query("SELECT id FROM app_user WHERE id=$1 FOR UPDATE",[actor.id]);
    const existing=(await c.query("SELECT pin,owner_id,content_id FROM workshop_room WHERE id=$1",[key])).rows[0];
    if(existing){if(existing.owner_id!==actor.id)throw new WorkshopError("room_not_found",404);const room=await loadRoom(c,existing.pin);live(room,await time(c));const accepted=(await c.query("SELECT request_digest,result_json FROM workshop_event WHERE room_id=$1 AND participant_id IS NULL AND request_key=$2",[room.id,key])).rows[0];if(!accepted||accepted.request_digest!==digest({kind:"create",version:version??null}))throw new WorkshopError("request_changed");return accepted.result_json;}
    if(Number((await c.query("SELECT count(*) FROM workshop_room WHERE owner_id=$1 AND phase NOT IN ('closed','finished') AND expires_at>now()",[actor.id])).rows[0].count)>=10)throw new WorkshopError("room_limit");
    let content=(await c.query(version?"SELECT id FROM workshop_content WHERE version=$1 ORDER BY published_at DESC LIMIT 1":"SELECT id FROM workshop_content WHERE version='short-conversation-workshop-v2' ORDER BY published_at DESC LIMIT 1",version?[version]:[])).rows[0];
    if(!content&&!version)content=(await c.query("SELECT id FROM workshop_content ORDER BY published_at DESC LIMIT 1")).rows[0];
    if(!content)throw new WorkshopError("workshop_unavailable",503);
    let pin="";for(let i=0;i<12;i++){pin=String(randomInt(100000,1000000));const inserted=await c.query("INSERT INTO workshop_room(id,owner_id,content_id,pin) VALUES($1,$2,$3,$4) ON CONFLICT(pin) DO NOTHING RETURNING id",[key,actor.id,content.id,pin]);if(inserted.rowCount)break;pin="";}
    if(!pin)throw new WorkshopError("room_unavailable",503);const room=await loadRoom(c,pin),result=hostProjection(room,[],await time(c));
    const action={kind:"create",version:version??null};await c.query("INSERT INTO workshop_event(room_id,actor_id,request_key,request_digest,action_json,result_json) VALUES($1,$2,$3,$4,$5,$6)",[room.id,actor.id,key,digest(action),JSON.stringify(action),JSON.stringify(result)]);return result;
  });}
  async host(actor:WorkshopActor,pin:string){teacher(actor);return transaction(async c=>{const room=await loadRoom(c,pin);const now=await time(c);live(room,now);if(room.owner_id!==actor.id)throw new WorkshopError("room_not_found",404);return hostProjection(room,await participants(c,room.id),now);});}
  async hostAction(actor:WorkshopActor,pin:string,revision:number,key:string,action:HostAction){teacher(actor);return transaction(async c=>{
    const room=await loadRoom(c,pin,true),now=await time(c);live(room,now);if(room.owner_id!==actor.id)throw new WorkshopError("room_not_found",404);
    const hash=digest({revision,action}),prior=(await c.query("SELECT request_digest,result_json FROM workshop_event WHERE room_id=$1 AND participant_id IS NULL AND request_key=$2",[room.id,key])).rows[0];
    if(prior){if(prior.request_digest!==hash)throw new WorkshopError("request_changed");return prior.result_json;}
    if(room.revision!==revision)throw new WorkshopError("refresh_required");if(room.phase==="closed"||room.phase==="finished")throw new WorkshopError("room_closed");
    if(action.kind==="open_practice"){if(room.phase!=="preparation")throw new WorkshopError("practice_already_open");room.phase="practice";}
    else if(action.kind==="next_group"){if(room.phase!=="practice")throw new WorkshopError("practice_not_open");if(room.group_index+1===room.content_json.groups.length)room.phase="finished";else{room.group_index++;room.phase="preparation";}}
    else if(action.kind==="select_group"){
      if(!Number.isInteger(action.groupIndex)||action.groupIndex<0||action.groupIndex>=room.content_json.groups.length)throw new WorkshopError("group_unavailable",400);
      room.group_index=action.groupIndex;room.phase="preparation";
    }
    else room.phase="closed";
    room.revision++;await c.query("UPDATE workshop_room SET phase=$2,group_index=$3,revision=$4 WHERE id=$1",[room.id,room.phase,room.group_index,room.revision]);
    const result=hostProjection(room,await participants(c,room.id),now);
    await c.query("INSERT INTO workshop_event(room_id,actor_id,request_key,request_digest,action_json,result_json) VALUES($1,$2,$3,$4,$5,$6)",[room.id,actor.id,key,hash,JSON.stringify(action),JSON.stringify(result)]);return result;
  });}
  async join(pin:string,key:string,tokenHash:string){return transaction(async c=>{
    const room=await loadRoom(c,pin,true),now=await time(c);live(room,now);if(["closed","finished"].includes(room.phase))throw new WorkshopError("room_closed");
    const prior=(await c.query("SELECT p.* FROM workshop_join j JOIN workshop_participant p ON p.id=j.participant_id WHERE j.room_id=$1 AND j.request_key=$2",[room.id,key])).rows[0];
    if(prior){if(prior.token_hash!==tokenHash)throw new WorkshopError("request_changed");const accepted=(await c.query("SELECT result_json FROM workshop_event WHERE participant_id=$1 AND request_key=$2",[prior.id,key])).rows[0];if(!accepted)throw new WorkshopError("join_unavailable",503);return accepted.result_json;}
    if(Number((await c.query("SELECT count(*) FROM workshop_participant WHERE room_id=$1",[room.id])).rows[0].count)>=150)throw new WorkshopError("participant_limit");
    const used=new Set((await participants(c,room.id)).map(p=>p.alias));const base=anonymousAlias(key);let alias=base,n=2;while(used.has(alias))alias=`${base} ${n++}`;
    const participant=(await c.query("INSERT INTO workshop_participant(room_id,token_hash,alias) VALUES($1,$2,$3) RETURNING *",[room.id,tokenHash,alias])).rows[0];
    await c.query("INSERT INTO workshop_join(request_key,room_id,token_hash,participant_id) VALUES($1,$2,$3,$4)",[key,room.id,tokenHash,participant.id]);const result=learnerProjection(room,participant,now),action={kind:"join",pin};
    await c.query("INSERT INTO workshop_event(room_id,participant_id,request_key,request_digest,action_json,result_json) VALUES($1,$2,$3,$4,$5,$6)",[room.id,participant.id,key,digest(action),JSON.stringify(action),JSON.stringify(result)]);return result;
  });}
  async learner(pin:string,tokenHash:string){return transaction(async c=>{
    const room=await loadRoom(c,pin),now=await time(c);live(room,now);const p=(await c.query("SELECT * FROM workshop_participant WHERE room_id=$1 AND token_hash=$2",[room.id,tokenHash])).rows[0];if(!p)throw new WorkshopError("membership_required",401);return learnerProjection(room,p,now);
  });}
  async learnerAction(pin:string,tokenHash:string,revision:number,key:string,action:LearnerAction){return transaction(async c=>{
    const room=await loadRoom(c,pin,true),now=await time(c);live(room,now);
    const p=(await c.query("SELECT * FROM workshop_participant WHERE room_id=$1 AND token_hash=$2 FOR UPDATE",[room.id,tokenHash])).rows[0];if(!p)throw new WorkshopError("membership_required",401);
    const hash=digest({revision,action}),prior=(await c.query("SELECT request_digest,result_json FROM workshop_event WHERE participant_id=$1 AND request_key=$2",[p.id,key])).rows[0];
    if(prior){if(prior.request_digest!==hash)throw new WorkshopError("request_changed");return prior.result_json;}
    if(room.phase==="closed")throw new WorkshopError("room_closed");
    if(room.phase!=="practice"&&!(room.phase==="finished"&&action.kind==="enrichment_choose"))throw new WorkshopError("practice_not_open");
    if(p.revision!==revision)throw new WorkshopError("refresh_required");
    const current=itemAt(room.content_json,room.group_index,p.state_json);
    let target:(typeof current.items)[number]|null=current.item;
    if(action.kind==="enrichment_choose"){
      if(current.item&&p.state_json.items[current.item.id]?.phase!=="item_complete")throw new WorkshopError("enrichment_not_available");
      target=current.items.find(candidate=>candidate.id===action.itemId)??null;
      if(!target||p.state_json.items[target.id]?.phase!=="item_complete")throw new WorkshopError("enrichment_requires_completed_item");
    }
    if(!target)throw new WorkshopError("group_complete");
    const group=current.group;
    const timing=action.kind==="listen_start"?workshopPlaybackTiming(room.content_json,room.group_index,p.state_json.cursors[group.id]??0,target):undefined;
    p.state_json=advanceParticipant(p.state_json,target,action,now,current.items.length,timing);p.revision++;
    await c.query("UPDATE workshop_participant SET state_json=$2,revision=$3 WHERE id=$1",[p.id,JSON.stringify(p.state_json),p.revision]);
    const result=learnerProjection(room,p,now);
    await c.query("INSERT INTO workshop_event(room_id,participant_id,request_key,request_digest,action_json,result_json) VALUES($1,$2,$3,$4,$5,$6)",[room.id,p.id,key,hash,JSON.stringify(action),JSON.stringify(result)]);return result;
  });}
}
export const workshopRepository=new PostgresWorkshopRepository();
