import {describe,it,expect} from "vitest";
import {fixture,partBcFixture} from "../../domain/workshop/fixture.test-support";
import {emptyParticipant,advanceParticipant} from "../../domain/workshop/state";
import {learnerProjection,hostProjection,type RoomRow} from "./projection";
const room:RoomRow={id:"room",pin:"123456",revision:0,phase:"preparation",group_index:0,expires_at:new Date(100000),content_json:fixture()};
const participant={id:"learner",alias:"Sunny Otter",revision:0,state_json:emptyParticipant()};
describe("workshop privacy projection",()=>{
 it("releases shared-passage and prompt audio only after start while projecting no stems or answer keys",()=>{
  const content=partBcFixture(),bcRoom={...room,content_json:content,phase:"practice" as const};
  const before=learnerProjection(bcRoom,participant,0);expect(before.current?.audioUrl).toBeNull();expect(before.current?.passageAudioUrl).toBeNull();
  const state=advanceParticipant(participant.state_json,content.items[0],{kind:"listen_start",itemId:content.items[0].id},0,3,{firstListenMs:1100,replayMs:1100});
  const after=learnerProjection(bcRoom,{...participant,state_json:state},0);
  expect(after.current?.audioUrl).toContain("sample-0.mp3");expect(after.current?.passageAudioUrl).toContain("passage-0.mp3");
  expect(after.current?.title).toEqual({en:"Question 31",id:"Soal 31"});
  expect(JSON.stringify(after)).not.toMatch(/What is the main topic|decisiveEvidence|optionReasons|guidedComparison|privateSourceReference|"answer"/);
 });
 it("withholds active options/audio during preparation and all private content always",()=>{
  const view=learnerProjection(room,participant,0);expect(view.current).toBeNull();
  expect(JSON.stringify(view)).not.toMatch(/decisiveEvidence|optionReasons|privateSourceReference|sha256|tips|guidedComparison|answer\"/);
  const active=learnerProjection({...room,phase:"practice"},participant,0);expect(active.current?.hint).toBeNull();expect(active.current?.comparison).toBeNull();expect(active.current?.explanationOptions).toEqual([]);expect(JSON.stringify(active)).not.toContain('"prompt"');
 });
 it("replaces historical written examples with the expanded Longman card without changing the stored room",()=>{
  const before=JSON.stringify(room.content_json.groups[0].preparation);
  const view=learnerProjection(room,participant,0);
  expect(view.group.preparation.procedure).toHaveLength(5);
  expect(view.group.preparation.longmanReference.en).toContain("Skills 1–3");
  expect(JSON.stringify(view)).not.toContain("Is the room free?");
  expect(JSON.stringify(room.content_json.groups[0].preparation)).toBe(before);
 });
 it("releases only the current tip and never learner text on the teacher board",()=>{
  const item=room.content_json.items[0];let state=advanceParticipant(participant.state_json,item,{kind:"listen_start",itemId:item.id},0,15);
  state=advanceParticipant(state,item,{kind:"choose",itemId:item.id,choice:"B"},100,15);
  const p={...participant,state_json:state};const view=learnerProjection({...room,phase:"practice"},p,100);expect(view.current?.hint).toEqual(item.tips[0]);expect(view.current?.comparison).toBeNull();
  const host=hostProjection(room,[p],100);expect(host.items[0]).toMatchObject({firstListenStarted:true,replayUsed:false});expect(JSON.stringify(host)).not.toMatch(/state_json|explanations|result|answer|token|participantCount|participants|notStarted|firstListenCorrect|completedWithReplay/);
 });
});
