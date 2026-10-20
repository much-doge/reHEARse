import { describe, expect, it } from "vitest";
import { secondsUntil, workshopClock } from "./time";

describe("workshop timing", () => {
  it("advances from the server clock without trusting the device epoch", () => {
    expect(workshopClock("2026-10-20T00:00:00.000Z", 10_000, 12_500)).toBe(
      1_792_454_402_500,
    );
  });

  it("rounds a visible deadline up and never becomes negative", () => {
    expect(secondsUntil("2026-10-20T00:00:12.000Z", 1_792_454_400_001)).toBe(12);
    expect(secondsUntil("2026-10-20T00:00:12.000Z", 1_792_454_413_000)).toBe(0);
    expect(secondsUntil(null, 0)).toBeNull();
  });
});

