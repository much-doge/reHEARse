import { z } from "zod";

import { createClippyProvider } from "@/adapters/feedback/clippy-provider-factory";
import { assertClippyDoesNotRevealAnswer, type ClippyReviewContext } from "../../../../../application/test-center-clippy";
import { currentUser } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/same-origin";
import { teacherDiagnosticReviewItem } from "@protefl/adapters/postgres-diagnostic";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie" };
const schema = z.object({
  resourceId: z.uuid(), candidateActorId: z.uuid(), attemptId: z.uuid(),
  section: z.enum(["listening", "structure", "reading"]), question: z.number().int().positive(),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "origin_rejected" }, { status: 403, headers });
  const user = await currentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers });
  if (user.role !== "teacher" && user.role !== "admin") return Response.json({ error: "not_found" }, { status: 404, headers });
  try {
    const raw = await request.text();
    if (raw.length > 1024) return Response.json({ error: "invalid_request" }, { status: 413, headers });
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400, headers });
    const item = await teacherDiagnosticReviewItem(user.id, user.role, parsed.data.resourceId, parsed.data.candidateActorId, parsed.data.attemptId, parsed.data.section, String(parsed.data.question));
    if (!item) return Response.json({ error: "not_found" }, { status: 404, headers });
    if (item.question.correct) return Response.json({ state: "correct" }, { headers });
    const choices = item.item.options as Record<"A" | "B" | "C" | "D", string>;
    const context: ClippyReviewContext = {
      section: parsed.data.section,
      response: item.question.selected,
      prompt: "tokens" in item.item ? item.item.tokens.map((token) => token.text).join(" ") : item.item.prompt,
      options: choices,
      sourceContext: "transcript" in item && item.transcript
        ? [...item.transcript.segments.map((segment) => `${segment.speaker}: ${segment.text}`), `Narrator: ${item.transcript.questionCue}`].join("\n")
        : "passage" in item && item.passage ? item.passage.lines.map((line) => line.text).join("\n") : null,
    };
    const hint = await createClippyProvider().hint(context);
    assertClippyDoesNotRevealAnswer(hint, item.question.correctAnswer, choices[item.question.correctAnswer]);
    return Response.json({ state: item.question.selected ? "wrong" : "omitted", hint }, { headers });
  } catch {
    return Response.json({ error: "clippy_unavailable" }, { status: 503, headers });
  }
}
