import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { PersistentLearningWorkspace } from "./persistent-learning-workspace";
import type { LearnerActivity } from "../adapters/db/listening-repository";
const activity: LearnerActivity = {
  id: "one",
  slug: "practice",
  versionId: "v1",
  title: "Conversation",
  partLabel: "Conversation",
  promptEn: "Explain the conversation.",
  promptId: "Jelaskan percakapan.",
  audioUrl: null,
  pseudonym: null,
  attempts: [],
};
describe("practice role boundary in the form", () => {
  it("offers a disabled preview without a save control for non-learners", () => {
    const html = renderToStaticMarkup(
      createElement(PersistentLearningWorkspace, {
        activity,
        canSubmit: false,
      }),
    );
    expect(html).toContain("Teacher and administrator preview");
    expect(html).not.toContain("Save and get feedback");
    expect(html.match(/<textarea[^>]*disabled/g)).toHaveLength(2);
  });
  it("keeps editable learner fields and a save control", () => {
    const html = renderToStaticMarkup(
      createElement(PersistentLearningWorkspace, { activity, canSubmit: true }),
    );
    expect(html).toContain("Save and get feedback");
    expect(html).not.toContain("Teacher and administrator preview");
    expect(html.match(/<textarea[^>]*disabled/g)).toBeNull();
    expect(html.match(/maxLength="12000"/g)).toHaveLength(2);
  });
});
