import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password adapter", () => {
  it("round-trips a valid password without storing it", async () => {
    const encoded = await hashPassword("a long classroom passphrase");
    expect(encoded).not.toContain("a long classroom passphrase");
    await expect(verifyPassword("a long classroom passphrase", encoded)).resolves.toBe(true);
    await expect(verifyPassword("wrong passphrase", encoded)).resolves.toBe(false);
  });

  it("rejects malformed stored hashes", async () => {
    await expect(verifyPassword("anything", "not-a-hash")).resolves.toBe(false);
  });
});

