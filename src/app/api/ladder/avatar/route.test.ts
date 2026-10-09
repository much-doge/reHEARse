import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentUser, setAvatar } = vi.hoisted(() => ({
  currentUser: vi.fn(),
  setAvatar: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ currentUser }));
vi.mock("@/adapters/ladder/postgres-ladder", () => ({
  ladderRepository: { setAvatar },
}));
vi.mock("@/domain/ladder/avatars", () => ({
  isAvatarId: (value: unknown) =>
    typeof value === "string" && ["moss", "fern"].includes(value),
}));
vi.mock("@/domain/ladder/model", () => ({
  LadderError: class LadderError extends Error {
    constructor(
      readonly code: string,
      readonly status = 400,
    ) {
      super(code);
    }
  },
}));
vi.mock("@/lib/same-origin", () => ({
  isSameOriginRequest: (request: Request) =>
    request.headers.get("origin") === `http://${request.headers.get("host")}`,
}));
vi.mock("@/lib/ladder-response", async () => {
  const { LadderError } = await import("@/domain/ladder/model");
  return {
    ladderFailure: (error: unknown) =>
      Response.json(
        { error: error instanceof LadderError ? error.code : "game_unavailable" },
        { status: error instanceof LadderError ? error.status : 503 },
      ),
  };
});

import { POST } from "./route";

const actor = { id: "11111111-1111-4111-8111-111111111111", role: "learner" };
const runId = "22222222-2222-4222-8222-222222222222";

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://app:3000/api/ladder/avatar", {
    method: "POST",
    headers: {
      host: "app:3000",
      origin: "http://app:3000",
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ladder/avatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser.mockResolvedValue(actor);
    setAvatar.mockResolvedValue({ runId, avatarId: "moss" });
  });

  it("passes only a known catalogue id to the owned repository boundary", async () => {
    const response = await POST(request({ runId, avatarId: "moss" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(setAvatar).toHaveBeenCalledWith(actor, runId, "moss");
  });

  it("rejects unauthenticated, foreign-origin and arbitrary-path requests", async () => {
    currentUser.mockResolvedValueOnce(null);
    expect((await POST(request({ runId, avatarId: "moss" }))).status).toBe(401);
    expect(
      (
        await POST(
          request(
            { runId, avatarId: "moss" },
            { origin: "https://elsewhere.example" },
          ),
        )
      ).status,
    ).toBe(403);
    expect(
      (await POST(request({ runId, avatarId: "../../secret" }))).status,
    ).toBe(400);
    expect(setAvatar).not.toHaveBeenCalled();
  });

  it("rejects extra keys and bodies over the narrow limit", async () => {
    expect(
      (await POST(request({ runId, avatarId: "moss", actorId: actor.id })))
        .status,
    ).toBe(400);
    expect(
      (
        await POST(
          request({ runId, avatarId: "moss", padding: "x".repeat(300) }),
        )
      ).status,
    ).toBe(413);
  });
});
