/** Only application destinations can survive authentication. */
export function safeReturnTo(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 1000 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\x00-\x20]/.test(value)
  )
    return "/dashboard";
  try {
    const url = new URL(value, "https://rehearse.invalid");
    if (
      url.origin !== "https://rehearse.invalid" ||
      !/^(?:\/|\/dashboard|\/ladder(?:\/host)?|\/classroom|\/play|\/learn\/[a-z0-9]+(?:-[a-z0-9]+)*)$/.test(
        url.pathname,
      )
    )
      return "/dashboard";
    const query = new URLSearchParams();
    const pin = url.searchParams.get("pin");
    if (
      pin &&
      /^\d{6}$/.test(pin) &&
      ["/ladder", "/ladder/host", "/classroom", "/play"].includes(url.pathname)
    )
      query.set("pin", pin);
    if (url.pathname === "/ladder" && url.searchParams.get("new") === "1")
      query.set("new", "1");
    return url.pathname + (query.size ? `?${query}` : "");
  } catch {
    return "/dashboard";
  }
}
export function signInUrl(destination: unknown, expired = false): string {
  return `/login?${new URLSearchParams({ next: safeReturnTo(destination), ...(expired ? { reason: "expired" } : {}) })}`;
}
