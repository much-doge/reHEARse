import { describe, it, expect } from "vitest";
import {
  publicPartLabel,
  publicActivityTitle,
  classroomTitle,
  containsConfidentialSourceLabel,
} from "./activity-presentation";
describe("confidential source presentation", () => {
  it("replaces legacy source labels with task descriptions, never source fragments", () => {
    const legacy =
      "Part B foundation · Conversation · ConTEFL 1163 · Questions 31–34";
    expect(publicPartLabel(legacy)).toBe("Conversation / Percakapan");
    expect(publicPartLabel("Part C · Private source code XYZ")).toBe(
      "Talk / Paparan",
    );
    expect(publicPartLabel("Archive code SECRET")).toBe(
      "Listening practice / Latihan menyimak",
    );
    expect(classroomTitle).toBe("Short conversations / Percakapan singkat");
  });
  it("allows pedagogical titles and withholds source-labelled titles", () => {
    expect(publicActivityTitle("Three papers, one thread")).toBe(
      "Three papers, one thread",
    );
    for (const t of ["ConTEFL lesson", "1163", "Package 12", "Archive 20"]) {
      expect(publicActivityTitle(t)).toBe(
        "Listening activity / Aktivitas menyimak",
      );
    }
    expect(containsConfidentialSourceLabel("Source package code: 1163")).toBe(
      true,
    );
  });
});
