import { beforeEach, describe, expect, it, vi } from "vitest";

const { clientQuery, connect, poolQuery } = vi.hoisted(() => ({
  clientQuery: vi.fn(),
  connect: vi.fn(),
  poolQuery: vi.fn(),
}));
vi.mock("@/adapters/db/client", () => ({ getPool: () => ({ connect, query: poolQuery }) }));
vi.mock("@/adapters/identity/password", () => ({ hashPassword: vi.fn() }));

import { archiveCandidateDiagnostic, claimResource } from "./postgres-resources";

const actor = "11111111-1111-4111-8111-111111111111";
const staff = "22222222-2222-4222-8222-222222222222";
const resource = "33333333-3333-4333-8333-333333333333";

describe("assignment title pinning and diagnostic archive boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connect.mockResolvedValue({ query: clientQuery, release: vi.fn() });
  });

  it.each(["private", "classroom"] as const)("copies the invite title when a %s code is claimed", async (inviteKind) => {
    poolQuery.mockResolvedValue({ rowCount: 1, rows: [{ attempt_count: 1 }] });
    clientQuery.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT i.*,r.status")) return { rowCount: 1, rows: [{ id: resource, resource_id: resource, created_by: staff, status: "published", not_expired: true, invite_kind: inviteKind, claimed_at: null, claimed_by: null, listening_mode: "question_click", show_listening_question_text: true, delivery_scope: "reading", assignment_title: "November Reading Group" }] };
      if (sql.includes("SELECT id FROM protefl_resource_assignment")) return { rowCount: 0, rows: [] };
      if (sql.includes("INSERT INTO protefl_resource_assignment")) return { rowCount: 1, rows: [] };
      return { rowCount: 1, rows: [] };
    });

    await claimResource(actor, "ABCDEFGHJK");

    const insert = clientQuery.mock.calls.find(([sql]) => String(sql).includes("INSERT INTO protefl_resource_assignment"));
    expect(insert?.[1]).toEqual([resource, actor, staff, resource, "question_click", true, "reading", "November Reading Group"]);
    expect(clientQuery).toHaveBeenCalledWith("COMMIT");
  });

  it("rolls back and creates no archive batch when the teacher did not issue the assignment", async () => {
    clientQuery.mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql === "ROLLBACK") return { rowCount: 0, rows: [] };
      if (sql.includes("SELECT a.id FROM protefl_resource_assignment")) return { rowCount: 0, rows: [] };
      return { rowCount: 0, rows: [] };
    });

    await expect(archiveCandidateDiagnostic(resource, actor, staff, "teacher")).rejects.toThrow("assignment_unavailable");

    const authorization = clientQuery.mock.calls.find(([sql]) => String(sql).includes("SELECT a.id FROM protefl_resource_assignment"));
    expect(authorization?.[0]).toContain("r.kind='diagnostic_package'");
    expect(authorization?.[0]).toContain("a.assigned_by=$3");
    expect(clientQuery.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO protefl_diagnostic_attempt_archive"))).toBe(false);
    expect(clientQuery).toHaveBeenCalledWith("ROLLBACK");
  });

  it("archives every unarchived diagnostic attempt for an authorized assignment in one batch", async () => {
    clientQuery.mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql === "COMMIT") return { rowCount: 0, rows: [] };
      if (sql.includes("SELECT a.id FROM protefl_resource_assignment")) return { rowCount: 1, rows: [{ id: resource }] };
      if (sql.includes("SELECT id FROM protefl_diagnostic_attempt")) return { rowCount: 3, rows: [{ id: "root-listening" }, { id: "root-reading" }, { id: "child-retake" }] };
      if (sql.includes("INSERT INTO protefl_diagnostic_attempt_archive")) return { rowCount: 1, rows: [{ id: "batch-id", archived_at: new Date("2026-11-10T00:00:00Z") }] };
      return { rowCount: 3, rows: [] };
    });

    const result = await archiveCandidateDiagnostic(resource, actor, staff, "admin");

    expect(result.archivedAttempts).toBe(3);
    const select = clientQuery.mock.calls.find(([sql]) => String(sql).includes("SELECT id FROM protefl_diagnostic_attempt"));
    expect(select?.[0]).toContain("archived_at IS NULL");
    expect(select?.[0]).not.toContain("scope='full'");
    const update = clientQuery.mock.calls.find(([sql]) => String(sql).includes("UPDATE protefl_diagnostic_attempt"));
    expect(update?.[0]).not.toContain("parent_attempt_id");
    expect(clientQuery).toHaveBeenCalledWith("COMMIT");
  });
});
