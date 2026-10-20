import {describe,it,expect} from "vitest";
import {fixture} from "./fixture.test-support";
import {advanceParticipant,emptyParticipant,effectivePhase} from "./state";
import type {LearnerAction} from "./contracts";
const item=fixture().items[0];
describe("workshop listening state",()=>{
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
});
