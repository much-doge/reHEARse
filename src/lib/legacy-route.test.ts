import { describe, expect, it } from "vitest";
import { legacyDestination } from "./legacy-route";

describe("archived resource routes", () => {
  it("maps old roots and nested paths into the legacy area", () => {
    for (const [source, destination] of [
      ["/learn", "/legacy/learn"],
      ["/learn/example", "/legacy/learn/example"],
      ["/workshop", "/legacy/workshop"],
      ["/workshop/join", "/legacy/workshop/join"],
      ["/ladder/host", "/legacy/ladder/host"],
      ["/classroom", "/legacy/classroom"],
      ["/play", "/legacy/play"],
    ]) expect(legacyDestination(source)).toBe(destination);
  });

  it("does not remap unrelated paths or lookalike roots", () => {
    expect(legacyDestination("/legacy/learn/example")).toBeNull();
    expect(legacyDestination("/player")).toBeNull();
    expect(legacyDestination("/api/learn/example")).toBeNull();
  });
});
