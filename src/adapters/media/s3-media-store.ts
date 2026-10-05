import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { RemoteMediaStore } from "@/application/media-store";
import type { S3MediaConfig } from "./s3-config";

function createClient(config: S3MediaConfig) {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
    maxAttempts: 3,
  });
}

export class S3CompatibleMediaStore implements RemoteMediaStore {
  private readonly client: S3Client;

  constructor(private readonly config: S3MediaConfig) {
    this.client = createClient(config);
  }

  async createDownloadUrl(storageKey: string) {
    assertSafeObjectKey(storageKey, this.config.prefix);
    if (this.config.deliveryMode === "public") {
      return { kind: "redirect" as const, url: createPublicMediaUrl(this.config, storageKey), expiresAt: null };
    }
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.config.bucket, Key: storageKey }),
      { expiresIn: this.config.signedUrlTtlSeconds },
    );
    return {
      kind: "redirect" as const,
      url,
      expiresAt: new Date(Date.now() + this.config.signedUrlTtlSeconds * 1_000),
    };
  }

  async uploadFile(input: {
    path: string;
    storageKey: string;
    contentType: string;
    sizeBytes: number;
    sha256: string;
    activitySlug: string;
  }) {
    assertSafeObjectKey(input.storageKey, this.config.prefix);
    if (input.sizeBytes > this.config.maxUploadBytes) {
      throw new Error("media exceeds MEDIA_MAX_UPLOAD_BYTES");
    }
    const source = await stat(input.path);
    if (!source.isFile() || source.size !== input.sizeBytes) {
      throw new Error("media changed before upload");
    }
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: input.storageKey,
        Body: createReadStream(input.path),
        IfNoneMatch: "*",
        ContentLength: input.sizeBytes,
        ContentType: input.contentType,
        ServerSideEncryption: "AES256",
        Metadata: {
          sha256: input.sha256,
          "activity-slug": input.activitySlug,
          "contract-version": "listening-activity-package.v1",
        },
      }),
    );
  }

  async deleteObject(storageKey: string) {
    assertSafeObjectKey(storageKey, this.config.prefix);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: storageKey }));
  }
}

export function assertSafeObjectKey(storageKey: string, prefix = "") {
  if (prefix && !/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(prefix)) throw new Error("invalid media prefix");
  const required = prefix ? `${prefix}/activities/` : "activities/";
  if (!storageKey.startsWith(required) || storageKey.includes("..") || !/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/.test(storageKey)) throw new Error("invalid media storage key");
}
export function createPublicMediaUrl(config: S3MediaConfig, storageKey: string): string {
  if (!config.prefix || !config.publicBaseUrl) throw new Error("public media configuration missing");
  assertSafeObjectKey(storageKey, config.prefix);
  const base = new URL(config.publicBaseUrl);
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash || !base.pathname.replace(/\/$/, "").endsWith(`/${config.prefix}`)) throw new Error("invalid public media URL");
  const relative = storageKey.slice(config.prefix.length + 1);
  return `${base.href.replace(/\/$/, "")}/${relative.split("/").map(encodeURIComponent).join("/")}`;
}
