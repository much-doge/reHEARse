/* Explicitly local verification only. Never targets production databases. */
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import pg from "/app/node_modules/pg/lib/index.js";

const { Pool } = pg;

async function main() {
  assert.equal(process.env.FEEDBACK_PROVIDER, "template");
  assert.match(process.env.DATABASE_URL, /@db:5432\/listening$/);
  assert.equal(process.env.ALLOW_LOCAL_AVATAR_JOURNEY, "true");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sessionHashes = [];
  try {
    const users = (
      await pool.query(
        "SELECT id,role FROM app_user WHERE role IN ('learner','teacher') ORDER BY created_at",
      )
    ).rows;
    const teacher = users.find((user) => user.role === "teacher");
    assert(teacher);
    const learner = (
      await pool.query(
        "INSERT INTO app_user(email,display_name,password_hash,role) VALUES($1,'Avatar owner fixture','local-fixture-no-login','learner') RETURNING id,role",
        [`avatar-owner-${randomUUID()}@test.invalid`],
      )
    ).rows[0];
    const foreign = (
      await pool.query(
        "INSERT INTO app_user(email,display_name,password_hash,role) VALUES($1,'Avatar fixture','local-fixture-no-login','learner') RETURNING id,role",
        [`avatar-${randomUUID()}@test.invalid`],
      )
    ).rows[0];

    async function cookie(user) {
      const token = randomBytes(32).toString("base64url");
      const hash = createHash("sha256").update(token).digest("hex");
      await pool.query(
        "INSERT INTO app_session(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '10 minutes')",
        [user.id, hash],
      );
      sessionHashes.push(hash);
      return `rehearse_session=${token}`;
    }
    const ownedCookie = await cookie(learner);
    const teacherCookie = await cookie(teacher);
    const foreignCookie = await cookie(foreign);

    async function call(path, body, auth = ownedCookie) {
      const response = await fetch(`http://127.0.0.1:3000${path}`, {
        method: body ? "POST" : "GET",
        headers: {
          origin: "http://127.0.0.1:3000",
          "content-type": "application/json",
          ...(auth ? { cookie: auth } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return {
        status: response.status,
        body: await response.json(),
        cache: response.headers.get("cache-control"),
      };
    }

    const session = await call(
      "/api/ladder/host",
      { kind: "create", key: randomUUID() },
      teacherCookie,
    );
    assert.equal(session.status, 200);
    const started = await call("/api/ladder", {
      kind: "start",
      key: randomUUID(),
      pin: session.body.pin,
    });
    assert.equal(started.status, 200);
    const initial = started.body.view;
    assert.equal(initial.contractVersion, "listening-ladder.v2");
    assert.equal(typeof initial.avatarId, "string");
    const firstAvatar = initial.avatarId === "fern" ? "moss" : "fern";

    assert.equal(
      (
        await call(
          "/api/ladder/avatar",
          { runId: initial.runId, avatarId: "fern" },
          "",
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await call("/api/ladder/avatar", {
          runId: initial.runId,
          avatarId: "../../secret",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await call(
          "/api/ladder/avatar",
          { runId: initial.runId, avatarId: "fern" },
          foreignCookie,
        )
      ).status,
      404,
    );

    // A repeated default is a no-op; first writes from different owned runs
    // must serialize even while no preference row exists yet.
    assert.equal((await call("/api/ladder/avatar", { runId: initial.runId, avatarId: initial.avatarId })).status, 200);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM ladder_avatar_change WHERE actor_id=$1", [learner.id])).rows[0].n, 0);
    const otherRun = await call("/api/ladder", { kind: "start", key: randomUUID() });
    assert.equal(otherRun.status, 200);
    const parallel = await Promise.all(Array.from({ length: 6 }, (_, index) => call("/api/ladder/avatar", {
      runId: index % 2 ? otherRun.body.view.runId : initial.runId, avatarId: firstAvatar,
    })));
    assert(parallel.every((response) => response.status === 200));
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM ladder_avatar_change WHERE actor_id=$1", [learner.id])).rows[0].n, 1);
    const saved = await call("/api/ladder/avatar", {
      runId: initial.runId,
      avatarId: firstAvatar,
    });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.view.avatarId, firstAvatar);
    assert.equal(saved.body.view.revision, initial.revision);
    assert.deepEqual(saved.body.view.state, initial.state);
    assert.match(saved.cache, /no-store/);

    const countBefore = (
      await pool.query(
        "SELECT count(*)::int AS n FROM ladder_avatar_change WHERE actor_id=$1",
        [learner.id],
      )
    ).rows[0].n;
    const duplicate = await call("/api/ladder/avatar", {
      runId: initial.runId,
      avatarId: firstAvatar,
    });
    assert.equal(duplicate.status, 200);
    assert.equal(
      (
        await pool.query(
          "SELECT count(*)::int AS n FROM ladder_avatar_change WHERE actor_id=$1",
          [learner.id],
        )
      ).rows[0].n,
      countBefore,
    );

    const [appearance, answer] = await Promise.all([
      call("/api/ladder/avatar", {
        runId: initial.runId,
        avatarId: "sprout",
      }),
      call("/api/ladder", {
        kind: "act",
        runId: initial.runId,
        revision: initial.revision,
        key: randomUUID(),
        action: { kind: "choice", item: 0, choice: 1 },
      }),
    ]);
    assert.equal(appearance.status, 200);
    assert.equal(answer.status, 200);
    const reloaded = await call(`/api/ladder?runId=${initial.runId}`);
    assert.equal(reloaded.body.view.avatarId, "sprout");
    assert.equal(reloaded.body.view.revision, initial.revision + 1);
    assert.equal(reloaded.body.view.state.choices.length, 1);

    const host = await call(
      `/api/ladder/host?pin=${session.body.pin}`,
      null,
      teacherCookie,
    );
    assert.equal(host.status, 200);
    assert.equal(host.body.players[0].avatarId, "sprout");

    const later = await call("/api/ladder", {
      kind: "start",
      key: randomUUID(),
    });
    assert.equal(later.status, 200);
    assert.equal(later.body.view.avatarId, "sprout");
    assert.notEqual(later.body.view.runId, initial.runId);
    console.log(
      "PASS: own save, validation/auth/ownership, host projection, reload/later-run preference, default/duplicate no-op, six cross-run first writes/one cosmetic event, and concurrent answer preservation",
    );
  } finally {
    for (const hash of sessionHashes)
      await pool.query(
        "UPDATE app_session SET expires_at=now() WHERE token_hash=$1",
        [hash],
      );
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Local avatar journey failed without printing response content.");
  console.error(error.name, error.code ?? "", error.message);
  process.exitCode = 1;
});
