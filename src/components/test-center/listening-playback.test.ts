import { describe, expect, it } from "vitest";

import { listeningContextQuestionsAtPosition, listeningQuestionAtPosition, listeningQuestionCueMs } from "./listening-playback";

const timing = [
  { question: 30, groupId: "part-a", groupType: "question", questionAudioStartMs: 900, contextStartMs: 900, answerWindowStartMs: 1_000, answerWindowEndMs: 1_100 },
  { question: 31, groupId: "part-b-1", groupType: "conversation", questionAudioStartMs: 1_200, contextStartMs: 1_200, answerWindowStartMs: 8_500, answerWindowEndMs: 8_620 },
  { question: 32, groupId: "part-b-1", groupType: "conversation", questionAudioStartMs: 8_700, contextStartMs: 1_200, answerWindowStartMs: 9_000, answerWindowEndMs: 9_120 },
  { question: 33, groupId: "part-b-1", groupType: "conversation", questionAudioStartMs: 9_120, contextStartMs: 1_200, answerWindowStartMs: 9_500, answerWindowEndMs: 9_620 },
];

describe("Listening timing transitions", () => {
  it("shows the complete mapped group during its context lead-in, then returns to one question at its cue", () => {
    expect(listeningContextQuestionsAtPosition(timing, 1_250)).toEqual([31, 32, 33]);
    expect(listeningQuestionAtPosition(timing, 1_250)).toBeNull();
    expect(listeningQuestionAtPosition(timing, listeningQuestionCueMs(timing[1]))).toBe(31);
    expect(listeningContextQuestionsAtPosition(timing, 8_700)).toEqual([]);
    expect(listeningQuestionAtPosition(timing, 8_800)).toBe(32);
  });

  it("keeps only selected questions for a focused group", () => {
    expect(listeningContextQuestionsAtPosition(timing, 1_250, [32, 33])).toEqual([32, 33]);
    expect(listeningQuestionAtPosition(timing, 8_800, [32, 33])).toBe(32);
  });
});

