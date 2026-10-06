import { NextResponse } from "next/server";
import { z } from "zod";

import { generateAttemptFeedback } from "@/adapters/db/listening-repository";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";

const requestSchema = z.object({ attemptId: z.string().uuid() }).strict();

export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "origin_rejected" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return NextResponse.json(
      { error: "content_type_required" },
      { status: 415 },
    );
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "authentication_required" },
      { status: 401 },
    );
  if (user.role !== "learner")
    return NextResponse.json(
      { error: "learner_role_required" },
      { status: 403 },
    );
  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_attempt" }, { status: 400 });

  try {
    const attempt = await generateAttemptFeedback(user.id, parsed.data.attemptId);
    if (!attempt)
      return NextResponse.json({ error: "attempt_not_found" }, { status: 404 });
    return NextResponse.json(
      { contractVersion: "attempt-result.v2", attempt },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "feedback_unavailable" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
