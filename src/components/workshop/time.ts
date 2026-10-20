export function workshopClock(
  serverTime: string,
  receivedAt: number,
  now = Date.now(),
) {
  return new Date(serverTime).getTime() + Math.max(0, now - receivedAt);
}

export function secondsUntil(iso: string | null, now: number) {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 1000));
}

