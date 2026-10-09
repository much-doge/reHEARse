import { createHash, randomInt } from "node:crypto";
import type { PoolClient } from "pg";
import { getPool } from "@/adapters/db/client";
import { getLearnerActivity } from "@/adapters/db/listening-repository";
import { createFeedbackProvider } from "@/adapters/feedback/provider-factory";
import { feedbackPresentation } from "@/adapters/db/feedback-presentation";
import type {
  LadderActor,
  LadderRepository,
} from "@/application/ladder/repository";
import {
  advanceLadder,
  emptyLadder,
  ladderPosition,
  LadderError,
  LADDER_VERSION,
  type LadderState,
  type LadderAction,
  type LadderView,
  type HostView,
} from "@/domain/ladder/model";
import { ladderContent, contentKeys, publicItems, pair } from "./content";
import { avatarFor, type AvatarId } from "@/domain/ladder/avatars";
const teacher = (a: LadderActor) => {
  if (!["teacher", "admin"].includes(a.role))
    throw new LadderError("teacher_required", 403);
};
const queryRun = `SELECT r.*, p.avatar_id, s.pin, (s.closed_at IS NOT NULL OR s.expires_at < now()) AS session_closed FROM ladder_run r LEFT JOIN ladder_session s ON s.id=r.session_id LEFT JOIN ladder_avatar_preference p ON p.user_id=r.learner_id WHERE r.id=$1 AND r.learner_id=$2`;
function fallback(): import("@/domain/feedback").ListeningFeedback {
  return {
    contractVersion: "listening-feedback.v1",
    summary: pair(
      "Your explanation is saved. Compare it with what you hear on the replay.",
      "Penjelasanmu sudah tersimpan. Bandingkan dengan bagian audio yang kamu dengar ulang.",
    ),
    observations: [
      {
        kind: "unclear",
        message: pair(
          "The follow-up choice checks one relationship; it does not judge your whole explanation.",
          "Pilihan lanjutan mengecek satu hubungan makna, bukan menilai seluruh penjelasanmu.",
        ),
      },
    ],
    nextListeningTarget: pair(
      "Listen again for how the speakers connect the problem and the suggestion.",
      "Dengarkan lagi bagaimana pembicara menghubungkan masalah dengan sarannya.",
    ),
  };
}
export class PostgresLadderRepository implements LadderRepository {
  async view(actor: LadderActor, runId?: string): Promise<LadderView | null> {
    const id =
      runId ??
      (
        await getPool().query(
          "SELECT id FROM ladder_run WHERE learner_id=$1 ORDER BY created_at DESC LIMIT 1",
          [actor.id],
        )
      ).rows[0]?.id;
    if (!id) return null;
    const row = (await getPool().query(queryRun, [id, actor.id])).rows[0];
    if (!row) throw new LadderError("run_not_found", 404);
    if (row.content_version !== ladderContent.version)
      throw new LadderError("activity_version_unavailable", 409);
    const activity = await getLearnerActivity(ladderContent.slug, actor.id);
    if (!activity?.audioUrl || activity.versionId !== row.activity_version_id)
      throw new LadderError("activity_version_unavailable", 409);
    const state = row.state_json as LadderState;
    const event = (
      await getPool().query(
        "SELECT id,feedback_json FROM ladder_event WHERE run_id=$1 AND action_json->>'kind'='repair' ORDER BY revision DESC LIMIT 1",
        [id],
      )
    ).rows[0];
    return {
      contractVersion: LADDER_VERSION,
      runId: id,
      revision: row.revision,
      title: activity.title,
      audioUrl: activity.audioUrl,
      alias: row.alias,
      avatarId: row.avatar_id ?? avatarFor(row.learner_id),
      pin: row.pin ?? null,
      sessionClosed: !!row.session_closed,
      state,
      position: ladderPosition(state),
      items: publicItems(state),
      latestNote: event?.feedback_json
        ? feedbackPresentation(event.feedback_json).summary
        : null,
      latestEventId: event?.id ?? null,
    };
  }
  async start(
    actor: LadderActor,
    id: string,
    pin?: string,
  ): Promise<LadderView> {
    const activity = await getLearnerActivity(ladderContent.slug, actor.id);
    if (!activity?.audioUrl) throw new LadderError("audio_unavailable", 503);
    const media = (
      await getPool().query(
        "SELECT media_sha256 FROM activity_version WHERE id=$1",
        [activity.versionId],
      )
    ).rows[0];
    if (media?.media_sha256 !== ladderContent.audioHash)
      throw new LadderError("audio_version_unavailable", 409);
    let sessionId: string | null = null;
    if (pin) {
      if (actor.role !== "learner")
        throw new LadderError("learner_required_to_join", 403);
      const session = (
        await getPool().query(
          "SELECT id FROM ladder_session WHERE pin=$1 AND closed_at IS NULL AND expires_at>now()",
          [pin],
        )
      ).rows[0];
      if (!session) throw new LadderError("session_not_open", 404);
      sessionId = session.id;
    }
    const existing = (
      await getPool().query(
        "SELECT id,learner_id,session_id FROM ladder_run WHERE id=$1",
        [id],
      )
    ).rows[0];
    if (existing && existing.learner_id !== actor.id)
      throw new LadderError("run_not_found", 404);
    if (existing && existing.session_id !== sessionId)
      throw new LadderError("request_changed", 409);
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      if (sessionId) {
        const session = (
          await client.query(
            "SELECT id FROM ladder_session WHERE id=$1 AND closed_at IS NULL AND expires_at>now() FOR UPDATE",
            [sessionId],
          )
        ).rows[0];
        if (!session) throw new LadderError("session_not_open", 409);
        const own = (
          await client.query(
            "SELECT id FROM ladder_run WHERE session_id=$1 AND learner_id=$2",
            [sessionId, actor.id],
          )
        ).rows[0];
        if (own) {
          await client.query("COMMIT");
          return (await this.view(actor, own.id))!;
        }
      }
      const alias = `Listener ${id.replaceAll("-", "").slice(0, 4).toUpperCase()}`;
      await client.query(
        "INSERT INTO ladder_run(id,learner_id,activity_version_id,content_version,session_id,alias,state_json) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING",
        [
          id,
          actor.id,
          activity.versionId,
          ladderContent.version,
          sessionId,
          alias,
          JSON.stringify(emptyLadder()),
        ],
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return (await this.view(actor, id))!;
  }
  async act(
    actor: LadderActor,
    runId: string,
    revision: number,
    key: string,
    action: LadderAction,
  ): Promise<LadderView> {
    if (action.kind === "teacher_close")
      throw new LadderError("teacher_action_required", 403);
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const row = (
        await client.query(
          "SELECT * FROM ladder_run WHERE id=$1 AND learner_id=$2 FOR UPDATE",
          [runId, actor.id],
        )
      ).rows[0];
      if (!row) throw new LadderError("run_not_found", 404);
      await this.append(client, row, revision, key, action);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return (await this.view(actor, runId))!;
  }
  async setAvatar(
    actor: LadderActor,
    runId: string,
    avatarId: AvatarId,
  ): Promise<LadderView> {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const run = (
        await client.query(
          "SELECT id FROM ladder_run WHERE id=$1 AND learner_id=$2 FOR UPDATE",
          [runId, actor.id],
        )
      ).rows[0];
      if (!run) throw new LadderError("run_not_found", 404);
      const current = (
        await client.query(
          "SELECT avatar_id FROM ladder_avatar_preference WHERE user_id=$1 FOR UPDATE",
          [actor.id],
        )
      ).rows[0]?.avatar_id;
      if (current !== avatarId) {
        await client.query(
          `INSERT INTO ladder_avatar_preference(user_id,avatar_id)
           VALUES($1,$2)
           ON CONFLICT(user_id) DO UPDATE SET avatar_id=excluded.avatar_id,updated_at=now()`,
          [actor.id, avatarId],
        );
        await client.query(
          "INSERT INTO ladder_avatar_change(actor_id,run_id,avatar_id) VALUES($1,$2,$3)",
          [actor.id, runId, avatarId],
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return (await this.view(actor, runId))!;
  }
  private async append(
    client: PoolClient,
    row: {
      id: string;
      revision: number;
      state_json: LadderState;
      content_version: string;
      session_id: string | null;
    },
    revision: number,
    key: string,
    action: LadderAction,
  ) {
    const digest = createHash("sha256")
      .update(JSON.stringify(action))
      .digest("hex");
    const previous = (
      await client.query(
        "SELECT request_digest FROM ladder_event WHERE run_id=$1 AND request_key=$2",
        [row.id, key],
      )
    ).rows[0];
    if (previous) {
      if (previous.request_digest !== digest)
        throw new LadderError("request_changed", 409);
      return;
    }
    if (row.content_version !== ladderContent.version)
      throw new LadderError("activity_version_unavailable", 409);
    if (row.session_id && action.kind !== "teacher_close") {
      const session = (
        await client.query(
          "SELECT closed_at,expires_at FROM ladder_session WHERE id=$1",
          [row.session_id],
        )
      ).rows[0];
      if (
        !session ||
        session.closed_at ||
        new Date(session.expires_at) < new Date()
      )
        throw new LadderError("session_closed", 409);
    }
    if (row.revision !== revision)
      throw new LadderError("refresh_progress", 409);
    const next = advanceLadder(row.state_json, action, contentKeys);
    if (action.kind === "teacher_close") next.helpRequested = false;
    await client.query(
      "INSERT INTO ladder_event(run_id,request_key,request_digest,revision,action_json) VALUES($1,$2,$3,$4,$5)",
      [row.id, key, digest, revision + 1, JSON.stringify(action)],
    );
    await client.query(
      "UPDATE ladder_run SET state_json=$2,revision=$3,updated_at=now() WHERE id=$1",
      [row.id, JSON.stringify(next), revision + 1],
    );
  }
  async createSession(actor: LadderActor, key: string): Promise<HostView> {
    teacher(actor);
    const existing = (
      await getPool().query(
        "SELECT pin,owner_id FROM ladder_session WHERE id=$1",
        [key],
      )
    ).rows[0];
    if (existing) {
      if (existing.owner_id !== actor.id)
        throw new LadderError("session_not_found", 404);
      return this.host(actor, existing.pin);
    }
    for (let i = 0; i < 8; i++) {
      const pin = String(randomInt(100000, 1000000));
      const row = await getPool().query(
        "INSERT INTO ladder_session(id,owner_id,pin) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id",
        [key, actor.id, pin],
      );
      if (row.rowCount) return this.host(actor, pin);
    }
    const raced = (
      await getPool().query(
        "SELECT pin FROM ladder_session WHERE id=$1 AND owner_id=$2",
        [key, actor.id],
      )
    ).rows[0];
    if (raced) return this.host(actor, raced.pin);
    throw new LadderError("session_unavailable", 503);
  }
  async host(actor: LadderActor, pin: string): Promise<HostView> {
    teacher(actor);
    const session = (
      await getPool().query(
        "SELECT * FROM ladder_session WHERE pin=$1 AND owner_id=$2",
        [pin, actor.id],
      )
    ).rows[0];
    if (!session) throw new LadderError("session_not_found", 404);
    const rows = (
      await getPool().query(
        `SELECT r.id,r.learner_id,r.alias,r.state_json,p.avatar_id
         FROM ladder_run r
         LEFT JOIN ladder_avatar_preference p ON p.user_id=r.learner_id
         WHERE r.session_id=$1 ORDER BY r.created_at`,
        [session.id],
      )
    ).rows;
    return {
      pin,
      closed: !!session.closed_at || new Date(session.expires_at) < new Date(),
      players: rows.map((r) => ({
        runId: r.id,
        alias: r.alias,
        avatarId: r.avatar_id ?? avatarFor(r.learner_id),
        position: ladderPosition(r.state_json),
        finished:
          r.state_json.choices.length === 4 &&
          r.state_json.choices.every(
            (x: { outcome: string }) => x.outcome !== "repair",
          ),
        needsHelp: r.state_json.helpRequested,
      })),
    };
  }
  async closeSession(actor: LadderActor, pin: string) {
    teacher(actor);
    const r = await getPool().query(
      "UPDATE ladder_session SET closed_at=coalesce(closed_at,now()) WHERE pin=$1 AND owner_id=$2 RETURNING id",
      [pin, actor.id],
    );
    if (!r.rowCount) throw new LadderError("session_not_found", 404);
    return this.host(actor, pin);
  }
  async assist(
    actor: LadderActor,
    pin: string,
    runId: string,
    key: string,
    reason: string,
  ) {
    teacher(actor);
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const row = (
        await client.query(
          "SELECT r.* FROM ladder_run r JOIN ladder_session s ON s.id=r.session_id WHERE r.id=$1 AND s.pin=$2 AND s.owner_id=$3 FOR UPDATE OF r",
          [runId, pin, actor.id],
        )
      ).rows[0];
      if (!row) throw new LadderError("run_not_found", 404);
      const already = (
        await client.query(
          "SELECT id,action_json FROM ladder_event WHERE run_id=$1 AND request_key=$2",
          [runId, key],
        )
      ).rows[0];
      if (already) {
        if (
          already.action_json.kind !== "teacher_close" ||
          already.action_json.explanation !== reason
        )
          throw new LadderError("request_changed", 409);
        await client.query("COMMIT");
        return this.host(actor, pin);
      }
      const index = (row.state_json as LadderState).choices.findIndex(
        (x) => x.outcome === "repair",
      );
      if (index < 0 || row.state_json.choices.length !== 4)
        throw new LadderError("no_repair_ready", 409);
      await this.append(client, row, row.revision, key, {
        kind: "teacher_close",
        item: index,
        explanation: reason,
      });
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return this.host(actor, pin);
  }
  async feedback(actor: LadderActor, eventId: string) {
    const client = await getPool().connect();
    let locked = false;
    try {
      const row = (
        await client.query(
          "SELECT e.*,r.learner_id,r.activity_version_id FROM ladder_event e JOIN ladder_run r ON r.id=e.run_id WHERE e.id=$1 AND r.learner_id=$2",
          [eventId, actor.id],
        )
      ).rows[0];
      if (!row) throw new LadderError("event_not_found", 404);
      if (row.action_json.kind !== "repair")
        throw new LadderError("no_explanation", 400);
      if (row.feedback_json)
        return feedbackPresentation(row.feedback_json).summary;
      locked = (
        await client.query(
          "SELECT pg_try_advisory_lock(hashtext($1)) AS locked",
          [`ladder-feedback:${eventId}`],
        )
      ).rows[0].locked;
      if (!locked) throw new LadderError("feedback_pending", 409);
      const saved = (
        await client.query(
          "SELECT feedback_json FROM ladder_event WHERE id=$1",
          [eventId],
        )
      ).rows[0];
      if (saved.feedback_json)
        return feedbackPresentation(saved.feedback_json).summary;
      const item = ladderContent.items[row.action_json.item];
      let result = fallback();
      try {
        const provider = createFeedbackProvider({
          ...process.env,
          OPENAI_TIMEOUT_MS: "12000",
          OPENAI_MAX_OUTPUT_TOKENS: "900",
        });
        const review = await provider.review({
          activityVersionId: row.activity_version_id,
          transcript: item.transcript,
          teacherGuide: `Comment briefly on the learner's explanation of this one part, with one listening nudge. Never disclose a missing answer. ${item.repair.focus.en}`,
          notes: "",
          reconstruction: row.action_json.explanation,
          previousReconstruction: null,
          template: result,
        });
        result = review.feedback;
      } catch {
        /* Saved explanation and prepared guidance remain available. */
      }
      await client.query(
        "UPDATE ladder_event SET feedback_json=$2 WHERE id=$1 AND feedback_json IS NULL",
        [eventId, JSON.stringify(result)],
      );
      return feedbackPresentation(result).summary;
    } finally {
      if (locked)
        await client
          .query("SELECT pg_advisory_unlock(hashtext($1))", [
            `ladder-feedback:${eventId}`,
          ])
          .catch(() => undefined);
      client.release();
    }
  }
}
export const ladderRepository = new PostgresLadderRepository();
