/* Isolated local verification only. Never targets production. */
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import pg from "/app/node_modules/pg/lib/index.js";
const { Pool } = pg;

async function main() {
  assert.equal(process.env.FEEDBACK_PROVIDER, "template");
  assert.equal(process.env.LADDER_START_VERSION, "original");
  assert.equal(process.env.ALLOW_LOCAL_LFL020_JOURNEY, "true");
  assert.match(process.env.DATABASE_URL, /@db:5432\/listening$/);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const baseUrl = process.env.LFL020_BASE_URL ?? "http://app:3000";
  const sessionHashes = [];
  try {
    const users = (await pool.query("SELECT id,role FROM app_user WHERE role IN ('learner','teacher') ORDER BY created_at")).rows;
    const learner = users.find((user) => user.role === "learner");
    const teacher = users.find((user) => user.role === "teacher");
    assert(learner && teacher);
    const otherTeacher = (await pool.query("INSERT INTO app_user(email,display_name,password_hash,role) VALUES($1,'LFL020 fixture','local-fixture','teacher') RETURNING id,role", [`lfl020-${randomUUID()}@test.invalid`])).rows[0];
    async function cookie(user) {
      const token = randomBytes(32).toString("base64url");
      const hash = createHash("sha256").update(token).digest("hex");
      await pool.query("INSERT INTO app_session(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '15 minutes')", [user.id, hash]);
      sessionHashes.push(hash);
      return `rehearse_session=${token}`;
    }
    const learnerCookie = await cookie(learner);
    const teacherCookie = await cookie(teacher);
    const foreignTeacherCookie = await cookie(otherTeacher);
    async function call(path, body, cookie = learnerCookie) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: body ? "POST" : "GET",
        headers: { origin: baseUrl, host: new URL(baseUrl).host, "content-type": "application/json", ...(cookie ? { cookie } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, body: await response.json() };
    }

    const catalogue = await call("/api/ladder/catalogue", null);
    assert.equal(catalogue.status, 200);
    assert.deepEqual(catalogue.body.activities.map((item) => item.id).sort(), ["ocean-currents-in-motion", "three-papers-one-thread"]);
    assert(!/transcript|answer|source|package|questionRange/i.test(JSON.stringify(catalogue.body)));

    for (const host of [false, true]) {
      const key = randomUUID();
      const path = host ? "/api/ladder/host" : "/api/ladder";
      const kind = host ? "create" : "start";
      const actorCookie = host ? teacherCookie : learnerCookie;
      const raced = await Promise.all([
        call(path, { kind, key, activityId: "three-papers-one-thread" }, actorCookie),
        call(path, { kind, key, activityId: "ocean-currents-in-motion" }, actorCookie),
      ]);
      assert.deepEqual(raced.map((result) => result.status).sort(), [200, 409]);
    }

    const original = await call("/api/ladder", { kind: "start", key: randomUUID(), activityId: "three-papers-one-thread" });
    assert.equal(original.status, 200, JSON.stringify(original.body));
    assert.equal(original.body.view.items[0].options.length, 4);
    assert.equal(original.body.view.journey.map.version, "chapter-route.v1");
    assert(!/transcript|reasons|repairKey|\"first\"/i.test(JSON.stringify(original.body)));

    let ocean = (await call("/api/ladder", { kind: "start", key: randomUUID(), activityId: "ocean-currents-in-motion" })).body.view;
    assert.equal(ocean.activityId, "ocean-currents-in-motion");
    const dKey = randomUUID();
    const dBody = { kind: "act", runId: ocean.runId, revision: 0, key: dKey, action: { kind: "choice", item: 0, choice: 3 } };
    const firstD = await call("/api/ladder", dBody);
    assert.equal(firstD.status, 200);
    ocean = firstD.body.view;
    assert.equal(ocean.journey.lastTransition.eventId, ocean.latestEventId ?? ocean.journey.lastTransition.eventId);
    assert.deepEqual(ocean.journey.lastTransition.steps.map((step) => step.kind), ["walk", "snake"]);
    const retried = await call("/api/ladder", dBody);
    assert.equal(retried.status, 200);
    assert.deepEqual(retried.body.view.journey.lastTransition, ocean.journey.lastTransition);
    assert.equal((await pool.query("SELECT count(*)::int n FROM ladder_event WHERE run_id=$1", [ocean.runId])).rows[0].n, 1);
    for (let item = 1; item < 4; item++) {
      const response = await call("/api/ladder", { kind: "act", runId: ocean.runId, revision: ocean.revision, key: randomUUID(), action: { kind: "choice", item, choice: null } });
      assert.equal(response.status, 200);
      ocean = response.body.view;
    }
    const repaired = await call("/api/ladder", { kind: "act", runId: ocean.runId, revision: ocean.revision, key: randomUUID(), action: { kind: "repair", item: 0, choice: 0, explanation: "I checked what connects the examples." } });
    assert.equal(repaired.status, 200);
    ocean = repaired.body.view;
    const invalidRepair = await call("/api/ladder", { kind: "act", runId: ocean.runId, revision: ocean.revision, key: randomUUID(), action: { kind: "repair", item: 0, choice: 3, explanation: "I checked the relationship." } });
    assert.equal(invalidRepair.status, 400);

    const sessionKey = randomUUID();
    const created = await call("/api/ladder/host", { kind: "create", key: sessionKey, activityId: "ocean-currents-in-motion" }, teacherCookie);
    assert.equal(created.status, 200);
    assert.equal(created.body.activityId, "ocean-currents-in-motion");
    assert.equal((await call("/api/ladder/host", { kind: "create", key: sessionKey, activityId: "three-papers-one-thread" }, teacherCookie)).status, 409);
    assert.equal((await call(`/api/ladder/host?pin=${created.body.pin}`, null, foreignTeacherCookie)).status, 404);
    assert.equal((await call("/api/ladder", { kind: "start", key: randomUUID(), pin: created.body.pin, activityId: "three-papers-one-thread" })).status, 409);
    const joined = await call("/api/ladder", { kind: "start", key: randomUUID(), pin: created.body.pin });
    assert.equal(joined.status, 200);
    assert.equal(joined.body.view.activityId, "ocean-currents-in-motion");
    await call("/api/ladder/host", { kind: "close", pin: created.body.pin }, teacherCookie);
    assert.equal((await call("/api/ladder", { kind: "act", runId: joined.body.view.runId, revision: 0, key: randomUUID(), action: { kind: "choice", item: 0, choice: 0 } })).status, 409);

    // Move latest media away, then prove an existing run still serves its own bytes.
    const pinned = (await pool.query("SELECT activity_version_id FROM ladder_run WHERE id=$1", [original.body.view.runId])).rows[0].activity_version_id;
    const stored = (await pool.query("SELECT activity_id,version_number FROM activity_version WHERE id=$1", [pinned])).rows[0];
    const latest = (await pool.query("SELECT current_version FROM activity WHERE id=$1", [stored.activity_id])).rows[0].current_version;
    const nextVersion = (await pool.query("SELECT max(version_number)+1 AS n FROM activity_version WHERE activity_id=$1", [stored.activity_id])).rows[0].n;
    await pool.query(`INSERT INTO activity_version SELECT (jsonb_populate_record(NULL::activity_version,to_jsonb(av)||jsonb_build_object('id',$2::text,'version_number',$3::int,'media_storage_key','fixture-current-missing.mp3'))).* FROM activity_version av WHERE id=$1`, [pinned, randomUUID(), nextVersion]);
    try {
      await pool.query("UPDATE activity SET current_version=$2 WHERE id=$1", [stored.activity_id, nextVersion]);
      const resumed = await call(`/api/ladder?runId=${original.body.view.runId}`, null);
      assert.equal(resumed.status, 200);
      assert.equal(new URL(resumed.body.view.audioUrl, baseUrl).searchParams.get("version"), pinned);
      const bytes = await fetch(new URL(resumed.body.view.audioUrl, baseUrl), { headers: { cookie: learnerCookie } });
      assert.equal(bytes.status, 200);
      assert.equal(createHash("sha256").update(Buffer.from(await bytes.arrayBuffer())).digest("hex"), "d728ede236948a4877dc38926114abdad19ff358dc35414f9be107ffbeed42c2");
      const note = (await pool.query("SELECT id FROM ladder_event WHERE run_id=$1 AND action_json->>'kind'='repair' LIMIT 1", [ocean.runId])).rows[0];
      if (note) assert.equal((await call("/api/ladder/feedback", { eventId: note.id })).status, 200);
    } finally {
      await pool.query("UPDATE activity SET current_version=$2 WHERE id=$1", [stored.activity_id, latest]);
    }

    const activity = (await pool.query("SELECT a.id,av.id AS version_id FROM activity a JOIN activity_version av ON av.activity_id=a.id AND av.version_number=a.current_version WHERE a.slug='three-papers-one-thread'")).rows[0];
    const legacyId = randomUUID();
    await pool.query("INSERT INTO ladder_run(id,learner_id,activity_version_id,content_version,session_id,alias,state_json,activity_id,mechanics_version) VALUES($1,$2,$3,'three-papers-ladder.2026-10-06.v1',NULL,'Legacy Lynx',$4,'three-papers-one-thread','legacy-linear.v1')", [legacyId, learner.id, activity.version_id, JSON.stringify({ choices: [], helpRequested: false })]);
    const legacy = await call(`/api/ladder?runId=${legacyId}`, null);
    assert.equal(legacy.status, 200);
    assert.equal(legacy.body.view.items[0].options.length, 3);
    assert.equal(legacy.body.view.journey, undefined);
    assert.equal((await call("/api/ladder", { kind: "act", runId: legacyId, revision: 0, key: randomUUID(), action: { kind: "choice", item: 0, choice: 3 } })).status, 400);

    console.log("PASS: two published dialogues, legacy/new version resolution, D cardinality, saved idempotent movement, activity/session pinning, closed and teacher ownership boundaries, and no public source/key transcript leakage");
  } finally {
    for (const hash of sessionHashes) await pool.query("UPDATE app_session SET expires_at=now() WHERE token_hash=$1", [hash]);
    await pool.end();
  }
}
main().catch((error) => {
  console.error("LFL-020 local journey failed without printing response content.");
  console.error(error.name, error.code ?? "", String(error.stack).split("\n").filter((line) => /^\s+at /.test(line)).slice(0, 3).join("\n"));
  process.exitCode = 1;
});
