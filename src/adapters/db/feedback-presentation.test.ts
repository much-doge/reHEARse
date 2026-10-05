import { describe, it, expect } from "vitest";
import type { ListeningFeedback } from "@/domain/feedback";
import { feedbackPresentation } from "./feedback-presentation";
const original: ListeningFeedback = {
  contractVersion: "listening-feedback.v1",
  summary: {
    en: "Your reconstruction evidences the changed plan.",
    id: "Rekonstruksimu menunjukkan perubahan rencana.",
  },
  observations: [
    {
      kind: "captured",
      message: {
        en: "Your evidence identifies the plan.",
        id: "Bukti menunjukkan rencana.",
      },
    },
  ],
  nextListeningTarget: {
    en: "Listen for the reason.",
    id: "Dengarkan alasannya.",
  },
};
describe("feedback presentation without changing stored records", () => {
  it("uses ordinary language while preserving the original record and listening focus", () => {
    const before = JSON.stringify(original);
    const shown = feedbackPresentation(original);
    expect(JSON.stringify(original)).toBe(before);
    expect(shown).not.toBe(original);
    expect(shown.summary.en).toBe(
      "Your explanation describes the changed plan.",
    );
    expect(shown.summary.id).toBe(
      "penjelasanmu menunjukkan perubahan rencana.",
    );
    expect(JSON.stringify(shown)).not.toMatch(/evidence|bukti|reconstruction/i);
    expect(shown.nextListeningTarget).toEqual(original.nextListeningTarget);
  });
  it("withholds a confidential source label in either language as a paired presentation", () => {
    const shown = feedbackPresentation({
      ...original,
      summary: { en: "Meaning is clear.", id: "Lihat ConTEFL 1163." },
    });
    expect(JSON.stringify(shown)).not.toMatch(/contefl|1163/i);
    expect(shown.summary).toEqual({
      en: "Check your explanation against the audio.",
      id: "Periksa penjelasanmu dengan mendengarkan audio.",
    });
  });
});
