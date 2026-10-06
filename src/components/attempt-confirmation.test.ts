import { describe, it, expect, vi } from "vitest";
import {
  saveWithConfirmation,
  confirmAttempt,
  requestAttemptFeedback,
} from "./attempt-confirmation";
const draft = {
  slug: "practice",
  pseudonym: "Team",
  notes: "A plan",
  reconstruction: "They change a plan.",
  submissionKey: "1b09f848-4d1a-48a3-a195-6d634f791b8d",
};
const attempt = { id: "attempt-one", feedbackStatus: "completed" };
const result = () =>
  Response.json({ contractVersion: "attempt-result.v2", attempt });
describe("confirmation after an uncertain save", () => {
  it("recovers a lost POST response by an owned read without another POST", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network lost"))
      .mockResolvedValueOnce(result());
    expect(await saveWithConfirmation(draft, fetcher)).toEqual(attempt);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][1].method).toBe("POST");
    expect(fetcher.mock.calls[1][0]).toContain(
      "submissionKey=" + draft.submissionKey,
    );
    expect(fetcher.mock.calls[1][1].body).toBeUndefined();
  });
  it("does not claim absence proves a write failed or send a blind retry", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network lost"))
      .mockResolvedValueOnce(Response.json({ attempt: null }, { status: 404 }));
    await expect(saveWithConfirmation(draft, fetcher)).rejects.toMatchObject({
      code: "save_unconfirmed",
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("preserves meaningful role rejections instead of probing a saved record", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        Response.json({ error: "learner_role_required" }, { status: 403 }),
      );
    await expect(saveWithConfirmation(draft, fetcher)).rejects.toMatchObject({
      code: "learner_role_required",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("can confirm a saved response whose feedback is not ready", async () => {
    const saved = { ...attempt, feedbackStatus: "pending" };
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        Response.json({ contractVersion: "attempt-result.v2", attempt: saved }),
      );
    expect(await confirmAttempt("known-id", fetcher, true)).toEqual(saved);
    expect(fetcher.mock.calls[0][0]).toBe("/api/attempts?attemptId=known-id");
    expect(fetcher.mock.calls[0][1].cache).toBe("no-store");
  });
  it("requests feedback separately after the response is safely stored", async () => {
    const fetcher = vi.fn().mockResolvedValue(result());
    expect(await requestAttemptFeedback("attempt-one", fetcher)).toEqual(attempt);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("/api/feedback");
    expect(fetcher.mock.calls[0][1].method).toBe("POST");
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
      attemptId: "attempt-one",
    });
  });
});
