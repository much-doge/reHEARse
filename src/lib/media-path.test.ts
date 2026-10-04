import { describe, expect, it } from "vitest";

import { resolvePrivateMediaPath } from "./media-path";

describe("resolvePrivateMediaPath", () => {
  it("resolves a key beneath the private media root", () => {
    expect(resolvePrivateMediaPath("/app/media", "sample.mp3")).toBe("/app/media/sample.mp3");
  });

  it("rejects traversal and the root itself", () => {
    expect(resolvePrivateMediaPath("/app/media", "../secret.mp3")).toBeNull();
    expect(resolvePrivateMediaPath("/app/media", "")).toBeNull();
  });
});
