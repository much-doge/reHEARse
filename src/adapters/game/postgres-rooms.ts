import { randomInt } from "node:crypto";
import type { PoolClient } from "pg";
import { getPool } from "@/adapters/db/client";
import type { GameActor, RoomPort } from "@/application/game/room-port";
import {
  deckSchema,
  gamePoints,
  nextPhase,
  publicRound,
  type GameView,
  type Phase,
} from "@/domain/game/contracts";
export class GameError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function room(client: PoolClient, pin: string) {
  const q = await client.query(
    "SELECT r.*,d.title,d.version,d.rounds FROM game_room r JOIN game_deck d ON d.id=r.deck_id WHERE r.pin=$1 AND r.expires_at>now() FOR UPDATE OF r",
    [pin],
  );
  if (!q.rowCount)
    throw new GameError(404, "Room unavailable / Ruang tidak tersedia");
  return q.rows[0];
}
async function identity(
  client: PoolClient,
  r: Record<string, unknown>,
  actor: GameActor,
) {
  const host = actor.userId === r.owner_id;
  const q = actor.tokenHash
    ? await client.query(
        "SELECT id,alias FROM game_player WHERE room_id=$1 AND token_hash=$2",
        [r.id, actor.tokenHash],
      )
    : null;
  if (!host && !q?.rowCount)
    throw new GameError(401, "Join this room / Gabung ruang ini");
  return { host, player: q?.rows[0] };
}
async function transaction<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await getPool().connect();
  try {
    await c.query("BEGIN");
    const v = await fn(c);
    await c.query("COMMIT");
    return v;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
export const rooms: RoomPort = {
  async create(ownerId) {
    return transaction(async (c) => {
      await c.query("SELECT id FROM app_user WHERE id=$1 FOR UPDATE", [
        ownerId,
      ]);
      const active = await c.query(
        "SELECT count(*)::int AS n FROM game_room WHERE owner_id=$1 AND expires_at>now() AND phase<>'finished'",
        [ownerId],
      );
      if (active.rows[0].n >= 10)
        throw new GameError(
          409,
          "Finish an existing room first / Selesaikan ruang yang ada dahulu",
        );
      const d = await c.query(
        "SELECT id FROM game_deck ORDER BY created_at DESC LIMIT 1",
      );
      if (!d.rowCount)
        throw new GameError(503, "Deck not prepared / Paket belum tersedia");
      for (let n = 0; n < 10; n++) {
        const pin = String(randomInt(100000, 1000000));
        const q = await c.query(
          "INSERT INTO game_room(pin,owner_id,deck_id) VALUES($1,$2,$3) ON CONFLICT(pin) DO NOTHING RETURNING pin",
          [pin, ownerId, d.rows[0].id],
        );
        if (q.rowCount) return pin;
      }
      throw new GameError(503, "Try again / Coba lagi");
    });
  },
  async join(pin, tokenHash) {
    await transaction(async (c) => {
      const r = await room(c, pin);
      if (r.phase === "finished")
        throw new GameError(409, "Room finished / Ruang selesai");
      const n = await c.query(
        "SELECT count(*)::int AS n FROM game_player WHERE room_id=$1",
        [r.id],
      );
      if (n.rows[0].n >= 150)
        throw new GameError(409, "Room full / Ruang penuh");
      await c.query(
        "INSERT INTO game_player(room_id,token_hash,alias) VALUES($1,$2,$3)",
        [r.id, tokenHash, `Team ${String(n.rows[0].n + 1).padStart(2, "0")}`],
      );
    });
  },
  async view(pin, actor) {
    return transaction(async (c) => {
      const r = await room(c, pin);
      const who = await identity(c, r, actor);
      const deck = deckSchema.parse({
        version: r.version,
        title: r.title,
        rounds: r.rounds,
      });
      const phase = r.phase as Phase;
      const round = deck.rounds[r.round_index];
      const cloud = await c.query(
        "SELECT x.id,x.term,COALESCE((SELECT visible FROM game_cloud_decision WHERE cloud_id=x.id ORDER BY id DESC LIMIT 1),false) AS visible FROM game_cloud x WHERE room_id=$1 AND round_index=$2 ORDER BY created_at",
        [r.id, r.round_index],
      );
      const grouped = new Map<
        string,
        { id: string; term: string; count: number }
      >();
      for (const x of cloud.rows.filter((x) => x.visible)) {
        const old = grouped.get(x.term);
        grouped.set(x.term, {
          id: x.id,
          term: x.term,
          count: (old?.count ?? 0) + 1,
        });
      }
      const players = await c.query(
        "SELECT count(*)::int AS n FROM game_player WHERE room_id=$1",
        [r.id],
      );
      const own = who.player
        ? await c.query(
            "SELECT EXISTS(SELECT 1 FROM game_answer WHERE player_id=$1 AND round_index=$2) answered,EXISTS(SELECT 1 FROM game_cloud WHERE player_id=$1 AND round_index=$2) submitted",
            [who.player.id, r.round_index],
          )
        : null;
      const leaderboard = ["review", "finished"].includes(phase)
        ? await c.query(
            "SELECT p.alias,COALESCE(sum(a.points),0)::int AS points FROM game_player p LEFT JOIN game_answer a ON a.player_id=p.id WHERE p.room_id=$1 AND (a.round_index IS NULL OR a.round_index<=$2) GROUP BY p.id ORDER BY points DESC,p.created_at LIMIT 150",
            [r.id, r.round_index],
          )
        : null;
      return {
        contractVersion: "classroom-game.v1",
        id: r.id,
        pin: r.pin,
        revision: r.revision,
        phase,
        roundIndex: r.round_index,
        total: deck.rounds.length,
        title: r.title,
        serverNow: Date.now(),
        deadline: r.deadline ? new Date(r.deadline).getTime() : null,
        host: who.host,
        alias: who.player?.alias ?? null,
        answered: own?.rows[0].answered ?? false,
        cloudSubmitted: own?.rows[0].submitted ?? false,
        players: players.rows[0].n,
        round: {
          ...publicRound(round, phase),
          ...(who.host && ["listen", "comprehend", "review"].includes(phase)
            ? { audioUrl: round.audioUrl }
            : {}),
        },
        cloud: [...grouped.values()],
        pending: who.host
          ? cloud.rows
              .filter((x) => !x.visible)
              .map((x) => ({ id: x.id, term: x.term }))
          : [],
        leaderboard: leaderboard?.rows ?? [],
      } as GameView;
    });
  },
  async act(pin, actor, a) {
    await transaction(async (c) => {
      const r = await room(c, pin);
      const who = await identity(c, r, actor);
      if (r.revision !== a.revision)
        throw new GameError(
          409,
          "Round changed; refreshed / Putaran berubah; diperbarui",
        );
      const deck = deckSchema.parse({
        version: r.version,
        title: r.title,
        rounds: r.rounds,
      });
      if (["advance", "finish", "moderate"].includes(a.kind)) {
        if (!who.host) throw new GameError(403, "Teacher only / Khusus guru");
        if (a.kind === "moderate") {
          const x = await c.query(
            "SELECT id,term FROM game_cloud WHERE id=$1 AND room_id=$2 AND round_index=$3",
            [a.cloudId, r.id, r.round_index],
          );
          if (!x.rowCount) throw new GameError(404, "Term unavailable");
          if (a.visible === true) {
            await c.query(
              "INSERT INTO game_cloud_decision(cloud_id,owner_id,visible) VALUES($1,$2,true)",
              [a.cloudId, actor.userId],
            );
          } else {
            // The displayed cloud aggregates matching phrases: hide every occurrence.
            await c.query(
              "INSERT INTO game_cloud_decision(cloud_id,owner_id,visible) SELECT id,$1,false FROM game_cloud WHERE room_id=$2 AND round_index=$3 AND term=$4",
              [actor.userId, r.id, r.round_index, x.rows[0].term],
            );
          }
          return;
        }
        const next =
          a.kind === "finish"
            ? { phase: "finished", index: r.round_index }
            : nextPhase(r.phase, r.round_index, deck.rounds.length);
        const duration = Math.min(90, Math.max(15, a.duration ?? 30));
        await c.query(
          "UPDATE game_room SET phase=$2,round_index=$3,revision=revision+1,opened_at=CASE WHEN $2='quiz' THEN now() ELSE NULL END,deadline=CASE WHEN $2='quiz' THEN now()+make_interval(secs=>$4) ELSE NULL END WHERE id=$1",
          [r.id, next.phase, next.index, duration],
        );
        return;
      }
      if (!who.player) throw new GameError(403, "Players only / Khusus pemain");
      if (a.kind === "cloud") {
        if (r.phase !== "comprehend")
          throw new GameError(409, "Wait for comprehension / Tunggu pemahaman");
        const term = a.term
          ?.normalize("NFKC")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ");
        if (!term || term.length > 40 || /[\x00-\x1f]/.test(term))
          throw new GameError(
            400,
            "Use 1–40 characters / Gunakan 1–40 karakter",
          );
        await c.query(
          "INSERT INTO game_cloud(room_id,player_id,round_index,term) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",
          [r.id, who.player.id, r.round_index, term],
        );
        return;
      }
      if (a.kind === "answer") {
        const now = await c.query("SELECT clock_timestamp() AS t");
        const t = new Date(now.rows[0].t).getTime();
        if (r.phase !== "quiz" || t >= new Date(r.deadline).getTime())
          throw new GameError(409, "Quiz closed / Kuis ditutup");
        if (
          a.choice === undefined ||
          !Number.isInteger(a.choice) ||
          a.choice < 0 ||
          a.choice > 3
        )
          throw new GameError(400, "Choose an option");
        const points = gamePoints(
          a.choice === deck.rounds[r.round_index].answer,
          t - new Date(r.opened_at).getTime(),
          new Date(r.deadline).getTime() - new Date(r.opened_at).getTime(),
        );
        await c.query(
          "INSERT INTO game_answer(room_id,player_id,round_index,choice,points) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING",
          [r.id, who.player.id, r.round_index, a.choice, points],
        );
        return;
      }
      throw new GameError(400, "Unknown action");
    });
  },
};
