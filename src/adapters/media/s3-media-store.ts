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
    assertSafeObjectKey(storageKey);
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
    assertSafeObjectKey(input.storageKey);
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
    assertSafeObjectKey(storageKey);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: storageKey }));
  }
}

export function assertSafeObjectKey(storageKey: string) {
  if (!storageKey.startsWith("activities/") || storageKey.includes("..") || storageKey.includes("\\")) {
    throw new Error("invalid media storage key");
  }
}
