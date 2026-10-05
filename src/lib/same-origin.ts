export function isSameOriginRequest(request: Request, publicOrigin = process.env.PUBLIC_APP_ORIGIN): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;

  try {
    const parsed = new URL(origin);
    if (publicOrigin) return parsed.origin === publicOrigin && origin === parsed.origin;
    return parsed.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}
