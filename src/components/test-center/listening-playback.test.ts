import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { listeningContextQuestionsAtPosition, listeningPlaybackStartMs, listeningQuestionAtPosition, listeningQuestionCueMs, listeningRecoveryPosition, type ListeningTimingQuestion } from "./listening-playback";

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

  it("rewinds only within the current mapped question or group context", () => {
    expect(listeningRecoveryPosition(timing, 8_800)).toBe(8_700);
    expect(listeningRecoveryPosition(timing, 8_800, 5_000)).toBe(8_700);
    expect(listeningRecoveryPosition(timing, 1_250)).toBe(1_200);
    expect(listeningRecoveryPosition(timing, 1_500)).toBe(1_500);
    expect(listeningRecoveryPosition(timing, 9_050)).toBe(8_700);
  });

  it("previews every May 2005 group question during its talk and starts replay at the group cue", () => {
    const path = resolve(process.cwd(), "apps/protefl-center/content/ets-toefl-pbt-2005-05-listening-v1/metadata/listening-question-map-v1.json");
    const packageTiming = JSON.parse(readFileSync(path, "utf8")).questions as ListeningTimingQuestion[];
    const grouped = new Map<string, ListeningTimingQuestion[]>();
    for (const item of packageTiming.filter((row) => row.groupType !== "question"))
      grouped.set(item.groupId, [...(grouped.get(item.groupId) ?? []), item]);

    expect(grouped.size).toBe(5);
    for (const items of grouped.values()) {
      const first = items[0];
      expect(listeningPlaybackStartMs(first)).toBe(first.contextStartMs);
      expect(listeningPlaybackStartMs(first, true)).toBe(first.contextStartMs);
      expect(listeningContextQuestionsAtPosition(packageTiming, first.contextStartMs + 1)).toEqual(items.map((item) => item.question));
      expect(listeningQuestionAtPosition(packageTiming, first.contextStartMs + 1)).toBeNull();
    }
  });
});

