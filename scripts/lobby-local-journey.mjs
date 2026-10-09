/* Guarded local PostgreSQL/API acceptance; never targets a live host. */
import assert from 'node:assert/strict';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import pg from '/app/node_modules/pg/lib/index.js';
assert.equal(process.env.ALLOW_LOCAL_LOBBY_JOURNEY,'true');
assert.equal(process.env.DATABASE_URL,'postgresql://listening:listening@db:5432/listening');
const origin='http://rehearse-lfl022-accept:3000',pool=new pg.Pool({connectionString:process.env.DATABASE_URL}),hashes=[];
async function actor(role){const {rows:[u]}=await pool.query("INSERT INTO app_user(email,display_name,password_hash,role) VALUES($1,'Lobby fixture','fixture-no-login',$2) RETURNING id",[`lobby-${randomUUID()}@test.invalid`,role]);const token=randomBytes(32).toString('base64url'),hash=createHash('sha256').update(token).digest('hex');hashes.push(hash);await pool.query("INSERT INTO app_session(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '15 minutes')",[u.id,hash]);return{...u,cookie:`rehearse_session=${token}`};}
const learner=await actor('learner'),teacher=await actor('teacher'),stranger=await actor('learner'),other=await actor('teacher');
async function call(path,body,auth=learner){const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{origin,'content-type':'application/json',...(auth?{cookie:auth.cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});return{status:r.status,body:await r.json()};}
try{
 const created=await call('/api/ladder/host',{kind:'create',key:randomUUID(),activityId:'conversation-journey'},teacher);assert.equal(created.status,200);const pin=created.body.pin;assert.equal(created.body.lobby.started,false);
 const runId=randomUUID();let r=await call('/api/ladder',{kind:'start',key:runId,pin});assert.equal(r.status,200);assert.equal(r.body.view.lobby.phase,'setup');assert.equal(r.body.view.audioUrl,'');assert.deepEqual(r.body.view.items,[]);
 assert.equal((await call('/api/ladder',{kind:'act',runId,revision:0,key:randomUUID(),action:{kind:'choice',item:0,choice:0}})).body.error,'setup_required');
 assert.equal((await call('/api/ladder/avatar',{runId,avatarId:'fern',paletteId:'violet',alias:'Sunny Learner'})).status,200);
 let h=(await call(`/api/ladder/host?pin=${pin}`,null,teacher)).body;assert.equal(h.players.length,1);assert.equal(h.players[0].alias,'Sunny Learner');assert.equal(h.players[0].ready,false);
 assert.equal((await call('/api/ladder/avatar',{runId,avatarId:'fern',alias:'<script>'})).status,400);
 assert.equal((await call('/api/ladder/avatar',{runId,avatarId:'fern'},stranger)).status,404);
 assert.equal((await call('/api/ladder',{kind:'ready',runId},stranger)).status,404);
 const ready=await Promise.all(Array.from({length:6},()=>call('/api/ladder',{kind:'ready',runId})));assert(ready.every(r=>r.status===200&&r.body.view.lobby.phase==='waiting'));
 assert.equal((await call('/api/ladder/avatar',{runId,avatarId:'moss'})).body.error,'profile_locked');
 assert.equal((await call('/api/ladder',{kind:'act',runId,revision:0,key:randomUUID(),action:{kind:'choice',item:0,choice:0}})).body.error,'waiting_for_teacher');
 assert.equal((await call('/api/ladder/host',{kind:'begin',pin})).status,403);assert.equal((await call('/api/ladder/host',{kind:'begin',pin},other)).status,409);
 const starts=await Promise.all(Array.from({length:6},()=>call('/api/ladder/host',{kind:'begin',pin},teacher)));assert(starts.every(r=>r.status===200&&r.body.lobby.started));
 r=await call(`/api/ladder?runId=${runId}`);assert.equal(r.body.view.lobby.phase,'playing');assert.equal(r.body.view.items.length,8);assert(r.body.view.audioUrl);
 const otherId=randomUUID();await call('/api/ladder',{kind:'start',key:otherId,activityId:'talk-journey'});await call('/api/ladder/avatar',{runId:otherId,avatarId:'moss',paletteId:'coral',alias:'Different Game'});assert.equal((await call(`/api/ladder?runId=${runId}`)).body.view.avatarId,'fern');
 const lateId=randomUUID();assert.equal((await call('/api/ladder',{kind:'start',key:lateId,pin},stranger)).body.view.lobby.phase,'setup');assert.equal((await call('/api/ladder',{kind:'ready',runId:lateId},stranger)).body.view.lobby.phase,'playing');
 let v=r.body.view;const keys=[0,3,1,2,2,0,1,2];for(let i=0;i<8;i++){if(i===4){const c=await call('/api/ladder',{kind:'act',runId,revision:v.revision,key:randomUUID(),action:{kind:'continue'}});assert.equal(c.status,200);v=c.body.view;}const a=await call('/api/ladder',{kind:'act',runId,revision:v.revision,key:randomUUID(),action:{kind:'choice',item:i,choice:keys[i]}});assert.equal(a.status,200);v=a.body.view;}
 h=(await call(`/api/ladder/host?pin=${pin}`,null,teacher)).body;assert.equal(h.players.find(p=>p.runId===runId).finished,true);
 const recap=await fetch(`${origin}/dashboard?completed=${runId}`,{headers:{cookie:learner.cookie}});assert.equal(recap.status,200);assert((await recap.text()).includes('Your choices and replay work are saved'));
 const foreign=await fetch(`${origin}/dashboard?completed=${runId}`,{headers:{cookie:stranger.cookie}});assert(!(await foreign.text()).includes('Your choices and replay work are saved'));
 await call('/api/ladder/host',{kind:'close',pin},teacher);assert.equal((await call('/api/ladder/host',{kind:'begin',pin},teacher)).status,409);
 const solo=await call('/api/ladder',{kind:'ready',runId:otherId});assert.equal(solo.body.view.lobby.phase,'playing');assert.equal(solo.body.view.items.length,12);
 console.log('PASS: real PostgreSQL/API teacher-owned lobby release, six concurrent ready/start retries, hidden pre-start media/items, name validation, profile locks and per-run appearance, late joins, full completion recap, ownership and closed-session guards.');
}finally{for(const hash of hashes)await pool.query('UPDATE app_session SET expires_at=now() WHERE token_hash=$1',[hash]);await pool.end();}
