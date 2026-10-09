import type { BilingualText } from "../feedback";
export const LADDER_VERSION = "listening-ladder.v2";
export type TaskOutcome = "matched" | "repair" | "revised" | "supported";
export type LadderState = {
  choices: Array<{
    choice: number | null;
    outcome: TaskOutcome;
    tries: number;
  }>;
  helpRequested: boolean;
};
export const emptyLadder = (): LadderState => ({
  choices: [],
  helpRequested: false,
});
export type LadderAction =
  | { kind: "choice"; item: number; choice: number | null }
  | { kind: "repair"; item: number; choice: number; explanation: string }
  | { kind: "support"; item: number; explanation: string }
  | { kind: "help" }
  | { kind: "teacher_close"; item: number; explanation: string };
export class LadderError extends Error {
  constructor(
    readonly code: string,
    readonly status = 400,
  ) {
    super(code);
  }
}
export function advanceLadder(
  state: LadderState,
  action: LadderAction,
  keys: Array<{ first: number; repair: number }>,
): LadderState {
  const next = structuredClone(state);
  if (action.kind === "help") {
    next.helpRequested = true;
    return next;
  }
  const key = keys[action.item];
  if (!key) throw new LadderError("invalid_task");
  if (action.kind === "choice") {
    if (action.item !== state.choices.length)
      throw new LadderError("task_order", 409);
    if (
      action.choice !== null &&
      (!Number.isInteger(action.choice) ||
        action.choice < 0 ||
        action.choice > 2)
    )
      throw new LadderError("invalid_choice");
    next.choices.push({
      choice: action.choice,
      outcome: action.choice === key.first ? "matched" : "repair",
      tries: 0,
    });
  } else {
    if (state.choices.length !== keys.length)
      throw new LadderError("finish_listening_first", 409);
    const task = next.choices[action.item];
    if (!task || task.outcome !== "repair")
      throw new LadderError("task_closed", 409);
    if (
      action.explanation.trim().length < 3 ||
      action.explanation.length > 1200
    )
      throw new LadderError("explanation_required");
    if (action.kind === "support" && task.tries < 1)
      throw new LadderError("try_replay_first", 409);
    if (action.kind === "repair" && task.tries >= 2)
      throw new LadderError("use_supported_review", 409);
    task.tries += 1;
    if (action.kind === "teacher_close" || action.kind === "support")
      task.outcome = "supported";
    else if (action.choice === key.repair) task.outcome = "revised";
  }
  if (
    next.choices.length === keys.length &&
    next.choices.every((x) => x.outcome !== "repair")
  )
    next.helpRequested = false;
  return next;
}
export function ladderPosition(state: LadderState, total = 4) {
  if (
    state.choices.length === total &&
    state.choices.every((x) => x.outcome !== "repair")
  )
    return 12;
  const debt = state.choices.filter(
    (x) => x.outcome === "repair" && x.choice !== null,
  ).length;
  return Math.max(0, Math.min(11, state.choices.length * 3 - debt * 2));
}
export type LadderItemView = {
  id: string;
  title: BilingualText;
  prompt: BilingualText;
  options: BilingualText[];
  startMs: number;
  endMs: number;
  repair?: {
    prompt: BilingualText;
    options: BilingualText[];
    focus: BilingualText;
    hint: BilingualText;
    supportedMeaning?: BilingualText;
  };
};
export type LadderView = {
  contractVersion: typeof LADDER_VERSION;
  runId: string;
  revision: number;
  title: string;
  audioUrl: string;
  alias: string;
  avatarId: string;
  pin: string | null;
  sessionClosed: boolean;
  state: LadderState;
  position: number;
  items: LadderItemView[];
  latestNote: BilingualText | null;
  latestEventId: string | null;
};
export type HostView = {
  pin: string;
  closed: boolean;
  players: Array<{
    alias: string;
    avatarId: string;
    position: number;
    finished: boolean;
    needsHelp: boolean;
    runId: string;
  }>;
};
