import { z } from "zod";
export const roundSchema = z.object({
  number: z.number().int().positive(),
  audioUrl: z.string().url(),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  answer: z.number().int().min(0).max(3),
  cue: z.object({ en: z.string().min(1), id: z.string().min(1) }),
  explanation: z.object({ en: z.string().min(1), id: z.string().min(1) }),
});
export const deckSchema = z.object({
  version: z.string().min(1),
  title: z.string().min(1),
  rounds: z.array(roundSchema).min(1).max(30),
});
export type Round = z.infer<typeof roundSchema>;
export type Phase =
  | "lobby"
  | "listen"
  | "comprehend"
  | "quiz"
  | "review"
  | "finished";
export function nextPhase(
  phase: Phase,
  index: number,
  total: number,
): { phase: Phase; index: number } {
  switch (phase) {
    case "lobby":
      return { phase: "listen", index };
    case "listen":
      return { phase: "comprehend", index };
    case "comprehend":
      return { phase: "quiz", index };
    case "quiz":
      return { phase: "review", index };
    case "review":
      return index + 1 < total
        ? { phase: "listen", index: index + 1 }
        : { phase: "finished", index };
    case "finished":
      throw new Error("Room finished");
  }
}
export function gamePoints(
  correct: boolean,
  elapsed: number,
  duration: number,
) {
  if (!correct) return 0;
  return (
    1000 + Math.round(200 * Math.max(0, Math.min(1, 1 - elapsed / duration)))
  );
}
export function publicRound(round: Round, phase: Phase) {
  return {
    number: round.number,
    ...(["quiz", "review"].includes(phase)
      ? { prompt: round.prompt, options: round.options }
      : {}),
    ...(phase === "review"
      ? { answer: round.answer, cue: round.cue, explanation: round.explanation }
      : {}),
  };
}
export type GameView = {
  contractVersion: "classroom-game.v1";
  id: string;
  pin: string;
  revision: number;
  phase: Phase;
  roundIndex: number;
  total: number;
  title: string;
  serverNow: number;
  deadline: number | null;
  host: boolean;
  alias: string | null;
  answered: boolean;
  cloudSubmitted: boolean;
  players: number;
  round: ReturnType<typeof publicRound> & { audioUrl?: string };
  cloud: { id: string; term: string; count: number }[];
  pending: { id: string; term: string }[];
  leaderboard: { alias: string; points: number }[];
};
