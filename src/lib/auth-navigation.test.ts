import { describe, expect, it } from "vitest";
import { safeReturnTo, signInUrl } from "./auth-navigation";
describe("authentication destinations", () => {
  it("preserves permitted activity destinations and validated PINs", () => {
    expect(safeReturnTo("/ladder/host?pin=632581")).toBe(
      "/ladder/host?pin=632581",
    );
    expect(safeReturnTo("/learn/three-papers-one-thread")).toBe(
      "/learn/three-papers-one-thread",
    );
    expect(safeReturnTo("/")).toBe("/");
    expect(safeReturnTo("/ladder?pin=bad&unknown=secret#fragment")).toBe(
      "/ladder",
    );
  });
  it("rejects external paths, encoded path tricks and authentication loops", () => {
    for (const value of [
      "https://evil.test",
      "//evil.test",
      "/\\evil.test",
      "/%2f%2fevil.test",
      "/login?next=/login",
      "/register",
      "/api/session",
      "/\n/evil",
      null,
    ])
      expect(safeReturnTo(value)).toBe("/dashboard");
  });
  it("encodes a single safe return path and expiry reason", () => {
    expect(signInUrl("/ladder?pin=632581", true)).toBe(
      "/login?next=%2Fladder%3Fpin%3D632581&reason=expired",
    );
  });
});
