import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentUser, start, act } = vi.hoisted(() => ({ currentUser: vi.fn(), start: vi.fn(), act: vi.fn() }));
vi.mock("@/lib/session", () => ({ currentUser }));
vi.mock("@/lib/same-origin", () => ({ isSameOriginRequest: () => true }));
vi.mock("@/adapters/ladder/postgres-ladder", () => ({ ladderRepository: { start, act } }));
vi.mock("@/domain/ladder/model", () => ({ LadderError: class LadderError extends Error { constructor(readonly code: string, readonly status = 400) { super(code); } } }));
vi.mock("@/lib/ladder-response", async () => {
  const { LadderError } = await import("@/domain/ladder/model");
  return { ladderFailure: (error: unknown) => Response.json({ error: error instanceof LadderError ? error.code : "game_unavailable" }, { status: error instanceof LadderError ? error.status : 503 }) };
});

import { POST } from "./route";

const actor = { id: "11111111-1111-4111-8111-111111111111", role: "learner" };
const runId = "22222222-2222-4222-8222-222222222222";
const key = "33333333-3333-4333-8333-333333333333";
const request = (body: unknown) => new Request("http://app/api/ladder", { method: "POST", headers: { origin: "http://app", host: "app", "content-type": "application/json" }, body: JSON.stringify(body) });

describe("version-aware ladder boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser.mockResolvedValue(actor);
    start.mockResolvedValue({ runId });
    act.mockResolvedValue({ runId });
  });

  it("passes an optional neutral activity id to solo start", async () => {
    const response = await POST(request({ kind: "start", key, activityId: "ocean-currents-in-motion" }));
    expect(response.status).toBe(200);
    expect(start).toHaveBeenCalledWith(actor, key, undefined, "ocean-currents-in-motion");
  });

  it("accepts D for a first choice but rejects D for a three-option repair", async () => {
    const first = await POST(request({ kind: "act", key, runId, revision: 0, action: { kind: "choice", item: 0, choice: 3 } }));
    expect(first.status).toBe(200);
    expect(act).toHaveBeenCalled();
    act.mockClear();
    const repair = await POST(request({ kind: "act", key, runId, revision: 4, action: { kind: "repair", item: 0, choice: 3, explanation: "I checked the relationship." } }));
    expect(repair.status).toBe(400);
    expect(act).not.toHaveBeenCalled();
  });
});
