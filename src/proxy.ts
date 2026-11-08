import { NextResponse, type NextRequest } from "next/server";
import { legacyDestination } from "@/lib/legacy-route";

export function proxy(request: NextRequest) {
  const destinationPath = legacyDestination(request.nextUrl.pathname);
  if (!destinationPath) return NextResponse.next();

  const destination = request.nextUrl.clone();
  destination.pathname = destinationPath;
  const response = NextResponse.redirect(destination, 307);
  response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Vary", "Cookie");
  return response;
}

export const config = {
  matcher: ["/learn/:path*", "/workshop/:path*", "/ladder/:path*", "/classroom/:path*", "/play/:path*"],
};
