import type { LadderState, LadderItemView } from "../../domain/ladder/model";
export function listeningStage(state: LadderState, total: number, passage?: { fromItem: number; toItem: number }) {
  const from = passage?.fromItem ?? 0, end = passage?.toItem ?? total;
  const first = state.choices.length;
  const localRepair = state.choices.slice(from, end).findIndex((choice) => choice.outcome === "repair");
  const repair = localRepair < 0 ? -1 : from + localRepair;
  return { index: first < end ? first : repair, repairing: first === end && repair >= 0,
    finished: total > 0 && first === total && repair < 0 };
}
export function listeningSpan(items: LadderItemView[], index: number, whole = false) {
  const selected = whole ? items : items[index] ? [items[index]] : [];
  if (!selected.length || selected.some((item) => !Number.isInteger(item.startMs) || !Number.isInteger(item.endMs) || item.startMs < 0 || item.endMs <= item.startMs)) return null;
  return { startMs: Math.min(...selected.map((item) => item.startMs)), endMs: Math.max(...selected.map((item) => item.endMs)) };
}
export function formatAudioTime(ms: number) {
  const value = Math.max(0, Math.round(ms));
  return `${Math.floor(value / 60000)}:${String(Math.floor(value / 1000) % 60).padStart(2, "0")}.${String(value % 1000).padStart(3, "0")}`;
}
