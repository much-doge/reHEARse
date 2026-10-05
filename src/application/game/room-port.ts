import type { GameView } from "@/domain/game/contracts";
export type GameActor = { userId?: string; tokenHash?: string };
export interface RoomPort {
  create(ownerId: string): Promise<string>;
  join(pin: string, tokenHash: string): Promise<void>;
  view(pin: string, actor: GameActor): Promise<GameView>;
  act(
    pin: string,
    actor: GameActor,
    action: {
      kind: string;
      revision: number;
      choice?: number;
      term?: string;
      cloudId?: string;
      visible?: boolean;
      duration?: number;
    },
  ): Promise<void>;
}
