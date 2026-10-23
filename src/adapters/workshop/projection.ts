import { WORKSHOP_VERSION, type HostView, type LearnerView, type GroupSummary, type Option, type Preparation } from "../../domain/workshop/contracts";
import type { WorkshopContent } from "../../domain/workshop/content";
import { effectivePhase, emptyItem, itemAt, options, type ParticipantState } from "../../domain/workshop/state";
import { workshopGroups } from "./preparation";
export type RoomRow = { id: string; pin:string; revision:number; phase:HostView["phase"]; group_index:number; expires_at:Date; content_json: WorkshopContent };
export type ParticipantRow = { id:string; alias:string; revision:number; state_json: ParticipantState };
const iso=(value:number|null)=>value===null?null:new Date(value).toISOString();
const groupSummary=(content:WorkshopContent,index:number):GroupSummary=>{const g=content.groups[index];return{id:g.id,title:g.title,skill:g.skill,itemCount:content.items.filter(i=>i.groupId===g.id).length};};
const summary=(item:WorkshopContent["items"][number],index:number)=>({id:item.id,title:{en:`Clip ${index+1}`,id:`Klip ${index+1}`},skill:item.primarySkill});
function safePreparation(content:WorkshopContent,index:number):Preparation {
  const group=content.groups[index], source=group.preparation;
  if("longmanReference" in source && "extensionActivities" in source)return {
    questionTask:source.questionTask,listeningTarget:source.listeningTarget,procedure:source.procedure,
    distractorPatterns:source.distractorPatterns,longmanReference:source.longmanReference,
    extensionActivities:source.extensionActivities,inquiryPrompts:source.inquiryPrompts,languageNotes:source.languageNotes,
  };
  const current=workshopGroups.find(candidate=>candidate.id===group.id)?.preparation??workshopGroups.find(candidate=>candidate.skill===group.skill)?.preparation;
  if(current)return current;
  throw new Error("preparation_unavailable");
}
export function learnerProjection(room:RoomRow,participant:ParticipantRow,now:number):LearnerView {
  const content=room.content_json,{items,item}=itemAt(content,room.group_index,participant.state_json);
  const state=item?participant.state_json.items[item.id]??emptyItem():null;
  const visible=room.phase==="practice"&&item&&state;
  const phase=state?effectivePhase(state,now):null;
  const explanation=state&&["explain_distractors","item_complete"].includes(state.phase);
  const groupIndex=room.group_index;
  const canEnrich=(!item||participant.state_json.items[item.id]?.phase==="item_complete")&&["practice","finished"].includes(room.phase);
  const enrichment=canEnrich?items.flatMap((completed,index)=>{
    const saved=participant.state_json.items[completed.id];
    if(saved?.phase!=="item_complete"||!completed.media.publicUrl)return[];
    return [{id:completed.id,number:index+1,audioUrl:completed.media.publicUrl,durationMs:completed.media.durationMs,
      originalChoice:saved.result?.choice??null,
      options:Object.fromEntries(options.map((key,optionIndex)=>[key,completed.options[optionIndex]])) as Record<Option,string>,
      tips:completed.tips,comparison:completed.guidedComparison,attempts:participant.state_json.enrichment?.[completed.id]??{}}];
  }):[];
  return{contractVersion:WORKSHOP_VERSION,pin:room.pin,roomRevision:room.revision,revision:participant.revision,alias:participant.alias,phase:room.phase,
    activity:{id:content.id,version:content.version,title:content.title},group:{...groupSummary(content,groupIndex),preparation:safePreparation(content,groupIndex)},
    items:items.map(summary),groupComplete:items.every(i=>participant.state_json.items[i.id]?.phase==="item_complete"),enrichment,
    current:!visible?null:{id:item.id,title:{en:`Clip ${(items.indexOf(item))+1}`,id:`Klip ${(items.indexOf(item))+1}`},phase:phase!,options:Object.fromEntries(options.map((key,index)=>[key,item.options[index]])) as Record<Option,string>,
      audioUrl:item.media.publicUrl!,durationMs:item.media.durationMs,startedAt:iso(state.startedAt),answerOpensAt:iso(state.answerOpensAt),deadline:iso(state.deadline),
      replayStartedAt:iso(state.replayStartedAt),replayEndsAt:iso(state.replayEndsAt),result:state.result,
      hint:phase==="relisten_1"?item.tips[0]:phase==="relisten_2"?item.tips[1]:null,
      comparison:phase==="guided_compare"?item.guidedComparison:null,explanations:{...state.explanations},explanationOptions:explanation?options.filter(key=>key!==item.answer):[]},
    serverTime:new Date(now).toISOString(),expiresAt:room.expires_at.toISOString()};
}
export function hostProjection(room:RoomRow,participants:ParticipantRow[],now:number):HostView {
  const content=room.content_json,group=content.groups[room.group_index];
  return{contractVersion:WORKSHOP_VERSION,pin:room.pin,revision:room.revision,phase:room.phase,activity:{id:content.id,version:content.version,title:content.title},
    groups:content.groups.map((_,i)=>groupSummary(content,i)),activeGroup:room.group_index,preparation:safePreparation(content,room.group_index),
    items:content.items.filter(i=>i.groupId===group.id).map((item,index)=>{
      const states=participants.map(p=>p.state_json.items[item.id]??emptyItem());
      return{...summary(item,index),firstListenStarted:states.some(s=>s.startedAt!==null),replayUsed:states.some(s=>s.replayCount>0)};
    }),serverTime:new Date(now).toISOString(),expiresAt:room.expires_at.toISOString()};
}
