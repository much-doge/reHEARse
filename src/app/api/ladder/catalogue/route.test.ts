import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentUser, catalogue } = vi.hoisted(() => ({ currentUser: vi.fn(), catalogue: vi.fn() }));
vi.mock("@/lib/session", () => ({ currentUser }));
vi.mock("@/adapters/ladder/postgres-ladder", () => ({ ladderRepository: { catalogue } }));
vi.mock("@/domain/ladder/model", () => ({ LadderError: class LadderError extends Error { constructor(readonly code: string, readonly status = 400) { super(code); } } }));
vi.mock("@/lib/ladder-response", async () => {
  const { LadderError } = await import("@/domain/ladder/model");
  return { ladderFailure: (error: unknown) => Response.json({ error: error instanceof LadderError ? error.code : "game_unavailable" }, { status: error instanceof LadderError ? error.status : 503 }) };
});

import { GET } from "./route";

describe("GET /api/ladder/catalogue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser.mockResolvedValue({ id: "actor", role: "teacher" });
    catalogue.mockResolvedValue([{ id: "ocean-currents-in-motion", title: { en: "Ocean currents in motion", id: "Arus laut yang bergerak" }, durationMs: 99036, questionCount: 4 }]);
  });

  it("returns only the neutral published projection without source or answer data", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const body = await response.json();
    expect(body.activities).toHaveLength(1);
    expect(JSON.stringify(body)).not.toMatch(/answer|transcript|source|questionRange|package/i);
  });

  it("requires authentication", async () => {
    currentUser.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(catalogue).not.toHaveBeenCalled();
  });
});
