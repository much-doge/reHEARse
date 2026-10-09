import { beforeEach, describe, expect, it, vi } from "vitest";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("./feedback-presentation", () => ({ feedbackPresentation: (value: unknown) => value }));
vi.mock("@/adapters/db/client", () => ({ getPool: () => ({ query }) }));
vi.mock("@/adapters/media/s3-config", () => ({ readS3MediaConfig: () => ({ bucket: "bucket", deliveryMode: "public", publicBaseUrl: "https://media.example", prefix: "rehearse/media" }) }));
vi.mock("@/adapters/media/s3-media-store", () => ({ createPublicMediaUrl: (_config: unknown, key: string) => `https://media.example/${key}` }));
vi.mock("@/domain/activity-presentation", () => ({ publicActivityTitle: (value: string) => value, publicPartLabel: (value: string) => value }));
vi.mock("@/adapters/feedback/provider-factory", () => ({ createFeedbackProvider: vi.fn() }));
vi.mock("@/adapters/feedback/openai-responses-provider", () => ({ OPENAI_FEEDBACK_PROMPT_VERSION: "test" }));
vi.mock("@/application/feedback-provider", () => ({ FeedbackProviderError: class FeedbackProviderError extends Error {} }));
vi.mock("@/domain/feedback", () => ({ parseListeningFeedback: (value: unknown) => value }));

import { getLearnerActivityVersion } from "./listening-repository";

describe("stored activity-version resolution", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads the requested immutable version rather than the current version", async () => {
    query.mockResolvedValue({ rows: [{ id: "activity", slug: "neutral-dialogue", version_id: "stored-version", title: "Neutral dialogue", part_label: "Conversation", prompt_en: "Listen", prompt_id: "Dengarkan", media_storage_key: "rehearse/media/stored.mp3", media_provider: "s3", media_bucket: "bucket", media_sha256: "abc" }] });
    const result = await getLearnerActivityVersion("neutral-dialogue", "stored-version");
    expect(query.mock.calls[0][0]).toContain("av.id=$2");
    expect(query.mock.calls[0][1]).toEqual(["neutral-dialogue", "stored-version"]);
    expect(result?.versionId).toBe("stored-version");
    expect(result?.audioUrl).toBe("https://media.example/rehearse/media/stored.mp3");
  });
  it("pins authenticated local media to the stored version too", async () => {
    query.mockResolvedValue({ rows: [{ id: "activity", slug: "neutral-dialogue", version_id: "stored-version", title: "Neutral dialogue", media_storage_key: "stored.mp3", media_provider: "local" }] });
    const result = await getLearnerActivityVersion("neutral-dialogue", "stored-version");
    expect(result?.audioUrl).toBe("/api/media/neutral-dialogue?version=stored-version");
  });

});
