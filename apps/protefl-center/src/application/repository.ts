import type { ListeningAction, ListeningView } from "@protefl/domain/listening";

export interface ListeningPilotRepository {
  view(actorId: string): Promise<ListeningView>;
  act(actorId: string, action: ListeningAction): Promise<ListeningView>;
  media(actorId: string, attemptId: string, itemId: string): Promise<{ storageKey: string; contentType: string }>;
}
