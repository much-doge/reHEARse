import {describe,it,expect} from "vitest";
import {fixture,partBcFixture} from "./fixture.test-support";
import {advanceParticipant,emptyParticipant,effectivePhase,emptyItem,workshopPlaybackTiming} from "./state";
import type {LearnerAction} from "./contracts";
const item=fixture().items[0];
describe("workshop listening state",()=>{
 it("starts the Part B/C choice window after passage plus spoken question and replays both",()=>{
  const content=partBcFixture(),first=content.items[0];
  const firstTiming=workshopPlaybackTiming(content,0,0,first);expect(firstTiming).toEqual({firstListenMs:1100,replayMs:1100});
  const later=content.items[3];expect(workshopPlaybackTiming(content,0,1,later)).toEqual({firstListenMs:100,replayMs:1100});
  let state=advanceParticipant(emptyParticipant(),first,{kind:"listen_start",itemId:first.id},1000,3,firstTiming);
  expect(state.items[first.id].answerOpensAt).toBe(2100);expect(state.items[first.id].deadline).toBe(14100);
  state=advanceParticipant(state,first,{kind:"choose",itemId:first.id,choice:"D"},2100,3);
  expect(state.items[first.id].phase).toBe("relisten_1");
  state=advanceParticipant(state,first,{kind:"listen_start",itemId:first.id},2200,3,firstTiming);
  expect(state.items[first.id].replayEndsAt).toBe(3300);
 });
 it("pins one first-choice window exactly twelve seconds after clip end",()=>{
  const initial=emptyParticipant();const started=advanceParticipant(initial,item,{kind:"listen_start",itemId:item.id},1000,15);
  expect(started.items[item.id]).toMatchObject({startedAt:1000,answerOpensAt:1100,deadline:13100});expect(initial.items).toEqual({});
  expect(()=>advanceParticipant(started,item,{kind:"listen_start",itemId:item.id},1100,15)).toThrow("listen_already_started");
  expect(()=>advanceParticipant(started,item,{kind:"choose",itemId:item.id,choice:"A"},1099,15)).toThrow("answer_not_open");
  for(const now of [1100,13100])expect(advanceParticipant(started,item,{kind:"choose",itemId:item.id,choice:"A"},now,15).items[item.id].phase).toBe("explain_distractors");
  expect(()=>advanceParticipant(started,item,{kind:"choose",itemId:item.id,choice:"A"},13101,15)).toThrow("deadline_elapsed");
  expect(effectivePhase(started.items[item.id],13101)).toBe("relisten_1");
  const timedOut=advanceParticipant(started,item,{kind:"listen_start",itemId:item.id},13101,15);expect(timedOut.items[item.id]).toMatchObject({phase:"relisten_1",replayStartedAt:13101,replayEndsAt:13201,result:{choice:null,result:"incorrect"}});
 });
 it("bounds misses to two purpose-led replays then a final guided comparison",()=>{
  let state=emptyParticipant(),now=0;const act=(action:LearnerAction)=>{state=advanceParticipant(state,item,action,now,15);return state.items[item.id];};
  act({kind:"listen_start",itemId:item.id});now=100;expect(act({kind:"choose",itemId:item.id,choice:null}).phase).toBe("relisten_1");
  expect(()=>act({kind:"choose",itemId:item.id,choice:"B"})).toThrow("replay_required");
  for(const phase of ["relisten_2","guided_compare"]){act({kind:"listen_start",itemId:item.id});expect(()=>act({kind:"choose",itemId:item.id,choice:"B"})).toThrow("replay_required");now+=100;expect(act({kind:"choose",itemId:item.id,choice:"B"}).phase).toBe(phase);}
  expect(()=>act({kind:"listen_start",itemId:item.id})).toThrow("listen_already_started");
  expect(act({kind:"choose",itemId:item.id,choice:"D"}).phase).toBe("explain_distractors");
  expect(()=>act({kind:"choose",itemId:item.id,choice:"A"})).toThrow("choice_not_open");
  expect(()=>act({kind:"explain",itemId:item.id,option:"A",text:"Reason"})).toThrow("invalid_explanation_option");
  for(const option of ["B","C","D"] as const)act({kind:"explain",itemId:item.id,option,text:"It changes the stated situation."});
  expect(state.items[item.id].phase).toBe("item_complete");
  expect(()=>act({kind:"explain",itemId:item.id,option:"B",text:"Changed"})).toThrow("explanation_not_open");
  act({kind:"next_item",itemId:item.id});expect(state.cursors[item.groupId]).toBe(1);
 });
 it("rejects wrong order, premature next and overwriting prose",()=>{
  let state=advanceParticipant(emptyParticipant(),item,{kind:"listen_start",itemId:item.id},0,15);
  state=advanceParticipant(state,item,{kind:"choose",itemId:item.id,choice:"A"},100,15);
  state=advanceParticipant(state,item,{kind:"explain",itemId:item.id,option:"B",text:"A saved reason."},100,15);
  expect(()=>advanceParticipant(state,item,{kind:"explain",itemId:item.id,option:"B",text:"Changed reason."},100,15)).toThrow("explanation_already_saved");
  expect(()=>advanceParticipant(state,item,{kind:"next_item",itemId:item.id},100,15)).toThrow("item_not_complete");
  expect(()=>advanceParticipant(state,item,{kind:"choose",itemId:"other-item",choice:"A"},100,15)).toThrow("item_order");
 });
 it("keeps untimed enrichment attempts separate and stops after a supported choice",()=>{
  const before=emptyParticipant();before.items[item.id]={...emptyItem(),phase:"item_complete",result:{choice:"A",result:"correct",attempt:1},firstCorrect:true};
  const first=advanceParticipant(before,item,{kind:"enrichment_choose",itemId:item.id,activityId:"cold-replay",choice:"B"},100,15);
  expect(first.enrichment?.[item.id]?.["cold-replay"]).toEqual([{choice:"B",result:"incorrect",attempt:1}]);
  const second=advanceParticipant(first,item,{kind:"enrichment_choose",itemId:item.id,activityId:"cold-replay",choice:"A"},200,15);
  expect(second.enrichment?.[item.id]?.["cold-replay"]).toEqual([{choice:"B",result:"incorrect",attempt:1},{choice:"A",result:"correct",attempt:2}]);
  expect(before.enrichment).toEqual({});
  expect(()=>advanceParticipant(second,item,{kind:"enrichment_choose",itemId:item.id,activityId:"cold-replay",choice:"C"},300,15)).toThrow("enrichment_already_complete");
  expect(()=>advanceParticipant(emptyParticipant(),item,{kind:"enrichment_choose",itemId:item.id,activityId:"focus-replay",choice:"A"},300,15)).toThrow("enrichment_requires_completed_item");
 });
});

describe("closed and open action matrix",()=>{
 const phases=["ready","timed_choice","relisten_1","relisten_2","guided_compare","explain_distractors","item_complete"] as const;
 for(const phase of phases)it(`only accepts allowed actions in ${phase}`,()=>{
  const before=emptyParticipant();before.items[item.id]={phase,startedAt:0,answerOpensAt:100,deadline:12100,replayStartedAt:phase.startsWith("relisten")?0:null,replayEndsAt:phase.startsWith("relisten")?100:null,replayCount:phase.startsWith("relisten")?1:0,result:null,firstCorrect:false,explanations:phase==="item_complete"?{B:"Saved B",C:"Saved C",D:"Saved D"}:{}};
  const actions:LearnerAction[]=[{kind:"listen_start",itemId:item.id},{kind:"choose",itemId:item.id,choice:"A"},{kind:"explain",itemId:item.id,option:"B",text:"A reason."},{kind:"next_item",itemId:item.id}];
  const allowed=phase==="ready"?"listen_start":["timed_choice","relisten_1","relisten_2","guided_compare"].includes(phase)?"choose":phase==="explain_distractors"?"explain":"next_item";
  for(const action of actions){if(action.kind===allowed)expect(()=>advanceParticipant(before,item,action,100,15)).not.toThrow();else expect(()=>advanceParticipant(before,item,action,100,15)).toThrow();}
  expect(before.items[item.id].phase).toBe(phase);
 });
 it("requires bounded prose and valid choices without semantically grading it",()=>{
  let state=advanceParticipant(emptyParticipant(),item,{kind:"listen_start",itemId:item.id},0,15);state=advanceParticipant(state,item,{kind:"choose",itemId:item.id,choice:"A"},100,15);
  for(const text of ["  ","ab","x".repeat(401)])expect(()=>advanceParticipant(state,item,{kind:"explain",itemId:item.id,option:"B",text},100,15)).toThrow("explanation_required");
  expect(advanceParticipant(state,item,{kind:"explain",itemId:item.id,option:"B",text:"  A short learner explanation.  "},100,15).items[item.id].explanations.B).toBe("A short learner explanation.");
 });
});
