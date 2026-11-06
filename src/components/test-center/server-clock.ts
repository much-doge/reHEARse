export function serverNowAt(serverTime: string, anchorMonotonicMs: number, currentMonotonicMs: number) {
  return new Date(serverTime).getTime() + Math.max(0, currentMonotonicMs - anchorMonotonicMs);
}
