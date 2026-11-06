import { describe, expect, it } from "vitest";

import { listeningActionSchema } from "./schema";

const id = "11111111-1111-4111-8111-111111111111";

describe("Test Center listening action schema", () => {
  it("accepts both start modes without duplicate discriminator construction", () => {
    expect(listeningActionSchema.parse({ kind: "start", key: id, mode: "full" })).toEqual({
      kind: "start",
      key: id,
      mode: "full",
    });
    expect(
      listeningActionSchema.parse({
        kind: "start",
        key: id,
        mode: "remedial",
        parentAttemptId: "22222222-2222-4222-8222-222222222222",
      }),
    ).toMatchObject({ kind: "start", mode: "remedial" });
  });

  it("keeps the two start payloads strict", () => {
    expect(
      listeningActionSchema.safeParse({ kind: "start", key: id, mode: "full", parentAttemptId: id }).success,
    ).toBe(false);
    expect(listeningActionSchema.safeParse({ kind: "start", key: id, mode: "remedial" }).success).toBe(false);
  });
});
