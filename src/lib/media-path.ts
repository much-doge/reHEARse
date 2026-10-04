import path from "node:path";

export function resolvePrivateMediaPath(root: string, storageKey: string): string | null {
  const resolvedRoot = path.resolve(root);
  const resolvedMedia = path.resolve(resolvedRoot, storageKey);
  return resolvedMedia.startsWith(`${resolvedRoot}${path.sep}`) ? resolvedMedia : null;
}
