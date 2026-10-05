import { describe, it, expect } from "vitest";
import { assertSafeObjectKey, createPublicMediaUrl, S3CompatibleMediaStore } from "./s3-media-store";
import { readS3MediaConfig } from "./s3-config";
const env: NodeJS.ProcessEnv = { NODE_ENV: "production", OBJECT_STORAGE_REGION: "us-west-000", OBJECT_STORAGE_ENDPOINT: "https://s3.us-west-000.backblazeb2.com", OBJECT_STORAGE_BUCKET: "najala-dumpster", OBJECT_STORAGE_ACCESS_KEY_ID: "test", OBJECT_STORAGE_SECRET_ACCESS_KEY: "test", OBJECT_STORAGE_PREFIX: "rehearse/media", MEDIA_DELIVERY_MODE: "public", PUBLIC_MEDIA_BASE_URL: "https://archive.najala.org/file/najala-dumpster/rehearse/media" };
const key = "rehearse/media/activities/activity-id/v1/random.mp3";
describe("confined public media", () => {
  it("constructs an unsigned stable URL without network access", async () => {
    const config = readS3MediaConfig(env);
    expect(createPublicMediaUrl(config, key)).toBe(`${env.PUBLIC_MEDIA_BASE_URL}/activities/activity-id/v1/random.mp3`);
    expect(await new S3CompatibleMediaStore(config).createDownloadUrl(key)).toEqual({ kind: "redirect", url: createPublicMediaUrl(config, key), expiresAt: null });
  });
  it.each(["activities/a/v1/a.mp3", "rehearse/media-other/activities/a/v1/a.mp3", "rehearse/media/activities/../a.mp3", "rehearse/media/activities/%2e%2e/a.mp3", "rehearse/media/activities/a//x.mp3", "rehearse/media/activities/a/x.mp3?other=1", "rehearse/media/activities/a/x.mp3#fragment", "rehearse/media/activities/a/\\x.mp3"])("rejects escaped object key %s", (bad) => {
    expect(() => assertSafeObjectKey(bad, "rehearse/media")).toThrow();
    expect(() => createPublicMediaUrl(readS3MediaConfig(env), bad)).toThrow();
  });
  it("rejects ambiguous prefixes and unrelated public origins", () => {
    expect(() => readS3MediaConfig({ ...env, OBJECT_STORAGE_PREFIX: "../media" })).toThrow();
    expect(() => readS3MediaConfig({ ...env, PUBLIC_MEDIA_BASE_URL: "https://archive.najala.org/other" })).toThrow();
    expect(() => readS3MediaConfig({ ...env, PUBLIC_MEDIA_BASE_URL: `${env.PUBLIC_MEDIA_BASE_URL}?x=1` })).toThrow();
  });
});
