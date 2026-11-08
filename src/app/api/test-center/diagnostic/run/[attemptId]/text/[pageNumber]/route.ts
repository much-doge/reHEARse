import { protectedDiagnosticPageText } from "@protefl/adapters/postgres-diagnostic";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string; pageNumber: string }> }) {
  const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" };
  const user = await currentUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers });
  const { attemptId, pageNumber } = await params;
  const text = await protectedDiagnosticPageText(user.id, attemptId, pageNumber);
  return text === null ? Response.json({ error: "not_found" }, { status: 404, headers }) : Response.json({ text }, { headers });
}
