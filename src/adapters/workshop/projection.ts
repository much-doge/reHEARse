import type { HostView, LearnerView, GroupSummary, Option } from "../../domain/workshop/contracts";
import type { WorkshopContent } from "../../domain/workshop/content";
import { effectivePhase, emptyItem, itemAt, options, type ParticipantState } from "../../domain/workshop/state";
export type RoomRow = { id: string; pin:string; revision:number; phase:HostView["phase"]; group_index:number; expires_at:Date; content_json: WorkshopContent };
export type ParticipantRow = { id:string; alias:string; revision:number; state_json: ParticipantState };
const iso=(value:number|null)=>value===null?null:new Date(value).toISOString();
const groupSummary=(content:WorkshopContent,index:number):GroupSummary=>{const g=content.groups[index];return{id:g.id,title:g.title,skill:g.skill,itemCount:content.items.filter(i=>i.groupId===g.id).length};};
const summary=(item:WorkshopContent["items"][number])=>({id:item.id,title:item.title,skill:item.primarySkill});
export function learnerProjection(room:RoomRow,participant:ParticipantRow,now:number):LearnerView {
  const content=room.content_json,{group,items,item}=itemAt(content,room.group_index,participant.state_json);
  const state=item?participant.state_json.items[item.id]??emptyItem():null;
  const visible=room.phase==="practice"&&item&&state;
  const phase=state?effectivePhase(state,now):null;
  const explanation=state&&["explain_distractors","item_complete"].includes(state.phase);
  return{contractVersion:"part-a-workshop.v1",pin:room.pin,roomRevision:room.revision,revision:participant.revision,alias:participant.alias,phase:room.phase,
    activity:{id:content.id,version:content.version,title:content.title},group:{...groupSummary(content,room.group_index),preparation:group.preparation},
    items:items.map(summary),groupComplete:items.every(i=>participant.state_json.items[i.id]?.phase==="item_complete"),
    current:!visible?null:{id:item.id,title:item.title,phase:phase!,prompt:item.prompt,options:Object.fromEntries(options.map((key,index)=>[key,item.options[index]])) as Record<Option,string>,
      audioUrl:item.media.publicUrl!,durationMs:item.media.durationMs,startedAt:iso(state.startedAt),answerOpensAt:iso(state.answerOpensAt),deadline:iso(state.deadline),
      replayStartedAt:iso(state.replayStartedAt),replayEndsAt:iso(state.replayEndsAt),result:state.result,
      hint:phase==="relisten_1"?item.tips[0]:phase==="relisten_2"?item.tips[1]:null,
      comparison:phase==="guided_compare"?item.guidedComparison:null,explanations:{...state.explanations},explanationOptions:explanation?options.filter(key=>key!==item.answer):[]},
    serverTime:new Date(now).toISOString(),expiresAt:room.expires_at.toISOString()};
}
export function hostProjection(room:RoomRow,participants:ParticipantRow[],now:number):HostView {
  const content=room.content_json,group=content.groups[room.group_index];
  return{contractVersion:"part-a-workshop.v1",pin:room.pin,revision:room.revision,phase:room.phase,activity:{id:content.id,version:content.version,title:content.title},
    groups:content.groups.map((_,i)=>groupSummary(content,i)),activeGroup:room.group_index,preparation:group.preparation,
    participants:participants.map(p=>({alias:p.alias})),participantCount:participants.length,
    items:content.items.filter(i=>i.groupId===group.id).map(item=>{
      const states=participants.map(p=>p.state_json.items[item.id]??emptyItem());
      return{...summary(item),notStarted:states.filter(s=>s.phase==="ready").length,firstListenCorrect:states.filter(s=>s.firstCorrect).length,
        relistening:states.filter(s=>["relisten_1","relisten_2","guided_compare"].includes(effectivePhase(s,now))).length,completed:states.filter(s=>s.phase==="item_complete").length};
    }),serverTime:new Date(now).toISOString(),expiresAt:room.expires_at.toISOString()};
}
