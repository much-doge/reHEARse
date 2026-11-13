import { describe, expect, it } from "vitest";

import packageV4 from "../../content/vocabulary/toefl-itp-full-frequency.v4.json";
import packageV5 from "../../content/vocabulary/toefl-itp-full-frequency.v5.json";

const roles = new Set(["Noun", "Verb", "Adjective", "Adverb"]);

describe("TOEFL vocabulary package v4", () => {
  it("publishes the complete reviewed contextual deck as single-role exposures", () => {
    expect(packageV4.contractVersion).toBe("toefl-vocabulary-package.v4");
    expect(packageV4.version).toBe(4);
    expect(packageV4.cardCount).toBe(2_948);
    expect(packageV4.cards).toHaveLength(packageV4.cardCount);

    const identities = new Set<string>();
    for (const card of packageV4.cards) {
      expect(roles.has(card.targetPart)).toBe(true);
      expect(card.partsOfSpeech).toEqual([card.targetPart]);
      expect(card.example.sentence.trim()).toMatch(/[.!?]$/);
      expect(card.example.highlightLength).toBeGreaterThan(0);
      const highlighted = Array.from(card.example.sentence).join("").slice(
        card.example.highlightStart,
        card.example.highlightStart + card.example.highlightLength,
      );
      expect(highlighted.toLocaleLowerCase("en-US")).toBe(card.headword.toLocaleLowerCase("en-US"));
      const identity = `${card.headword.toLocaleLowerCase("en-US")}\0${card.targetPart}`;
      expect(identities.has(identity)).toBe(false);
      identities.add(identity);
    }
  });

  it("does not ship the rejected metadata sentence frames", () => {
    const rejected = [
      "in the reviewed list",
      "is labeled as a",
      "appeared in the report",
      "remained important during the discussion",
      "the instructor used the word",
    ];
    for (const card of packageV4.cards) {
      const sentence = card.example.sentence.toLocaleLowerCase("en-US");
      for (const phrase of rejected) expect(sentence).not.toContain(phrase);
    }
  });
});

describe("TOEFL vocabulary package v5 contextual POS audit", () => {
  it("keeps every highlighted role aligned and records the reviewed corrections", () => {
    expect(packageV5.contractVersion).toBe("toefl-vocabulary-package.v5");
    expect(packageV5.version).toBe(5);
    expect(packageV5.cardCount).toBe(packageV5.cards.length);
    expect(packageV5.contextAudit.reviewedCardCount).toBe(packageV5.cards.length);
    expect(packageV5.contextAudit.correctionCount).toBe(2);

    const combat = packageV5.cards.find((card) => card.headword === "combat");
    expect(combat?.targetPart).toBe("Noun");
    expect(combat?.example.sentence).toContain("prepared for combat");

    const condensation = packageV5.cards.find((card) => card.headword === "condensation");
    expect(condensation?.targetPart).toBe("Noun");
    expect(condensation?.example.sentence).toContain("Condensation formed");
    expect(packageV5.cards.some((card) => card.headword === "condense" && card.targetPart === "Noun")).toBe(false);

    for (const card of packageV5.cards) {
      expect(roles.has(card.targetPart)).toBe(true);
      expect(card.partsOfSpeech).toEqual([card.targetPart]);
      const highlighted = Array.from(card.example.sentence).join("").slice(card.example.highlightStart, card.example.highlightStart + card.example.highlightLength);
      expect(highlighted.toLocaleLowerCase("en-US")).toBe(card.headword.toLocaleLowerCase("en-US"));
    }
  });
});
