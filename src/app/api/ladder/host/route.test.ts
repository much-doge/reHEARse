import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentUser, createSession, host, closeSession, assist } = vi.hoisted(() => ({ currentUser: vi.fn(), createSession: vi.fn(), host: vi.fn(), closeSession: vi.fn(), assist: vi.fn() }));
vi.mock("@/lib/session", () => ({ currentUser }));
vi.mock("@/lib/same-origin", () => ({ isSameOriginRequest: () => true }));
vi.mock("@/adapters/ladder/postgres-ladder", () => ({ ladderRepository: { createSession, host, closeSession, assist } }));
vi.mock("@/domain/ladder/model", () => ({ LadderError: class LadderError extends Error { constructor(readonly code: string, readonly status = 400) { super(code); } } }));
vi.mock("@/lib/ladder-response", async () => {
  const { LadderError } = await import("@/domain/ladder/model");
  return { ladderFailure: (error: unknown) => Response.json({ error: error instanceof LadderError ? error.code : "game_unavailable" }, { status: error instanceof LadderError ? error.status : 503 }) };
});

import { POST } from "./route";
const actor = { id: "teacher", role: "teacher" };
const key = "33333333-3333-4333-8333-333333333333";
const request = (body: unknown) => new Request("http://app/api/ladder/host", { method: "POST", headers: { origin: "http://app", host: "app", "content-type": "application/json" }, body: JSON.stringify(body) });

describe("activity-pinned teacher session boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser.mockResolvedValue(actor);
    createSession.mockResolvedValue({ pin: "123456", closed: false, players: [] });
  });

  it("passes the optional neutral activity selection to the repository", async () => {
    const response = await POST(request({ kind: "create", key, activityId: "ocean-currents-in-motion" }));
    expect(response.status).toBe(200);
    expect(createSession).toHaveBeenCalledWith(actor, key, "ocean-currents-in-motion");
  });
});
