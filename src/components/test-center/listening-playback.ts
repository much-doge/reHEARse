export type ListeningTimingQuestion = {
  question: number;
  groupId: string;
  groupType: string;
  questionAudioStartMs: number;
  answerWindowEndMs: number;
  contextStartMs: number;
  answerWindowStartMs: number;
};

export const LISTENING_RECOVERY_GRACE_MS = 3_000;

export function listeningQuestionCueMs(item: ListeningTimingQuestion) {
  const isGroupLead = item.groupType !== "question" && item.questionAudioStartMs === item.contextStartMs;
  return isGroupLead ? Math.max(item.questionAudioStartMs, item.answerWindowStartMs - 7_000) : item.questionAudioStartMs;
}

export function listeningPlaybackStartMs(item: ListeningTimingQuestion, withContext = false) {
  return withContext ? item.contextStartMs : item.questionAudioStartMs;
}

function eligibleGroupItems(timing: ListeningTimingQuestion[], item: ListeningTimingQuestion, selectedQuestions?: number[] | null) {
  const selected = selectedQuestions?.length ? new Set(selectedQuestions) : null;
  return timing.filter((candidate) => candidate.groupId === item.groupId && (!selected || selected.has(candidate.question)));
}

export function listeningContextQuestionsAtPosition(timing: ListeningTimingQuestion[], positionMs: number, selectedQuestions?: number[] | null) {
  const groupLead = timing.find((item) => item.groupType !== "question" && positionMs >= item.contextStartMs && positionMs < item.answerWindowEndMs);
  if (!groupLead) return [];
  const group = eligibleGroupItems(timing, groupLead, selectedQuestions);
  const first = group[0];
  return first && positionMs < listeningQuestionCueMs(first) ? group.map((item) => item.question) : [];
}

export function listeningQuestionAtPosition(timing: ListeningTimingQuestion[], positionMs: number, selectedQuestions?: number[] | null) {
  const selected = selectedQuestions?.length ? new Set(selectedQuestions) : null;
  const candidates = timing.filter((item) => (!selected || selected.has(item.question)) && positionMs >= listeningQuestionCueMs(item) && positionMs < item.answerWindowEndMs);
  return candidates.at(-1)?.question ?? null;
}

/** Return a bounded media-only rewind point for a recovered Listening player. */
export function listeningRecoveryPosition(timing: ListeningTimingQuestion[], positionMs: number, graceMs = LISTENING_RECOVERY_GRACE_MS) {
  const safePosition = Math.max(0, Math.round(positionMs));
  if (safePosition === 0) return 0;
  const safeGrace = Math.max(0, Math.min(LISTENING_RECOVERY_GRACE_MS, Math.round(graceMs)));
  const current = timing.find((item) => safePosition >= item.contextStartMs && safePosition < item.answerWindowEndMs);
  const groupLead = current && current.groupType !== "question" && current.questionAudioStartMs === current.contextStartMs;
  const boundary = groupLead
    ? safePosition < listeningQuestionCueMs(current) ? current.contextStartMs : listeningQuestionCueMs(current)
    : current?.questionAudioStartMs;
  return Math.max(boundary ?? 0, safePosition - safeGrace);
}

