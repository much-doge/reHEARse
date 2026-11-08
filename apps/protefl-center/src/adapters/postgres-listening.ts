import { createHash } from "node:crypto";
import type { PoolClient } from "pg";

import { getPool } from "@/adapters/db/client";
import type { ListeningPilotRepository } from "@protefl/application/repository";
import {
  LISTENING_CONTRACT,
  LISTENING_FORM_CODE,
  ListeningPilotError,
  selectRemedialItems,
  type ListeningAction,
  type ListeningView,
  type Option,
} from "@protefl/domain/listening";

const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function databaseNow(client: PoolClient): Promise<Date> {
  return (await client.query("SELECT clock_timestamp() AS now")).rows[0].now;
}

async function resourceAccess(client: PoolClient, actorId: string, formId: string) {
  return (await client.query(
    `SELECT r.status,
       EXISTS(SELECT 1 FROM protefl_resource_assignment a WHERE a.resource_id=r.id AND a.actor_id=$1
         AND a.revoked_at IS NULL AND a.starts_at<=now() AND (a.ends_at IS NULL OR a.ends_at>now())) AS assigned,
       EXISTS(SELECT 1 FROM protefl_attempt t WHERE t.actor_id=$1 AND t.form_id=r.listening_form_id AND t.status<>'invalidated') AS has_attempt
     FROM protefl_resource r WHERE r.listening_form_id=$2`, [actorId, formId],
  )).rows[0];
}

async function form(client: PoolClient) {
  const row = (
    await client.query(
      `SELECT f.*, count(i.id)::int AS item_count
       FROM protefl_test_form f
       JOIN protefl_test_item i ON i.form_id=f.id
       WHERE f.code=$1 AND f.retired_at IS NULL
       GROUP BY f.id`,
      [LISTENING_FORM_CODE],
    )
  ).rows[0];
  if (!row) throw new ListeningPilotError("form_unavailable", 503);
  return row;
}

async function expireElapsed(client: PoolClient, attempt: Record<string, unknown>, now: Date) {
  if (attempt.status !== "in_progress") return attempt;
  const current = (
    await client.query(
      `SELECT ai.*, i.answer
       FROM protefl_attempt_item ai JOIN protefl_test_item i ON i.id=ai.item_id
       WHERE ai.attempt_id=$1 AND ai.sequence=$2 FOR UPDATE OF ai`,
      [attempt.id, attempt.current_position],
    )
  ).rows[0];
  if (
    !current?.answer_deadline_at ||
    current.locked_at ||
    new Date(current.answer_deadline_at).getTime() > now.getTime()
  )
    return attempt;
  await client.query(
    "UPDATE protefl_attempt_item SET locked_at=$3, correct=false WHERE attempt_id=$1 AND item_id=$2",
    [attempt.id, current.item_id, now],
  );
  const total = Number((await client.query("SELECT count(*) FROM protefl_attempt_item WHERE attempt_id=$1", [attempt.id])).rows[0].count);
  const nextPosition = Number(attempt.current_position) + 1;
  const submitted = nextPosition >= total;
  const updated = (
    await client.query(
      `UPDATE protefl_attempt SET current_position=$2,revision=revision+1,
       status=CASE WHEN $3 THEN 'submitted' ELSE status END,
       submitted_at=CASE WHEN $3 THEN $4 ELSE submitted_at END
       WHERE id=$1 RETURNING *`,
      [attempt.id, nextPosition, submitted, now],
    )
  ).rows[0];
  return updated;
}

async function project(client: PoolClient, actorId: string, selectedAttempt?: Record<string, unknown>): Promise<ListeningView> {
  const currentForm = await form(client);
  const now = await databaseNow(client);
  let attempt = selectedAttempt ?? (
    await client.query(
      `SELECT * FROM protefl_attempt
       WHERE actor_id=$1 AND form_id=$2 AND status<>'invalidated'
       ORDER BY (status='in_progress') DESC, created_at DESC LIMIT 1`,
      [actorId, currentForm.id],
    )
  ).rows[0];
  if (attempt) attempt = await expireElapsed(client, attempt, now);
  const base: ListeningView = {
    contractVersion: LISTENING_CONTRACT,
    form: {
      code: currentForm.code,
      title: currentForm.title,
      itemCount: currentForm.item_count,
      responseWindowMs: currentForm.response_window_ms,
    },
    attempt: null,
    serverTime: now.toISOString(),
  };
  if (!attempt) return base;
  const rows = (
    await client.query(
      `SELECT ai.*,i.ordinal,i.part,i.options_json,i.answer,i.media_duration_ms
       FROM protefl_attempt_item ai JOIN protefl_test_item i ON i.id=ai.item_id
       WHERE ai.attempt_id=$1 ORDER BY ai.sequence`,
      [attempt.id],
    )
  ).rows;
  const resultItems = attempt.status === "submitted"
    ? rows.map((row) => ({
        number: row.ordinal,
        part: row.part,
        options: row.options_json,
        choice: row.choice as Option | null,
        answer: row.answer as Option,
        correct: row.correct === true,
      }))
    : [];
  const active = attempt.status === "in_progress" ? rows[Number(attempt.current_position)] : null;
  const correct = resultItems.filter((item) => item.correct).length;
  const omitted = resultItems.filter((item) => item.choice === null).length;
  base.attempt = {
    id: String(attempt.id),
    kind: attempt.kind,
    parentAttemptId: attempt.parent_attempt_id ? String(attempt.parent_attempt_id) : null,
    status: attempt.status,
    revision: Number(attempt.revision),
    position: Number(attempt.current_position),
    totalItems: rows.length,
    current: active
      ? {
          id: active.item_id,
          number: active.ordinal,
          part: active.part,
          options: active.options_json,
          mediaUrl: `/api/test-center/media/${active.item_id}?attempt=${attempt.id}`,
          durationMs: active.media_duration_ms,
          startedAt: active.opened_at ? new Date(active.opened_at).toISOString() : null,
          answerOpensAt: active.answer_opens_at ? new Date(active.answer_opens_at).toISOString() : null,
          deadline: active.answer_deadline_at ? new Date(active.answer_deadline_at).toISOString() : null,
        }
      : null,
    result: attempt.status === "submitted"
      ? {
          correct,
          wrong: resultItems.length - correct,
          omitted,
          items: resultItems,
          canRemediate: correct < resultItems.length,
        }
      : null,
  };
  return base;
}

export class PostgresListeningPilotRepository implements ListeningPilotRepository {
  async view(actorId: string) {
    return transaction(async (client) => {
      const currentForm = await form(client);
      const access = await resourceAccess(client, actorId, String(currentForm.id));
      if (!access?.assigned || (access.status !== "published" && !access.has_attempt))
        throw new ListeningPilotError("attempt_not_found", 404);
      return project(client, actorId);
    });
  }

  async act(actorId: string, action: ListeningAction) {
    return transaction(async (client) => {
      const currentForm = await form(client);
      if (action.kind === "start") {
        const existing = (
          await client.query(
            "SELECT * FROM protefl_attempt WHERE id=$1",
            [action.key],
          )
        ).rows[0];
        if (existing) {
          if (existing.actor_id !== actorId) throw new ListeningPilotError("attempt_not_found", 404);
          const access = await resourceAccess(client, actorId, String(currentForm.id));
          if (!access?.assigned) throw new ListeningPilotError("attempt_not_found", 404);
          return project(client, actorId, existing);
        }
        const access = await resourceAccess(client, actorId, String(currentForm.id));
        if (!access?.assigned || access.status !== "published")
          throw new ListeningPilotError("attempt_not_found", 404);
        const inProgress = (
          await client.query(
            `SELECT * FROM protefl_attempt WHERE actor_id=$1 AND form_id=$2 AND status='in_progress'
             ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
            [actorId, currentForm.id],
          )
        ).rows[0];
        if (inProgress) return project(client, actorId, inProgress);
        let itemRows;
        if (action.mode === "full") {
          itemRows = (await client.query("SELECT id FROM protefl_test_item WHERE form_id=$1 ORDER BY ordinal", [currentForm.id])).rows;
        } else {
          const parent = (
            await client.query(
              "SELECT * FROM protefl_attempt WHERE id=$1 AND actor_id=$2 AND form_id=$3 AND status='submitted'",
              [action.parentAttemptId, actorId, currentForm.id],
            )
          ).rows[0];
          if (!parent) throw new ListeningPilotError("parent_attempt_not_found", 404);
          const parentItems = (
            await client.query(
              `SELECT i.id,i.ordinal,i.part,i.passage_group,ai.correct
               FROM protefl_attempt_item ai
               JOIN protefl_test_item i ON i.id=ai.item_id
               WHERE ai.attempt_id=$1 ORDER BY i.ordinal`,
              [parent.id],
            )
          ).rows.map((row) => ({
            id: String(row.id),
            ordinal: Number(row.ordinal),
            part: row.part as "A" | "B" | "C",
            passageGroup: String(row.passage_group),
            correct: row.correct === true,
          }));
          itemRows = selectRemedialItems(parentItems);
          if (!itemRows.length) throw new ListeningPilotError("nothing_to_remediate");
        }
        const inserted = (
          await client.query(
            `INSERT INTO protefl_attempt(id,actor_id,form_id,kind,parent_attempt_id)
             VALUES($1,$2,$3,$4,$5) RETURNING *`,
            [action.key, actorId, currentForm.id, action.mode, action.mode === "remedial" ? action.parentAttemptId : null],
          )
        ).rows[0];
        for (const [sequence, item] of itemRows.entries()) {
          await client.query(
            "INSERT INTO protefl_attempt_item(attempt_id,item_id,sequence) VALUES($1,$2,$3)",
            [inserted.id, item.id, sequence],
          );
        }
        return project(client, actorId, inserted);
      }

      const attempt = (
        await client.query(
          "SELECT * FROM protefl_attempt WHERE id=$1 AND actor_id=$2 FOR UPDATE",
          [action.attemptId, actorId],
        )
      ).rows[0];
      if (!attempt) throw new ListeningPilotError("attempt_not_found", 404);
      const access = await resourceAccess(client, actorId, String(currentForm.id));
      if (!access?.assigned) throw new ListeningPilotError("attempt_not_found", 404);
      const requestDigest = digest({ revision: action.revision, action });
      const prior = (
        await client.query(
          "SELECT request_digest,result_json FROM protefl_attempt_event WHERE attempt_id=$1 AND request_key=$2",
          [attempt.id, action.key],
        )
      ).rows[0];
      if (prior) {
        if (prior.request_digest !== requestDigest) throw new ListeningPilotError("request_changed");
        return prior.result_json as ListeningView;
      }
      if (attempt.status !== "in_progress") throw new ListeningPilotError("attempt_not_found", 404);
      if (Number(attempt.revision) !== action.revision) throw new ListeningPilotError("refresh_required");
      const item = (
        await client.query(
          `SELECT ai.*,i.answer,i.media_duration_ms FROM protefl_attempt_item ai
           JOIN protefl_test_item i ON i.id=ai.item_id
           WHERE ai.attempt_id=$1 AND ai.sequence=$2 FOR UPDATE OF ai`,
          [attempt.id, attempt.current_position],
        )
      ).rows[0];
      if (!item || item.item_id !== action.itemId) throw new ListeningPilotError("item_changed");
      const now = await databaseNow(client);
      if (action.kind === "listen_start") {
        if (!item.opened_at) {
          const opensAt = new Date(now.getTime() + Number(item.media_duration_ms));
          const deadline = new Date(opensAt.getTime() + Number(currentForm.response_window_ms));
          await client.query(
            "UPDATE protefl_attempt_item SET opened_at=$3,answer_opens_at=$4,answer_deadline_at=$5 WHERE attempt_id=$1 AND item_id=$2",
            [attempt.id, item.item_id, now, opensAt, deadline],
          );
          attempt.revision = Number(attempt.revision) + 1;
          await client.query("UPDATE protefl_attempt SET revision=$2 WHERE id=$1", [attempt.id, attempt.revision]);
        }
      } else {
        if (!item.opened_at || !item.answer_opens_at || !item.answer_deadline_at) throw new ListeningPilotError("listen_first");
        const opensAt = new Date(item.answer_opens_at);
        const deadline = new Date(item.answer_deadline_at);
        if (now.getTime() < opensAt.getTime()) throw new ListeningPilotError("answer_not_open");
        if (action.kind === "choose" && now.getTime() > deadline.getTime())
          throw new ListeningPilotError("answer_closed");
        if (action.kind === "timeout" && now.getTime() < deadline.getTime())
          throw new ListeningPilotError("answer_still_open");
        const choice = action.kind === "choose" ? action.choice : null;
        await client.query(
          `UPDATE protefl_attempt_item
           SET choice=$3,locked_at=$4,correct=COALESCE($3=protefl_test_item.answer,false)
           FROM protefl_test_item
           WHERE protefl_attempt_item.attempt_id=$1
             AND protefl_attempt_item.item_id=$2
             AND protefl_test_item.id=protefl_attempt_item.item_id`,
          [attempt.id, item.item_id, choice, now],
        );
        const total = Number((await client.query("SELECT count(*) FROM protefl_attempt_item WHERE attempt_id=$1", [attempt.id])).rows[0].count);
        const nextPosition = Number(attempt.current_position) + 1;
        const submitted = nextPosition >= total;
        Object.assign(
          attempt,
          (
            await client.query(
              `UPDATE protefl_attempt SET current_position=$2,revision=revision+1,
               status=CASE WHEN $3 THEN 'submitted' ELSE status END,
               submitted_at=CASE WHEN $3 THEN $4 ELSE submitted_at END
               WHERE id=$1 RETURNING *`,
              [attempt.id, nextPosition, submitted, now],
            )
          ).rows[0],
        );
      }
      const result = await project(client, actorId, attempt);
      await client.query(
        `INSERT INTO protefl_attempt_event(attempt_id,actor_id,request_key,request_digest,action_json,result_json)
         VALUES($1,$2,$3,$4,$5,$6)`,
        [attempt.id, actorId, action.key, requestDigest, JSON.stringify(action), JSON.stringify(result)],
      );
      return result;
    });
  }

  async media(actorId: string, attemptId: string, itemId: string) {
    const row = (
      await getPool().query(
        `SELECT i.media_storage_key FROM protefl_attempt a
         JOIN protefl_attempt_item ai ON ai.attempt_id=a.id
         JOIN protefl_test_item i ON i.id=ai.item_id
         JOIN protefl_resource r ON r.listening_form_id=a.form_id
         JOIN protefl_resource_assignment ra ON ra.resource_id=r.id AND ra.actor_id=a.actor_id
         WHERE a.id=$1 AND a.actor_id=$2 AND i.id=$3 AND a.status<>'invalidated'
           AND ra.revoked_at IS NULL AND ra.starts_at<=now() AND (ra.ends_at IS NULL OR ra.ends_at>now())`,
        [attemptId, actorId, itemId],
      )
    ).rows[0];
    if (!row) throw new ListeningPilotError("media_not_found", 404);
    return { storageKey: row.media_storage_key, contentType: "audio/mpeg" };
  }
}

export const listeningPilotRepository = new PostgresListeningPilotRepository();
