/** Public recreational movement contract. No answer keys or learning judgments. */
export const CHAPTER_JOURNEY_VERSION = "chapter-route.v1" as const;
export type JourneyCause = "first_match" | "first_mismatch" | "uncertain" | "repair_retry" | "repair_revised" | "supported" | "teacher_assisted" | "finish";
export type JourneyStep = {
  kind: "walk" | "snake" | "ladder";
  from: number;
  to: number;
  chapter: number;
  cause: JourneyCause;
};
export type JourneyTransition = {
  eventId: string;
  revision: number;
  steps: JourneyStep[];
};
export type JourneyMap = {
  version: typeof CHAPTER_JOURNEY_VERSION | "chapter-route.v2";
  nodeCount: number;
  connections: Array<{ id: string; kind: "snake" | "ladder"; from: number; to: number; chapter: number }>;
};
export const CHAPTER_JOURNEY_MAP: JourneyMap = {
  version: CHAPTER_JOURNEY_VERSION,
  nodeCount: 14,
  connections: Array.from({ length: 4 }, (_, chapter) => [
    { id: `chapter-${chapter}-snake`, kind: "snake" as const, from: chapter * 3 + 2, to: chapter * 3 + 1, chapter },
    { id: `chapter-${chapter}-ladder`, kind: "ladder" as const, from: chapter * 3 + 1, to: chapter * 3 + 3, chapter },
  ]).flat(),
};
export type LearnerJourney = { map: JourneyMap; lastTransition: JourneyTransition | null };
export type HostJourney = { map: JourneyMap };

/** Published neutral activity choices; no source identifiers or answer material. */
export type LadderActivityChoice = {
  id: string;
  title: import("../feedback").BilingualText;
  durationMs: number;
  questionCount: number;
  passageCount?: number;
};

/** Registered passage maps retain the same executable connectors for 3–5 items. */
export function passageJourneyMap(questionCount: number): JourneyMap {
  if (![3, 4, 5].includes(questionCount)) throw new Error("invalid_passage_size");
  return {
    version: "chapter-route.v2",
    nodeCount: questionCount * 3 + 2,
    connections: Array.from({ length: questionCount }, (_, chapter) => [
      { id: `chapter-${chapter}-snake`, kind: "snake" as const, from: chapter * 3 + 2, to: chapter * 3 + 1, chapter },
      { id: `chapter-${chapter}-ladder`, kind: "ladder" as const, from: chapter * 3 + 1, to: chapter * 3 + 3, chapter },
    ]).flat(),
  };
}
