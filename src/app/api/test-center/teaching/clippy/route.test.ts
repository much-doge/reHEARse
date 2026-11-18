import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentUser, reviewItem, hint } = vi.hoisted(() => ({ currentUser: vi.fn(), reviewItem: vi.fn(), hint: vi.fn() }));
vi.mock("@/lib/session", () => ({ currentUser }));
vi.mock("@/lib/same-origin", () => ({ isSameOriginRequest: (request: Request) => request.headers.get("origin") === "http://app" }));
vi.mock("@protefl/adapters/postgres-diagnostic", () => ({ teacherDiagnosticReviewItem: reviewItem }));
vi.mock("@/adapters/feedback/clippy-provider-factory", () => ({ createClippyProvider: () => ({ hint }) }));

import { POST } from "./route";

const ids = {
  resourceId: "11111111-1111-4111-8111-111111111111",
  candidateActorId: "22222222-2222-4222-8222-222222222222",
  attemptId: "33333333-3333-4333-8333-333333333333",
  section: "listening",
  question: 1,
};
const request = (body: unknown, origin = "http://app") => new Request("http://app/api/test-center/teaching/clippy", { method: "POST", headers: { origin, host: "app", "content-type": "application/json" }, body: JSON.stringify(body) });
const item = {
  section: "listening",
  question: { section: "listening", question: 1, selected: "A", correctAnswer: "B", correct: false },
  item: { number: 1, prompt: "What does the woman imply?", options: { A: "She agreed.", B: "She changed the plan.", C: "She was absent.", D: "She forgot." } },
  transcript: { segments: [{ speaker: "Man", text: "We can meet today." }, { speaker: "Woman", text: "Actually, tomorrow would work better." }], questionCue: "What does the woman imply?" },
};

describe("POST /api/test-center/teaching/clippy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser.mockResolvedValue({ id: "teacher", role: "teacher" });
    reviewItem.mockResolvedValue(item);
    hint.mockResolvedValue({ text: "Clippy melihat satu petunjuk kecil: \"tomorrow would work better\". Coba gunakan pertanyaan Anda sendiri untuk mengajak siswa menelusurinya." });
  });

  it("authorizes through the existing teacher review boundary and omits the key from provider context", async () => {
    const response = await POST(request(ids));
    expect(response.status).toBe(200);
    expect(reviewItem).toHaveBeenCalledWith("teacher", "teacher", ids.resourceId, ids.candidateActorId, ids.attemptId, "listening", "1");
    expect(hint).toHaveBeenCalledOnce();
    expect(JSON.stringify(hint.mock.calls[0][0])).not.toContain("correctAnswer");
    expect(hint.mock.calls[0][0]).toMatchObject({ response: "A", selectedResponse: "She agreed." });
    expect(JSON.stringify(hint.mock.calls[0][0])).not.toContain("She changed the plan.");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("does not invoke the provider for a correct response", async () => {
    reviewItem.mockResolvedValue({ ...item, question: { ...item.question, selected: "B", correct: true } });
    const response = await POST(request(ids));
    expect(await response.json()).toEqual({ state: "correct" });
    expect(hint).not.toHaveBeenCalled();
  });

  it("denies candidates, foreign origins, and inaccessible attempts without invoking the provider", async () => {
    currentUser.mockResolvedValueOnce({ id: "candidate", role: "learner" });
    expect((await POST(request(ids))).status).toBe(404);
    expect((await POST(request(ids, "https://elsewhere.example"))).status).toBe(403);
    reviewItem.mockResolvedValueOnce(null);
    expect((await POST(request(ids))).status).toBe(404);
    expect(hint).not.toHaveBeenCalled();
  });

  it("accepts unconventional free-form provider text", async () => {
    hint.mockResolvedValue({ text: "Clippy boleh memilih bentuk lain—misalnya catatan pendek, pertanyaan, atau contoh." });
    const response = await POST(request(ids));
    expect(response.status).toBe(200);
    expect((await response.json()).hint.text).toContain("Clippy");
  });
});
