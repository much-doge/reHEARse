import { beforeEach, describe, expect, it, vi } from "vitest";

const { clientQuery, connect } = vi.hoisted(() => ({
  clientQuery: vi.fn(),
  connect: vi.fn(),
}));

vi.mock("@/adapters/db/client", () => ({ getPool: () => ({ connect }) }));

import { startSectionRetake } from "./postgres-diagnostic";

const actor = "11111111-1111-4111-8111-111111111111";
const assignment = "22222222-2222-4222-8222-222222222222";
const source = "33333333-3333-4333-8333-333333333333";
const retake = "44444444-4444-4444-8444-444444444444";

describe("diagnostic section retake assignment boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connect.mockResolvedValue({ query: clientQuery, release: vi.fn() });
  });

  it("does not resume an active retake from a different section", async () => {
    clientQuery.mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql === "COMMIT") return { rowCount: 0, rows: [] };
      if (sql.includes("SELECT d.id,d.assignment_id,d.scope")) {
        return { rowCount: 1, rows: [{ id: source, assignment_id: assignment, scope: "full", parent_attempt_id: null, status: "completed", code: "ets-volume3-practice-test-a" }] };
      }
      if (sql.includes("SELECT d.*,r.status AS resource_status")) {
        return { rowCount: 1, rows: [{
          id: source, resource_id: "55555555-5555-4555-8555-555555555555", assignment_id: assignment,
          actor_id: actor, package_version: 1, resource_version: 1, resource_status: "published",
          assigned_listening_mode: "question_click", assigned_show_question_text: true,
          delivery_scope: "full", content_hash: "content", answer_key_hash: "answers",
          score_table_hash: "scores", timing_map_hash: "timing",
        }] };
      }
      if (sql.includes("SELECT result_data FROM protefl_diagnostic_result")) {
        return { rowCount: 1, rows: [{ result_data: { review: [{ section: "reading", question: 3, correct: false }] } }] };
      }
      if (sql.includes("scope=$3") && sql.includes("status='in_progress'")) return { rowCount: 0, rows: [] };
      if (sql.includes("max(attempt_number)")) return { rowCount: 1, rows: [{ number: 2 }] };
      if (sql.includes("max(section_retake_number)")) return { rowCount: 1, rows: [{ number: 0 }] };
      if (sql.includes("INSERT INTO protefl_diagnostic_attempt")) return { rowCount: 1, rows: [{ id: retake }] };
      return { rowCount: 0, rows: [] };
    });

    await expect(startSectionRetake(actor, assignment, source, "reading")).resolves.toEqual({ attemptId: retake, resumed: false });

    const activeLookup = clientQuery.mock.calls.find(([sql]) => String(sql).includes("status='in_progress'"));
    expect(activeLookup?.[0]).toContain("scope=$3");
    expect(activeLookup?.[1]).toEqual([assignment, actor, "reading"]);
    expect(clientQuery).toHaveBeenCalledWith("COMMIT");
  });
});
