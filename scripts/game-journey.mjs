import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import pg from "pg";
if (process.env.ALLOW_GAME_JOURNEY !== "true")
  throw new Error("Explicit test gate required");
const base = process.env.JOURNEY_ORIGIN ?? "http://localhost:3017";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const user = await pool.query("SELECT id FROM app_user WHERE email=$1", [
  process.env.JOURNEY_TEACHER_EMAIL ?? "teacher@test.invalid",
]);
assert.equal(user.rowCount, 1);
const token = randomBytes(32).toString("hex");
await pool.query(
  "INSERT INTO app_session(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '10 minutes')",
  [user.rows[0].id, createHash("sha256").update(token).digest("hex")],
);
const teacher = `rehearse_session=${token}`;
let student = "";
let pin;
async function post(body, cookie = teacher, expected = 200, origin = base) {
  const r = await fetch(base + "/api/game", {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(body),
  });
  assert.equal(r.status, expected, `POST ${body.kind}`);
  const json = await r.json();
  return { json, cookie: r.headers.get("set-cookie")?.split(";")[0] };
}
async function view(cookie = student, expected = 200) {
  const r = await fetch(base + "/api/game?pin=" + pin, {
    headers: { Cookie: cookie },
  });
  assert.equal(r.status, expected);
  return r.json();
}
try {
  await post({ kind: "create" }, "", 403);
  await post({ kind: "create" }, teacher, 403, "https://other.invalid");
  pin = (await post({ kind: "create" })).json.pin;
  await view("", 401);
  student = (await post({ kind: "join", pin }, "")).cookie;
  assert.ok(student);
  let s = await view();
  assert.equal(s.players, 1);
  assert.equal(s.phase, "lobby");
  assert.ok(!("answer" in s.round));
  await post({ kind: "join", pin }, student);
  assert.equal((await view()).players, 1);
  await post({ kind: "advance", pin, revision: 0 }, student, 403);
  const parallel = await Promise.all(
    [0, 1].map(() =>
      fetch(base + "/api/game", {
        method: "POST",
        headers: {
          Origin: base,
          "Content-Type": "application/json",
          Cookie: teacher,
        },
        body: JSON.stringify({ kind: "advance", pin, revision: 0 }),
      }),
    ),
  );
  assert.deepEqual(parallel.map((r) => r.status).sort(), [200, 409]);
  s = await view();
  assert.equal(s.phase, "listen");
  assert.ok(!("options" in s.round));
  assert.ok(!("audioUrl" in s.round));
  assert.ok((await view(teacher)).round.audioUrl);
  await post({ kind: "answer", pin, revision: 1, choice: 2 }, student, 409);
  await post({ kind: "advance", pin, revision: 1 });
  await post(
    { kind: "cloud", pin, revision: 2, term: "uncertain meaning" },
    student,
  );
  await post({ kind: "cloud", pin, revision: 2, term: "overwrite" }, student);
  s = await view();
  assert.equal(s.cloud.length, 0);
  assert.equal(s.cloudSubmitted, true);
  let h = await view(teacher);
  assert.equal(h.pending.length, 1);
  assert.equal(h.pending[0].term, "uncertain meaning");
  await post(
    {
      kind: "moderate",
      pin,
      revision: 2,
      cloudId: h.pending[0].id,
      visible: true,
    },
    student,
    403,
  );
  await post({
    kind: "moderate",
    pin,
    revision: 2,
    cloudId: h.pending[0].id,
    visible: true,
  });
  assert.equal((await view()).cloud[0].term, "uncertain meaning");
  const second = (await post({ kind: "join", pin }, "")).cookie;
  await post(
    { kind: "cloud", pin, revision: 2, term: "uncertain meaning" },
    second,
  );
  h = await view(teacher);
  await post({
    kind: "moderate",
    pin,
    revision: 2,
    cloudId: h.pending[0].id,
    visible: true,
  });
  const visible = (await view()).cloud;
  assert.equal(visible.length, 1);
  assert.equal(visible[0].count, 2);
  await post({
    kind: "moderate",
    pin,
    revision: 2,
    cloudId: visible[0].id,
    visible: false,
  });
  assert.equal((await view()).cloud.length, 0);
  await post({ kind: "advance", pin, revision: 2, duration: 30 });
  s = await view();
  assert.equal(s.phase, "quiz");
  assert.equal(s.round.options.length, 4);
  assert.ok(!("answer" in s.round));
  await post({ kind: "answer", pin, revision: 3, choice: 2 }, student);
  await post({ kind: "answer", pin, revision: 3, choice: 0 }, student);
  assert.equal((await view()).answered, true);
  assert.equal((await view()).leaderboard.length, 0);
  await post({ kind: "advance", pin, revision: 3 });
  s = await view();
  assert.equal(s.phase, "review");
  assert.equal(s.round.answer, 2);
  assert.ok(s.round.cue.id);
  assert.equal(s.leaderboard.length, 2);
  assert.ok(s.leaderboard[0].points >= 1000 && s.leaderboard[0].points <= 1200);
  await post({ kind: "advance", pin, revision: 4 });
  s = await view();
  assert.equal(s.roundIndex, 1);
  assert.equal(s.phase, "listen");
  assert.equal(s.answered, false);
  assert.equal(s.cloudSubmitted, false);
  assert.ok(!("answer" in s.round));
  assert.equal(s.leaderboard.length, 0);
  await post({ kind: "advance", pin, revision: 5 });
  await post({ kind: "advance", pin, revision: 6, duration: 15 });
  await pool.query(
    "UPDATE game_room SET deadline=now()-interval '1 second' WHERE pin=$1",
    [pin],
  );
  await post({ kind: "answer", pin, revision: 7, choice: 2 }, student, 409);
  await post({ kind: "finish", pin, revision: 7 });
  assert.equal((await view()).phase, "finished");
  await post({ kind: "join", pin }, "", 409);
  console.log(
    "PASS: role/origin guards, hidden answers, CAS transition, immutable cloud/answer, moderation, isolated bounded points, next-round reset, server deadline, finish",
  );
} finally {
  await pool.query("DELETE FROM app_session WHERE token_hash=$1", [
    createHash("sha256").update(token).digest("hex"),
  ]);
  await pool.end();
}
