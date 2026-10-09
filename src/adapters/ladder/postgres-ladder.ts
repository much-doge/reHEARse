import { createHash, randomInt, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { getPool } from "@/adapters/db/client";
import {
  getLearnerActivity,
  getLearnerActivityVersion,
} from "@/adapters/db/listening-repository";
import { createFeedbackProvider } from "@/adapters/feedback/provider-factory";
import { feedbackPresentation } from "@/adapters/db/feedback-presentation";
import type {
  LadderActor,
  LadderRepository,
} from "@/application/ladder/repository";
import {
  advanceLadder,
  advanceChapterJourney,
  chapterJourney,
  emptyLadder,
  ladderPosition,
  LadderError,
  LADDER_VERSION,
  type LadderState,
  type LadderAction,
  type LadderView,
  type HostView,
} from "@/domain/ladder/model";
import { keysFor, publicItems, pair } from "./content";
import {
  gameContents,
  resolveLadderContent,
  selectStartContent,
} from "./content-resolver";
import type { LadderContent } from "./content-schema";
import { passageJourneyMap } from "@/domain/ladder/journey-contract";
import { advancePassageJourney, passageComplete } from "@/domain/ladder/passage-journey";
const passagesFor = (content: LadderContent) => content.passages ?? [{ slug: content.slug, title: content.title, durationMs: content.durationMs, audioHash: content.audioHash, fromItem: 0, toItem: content.items.length }];
const sizesFor = (content: LadderContent) => passagesFor(content).map((passage) => passage.toItem - passage.fromItem);
const mapped = (mechanics: string) => mechanics === "chapter-route.v1" || mechanics === "passage-route.v1";
const mapFor = (content: LadderContent, index = 0) => content.passages
  ? { map: passageJourneyMap(sizesFor(content)[index]) } : chapterJourney();
function pinsFor(content: LadderContent, row: { activity_version_id: string; passage_versions_json?: unknown }): string[] {
  if (!content.passages) return [row.activity_version_id];
  const pins = row.passage_versions_json;
  if (!Array.isArray(pins) || pins.length !== content.passages.length || pins.some((id) => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) || pins[0] !== row.activity_version_id)
    throw new LadderError("activity_version_unavailable", 409);
  return pins;
}
async function publishedVersions(content: LadderContent, actor: LadderActor, pins?: string[]) {
  const versions = [];
  for (const [index, passage] of passagesFor(content).entries()) {
    const activity = pins ? await getLearnerActivityVersion(passage.slug, pins[index]) : await getLearnerActivity(passage.slug, actor.id);
    if (!activity?.audioUrl) throw new LadderError("audio_unavailable", 503);
    const hash = "mediaSha256" in activity ? activity.mediaSha256 : (await getPool().query("SELECT media_sha256 FROM activity_version WHERE id=$1", [activity.versionId])).rows[0]?.media_sha256;
    if (hash !== passage.audioHash) throw new LadderError("audio_version_unavailable", 409);
    versions.push(activity);
  }
  return versions;
}
import { avatarFor, type AvatarId } from "@/domain/ladder/avatars";
import { paletteFor, type AvatarPaletteId } from "@/domain/ladder/appearance";
import { anonymousAlias, displayAliases } from "@/domain/ladder/anonymous-alias";
const teacher = (a: LadderActor) => {
  if (!["teacher", "admin"].includes(a.role))
    throw new LadderError("teacher_required", 403);
};
const queryRun = `SELECT r.*, p.avatar_id, p.avatar_palette, s.pin, (s.closed_at IS NOT NULL OR s.expires_at < now()) AS session_closed FROM ladder_run r LEFT JOIN ladder_session s ON s.id=r.session_id LEFT JOIN ladder_avatar_preference p ON p.user_id=r.learner_id WHERE r.id=$1 AND r.learner_id=$2`;
function startContent(activityId?: string): LadderContent {
  const mode = process.env.LADDER_START_VERSION === "legacy" ? "legacy" : "original";
  const content = selectStartContent(mode, activityId);
  if (!content)
    throw new LadderError(
      mode === "legacy" ? "original_starts_disabled" : "activity_not_available",
      mode === "legacy" ? 409 : 404,
    );
  return content;
}
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
      "Listen again for how the details connect to the main idea in this part.",
      "Dengarkan lagi hubungan antara detail dan gagasan utama di bagian ini.",
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
    const content = resolveLadderContent(row.content_version);
    if (!content) throw new LadderError("activity_version_unavailable", 409);
    const state = row.state_json as LadderState;
    const passageIndex = state.passageIndex ?? 0;
    const passage = passagesFor(content)[passageIndex];
    if (!passage) throw new LadderError("activity_version_unavailable", 409);
    const activity = await getLearnerActivityVersion(passage.slug, pinsFor(content, row)[passageIndex]);
    if (!activity?.audioUrl || activity.mediaSha256 !== passage.audioHash)
      throw new LadderError("activity_version_unavailable", 409);
    const event = (
      await getPool().query(
        "SELECT id,feedback_json FROM ladder_event WHERE run_id=$1 AND action_json->>'kind'='repair' ORDER BY revision DESC LIMIT 1",
        [id],
      )
    ).rows[0];
    const aliases = row.session_id
      ? (await getPool().query("SELECT id,alias FROM ladder_run WHERE session_id=$1 ORDER BY created_at,id", [row.session_id])).rows
      : [{ id, alias: row.alias }];
    return {
      contractVersion: LADDER_VERSION,
      runId: id,
      revision: row.revision,
      title: content.passages ? content.title.en : activity.title,
      audioUrl: activity.audioUrl,
      alias: displayAliases(aliases).get(id)!,
      avatarId: row.avatar_id ?? avatarFor(row.learner_id),
      avatarPalette: row.avatar_palette ?? paletteFor(row.learner_id),
      pin: row.pin ?? null,
      sessionClosed: !!row.session_closed,
      state,
      position:
        mapped(row.mechanics_version)
          ? row.position
          : ladderPosition(state),
      items: publicItems(state, content),
      latestNote: event?.feedback_json
        ? feedbackPresentation(event.feedback_json).summary
        : null,
      latestEventId: event?.id ?? null,
      activityId: content.activityId,
      ...(content.passages ? { passage: { index: passageIndex, total: content.passages.length, title: passage.title,
        fromItem: passage.fromItem, toItem: passage.toItem, checkpoint: passageComplete(state, sizesFor(content)) && passageIndex < content.passages.length - 1 } } : {}),
      ...(mapped(row.mechanics_version)
        ? {
            journey: {
              ...mapFor(content, passageIndex),
              lastTransition: row.last_transition_json ?? null,
            },
          }
        : {}),
    };
  }
  async start(
    actor: LadderActor,
    id: string,
    pin?: string,
    activityId?: string,
  ): Promise<LadderView> {
    let content: LadderContent | null = null;
    let pinnedVersions: string[] | undefined;
    let sessionId: string | null = null;
    if (pin) {
      if (actor.role !== "learner")
        throw new LadderError("learner_required_to_join", 403);
      const session = (
        await getPool().query(
          `SELECT id,activity_id,activity_version_id,content_version,mechanics_version,passage_versions_json
           FROM ladder_session
           WHERE pin=$1 AND closed_at IS NULL AND expires_at>now()`,
          [pin],
        )
      ).rows[0];
      if (!session) throw new LadderError("session_not_open", 404);
      if (activityId && activityId !== session.activity_id)
        throw new LadderError("request_changed", 409);
      const pinned = resolveLadderContent(session.content_version);
      if (!pinned || pinned.activityId !== session.activity_id)
        throw new LadderError("activity_version_unavailable", 409);
      content = pinned;
      pinnedVersions = pinsFor(pinned, session);
      sessionId = session.id;
    }
    const existing = (
      await getPool().query(
        "SELECT id,learner_id,session_id,activity_id,content_version FROM ladder_run WHERE id=$1",
        [id],
      )
    ).rows[0];
    if (existing && existing.learner_id !== actor.id)
      throw new LadderError("run_not_found", 404);
    if (existing && existing.session_id !== sessionId)
      throw new LadderError("request_changed", 409);
    if (existing) {
      if (activityId && existing.activity_id !== activityId)
        throw new LadderError("request_changed", 409);
      return (await this.view(actor, id))!;
    }
    content ??= startContent(activityId);
    const activities = await publishedVersions(content, actor, pinnedVersions);
    const activity = activities[0];
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
      const alias = anonymousAlias(id);
      await client.query(
        `INSERT INTO ladder_run(
           id,learner_id,activity_version_id,content_version,session_id,alias,state_json,
           activity_id,mechanics_version,position,passage_versions_json
         ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT(id) DO NOTHING`,
        [
          id,
          actor.id,
          activity.versionId,
          content.version,
          sessionId,
          alias,
          JSON.stringify(content.passages ? { ...emptyLadder(), passageIndex: 0 } : emptyLadder()),
          content.activityId,
          content.mechanicsVersion,
          mapped(content.mechanicsVersion) ? 0 : null,
          content.passages ? JSON.stringify(activities.map((activity) => activity.versionId)) : null,
        ],
      );
      // The initial lookup can race a second start using the same key.
      // Validate the winner while still holding this transaction's row lock.
      const saved = (await client.query(
        "SELECT learner_id,session_id,activity_id FROM ladder_run WHERE id=$1 FOR UPDATE",
        [id],
      )).rows[0];
      if (saved.learner_id !== actor.id)
        throw new LadderError("run_not_found", 404);
      if (saved.session_id !== sessionId || saved.activity_id !== content.activityId)
        throw new LadderError("request_changed", 409);
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
    paletteId?: AvatarPaletteId,
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
      // The preference is shared by all of this actor's runs. A run lock alone
      // cannot serialize first-time writes from two different owned runs.
      await client.query("SELECT id FROM app_user WHERE id=$1 FOR UPDATE", [actor.id]);
      const current = (
        await client.query(
          "SELECT avatar_id,avatar_palette FROM ladder_avatar_preference WHERE user_id=$1 FOR UPDATE",
          [actor.id],
        )
      ).rows[0];
      const currentId = current?.avatar_id ?? avatarFor(actor.id);
      const currentPalette = current?.avatar_palette ?? paletteFor(actor.id);
      const palette = paletteId ?? currentPalette;
      if (currentId !== avatarId || currentPalette !== palette) {
        await client.query(
          `INSERT INTO ladder_avatar_preference(user_id,avatar_id,avatar_palette)
           VALUES($1,$2,$3)
           ON CONFLICT(user_id) DO UPDATE SET avatar_id=excluded.avatar_id,avatar_palette=excluded.avatar_palette,updated_at=now()`,
          [actor.id, avatarId, palette],
        );
        await client.query(
          "INSERT INTO ladder_avatar_change(actor_id,run_id,avatar_id,avatar_palette) VALUES($1,$2,$3,$4)",
          [actor.id, runId, avatarId, palette],
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
      mechanics_version: string;
      position: number | null;
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
        "SELECT request_digest,transition_json FROM ladder_event WHERE run_id=$1 AND request_key=$2",
        [row.id, key],
      )
    ).rows[0];
    if (previous) {
      if (previous.request_digest !== digest)
        throw new LadderError("request_changed", 409);
      return;
    }
    const content = resolveLadderContent(row.content_version);
    if (!content) throw new LadderError("activity_version_unavailable", 409);
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
    const eventId = randomUUID();
    const keys = keysFor(content);
    const advanced =
      row.mechanics_version === "passage-route.v1"
        ? advancePassageJourney(row.state_json, row.position ?? 0, action, keys, sizesFor(content), eventId, revision + 1)
        : row.mechanics_version === "chapter-route.v1"
        ? advanceChapterJourney(
            row.state_json,
            row.position ?? 0,
            action,
            keys,
            eventId,
            revision + 1,
          )
        : {
            state: advanceLadder(row.state_json, action, keys),
            position: null,
            transition: null,
          };
    const next = advanced.state;
    if (action.kind === "teacher_close") next.helpRequested = false;
    await client.query(
      `INSERT INTO ladder_event(
         id,run_id,request_key,request_digest,revision,action_json,transition_json
       ) VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [
        eventId,
        row.id,
        key,
        digest,
        revision + 1,
        JSON.stringify(action),
        advanced.transition ? JSON.stringify(advanced.transition) : null,
      ],
    );
    await client.query(
      `UPDATE ladder_run
       SET state_json=$2,revision=$3,position=coalesce($4,position),
           last_transition_json=coalesce($5,last_transition_json),updated_at=now()
       WHERE id=$1`,
      [
        row.id,
        JSON.stringify(next),
        revision + 1,
        advanced.position,
        advanced.transition ? JSON.stringify(advanced.transition) : null,
      ],
    );
  }
  async createSession(
    actor: LadderActor,
    key: string,
    activityId?: string,
  ): Promise<HostView> {
    teacher(actor);
    const existing = (
      await getPool().query(
        "SELECT pin,owner_id,activity_id FROM ladder_session WHERE id=$1",
        [key],
      )
    ).rows[0];
    if (existing) {
      if (existing.owner_id !== actor.id)
        throw new LadderError("session_not_found", 404);
      if (activityId && existing.activity_id !== activityId)
        throw new LadderError("request_changed", 409);
      return this.host(actor, existing.pin);
    }
    const content = startContent(activityId);
    const activities = await publishedVersions(content, actor);
    const activity = activities[0];
    for (let i = 0; i < 8; i++) {
      const pin = String(randomInt(100000, 1000000));
      const row = await getPool().query(
        `INSERT INTO ladder_session(
           id,owner_id,pin,activity_id,activity_version_id,content_version,mechanics_version,passage_versions_json
         ) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT DO NOTHING RETURNING id`,
        [
          key,
          actor.id,
          pin,
          content.activityId,
          activity.versionId,
          content.version,
          content.mechanicsVersion,
          content.passages ? JSON.stringify(activities.map((activity) => activity.versionId)) : null,
        ],
      );
      if (row.rowCount) return this.host(actor, pin);
    }
    const raced = (
      await getPool().query(
        "SELECT pin,activity_id FROM ladder_session WHERE id=$1 AND owner_id=$2",
        [key, actor.id],
      )
    ).rows[0];
    if (raced) {
      if (activityId && raced.activity_id !== activityId)
        throw new LadderError("request_changed", 409);
      return this.host(actor, raced.pin);
    }
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
        `SELECT r.id,r.learner_id,r.alias,r.state_json,r.mechanics_version,
                r.position,r.last_transition_json,p.avatar_id,p.avatar_palette
         FROM ladder_run r
         LEFT JOIN ladder_avatar_preference p ON p.user_id=r.learner_id
         WHERE r.session_id=$1 ORDER BY r.created_at,r.id`,
        [session.id],
      )
    ).rows;
    const aliases = displayAliases(rows);
    const content = resolveLadderContent(session.content_version);
    if (!content) throw new LadderError("activity_version_unavailable", 409);
    return {
      pin,
      closed: !!session.closed_at || new Date(session.expires_at) < new Date(),
      ...(session.activity_id ? { activityId: session.activity_id } : {}),
      ...(session.content_version && resolveLadderContent(session.content_version)
        ? { title: resolveLadderContent(session.content_version)!.title.en }
        : {}),
      ...(mapped(session.mechanics_version) ? { journey: mapFor(content) } : {}),
      ...(content.passages ? { passages: content.passages.map((passage, index) => ({ title: passage.title,
        questionCount: passage.toItem - passage.fromItem, journey: mapFor(content, index) })) } : {}),
      players: rows.map((r) => ({
        runId: r.id,
        ...(content.passages ? { passageIndex: r.state_json.passageIndex ?? 0 } : {}),
        alias: aliases.get(r.id)!,
        avatarId: r.avatar_id ?? avatarFor(r.learner_id),
        avatarPalette: r.avatar_palette ?? paletteFor(r.learner_id),
        position:
          mapped(r.mechanics_version)
            ? r.position
            : ladderPosition(r.state_json),
        finished:
          r.state_json.choices.length === content.items.length &&
          r.state_json.choices.every(
            (x: { outcome: string }) => x.outcome !== "repair",
          ),
        needsHelp: r.state_json.helpRequested,
        ...(mapped(r.mechanics_version)
          ? { lastTransition: r.last_transition_json ?? null }
          : {}),
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
      const content = resolveLadderContent(row.content_version);
      const passage = content && passagesFor(content)[row.state_json.passageIndex ?? 0];
      if (!passage || index < passage.fromItem || row.state_json.choices.length !== passage.toItem)
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
          "SELECT e.*,r.learner_id,r.activity_version_id,r.passage_versions_json,r.content_version FROM ladder_event e JOIN ladder_run r ON r.id=e.run_id WHERE e.id=$1 AND r.learner_id=$2",
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
      const content = resolveLadderContent(row.content_version);
      const item = content?.items[row.action_json.item];
      if (!content || !item) throw new LadderError("activity_version_unavailable", 409);
      let result = fallback();
      try {
        const provider = createFeedbackProvider({
          ...process.env,
          OPENAI_TIMEOUT_MS: "12000",
          OPENAI_MAX_OUTPUT_TOKENS: "900",
        });
        const review = await provider.review({
          activityVersionId: pinsFor(content, row)[Math.max(0, content.passages?.findIndex((passage) => row.action_json.item >= passage.fromItem && row.action_json.item < passage.toItem) ?? 0)],
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

  async catalogue(actor: LadderActor) {
    const available = [];
    const contents = process.env.LADDER_START_VERSION === "legacy" ? [startContent()] : gameContents;
    for (const content of contents) {
      try { await publishedVersions(content, actor); }
      catch (error) {
        if (error instanceof LadderError) continue;
        throw error;
      }
      available.push({ id: content.activityId, title: content.title, durationMs: content.durationMs,
        questionCount: content.items.length, ...(content.passages ? { passageCount: content.passages.length } : {}) });
    }
    return available;
  }
}
export const ladderRepository = new PostgresLadderRepository();
