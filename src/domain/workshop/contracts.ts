/** Independent public workshop contract. No source data, keys or private reasons. */
export const WORKSHOP_VERSION = "part-a-workshop.v1" as const;
export type Text = { en: string; id: string };
export type Option = "A" | "B" | "C" | "D";
export type Skill = "restatement" | "inference" | "negatives" | "functional-expressions" | "passives" | "idioms" | "distractor-recognition";
export type Preparation = {
  questionTask: Text; listeningTarget: Text; procedure: Text[];
  distractorPatterns: Text[]; example: { dialogue: Text; question: Text; discussion: Text };
  inquiryPrompts: [Text, Text]; languageNotes: Text[];
};
export type GroupSummary = { id: string; title: Text; skill: Skill; itemCount: number };
export type PublicItemSummary = { id: string; title: Text; skill: Skill };
export type ItemPhase = "ready" | "timed_choice" | "relisten_1" | "relisten_2" | "guided_compare" | "explain_distractors" | "item_complete";
export type RoomPhase = "preparation" | "practice" | "finished" | "closed";
export type ChoiceResult = { choice: Option | null; result: "correct" | "incorrect"; attempt: number };
export type LearnerAction =
  | { kind: "listen_start"; itemId: string }
  | { kind: "choose"; itemId: string; choice: Option | null }
  | { kind: "explain"; itemId: string; option: Option; text: string }
  | { kind: "next_item"; itemId: string };
export type HostAction = { kind: "open_practice" } | { kind: "next_group" } | { kind: "close" };
export type LearnerView = {
  contractVersion: typeof WORKSHOP_VERSION;
  pin: string; roomRevision: number; revision: number; alias: string; phase: RoomPhase;
  activity: { id: string; version: string; title: Text };
  group: GroupSummary & { preparation: Preparation };
  items: PublicItemSummary[]; groupComplete: boolean;
  current: null | {
    id: string; title: Text; phase: ItemPhase; prompt: Text;
    options: Record<Option, string>; audioUrl: string; durationMs: number;
    startedAt: string | null; answerOpensAt: string | null; deadline: string | null;
    replayStartedAt: string | null; replayEndsAt: string | null;
    result: ChoiceResult | null; hint: Text | null; comparison: Text | null;
    explanations: Partial<Record<Option, string>>; explanationOptions: Option[];
  };
  serverTime: string; expiresAt: string;
};
export type HostView = {
  contractVersion: typeof WORKSHOP_VERSION; pin: string; revision: number; phase: RoomPhase;
  activity: { id: string; version: string; title: Text };
  groups: GroupSummary[]; activeGroup: number; preparation: Preparation;
  participants: Array<{ alias: string }>;
  participantCount: number;
  items: Array<PublicItemSummary & { notStarted: number; firstListenCorrect: number; relistening: number; completed: number }>;
  serverTime: string; expiresAt: string;
};
export type Mutation<T> = { key: string; revision: number; action: T };
export type JoinRequest = { kind: "join"; pin: string; key: string };
export type LearnerRequest = JoinRequest | { kind: "act"; pin: string; key: string; revision: number; action: LearnerAction };
export type HostRequest = { kind: "create"; key: string; version?: string } | { kind: "act"; pin: string; key: string; revision: number; action: HostAction };
