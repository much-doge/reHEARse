import { describe, expect, it } from "vitest";

import { effectiveDiagnosticResult, type FullDiagnosticResult } from "./diagnostic-effective-result";

const summary = (correct: number, total: number) => ({ correct, incorrect: total - correct, omitted: 0, total, converted: [40 + correct, 41 + correct] as [number, number] });
const original: FullDiagnosticResult = {
  sections: { listening: summary(20, 50), structure: summary(10, 40), reading: summary(30, 50) },
  total: { correct: 60, incorrect: 80, omitted: 0, questions: 140 },
  convertedTotal: [400, 410],
  review: [
    { section: "listening", question: 1, selected: "A", correctAnswer: "A", correct: true },
    { section: "structure", question: 1, selected: "B", correctAnswer: "A", correct: false },
    { section: "reading", question: 1, selected: "C", correctAnswer: "C", correct: true },
  ],
  answers: { "listening:1": "A", "structure:1": "B", "reading:1": "C" },
};

describe("effective diagnostic result", () => {
  it("replaces only the latest teacher-reset section and recalculates totals", () => {
    const effective = effectiveDiagnosticResult(original, [
      { section: "structure", result: { summary: summary(20, 40), review: [{ section: "structure", question: 1, selected: "C", correctAnswer: "C", correct: true }], answers: { "1": "C" } } },
      { section: "structure", result: { summary: summary(30, 40), review: [{ section: "structure", question: 1, selected: "A", correctAnswer: "A", correct: true }], answers: { "1": "A" } } },
    ]);
    expect(effective.sections.structure.correct).toBe(30);
    expect(effective.sections.listening).toEqual(original.sections.listening);
    expect(effective.total).toEqual({ correct: 80, incorrect: 60, omitted: 0, questions: 140 });
    expect(effective.answers?.["structure:1"]).toBe("A");
    expect(original.sections.structure.correct).toBe(10);
  });

  it("returns the original result when there are no teacher resets", () => {
    expect(effectiveDiagnosticResult(original, [])).toBe(original);
  });
});
