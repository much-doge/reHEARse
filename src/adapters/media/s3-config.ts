import { z } from "zod";
const positiveInteger = z.coerce.number().int().positive();
export type S3MediaConfig = {
  endpoint: string; region: string; bucket: string; accessKeyId: string; secretAccessKey: string;
  signedUrlTtlSeconds: number; maxUploadBytes: number;
  prefix?: string; deliveryMode?: "private" | "public"; publicBaseUrl?: string;
};
export function readS3MediaConfig(environment: NodeJS.ProcessEnv = process.env): S3MediaConfig {
  const region = z.string().trim().min(1).parse(environment.OBJECT_STORAGE_REGION ?? environment.B2_REGION);
  const endpoint = environment.OBJECT_STORAGE_ENDPOINT ?? environment.B2_S3_ENDPOINT ?? `https://s3.${region}.backblazeb2.com`;
  const url = new URL(z.string().url().parse(endpoint));
  if (url.username || url.password || url.search || url.hash || (environment.NODE_ENV === "production" && url.protocol !== "https:")) throw new Error("Invalid object storage endpoint");
  const prefix = environment.OBJECT_STORAGE_PREFIX?.trim() ?? "";
  if (prefix && !/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(prefix)) throw new Error("Invalid object storage prefix");
  const deliveryMode = z.enum(["private", "public"]).parse(environment.MEDIA_DELIVERY_MODE ?? "private");
  const publicBaseUrl = environment.PUBLIC_MEDIA_BASE_URL?.trim();
  if (deliveryMode === "public") {
    if (!prefix || !publicBaseUrl) throw new Error("Public media requires a prefix and base URL");
    const base = new URL(publicBaseUrl);
    if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash || !base.pathname.replace(/\/$/, "").endsWith(`/${prefix}`)) throw new Error("Invalid public media base URL");
  }
  return {
    endpoint: url.href.replace(/\/$/, ""), region,
    bucket: z.string().trim().min(1).parse(environment.OBJECT_STORAGE_BUCKET ?? environment.B2_BUCKET_NAME),
    accessKeyId: z.string().trim().min(1).parse(environment.OBJECT_STORAGE_ACCESS_KEY_ID ?? environment.B2_APPLICATION_KEY_ID),
    secretAccessKey: z.string().trim().min(1).parse(environment.OBJECT_STORAGE_SECRET_ACCESS_KEY ?? environment.B2_APPLICATION_KEY),
    signedUrlTtlSeconds: positiveInteger.max(3600).parse(environment.MEDIA_SIGNED_URL_TTL_SECONDS ?? "600"),
    maxUploadBytes: positiveInteger.max(2 * 1024 * 1024 * 1024).parse(environment.MEDIA_MAX_UPLOAD_BYTES ?? String(250 * 1024 * 1024)),
    prefix, deliveryMode, publicBaseUrl,
  };
}
