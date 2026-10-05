import { describe, expect, it } from "vitest";

import { activityPackageSchema } from "./activity-package";

const validPackage = {
  contractVersion: "listening-activity-package.v1",
  slug: "three-papers",
  title: "Three papers",
  partLabel: "Part B",
  prompt: { en: "What changed?", id: "Apa yang berubah?" },
  transcript: {
    text: "Speaker A: Hello.",
    segments: [{ id: "s1", startMs: 0, endMs: 900, text: "Hello." }],
  },
  teacherGuide: "Focus on the change in approach.",
  questions: [
    {
      id: "q1",
      number: 1,
      kind: "multiple_choice",
      prompt: { en: "What changed?" },
      options: [{ id: "a", text: { en: "The topic" } }],
      answer: { optionIds: ["a"] },
      transcriptSegmentIds: ["s1"],
    },
  ],
  source: { packageCode: "1163" },
};

describe("activityPackageSchema", () => {
  it("keeps a small typed spine while accepting question extensions", () => {
    const parsed = activityPackageSchema.parse({
      ...validPackage,
      questions: [{ ...validPackage.questions[0], extensions: { difficultyHint: "teacher-only" } }],
    });
    expect(parsed.questions[0].kind).toBe("multiple_choice");
    expect(parsed.transcript.language).toBe("en");
  });

  it("rejects dangling transcript links and duplicate identifiers", () => {
    const result = activityPackageSchema.safeParse({
      ...validPackage,
      questions: [
        { ...validPackage.questions[0], transcriptSegmentIds: ["missing"] },
        validPackage.questions[0],
      ],
    });
    expect(result.success).toBe(false);
  });
});
