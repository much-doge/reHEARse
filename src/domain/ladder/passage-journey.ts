import { advanceChapterJourney, LadderError, type LadderAction, type LadderState } from "./model";
import type { JourneyTransition } from "./journey-contract";

type Key = { first: number; repair: number; firstCount?: number; repairCount?: number };
export function passageRange(sizes: number[], index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= sizes.length || sizes.some((size) => ![3, 4, 5].includes(size)))
    throw new LadderError("invalid_passage", 409);
  const fromItem = sizes.slice(0, index).reduce((sum, size) => sum + size, 0);
  return { fromItem, toItem: fromItem + sizes[index] };
}
export function passageComplete(state: LadderState, sizes: number[]) {
  const { fromItem, toItem } = passageRange(sizes, state.passageIndex ?? 0);
  return state.choices.length === toItem && state.choices.slice(fromItem, toItem).every((choice) => choice.outcome !== "repair");
}
/** One saved run; only the current recording can receive choices or repairs. */
export function advancePassageJourney(state: LadderState, position: number, action: LadderAction,
  keys: Key[], sizes: number[], eventId: string, revision: number): { state: LadderState; position: number; transition: JourneyTransition } {
  const index = state.passageIndex ?? 0;
  const { fromItem, toItem } = passageRange(sizes, index);
  if (sizes.reduce((sum, size) => sum + size, 0) !== keys.length || state.choices.length < fromItem || state.choices.length > toItem ||
    state.choices.slice(0, fromItem).some((choice) => choice.outcome === "repair"))
    throw new LadderError("invalid_passage_state", 409);
  if (action.kind === "continue") {
    if (!passageComplete(state, sizes) || index === sizes.length - 1)
      throw new LadderError("checkpoint_not_ready", 409);
    return { state: { ...structuredClone(state), passageIndex: index + 1, helpRequested: false }, position: 0,
      transition: { eventId, revision, steps: [] } };
  }
  if (action.kind !== "help" && (!Number.isInteger(action.item) || action.item < fromItem || action.item >= toItem))
    throw new LadderError("invalid_task", 409);
  const localAction = action.kind === "help" ? action : { ...action, item: action.item - fromItem };
  const advanced = advanceChapterJourney({ choices: state.choices.slice(fromItem), helpRequested: state.helpRequested },
    position, localAction, keys.slice(fromItem, toItem), eventId, revision);
  return { ...advanced, state: { ...advanced.state, choices: [...structuredClone(state.choices.slice(0, fromItem)), ...advanced.state.choices], passageIndex: index } };
}
