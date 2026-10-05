import { describe, expect, it } from "vitest";

import { assertSafeObjectKey, S3CompatibleMediaStore } from "./s3-media-store";
import { readS3MediaConfig } from "./s3-config";

describe("S3-compatible media configuration", () => {
  it("derives the official Backblaze endpoint from the region", () => {
    const config = readS3MediaConfig({
      NODE_ENV: "test",
      B2_REGION: "us-west-004",
      B2_BUCKET_NAME: "rehearse-media",
      B2_APPLICATION_KEY_ID: "key-id",
      B2_APPLICATION_KEY: "secret",
    });
    expect(config.endpoint).toBe("https://s3.us-west-004.backblazeb2.com");
    expect(config.signedUrlTtlSeconds).toBe(600);
  });

  it("rejects traversal and keys outside the activity prefix", () => {
    expect(() => assertSafeObjectKey("activities/demo/audio.mp3")).not.toThrow();
    expect(() => assertSafeObjectKey("../audio.mp3")).toThrow();
    expect(() => assertSafeObjectKey("retained/audio.mp3")).toThrow();
  });

  it("creates a short-lived Backblaze download URL without fetching the object", async () => {
    const store = new S3CompatibleMediaStore({
      endpoint: "https://s3.us-west-004.backblazeb2.com",
      region: "us-west-004",
      bucket: "rehearse-media",
      accessKeyId: "test-key-id",
      secretAccessKey: "test-application-key",
      signedUrlTtlSeconds: 600,
      maxUploadBytes: 250 * 1024 * 1024,
    });
    const delivery = await store.createDownloadUrl("activities/demo/audio.mp3");
    const url = new URL(delivery.url);
    expect(url.hostname).toBe("s3.us-west-004.backblazeb2.com");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("600");
    expect(delivery.kind).toBe("redirect");
  });
});
