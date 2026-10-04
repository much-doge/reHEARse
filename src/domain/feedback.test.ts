import { describe, expect, it } from "vitest";

import {
  assertNoAssessmentMetrics,
  parseListeningFeedback,
} from "./feedback";

const validFeedback = {
  contractVersion: "listening-feedback.v1",
  summary: {
    en: "You captured the main situation, while the final outcome is still unclear.",
    id: "Kamu menangkap situasi utama, tetapi hasil akhirnya masih belum jelas.",
  },
  observations: [
    {
      kind: "captured",
      message: {
        en: "Your reconstruction shows why the student visited the office.",
        id: "Rekonstruksimu menunjukkan alasan mahasiswa itu datang ke kantor.",
      },
    },
  ],
  nextListeningTarget: {
    en: "On the next listen, focus on what the professor finally agrees to do.",
    id: "Saat mendengarkan lagi, fokuslah pada hal yang akhirnya disetujui profesor.",
  },
} as const;

describe("listening feedback contract", () => {
  it("accepts paired bilingual diagnostic feedback", () => {
    expect(parseListeningFeedback(validFeedback)).toEqual(validFeedback);
  });

  it("rejects a missing Indonesian pair", () => {
    const invalid = {
      ...validFeedback,
      summary: { en: validFeedback.summary.en },
    };

    expect(() => parseListeningFeedback(invalid)).toThrow();
  });

  it("rejects assessment metrics anywhere in provider output", () => {
    const invalid = { ...validFeedback, score: 82 };

    expect(() => assertNoAssessmentMetrics(invalid)).toThrow(
      "Assessment metric 'score' is forbidden",
    );
  });

  it("does not offer numerical assessment fields in the released contract", () => {
    expect(JSON.stringify(validFeedback)).not.toMatch(
      /score|percentage|grade|band|mastery|rank|rating/i,
    );
  });
});

