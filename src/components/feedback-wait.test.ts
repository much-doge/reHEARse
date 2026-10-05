import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { FeedbackWait, waitingFocuses } from "./feedback-wait";
describe("optional listening reflection during feedback", () => {
  it("provides bilingual keyboard controls and an honest pending state", () => {
    const html = renderToStaticMarkup(createElement(FeedbackWait));
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('role="status"');
    expect(html.match(/<button /g)).toHaveLength(5);
    expect(html).toContain("aren’t saved or sent");
    expect(html).not.toContain("Response saved");
  });
  it("keeps all reflection cues generic rather than revealing activity content", () => {
    expect(waitingFocuses).toHaveLength(3);
    for (const focus of waitingFocuses) {
      expect(focus.en).toContain("?");
      expect(focus.id).toContain("?");
    }
  });
});
