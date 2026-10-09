import type { LadderView } from "@/domain/ladder/model";

/** An appearance response must never roll a newer task back or reopen an old run. */
export function reconcileLadderView(previous: LadderView | null, next: LadderView, allowNewRun = false) {
  if (!previous) return allowNewRun ? next : null;
  if (previous.runId !== next.runId) return allowNewRun ? next : previous;
  if (next.revision < previous.revision) return previous;
  if (next.latestEventId === previous.latestEventId && next.latestNote === null && previous.latestNote !== null)
    return { ...next, latestNote: previous.latestNote };
  return next;
}

export function ladderTaskKey(view: LadderView | null) {
  return `${view?.runId}:${view?.state.choices.length}:${view?.state.choices.findIndex((choice) => choice.outcome === "repair")}`;
}
