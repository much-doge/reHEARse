import { describe, expect, it } from "vitest";
import { aggregateTeacherQuestionAnalytics } from "./teacher-question-analytics";

describe("aggregateTeacherQuestionAnalytics", () => {
  it("keeps the 50/40/50 question ranges and counts responses by item", () => {
    const result = aggregateTeacherQuestionAnalytics([
      {
        sections: { listening: { correct: 1, incorrect: 0, omitted: 0, total: 50 } },
        review: [
          { section: "listening", question: 1, selected: "A", correctAnswer: "A", correct: true },
          { section: "listening", question: 2, selected: "B", correctAnswer: "C", correct: false },
          { section: "listening", question: 3, selected: null, correctAnswer: "D", correct: false },
        ],
      },
      {
        section: "listening", summary: { correct: 1, incorrect: 0, omitted: 0, total: 50 },
        review: [{ section: "listening", question: 1, selected: "C", correctAnswer: "C", correct: true }],
      },
    ]);
    expect(result.completedAttempts).toBe(2);
    expect(result.sections.listening.questions).toBe(50);
    expect(result.sections.structure.questions).toBe(40);
    expect(result.sections.reading.questions).toBe(50);
    expect(result.sections.listening.rows[0]).toMatchObject({ seen: 2, correct: 2, incorrect: 0, omitted: 0, choices: { A: 1, C: 1 } });
    expect(result.sections.listening.rows[1]).toMatchObject({ seen: 1, correct: 0, incorrect: 1, choices: { B: 1 } });
    expect(result.sections.listening.rows[2]).toMatchObject({ seen: 1, correct: 0, incorrect: 0, omitted: 1 });
  });

  it("uses the registered package counts instead of a dashboard constant", () => {
    const result = aggregateTeacherQuestionAnalytics([], "ets-volume3-practice-test-a");
    expect(result.sections).toMatchObject({
      listening: { questions: 50 },
      structure: { questions: 40 },
      reading: { questions: 50 },
    });
  });
});

