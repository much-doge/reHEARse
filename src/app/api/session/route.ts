import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
export async function GET() {
  return NextResponse.json(
    {
      contractVersion: "auth-session.v1",
      authenticated: !!(await currentUser()),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
