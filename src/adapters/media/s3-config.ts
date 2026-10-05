import { z } from "zod";

const positiveInteger = z.coerce.number().int().positive();

export type S3MediaConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  signedUrlTtlSeconds: number;
  maxUploadBytes: number;
};

export function readS3MediaConfig(environment: NodeJS.ProcessEnv = process.env): S3MediaConfig {
  const region = z.string().trim().min(1).parse(environment.B2_REGION);
  const endpoint = environment.B2_S3_ENDPOINT?.trim() || `https://s3.${region}.backblazeb2.com`;
  const url = z.string().url().parse(endpoint);
  if (environment.NODE_ENV === "production" && !url.startsWith("https://")) {
    throw new Error("B2_S3_ENDPOINT must use HTTPS in production");
  }
  return {
    endpoint: url.replace(/\/$/, ""),
    region,
    bucket: z.string().trim().min(1).parse(environment.B2_BUCKET_NAME),
    accessKeyId: z.string().trim().min(1).parse(environment.B2_APPLICATION_KEY_ID),
    secretAccessKey: z.string().trim().min(1).parse(environment.B2_APPLICATION_KEY),
    signedUrlTtlSeconds: positiveInteger.max(3_600).parse(environment.MEDIA_SIGNED_URL_TTL_SECONDS ?? "600"),
    maxUploadBytes: positiveInteger.max(2 * 1024 * 1024 * 1024).parse(
      environment.MEDIA_MAX_UPLOAD_BYTES ?? String(250 * 1024 * 1024),
    ),
  };
}
