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
    const response = await GET(new Request("http://localhost/api/ladder/catalogue"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const body = await response.json();
    expect(body.activities).toHaveLength(1);
    expect(body.contractVersion).toBe("ladder-catalogue.v1");
    expect(catalogue).toHaveBeenCalledWith({ id: "actor", role: "teacher" }, "single");
    expect(JSON.stringify(body)).not.toMatch(/answer|transcript|source|questionRange|package/i);
  });

  it("selects complete games only for the explicitly versioned catalogue", async () => {
    const response = await GET(new Request("http://localhost/api/ladder/catalogue?format=passage-v1"));
    expect(response.status).toBe(200);
    expect((await response.json()).contractVersion).toBe("ladder-catalogue.v2");
    expect(catalogue).toHaveBeenCalledWith({ id: "actor", role: "teacher" }, "passage");
  });

  it("rejects unknown catalogue formats", async () => {
    expect((await GET(new Request("http://localhost/api/ladder/catalogue?format=unsupported"))).status).toBe(400);
    expect(catalogue).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    currentUser.mockResolvedValue(null);
    expect((await GET(new Request("http://localhost/api/ladder/catalogue"))).status).toBe(401);
    expect(catalogue).not.toHaveBeenCalled();
  });
});
