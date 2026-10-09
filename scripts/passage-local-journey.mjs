/* Guarded local PostgreSQL/API acceptance. Never targets a live host. */
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import pg from "/app/node_modules/pg/lib/index.js";
assert.equal(process.env.ALLOW_LOCAL_PASSAGE_JOURNEY, "true");
assert.equal(process.env.FEEDBACK_PROVIDER, "template");
assert.match(process.env.DATABASE_URL, /@db:5432\/listening$/);
const origin = "http://rehearse-lfl021-accept:3000";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const hashes = [];
try {
  async function actor(role) {
    const user = (await pool.query("INSERT INTO app_user(email,display_name,password_hash,role) VALUES($1,'Local passage fixture','fixture-no-login',$2) RETURNING id", [`passage-${randomUUID()}@test.invalid`, role])).rows[0];
    const token = randomBytes(32).toString("base64url"), hash = createHash("sha256").update(token).digest("hex");
    await pool.query("INSERT INTO app_session(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '15 minutes')", [user.id, hash]);
    hashes.push(hash); return { id: user.id, cookie: `rehearse_session=${token}` };
  }
  const learner = await actor("learner"), teacher = await actor("teacher"), stranger = await actor("learner"), foreignTeacher = await actor("teacher");
  async function call(path, body, auth = learner) {
    const r = await fetch(origin + path, { method: body ? "POST" : "GET", headers: { origin, "content-type": "application/json", ...(auth ? { cookie: auth.cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: r.status, body: await r.json() };
  }
  const catalogue = await call("/api/ladder/catalogue?format=passage-v1");
  assert.equal(catalogue.status, 200);
  assert.equal(catalogue.body.contractVersion, "ladder-catalogue.v2");
  const older = await call("/api/ladder/catalogue");
  assert.equal(older.body.contractVersion, "ladder-catalogue.v1");
  assert.deepEqual(older.body.activities.map((activity) => activity.questionCount), [4, 4]);
  assert.equal((await call("/api/ladder/catalogue?format=unsupported")).status, 400);
  assert.deepEqual(catalogue.body.activities.map((a) => [a.id, a.passageCount, a.questionCount]), [["conversation-journey", 2, 8], ["talk-journey", 3, 12]]);
  assert.equal((await call("/api/ladder/catalogue?format=passage-v1", undefined, null)).status, 401);
  assert.equal((await call("/api/ladder/host", { kind: "create", key: randomUUID() })).status, 403);
  for (const [activityId, sizes, keys, repairs] of [
    ["conversation-journey", [4, 4], [0, 3, 1, 2, 2, 0, 1, 2], [2, 1, 0, 0, 1, 2, 0, 1]],
    ["talk-journey", [5, 3, 4], [1, 3, 3, 0, 2, 3, 1, 3, 0, 1, 2, 3], [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2]],
  ]) {
    const sessionKey = randomUUID();
    const created = await call("/api/ladder/host", { kind: "create", key: sessionKey, activityId }, teacher);
    assert.equal(created.status, 200); assert.equal(created.body.passages.length, sizes.length);
    const pin = created.body.pin;
    assert.equal((await call(`/api/ladder/host?pin=${pin}`, undefined, foreignTeacher)).status, 404);
    assert.equal((await call("/api/ladder/host", { kind: "create", key: sessionKey, activityId: "missing" }, teacher)).status, 409);
    const runId = randomUUID();
    let response = await call("/api/ladder", { kind: "start", key: runId, pin });
    assert.equal(response.status, 200); let v = response.body.view;
    assert.equal(v.activityId, activityId); assert.equal(v.contractVersion, "listening-ladder.v4");
    assert.equal((await call(`/api/ladder?runId=${runId}`, undefined, stranger)).status, 404);
    const run = (await pool.query("SELECT passage_versions_json FROM ladder_run WHERE id=$1", [runId])).rows[0];
    const session = (await pool.query("SELECT passage_versions_json FROM ladder_session WHERE pin=$1", [pin])).rows[0];
    assert.deepEqual(run.passage_versions_json, session.passage_versions_json);
    assert.equal(run.passage_versions_json.length, sizes.length);
    async function act(action, expected = 200) {
      const r = await call("/api/ladder", { kind: "act", key: randomUUID(), runId, revision: v.revision, action });
      assert.equal(r.status, expected); if (r.status === 200) v = r.body.view; return r;
    }
    await act({ kind: "continue" }, 409);
    assert(!/repairKey|transcript|reasons|audioHash|contefl|1163|\"first\"/i.test(JSON.stringify(v)));
    const urls = new Set(); let offset = 0;
    for (let passage = 0; passage < sizes.length; passage++) {
      assert.equal(v.passage.index, passage); assert.equal(v.passage.fromItem, offset);
      assert.equal(v.journey.map.nodeCount, sizes[passage] * 3 + 2);
      assert.equal(v.journey.map.connections.length, sizes[passage] * 2);
      urls.add(v.audioUrl);
      const audio = await fetch(origin + v.audioUrl, { headers: { cookie: learner.cookie, range: "bytes=0-1023" } });
      assert.equal(audio.status, 206); assert.equal((await audio.arrayBuffer()).byteLength, 1024);
      if (passage > 0) await act({ kind: "repair", item: offset - 1, choice: 0, explanation: "Closed task" }, 409);
      const before = structuredClone(v.state.choices);
      for (let i = offset; i < offset + sizes[passage]; i++) await act({ kind: "choice", item: i, choice: i === offset ? (keys[i] + 1) % 4 : keys[i] });
      await act({ kind: "continue" }, 409);
      await act({ kind: "help" });
      let host = (await call(`/api/ladder/host?pin=${pin}`, undefined, teacher)).body;
      assert.equal(host.players[0].passageIndex, passage); assert.equal(host.players[0].needsHelp, true); assert.equal(host.players[0].finished, false);
      if (passage === 1) {
        const r = await call("/api/ladder/host", { kind: "assist", pin, runId, key: randomUUID(), reason: "Discussed this span together." }, teacher);
        assert.equal(r.status, 200); v = (await call(`/api/ladder?runId=${runId}`)).body.view;
      } else {
        await act({ kind: "repair", item: offset, choice: (repairs[offset] + 1) % 3, explanation: "I compared the ideas in this recording." });
        const event = v.latestEventId;
        assert.equal((await call("/api/ladder/feedback", { eventId: event })).status, 200);
        await act({ kind: "support", item: offset, explanation: "I used the guide to explain the connection." });
      }
      assert.deepEqual(v.state.choices.slice(0, offset), before);
      assert.equal(v.position, sizes[passage] * 3 + 1);
      if (passage < sizes.length - 1) {
        assert.equal(v.passage.checkpoint, true);
        const checkpoint = (await call(`/api/ladder?runId=${runId}`)).body.view;
        assert.equal(checkpoint.passage.checkpoint, true);
        const retry = { kind: "act", key: randomUUID(), runId, revision: v.revision, action: { kind: "continue" } };
        const races = await Promise.all(Array.from({ length: 6 }, () => call("/api/ladder", retry)));
        assert(races.every((r) => r.status === 200));
        v = races[0].body.view; assert.equal(v.passage.index, passage + 1); assert.equal(v.position, 0);
        assert.equal((await pool.query("SELECT count(*)::int n FROM ladder_event WHERE run_id=$1 AND request_key=$2", [runId, retry.key])).rows[0].n, 1);
      } else {
        assert.equal(v.passage.checkpoint, false);
        await act({ kind: "continue" }, 409);
        host = (await call(`/api/ladder/host?pin=${pin}`, undefined, teacher)).body;
        assert.equal(host.players[0].finished, true);
      }
      offset += sizes[passage];
    }
    assert.equal(urls.size, sizes.length); assert.equal(v.state.choices.length, keys.length);
    // A later import pointer must not retarget a saved recording, including future pins.
    const changed = (await pool.query("SELECT a.id,a.current_version,av.id version_id FROM activity a JOIN activity_version av ON av.activity_id=a.id AND av.version_number=a.current_version WHERE av.id=$1", [run.passage_versions_json.at(-1)])).rows[0];
    await pool.query("UPDATE activity SET current_version=999999 WHERE id=$1", [changed.id]);
    try {
      assert.equal((await call(`/api/ladder?runId=${runId}`)).status, 200);
      const late = await call("/api/ladder", { kind: "start", key: randomUUID(), pin }, stranger);
      assert.equal(late.status, 200); assert.equal(late.body.view.passage.index, 0);
      assert(!(await call("/api/ladder/catalogue?format=passage-v1")).body.activities.some((a) => a.id === activityId));
    } finally { await pool.query("UPDATE activity SET current_version=$2 WHERE id=$1", [changed.id, changed.current_version]); }
    await call("/api/ladder/host", { kind: "close", pin }, teacher);
    assert.equal((await call(`/api/ladder?runId=${runId}`)).body.view.sessionClosed, true);
  }
  // Mounted pre-v4 clients send no activity ID and must keep their old four-item shape.
  for (const [path, kind, auth] of [["/api/ladder", "start", learner], ["/api/ladder/host", "create", teacher]]) {
    const response = await call(path, { kind, key: randomUUID() }, auth);
    assert.equal(response.status, 200);
    const v = kind === "start" ? response.body.view : response.body;
    assert.equal(v.activityId, "three-papers-one-thread");
    if (kind === "start") assert.equal(v.items.length, 4);
  }
  for (const activityId of ["three-papers-one-thread", "ocean-currents-in-motion"]) {
    const r = await call("/api/ladder", { kind: "start", key: randomUUID(), activityId });
    assert.equal(r.status, 200); assert.equal(r.body.view.items.length, 4); assert.equal(r.body.view.journey.map.version, "chapter-route.v1");
    assert.equal((await call("/api/ladder", { kind: "act", key: randomUUID(), runId: r.body.view.runId, revision: 0, action: { kind: "continue" } })).status, 400);
  }
  console.log("PASS: both complete games, five recording URLs/ranges, passage-scoped repair/support/teacher assistance, checkpoint retry races, immutable media pins and late joins, ownership/role guards, final completion and original single-recording readers.");
} finally {
  for (const hash of hashes) await pool.query("UPDATE app_session SET expires_at=now() WHERE token_hash=$1", [hash]);
  await pool.end();
}
