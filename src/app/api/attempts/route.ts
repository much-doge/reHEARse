import { NextResponse } from "next/server";
import { z } from "zod";

import {
  submitLearnerAttempt,
  findSubmittedAttempt,
  SubmissionConflict,
} from "@/adapters/db/listening-repository";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";

const requestSchema = z.object({
  submissionKey: z.string().uuid().optional(),
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
    return NextResponse.json(
      { error: "content_type_required" },
      { status: 415 },
    );
  }
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "authentication_required" },
      { status: 401 },
    );
  if (user.role !== "learner") {
    return NextResponse.json(
      { error: "learner_role_required" },
      { status: 403 },
    );
  }

  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_attempt" }, { status: 400 });

  try {
    const attempt = await submitLearnerAttempt({
      ...parsed.data,
      learnerId: user.id,
    });
    if (!attempt)
      return NextResponse.json(
        { error: "activity_not_found" },
        { status: 404 },
      );
    return NextResponse.json(
      { contractVersion: "attempt-result.v2", attempt },
      { status: attempt.feedbackStatus === "pending" ? 202 : 201 },
    );
  } catch (error) {
    if (error instanceof SubmissionConflict)
      return NextResponse.json(
        { error: "submission_changed" },
        { status: 409 },
      );
    return NextResponse.json({ error: "save_unconfirmed" }, { status: 503 });
  }
}

export async function GET(request: Request) {
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
  const params = new URL(request.url).searchParams;
  const byId = params.has("attemptId");
  if (byId && params.has("submissionKey"))
    return NextResponse.json(
      { error: "invalid_submission_key" },
      { status: 400 },
    );
  const key = z
    .string()
    .uuid()
    .safeParse(params.get(byId ? "attemptId" : "submissionKey"));
  if (!key.success)
    return NextResponse.json(
      { error: "invalid_submission_key" },
      { status: 400 },
    );
  try {
    const attempt = await findSubmittedAttempt(user.id, key.data, byId);
    return NextResponse.json(
      { contractVersion: "attempt-result.v2", attempt },
      {
        status: attempt ? 200 : 404,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "confirmation_unavailable" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
