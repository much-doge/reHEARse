import { protectedDiagnosticItem } from "@protefl/adapters/postgres-diagnostic";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string; section: string; question: string }> }) {
  const headers = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };
  const user = await currentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers });
  const { attemptId, section, question } = await params;
  const content = await protectedDiagnosticItem(user.id, attemptId, section, question);
  return content ? Response.json(content, { headers }) : Response.json({ error: "not_found" }, { status: 404, headers });
}
