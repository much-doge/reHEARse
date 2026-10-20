import type { HostAction, HostView, LearnerAction, LearnerView } from "@/domain/workshop/contracts";
export type WorkshopActor = { id: string; role: "learner" | "teacher" | "admin" };
export interface WorkshopRepository {
  create(actor: WorkshopActor, key: string, version?: string): Promise<HostView>;
  host(actor: WorkshopActor, pin: string): Promise<HostView>;
  hostAction(actor: WorkshopActor, pin: string, revision: number, key: string, action: HostAction): Promise<HostView>;
  join(pin: string, key: string, tokenHash: string): Promise<LearnerView>;
  learner(pin: string, tokenHash: string): Promise<LearnerView>;
  learnerAction(pin: string, tokenHash: string, revision: number, key: string, action: LearnerAction): Promise<LearnerView>;
}
