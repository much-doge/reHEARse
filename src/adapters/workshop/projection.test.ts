import {describe,it,expect} from "vitest";
import {fixture} from "../../domain/workshop/fixture.test-support";
import {emptyParticipant,advanceParticipant} from "../../domain/workshop/state";
import {learnerProjection,hostProjection,type RoomRow} from "./projection";
const room:RoomRow={id:"room",pin:"123456",revision:0,phase:"preparation",group_index:0,expires_at:new Date(100000),content_json:fixture()};
const participant={id:"learner",alias:"Sunny Otter",revision:0,state_json:emptyParticipant()};
describe("workshop privacy projection",()=>{
 it("withholds active options/audio during preparation and all private content always",()=>{
  const view=learnerProjection(room,participant,0);expect(view.current).toBeNull();
  expect(JSON.stringify(view)).not.toMatch(/decisiveEvidence|optionReasons|privateSourceReference|sha256|tips|guidedComparison|answer\"/);
  const active=learnerProjection({...room,phase:"practice"},participant,0);expect(active.current?.hint).toBeNull();expect(active.current?.comparison).toBeNull();expect(active.current?.explanationOptions).toEqual([]);
 });
 it("releases only the current tip and never learner text on the teacher board",()=>{
  const item=room.content_json.items[0];let state=advanceParticipant(participant.state_json,item,{kind:"listen_start",itemId:item.id},0,15);
  state=advanceParticipant(state,item,{kind:"choose",itemId:item.id,choice:"B"},100,15);
  const p={...participant,state_json:state};const view=learnerProjection({...room,phase:"practice"},p,100);expect(view.current?.hint).toEqual(item.tips[0]);expect(view.current?.comparison).toBeNull();
  const host=hostProjection(room,[p],100);expect(host.items[0]).toMatchObject({notStarted:0,firstListenCorrect:0,relistening:1,completed:0});expect(JSON.stringify(host)).not.toMatch(/state_json|explanations|result|answer|token/);
 });
});
