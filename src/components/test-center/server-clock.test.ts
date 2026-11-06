import { describe, expect, it } from "vitest";

import { serverNowAt } from "./server-clock";

describe("Test Center server clock", () => {
  it("advances from the server anchor instead of the computer wall clock", () => {
    const serverTime = "2026-11-06T11:00:00.000Z";
    expect(serverNowAt(serverTime, 2_000, 5_250)).toBe(new Date(serverTime).getTime() + 3_250);
  });

  it("does not move backward when a monotonic reading is stale", () => {
    const serverTime = "2026-11-06T11:00:00.000Z";
    expect(serverNowAt(serverTime, 5_000, 4_000)).toBe(new Date(serverTime).getTime());
  });
});
