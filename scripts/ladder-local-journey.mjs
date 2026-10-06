/* Explicitly local verification only. Never creates production sessions. */
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import pg from "/app/node_modules/pg/lib/index.js";
const { Pool } = pg;
async function main() {
  assert.equal(process.env.FEEDBACK_PROVIDER, "template");
  assert.match(process.env.DATABASE_URL, /@db:5432\/listening$/);
  assert.equal(process.env.ALLOW_LOCAL_LADDER_JOURNEY, "true");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const hashes = [];
  try {
    const users = (
      await pool.query(
        "SELECT id,role FROM app_user WHERE role IN ('learner','teacher','admin') ORDER BY created_at",
      )
    ).rows;
    const learner = users.find((x) => x.role === "learner"),
      teacher = users.find((x) => x.role === "teacher"),
      admin = users.find((x) => x.role === "admin");
    assert(learner && teacher && admin);
    async function fixture(role) {
      return (
        await pool.query(
          "INSERT INTO app_user(email,display_name,password_hash,role) VALUES($1,'Local game fixture','local-fixture-no-login',$2) RETURNING id,role",
          [`ladder-${randomUUID()}@test.invalid`, role],
        )
      ).rows[0];
    }
    const other = await fixture("learner"),
      otherTeacher = await fixture("teacher");
    async function cookie(user) {
      const token = randomBytes(32).toString("base64url"),
        hash = createHash("sha256").update(token).digest("hex");
      await pool.query(
        "INSERT INTO app_session(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '10 minutes')",
        [user.id, hash],
      );
      hashes.push(hash);
      return `rehearse_session=${token}`;
    }
    const owned = await cookie(learner),
      host = await cookie(teacher),
      foreign = await cookie(other),
      foreignHost = await cookie(otherTeacher),
      privileged = await cookie(admin);
    async function call(path, body, auth = owned) {
      const r = await fetch(`http://127.0.0.1:3000${path}`, {
        method: body ? "POST" : "GET",
        headers: {
          origin: "http://127.0.0.1:3000",
          "content-type": "application/json",
          ...(auth ? { cookie: auth } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return {
        status: r.status,
        body: await r.json(),
        cache: r.headers.get("cache-control"),
      };
    }
    assert.equal((await call("/api/ladder", null, "")).status, 401);
    assert.equal(
      (
        await call(
          "/api/ladder/host",
          { kind: "create", key: randomUUID() },
          owned,
        )
      ).status,
      403,
    );
    const sessionKey = randomUUID();
    const created = await call(
      "/api/ladder/host",
      { kind: "create", key: sessionKey },
      host,
    );
    assert.equal(created.status, 200);
    const pin = created.body.pin;
    assert.equal(
      (
        await call(
          "/api/ladder/host",
          { kind: "create", key: sessionKey },
          host,
        )
      ).body.pin,
      pin,
    );
    assert.equal(
      (await call(`/api/ladder/host?pin=${pin}`, null, foreignHost)).status,
      404,
    );
    const startKey = randomUUID();
    const started = await call("/api/ladder", {
      kind: "start",
      key: startKey,
      pin,
    });
    assert.equal(started.status, 200);
    let v = started.body.view;
    const allKeys = new Set(Object.keys(v.items[0]));
    assert(!allKeys.has("first"));
    assert(!allKeys.has("transcript"));
    assert(!v.items[0].repair);
    assert.equal(
      (
        await call(
          "/api/ladder",
          { kind: "start", key: randomUUID(), pin },
          host,
        )
      ).status,
      403,
    );
    const eventKey = randomUUID();
    const body = {
      kind: "act",
      runId: v.runId,
      revision: 0,
      key: eventKey,
      action: { kind: "choice", item: 0, choice: 1 },
    };
    const concurrent = await Promise.all(
      Array.from({ length: 6 }, () => call("/api/ladder", body)),
    );
    assert(concurrent.every((x) => x.status === 200));
    v = concurrent[0].body.view;
    assert.equal(v.revision, 1);
    assert.equal(v.state.choices.length, 1);
    assert.equal(
      (
        await pool.query(
          "SELECT count(*)::int n FROM ladder_event WHERE run_id=$1",
          [v.runId],
        )
      ).rows[0].n,
      1,
    );
    assert.equal(
      (
        await call("/api/ladder", {
          ...body,
          action: { kind: "choice", item: 0, choice: 0 },
        })
      ).status,
      409,
    );
    assert.equal(
      (await call(`/api/ladder?runId=${v.runId}`, null, foreign)).status,
      404,
    );
    assert.equal(
      (
        await call("/api/ladder", {
          ...body,
          key: randomUUID(),
          action: { kind: "choice", item: 1, choice: 1 },
        })
      ).status,
      409,
    );
    async function act(action, key = randomUUID()) {
      const r = await call("/api/ladder", {
        kind: "act",
        runId: v.runId,
        revision: v.revision,
        key,
        action,
      });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      v = r.body.view;
      return r;
    }
    for (const [item, choice] of [
      [1, 2],
      [2, 0],
      [3, 1],
    ])
      await act({ kind: "choice", item, choice });
    assert.equal(v.position, 4);
    assert(!v.items[0].repair.supportedMeaning);
    await act({
      kind: "repair",
      item: 0,
      choice: 0,
      explanation: "A synthetic interpretation to reconsider.",
    });
    assert.equal(v.position, 4);
    assert(v.items[0].repair.supportedMeaning);
    const eventId = v.latestEventId;
    const note = await call("/api/ladder/feedback", { eventId });
    assert.equal(note.status, 200);
    assert(note.body.note.en && note.body.note.id);
    assert.equal(
      (await call("/api/ladder/feedback", { eventId }, foreign)).status,
      404,
    );
    await act({
      kind: "repair",
      item: 0,
      choice: 0,
      explanation: "Another synthetic interpretation.",
    });
    assert.equal(v.position, 4);
    const blocked = await call("/api/ladder", {
      kind: "act",
      runId: v.runId,
      revision: v.revision,
      key: randomUUID(),
      action: {
        kind: "repair",
        item: 0,
        choice: 0,
        explanation: "A third attempt.",
      },
    });
    assert.equal(blocked.status, 409);
    await act({
      kind: "support",
      item: 0,
      explanation: "Several separate assignments keep him busy.",
    });
    assert.equal(v.state.choices[0].outcome, "supported");
    await act({
      kind: "repair",
      item: 1,
      choice: 0,
      explanation: "The professors require separate papers.",
    });
    await act({ kind: "help" });
    assert.equal(
      (await call(`/api/ladder/host?pin=${pin}`, null, host)).body.players[0]
        .needsHelp,
      true,
    );
    const assistKey = randomUUID();
    const assist = {
      kind: "assist",
      pin,
      runId: v.runId,
      key: assistKey,
      reason: "Discussed the organizing suggestion together.",
    };
    assert.equal((await call("/api/ladder/host", assist, host)).status, 200);
    assert.equal((await call("/api/ladder/host", assist, host)).status, 200);
    v = (await call(`/api/ladder?runId=${v.runId}`)).body.view;
    assert.equal(v.state.choices[2].outcome, "supported");
    assert.equal(v.state.choices[3].outcome, "repair");
    await act({
      kind: "repair",
      item: 3,
      choice: 2,
      explanation: "He can develop research he already started.",
    });
    assert.equal(v.position, 12);
    const refreshed = await call(`/api/ladder?runId=${v.runId}`);
    assert.equal(refreshed.body.view.position, 12);
    assert.match(refreshed.cache, /no-store/);
    const board = await call(`/api/ladder/host?pin=${pin}`, null, host);
    assert.equal(board.body.players[0].finished, true);
    assert(!JSON.stringify(board.body).includes("explanation"));
    assert.equal(
      (await call("/api/ladder/host", { kind: "close", pin }, host)).status,
      200,
    );
    assert.equal(
      (
        await call(
          "/api/ladder",
          { kind: "start", key: randomUUID(), pin },
          foreign,
        )
      ).status,
      404,
    );
    const solo = await call(
      "/api/ladder",
      { kind: "start", key: randomUUID() },
      privileged,
    );
    assert.equal(solo.status, 200);
    console.log(
      "PASS: owned classroom, six retries/one event, stale and changed requests, bounded repair, support, feedback ownership, teacher assistance, resume, finish and session closure",
    );
  } finally {
    for (const hash of hashes)
      await pool.query(
        "UPDATE app_session SET expires_at=now() WHERE token_hash=$1",
        [hash],
      );
    await pool.end();
  }
}
main().catch((e) => {
  console.error(
    "Local ladder journey failed; inspect assertions locally without exposing response content.",
  );
  console.error(
    e.name,
    e.code ?? "",
    String(e.stack)
      .split("\n")
      .filter((x) => /^\s+at /.test(x))
      .slice(0, 3)
      .join("\n"),
  );
  if (typeof e.actual === "number")
    console.error("actual", e.actual, "expected", e.expected);
  process.exitCode = 1;
});
