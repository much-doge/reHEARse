export type MediaProvider = "bundled" | "local" | "s3";

export type MediaObject = {
  provider: MediaProvider;
  storageKey: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
};

export type RemoteMediaDelivery = {
  kind: "redirect";
  url: string;
  expiresAt: Date | null;
};

export interface RemoteMediaStore {
  createDownloadUrl(storageKey: string): Promise<RemoteMediaDelivery>;
}
