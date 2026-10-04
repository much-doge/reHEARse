import { NextResponse } from "next/server";
import { z } from "zod";

import { submitLearnerAttempt } from "@/adapters/db/listening-repository";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";

const requestSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  pseudonym: z.string().trim().min(1).max(40),
  notes: z.string().max(12_000),
  reconstruction: z.string().trim().min(1).max(12_000),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "origin_rejected" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "content_type_required" }, { status: 415 });
  }
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_attempt" }, { status: 400 });

  const attempt = await submitLearnerAttempt({ ...parsed.data, learnerId: user.id });
  if (!attempt) return NextResponse.json({ error: "activity_not_found" }, { status: 404 });
  return NextResponse.json({ contractVersion: "attempt-result.v1", attempt }, { status: 201 });
}
