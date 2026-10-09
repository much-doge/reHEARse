import type { HostView, LadderAction, LadderView } from "@/domain/ladder/model";
import type { AvatarId } from "@/domain/ladder/avatars";
import type { AvatarPaletteId } from "@/domain/ladder/appearance";
import type { LadderActivityChoice } from "@/domain/ladder/journey-contract";
export type LadderActor = { id: string; role: "learner" | "teacher" | "admin" };
export interface LadderRepository {
  view(actor: LadderActor, runId?: string): Promise<LadderView | null>;
  start(actor: LadderActor, id: string, pin?: string, activityId?: string): Promise<LadderView>;
  act(
    actor: LadderActor,
    runId: string,
    revision: number,
    key: string,
    action: LadderAction,
  ): Promise<LadderView>;
  setAvatar(
    actor: LadderActor,
    runId: string,
    avatarId: AvatarId,
    paletteId?: AvatarPaletteId,
    alias?: string,
  ): Promise<LadderView>;
  ready(actor: LadderActor, runId: string): Promise<LadderView>;
  beginSession(actor: LadderActor, pin: string): Promise<HostView>;
  createSession(actor: LadderActor, key: string, activityId?: string): Promise<HostView>;
  catalogue(actor: LadderActor, format?: "single" | "passage"): Promise<LadderActivityChoice[]>;
  host(actor: LadderActor, pin: string): Promise<HostView>;
  closeSession(actor: LadderActor, pin: string): Promise<HostView>;
}
