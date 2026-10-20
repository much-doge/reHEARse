/* Guarded disposable local PostgreSQL/API acceptance. Never targets production. */
import assert from "node:assert/strict";
import { randomUUID,randomBytes,createHash } from "node:crypto";
import pg from "pg";
import { fixture } from "../src/domain/workshop/fixture.test-support";
assert.equal(process.env.ALLOW_LOCAL_WORKSHOP_JOURNEY,"true");
assert.equal(process.env.FEEDBACK_PROVIDER,"template");
assert.equal(process.env.DATABASE_URL,"postgresql://listening:listening@rehearse-lfl023-db:5432/listening");
const origin="http://rehearse-lfl023-app:3000",pool=new pg.Pool({connectionString:process.env.DATABASE_URL}),hashes:string[]=[];
async function actor(role:string){const u=(await pool.query("INSERT INTO app_user(email,display_name,password_hash,role) VALUES($1,'Local workshop fixture','fixture-no-login',$2) RETURNING id",[`workshop-${randomUUID()}@test.invalid`,role])).rows[0];const token=randomBytes(32).toString("base64url"),hash=createHash("sha256").update(token).digest("hex");hashes.push(hash);await pool.query("INSERT INTO app_session(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '20 minutes')",[u.id,hash]);return{...u,cookie:`rehearse_session=${token}`};}
async function call(path:string,body?:unknown,cookie="",requestOrigin=origin){const r=await fetch(origin+path,{method:body?"POST":"GET",headers:{origin:requestOrigin,"content-type":"application/json",...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});return{status:r.status,body:await r.json(),cookie:r.headers.get("set-cookie"),cache:r.headers.get("cache-control")};}
const teacher=await actor("teacher"),other=await actor("teacher"),learner=await actor("learner");
try{
 const content=fixture();content.items[0].media.durationMs=500;content.version=`local-${randomUUID()}`;const contentId=(await pool.query("INSERT INTO workshop_content(version,activity_id,grouping_version,pedagogy_version,digest,content_json,media_json) VALUES($1,$2,$3,$4,$5,$6,'[]') RETURNING id",[content.version,content.id,content.groupingVersion,content.pedagogyVersion,"0".repeat(64),JSON.stringify(content)])).rows[0].id;
 assert.equal((await call("/api/workshop/host",{kind:"create",key:randomUUID()},learner.cookie)).status,403);
 assert.equal((await call("/api/workshop/host",{kind:"create",key:randomUUID()})).status,401);
 assert.equal((await call("/api/workshop/host",{kind:"create",key:randomUUID()},teacher.cookie,"https://foreign.invalid")).status,403);
 const create={kind:"create",key:randomUUID(),version:content.version};const created=await call("/api/workshop/host",create,teacher.cookie);assert.equal(created.status,200);let host=created.body;const pin=host.pin;
 const repeated=await call("/api/workshop/host",create,teacher.cookie);assert.deepEqual(repeated.body,host);
 assert.equal((await call("/api/workshop/host",{...create,version:"changed"},teacher.cookie)).status,409);
 assert.equal((await call(`/api/workshop/host?pin=${pin}`,undefined,other.cookie)).status,404);
 assert.equal((await call(`/api/workshop?pin=${pin}`)).status,401);
 const join={kind:"join",pin,key:randomUUID()};const joined=await call("/api/workshop",join);assert.equal(joined.status,200);const cookie=joined.cookie!.split(";")[0];assert.match(joined.cookie!,/HttpOnly/i);assert.match(joined.cookie!,/SameSite=Lax/i);let view=joined.body;
 const storedJoin=(await pool.query("SELECT j.request_key,p.token_hash FROM workshop_join j JOIN workshop_participant p ON p.id=j.participant_id WHERE j.room_id=(SELECT id FROM workshop_room WHERE pin=$1)",[pin])).rows[0];
 assert.notEqual(storedJoin.request_key,join.key);assert.equal(storedJoin.token_hash,createHash("sha256").update(cookie.split("=")[1]).digest("hex"));
 assert.equal(view.current,null);assert.equal(view.phase,"preparation");assert.deepEqual((await call("/api/workshop",join)).body,view);
 const eventCount=async()=>Number((await pool.query("SELECT count(*) FROM workshop_event WHERE room_id=(SELECT id FROM workshop_room WHERE pin=$1)",[pin])).rows[0].count);
 const act=async(action:unknown,key=randomUUID(),revision=view.revision)=>{const r=await call("/api/workshop",{kind:"act",pin,key,revision,action},cookie);if(r.status===200)view=r.body;return r;};
 const hostAct=async(action:unknown,key=randomUUID(),revision=host.revision)=>{const r=await call("/api/workshop/host",{kind:"act",pin,key,revision,action},teacher.cookie);if(r.status===200)host=r.body;return r;};
 assert.equal((await act({kind:"listen_start",itemId:content.items[0].id})).status,409);
 assert.equal((await hostAct({kind:"open_practice"})).status,200);view=(await call(`/api/workshop?pin=${pin}`,undefined,cookie)).body;let item=content.items[0];
 assert(!/decisiveEvidence|optionReasons|privateSourceReference|sha256|"answer"|guidedComparison/.test(JSON.stringify(view)));
 const before=await eventCount(),listenKey=randomUUID();const starts=await Promise.all(Array.from({length:6},()=>call("/api/workshop",{kind:"act",pin,key:listenKey,revision:0,action:{kind:"listen_start",itemId:item.id}},cookie)));assert(starts.every(r=>r.status===200));for(const result of starts)assert.deepEqual(result.body,starts[0].body);view=starts[0].body;
 assert.equal(await eventCount(),before+1);assert.equal(Date.parse(view.current.deadline)-Date.parse(view.current.answerOpensAt),12000);assert.equal(Date.parse(view.current.answerOpensAt)-Date.parse(view.current.startedAt),item.media.durationMs);
 assert.equal((await act({kind:"choose",itemId:item.id,choice:"A"})).body.error,"answer_not_open");
 const deadline=view.current.deadline;assert.equal((await call(`/api/workshop?pin=${pin}`,undefined,cookie)).body.current.deadline,deadline);
 assert.equal((await act({kind:"choose",itemId:item.id,choice:"A"},listenKey,0)).body.error,"request_changed");
 assert.equal((await act({kind:"listen_start",itemId:item.id})).body.error,"listen_already_started");
 await new Promise(r=>setTimeout(r,550));assert.equal((await act({kind:"choose",itemId:item.id,choice:"A"})).status,200);assert.equal(view.current.phase,"explain_distractors");
 const explainRevision=view.revision;const explainKey=randomUUID(),text="This option changes the stated booking.";const accepted=await act({kind:"explain",itemId:item.id,option:"B",text},explainKey);assert.equal(accepted.status,200);const saved=structuredClone(accepted.body);
 assert.equal((await act({kind:"explain",itemId:item.id,option:"B",text:"Changed text"},explainKey,view.revision-1)).body.error,"request_changed");
 assert.equal((await act({kind:"explain",itemId:item.id,option:"A",text})).status,400);
 for(const option of ["C","D"])assert.equal((await act({kind:"explain",itemId:item.id,option,text})).status,200);
 assert.equal(view.current.phase,"item_complete");assert.deepEqual((await call("/api/workshop",{kind:"act",pin,key:explainKey,revision:explainRevision,action:{kind:"explain",itemId:item.id,option:"B",text}},cookie)).body,saved);
 assert.equal((await act({kind:"next_item",itemId:item.id})).status,200);item=content.items[1];
 await act({kind:"listen_start",itemId:item.id});await new Promise(r=>setTimeout(r,130));await act({kind:"choose",itemId:item.id,choice:null});assert.equal(view.current.phase,"relisten_1");assert.deepEqual(view.current.hint,item.tips[0]);assert.equal(view.current.comparison,null);
 assert.equal((await act({kind:"choose",itemId:item.id,choice:"B"})).body.error,"replay_required");
 for(const expected of ["relisten_2","guided_compare"]){await act({kind:"listen_start",itemId:item.id});await new Promise(r=>setTimeout(r,130));await act({kind:"choose",itemId:item.id,choice:"B"});assert.equal(view.current.phase,expected);}
 assert.deepEqual(view.current.comparison,item.guidedComparison);assert.equal((await act({kind:"listen_start",itemId:item.id})).status,409);await act({kind:"choose",itemId:item.id,choice:"D"});assert.equal(view.current.phase,"explain_distractors");
 for(const option of ["B","C","D"])await act({kind:"explain",itemId:item.id,option,text});assert.equal(view.current.phase,"item_complete");
 const counts=(await call(`/api/workshop/host?pin=${pin}`,undefined,teacher.cookie)).body.items;assert.equal(counts[0].firstListenCorrect,1);assert.equal(counts[0].completed,1);assert.equal(counts[1].completed,1);assert(!JSON.stringify(counts).includes(text));
 await act({kind:"next_item",itemId:item.id});item=content.items[2];await act({kind:"listen_start",itemId:item.id});
 // Deliberately expire only this disposable fixture's timer to exercise the real endpoint.
 const participantId=(await pool.query("SELECT id FROM workshop_participant WHERE room_id=(SELECT id FROM workshop_room WHERE pin=$1)",[pin])).rows[0].id;
 const expired=(await pool.query("SELECT state_json FROM workshop_participant WHERE id=$1",[participantId])).rows[0].state_json;
 const dbNow=Number((await pool.query("SELECT extract(epoch FROM clock_timestamp())*1000 AS now")).rows[0].now);expired.items[item.id].startedAt=dbNow-13000-item.media.durationMs;expired.items[item.id].answerOpensAt=dbNow-13000;expired.items[item.id].deadline=dbNow-1000;
 await pool.query("UPDATE workshop_participant SET state_json=$2 WHERE id=$1",[participantId,JSON.stringify(expired)]);
 assert.equal((await act({kind:"choose",itemId:item.id,choice:"A"})).body.error,"deadline_elapsed");view=(await call(`/api/workshop?pin=${pin}`,undefined,cookie)).body;assert.equal(view.current.phase,"relisten_1");assert.equal((await act({kind:"listen_start",itemId:item.id})).status,200);
 assert.equal((await act({kind:"explain",itemId:content.items[0].id,option:"B",text},explainKey,explainRevision+1)).body.error,"request_changed");
 const previousState=(await pool.query("SELECT state_json FROM workshop_participant WHERE id=$1",[participantId])).rows[0].state_json;
 const nextKey=randomUUID(),hostBefore=host.revision;const advances=await Promise.all(Array.from({length:6},()=>call("/api/workshop/host",{kind:"act",pin,key:nextKey,revision:hostBefore,action:{kind:"next_group"}},teacher.cookie)));assert(advances.every(r=>r.status===200));assert(advances.every(r=>r.body.activeGroup===1));host=advances[0].body;
 assert.deepEqual((await pool.query("SELECT state_json FROM workshop_participant WHERE id=$1",[participantId])).rows[0].state_json,previousState);
 view=(await call(`/api/workshop?pin=${pin}`,undefined,cookie)).body;assert.equal(view.phase,"preparation");assert.equal(view.current,null);assert.equal((await act({kind:"choose",itemId:item.id,choice:"A"})).status,409);
 assert.equal((await hostAct({kind:"open_practice"},randomUUID(),0)).body.error,"refresh_required");await hostAct({kind:"open_practice"});view=(await call(`/api/workshop?pin=${pin}`,undefined,cookie)).body;assert.equal(view.current.id,content.items[15].id);
 await hostAct({kind:"close"});assert.equal((await act({kind:"listen_start",itemId:content.items[15].id})).status,409);assert.equal((await call("/api/workshop",{kind:"join",pin,key:randomUUID()})).status,409);
 await pool.query("UPDATE workshop_room SET expires_at=now()-interval '1 second' WHERE pin=$1",[pin]);assert.equal((await call(`/api/workshop?pin=${pin}`,undefined,cookie)).status,410);assert.equal((await call(`/api/workshop/host?pin=${pin}`,undefined,teacher.cookie)).status,410);
 // Complete every item in a second synthetic room to cover both group finishes.
 const completeRoom=await call("/api/workshop/host",{kind:"create",key:randomUUID(),version:content.version},teacher.cookie);assert.equal(completeRoom.status,200);
 const completePin=completeRoom.body.pin;let completeHost=completeRoom.body;
 const completeJoin=await call("/api/workshop",{kind:"join",pin:completePin,key:randomUUID()});const completeCookie=completeJoin.cookie!.split(";")[0];let completeView=completeJoin.body;
 for(let groupIndex=0;groupIndex<content.groups.length;groupIndex++){
  const opened=await call("/api/workshop/host",{kind:"act",pin:completePin,key:randomUUID(),revision:completeHost.revision,action:{kind:"open_practice"}},teacher.cookie);assert.equal(opened.status,200);completeHost=opened.body;
  completeView=(await call(`/api/workshop?pin=${completePin}`,undefined,completeCookie)).body;
  for(const groupItem of content.items.filter(i=>i.groupId===content.groups[groupIndex].id)){
   const action=async(a:unknown)=>{const r=await call("/api/workshop",{kind:"act",pin:completePin,key:randomUUID(),revision:completeView.revision,action:a},completeCookie);assert.equal(r.status,200);completeView=r.body;};
   await action({kind:"listen_start",itemId:groupItem.id});await new Promise(r=>setTimeout(r,groupItem.media.durationMs+30));await action({kind:"choose",itemId:groupItem.id,choice:"A"});
   for(const option of ["B","C","D"])await action({kind:"explain",itemId:groupItem.id,option,text:"This option changes the stated information."});
   await action({kind:"next_item",itemId:groupItem.id});
  }
  assert.equal(completeView.groupComplete,true);assert.equal(completeView.current,null);
  const next=await call("/api/workshop/host",{kind:"act",pin:completePin,key:randomUUID(),revision:completeHost.revision,action:{kind:"next_group"}},teacher.cookie);assert.equal(next.status,200);completeHost=next.body;
 }
 assert.equal(completeHost.phase,"finished");assert.equal((await call(`/api/workshop?pin=${completePin}`,undefined,completeCookie)).body.phase,"finished");
 // Historical readers retain their original capability contracts.
 const oldRun=await call("/api/ladder",{kind:"start",key:randomUUID(),activityId:"three-papers-one-thread"},teacher.cookie);assert.equal(oldRun.status,200);const oldId=oldRun.body.view.runId;const ready=await call("/api/ladder",{kind:"ready",runId:oldId},teacher.cookie);assert.equal(ready.status,200);assert.equal(ready.body.view.items.length,4);assert.equal((await call(`/api/ladder?runId=${oldId}`,undefined,teacher.cookie)).body.view.runId,oldId);
 const deck=(await pool.query("INSERT INTO game_deck(version,title,rounds,source) VALUES($1,'Local historical fixture',$2,'{}') RETURNING id",[`local-${randomUUID()}`,JSON.stringify([{number:1,audioUrl:"https://media.example.invalid/legacy.mp3",prompt:"Original fixture task",options:["One","Two","Three","Four"],answer:0,cue:{en:"Compare the actions.",id:"Bandingkan tindakan."},explanation:{en:"The action is explicit.",id:"Tindakannya jelas."}}])])).rows[0];assert(deck.id);
 const oldGame=await call("/api/game",{kind:"create"},teacher.cookie);assert.equal(oldGame.status,200);const oldView=await call(`/api/game?pin=${oldGame.body.pin}`,undefined,teacher.cookie);assert.equal(oldView.body.contractVersion,"classroom-game.v1");assert.equal(oldView.body.phase,"lobby");
 assert(contentId);console.log("PASS: local PostgreSQL/API membership/auth/ownership/CSRF, original retry acknowledgements and conflicts, six-way listen/advance races, pinned clip+12-second timing, both answer/relisten branches, immutable three-explanation saves, operational counts, group release/history, deadline/expiry/close, refresh, privacy, all thirty synthetic items/group finishes and historical ladder/classroom readers.");
}finally{for(const hash of hashes)await pool.query("UPDATE app_session SET expires_at=now() WHERE token_hash=$1",[hash]);await pool.end();}
