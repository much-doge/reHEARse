import type { LearnerAction, Option, ItemPhase, ChoiceResult } from "./contracts";
import type { WorkshopContent, WorkshopItem } from "./content";
export class WorkshopError extends Error {
  constructor(readonly code: string, readonly status = 409) { super(code); }
}
export type ItemState = {
  phase: ItemPhase; startedAt: number | null; answerOpensAt: number | null; deadline: number | null;
  replayStartedAt: number | null; replayEndsAt: number | null; replayCount: number;
  result: ChoiceResult | null; firstCorrect: boolean; explanations: Partial<Record<Option,string>>;
};
export type ParticipantState = { items: Record<string,ItemState>; cursors: Record<string,number> };
export const emptyParticipant = (): ParticipantState => ({ items:{}, cursors:{} });
export const emptyItem = (): ItemState => ({ phase:"ready", startedAt:null, answerOpensAt:null,deadline:null,replayStartedAt:null,replayEndsAt:null,replayCount:0,result:null,firstCorrect:false,explanations:{} });
export const options: Option[] = ["A","B","C","D"];
export function itemAt(content: WorkshopContent, groupIndex: number, state: ParticipantState) {
  const group = content.groups[groupIndex]; if(!group) throw new WorkshopError("group_unavailable");
  const items = content.items.filter(item=>item.groupId===group.id);
  return { group, items, item: items[state.cursors[group.id] ?? 0] ?? null };
}
export function effectivePhase(state: ItemState, now: number): ItemPhase {
  return state.phase === "timed_choice" && now > state.deadline! ? "relisten_1" : state.phase;
}
export function advanceParticipant(before: ParticipantState, item: WorkshopItem, action: LearnerAction, now: number,
  groupItemCount: number): ParticipantState {
  if(action.itemId !== item.id) throw new WorkshopError("item_order");
  const next = structuredClone(before), state = next.items[item.id] ??= emptyItem();
  if(action.kind === "next_item") {
    if(state.phase !== "item_complete") throw new WorkshopError("item_not_complete");
    const current = next.cursors[item.groupId] ?? 0;
    if(current >= groupItemCount) throw new WorkshopError("group_complete");
    next.cursors[item.groupId] = current + 1; return next;
  }
  if(action.kind === "listen_start") {
    if(state.phase === "ready") {
      state.phase="timed_choice"; state.startedAt=now; state.answerOpensAt=now+item.media.durationMs; state.deadline=state.answerOpensAt+12000;
    } else {
      if(state.phase === "timed_choice" && now > state.deadline!) {
        state.phase="relisten_1"; state.result={choice:null,result:"incorrect",attempt:1};
      }
      if(!["relisten_1","relisten_2"].includes(state.phase) || state.replayStartedAt !== null) throw new WorkshopError("listen_already_started");
      state.replayStartedAt=now; state.replayEndsAt=now+item.media.durationMs; state.replayCount++;
    }
    return next;
  }
  if(action.kind === "explain") {
    if(state.phase !== "explain_distractors") throw new WorkshopError("explanation_not_open");
    if(action.option === item.answer || !options.includes(action.option)) throw new WorkshopError("invalid_explanation_option",400);
    if(state.explanations[action.option] !== undefined) throw new WorkshopError("explanation_already_saved");
    const prose=action.text.trim(); if(prose.length<3 || prose.length>400) throw new WorkshopError("explanation_required",400);
    state.explanations[action.option]=prose;
    if(Object.keys(state.explanations).length===3) state.phase="item_complete";
    return next;
  }
  if(action.choice !== null && !options.includes(action.choice)) throw new WorkshopError("invalid_choice",400);
  const phase=state.phase;
  if(phase === "timed_choice") {
    if(now < state.answerOpensAt!) throw new WorkshopError("answer_not_open");
    if(now > state.deadline!) throw new WorkshopError("deadline_elapsed");
  } else if(phase === "relisten_1" || phase === "relisten_2") {
    if(state.replayEndsAt === null || now < state.replayEndsAt) throw new WorkshopError("replay_required");
  } else if(phase !== "guided_compare") throw new WorkshopError("choice_not_open");
  const correct=action.choice === item.answer;
  state.result={choice:action.choice,result:correct ? "correct":"incorrect",attempt:phase==="timed_choice"?1:phase==="relisten_1"?2:phase==="relisten_2"?3:4};
  if(phase==="timed_choice") state.firstCorrect=correct;
  if(correct || phase === "guided_compare") state.phase="explain_distractors";
  else state.phase=phase==="timed_choice" ? "relisten_1" : phase==="relisten_1" ? "relisten_2" : "guided_compare";
  state.replayStartedAt=null;state.replayEndsAt=null;
  return next;
}
