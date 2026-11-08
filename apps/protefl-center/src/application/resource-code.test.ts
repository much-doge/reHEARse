import { describe, expect, it } from "vitest";

import { generateResourceCode, hashResourceCode, isValidResourceCode, normalizeResourceCode } from "./resource-code";

describe("short Test Center resource codes", () => {
  it("creates ten-character Crockford codes with a readable separator", () => {
    const code = generateResourceCode();
    expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/);
    expect(isValidResourceCode(code)).toBe(true);
  });

  it("normalizes case and separators while rejecting ambiguous or malformed characters", () => {
    expect(normalizeResourceCode("ab23c-d45ef")).toBe("AB23CD45EF");
    expect(isValidResourceCode("ab23c-d45ef")).toBe(true);
    expect(isValidResourceCode("AB23I-D45EF")).toBe(false);
    expect(isValidResourceCode("AB23C-D45E")).toBe(false);
  });

  it("hashes a normalized code consistently", () => {
    expect(hashResourceCode("ab23c-d45ef")).toBe(hashResourceCode("AB23CD45EF"));
    expect(hashResourceCode("ab23c-d45ef")).toHaveLength(64);
  });
});
