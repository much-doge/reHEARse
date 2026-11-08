import { protectedDiagnosticPage } from "@protefl/adapters/postgres-diagnostic";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string; pageNumber: string }> }) {
  const user = await currentUser();
  const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401, headers });
  const { attemptId, pageNumber } = await params;
  const image = await protectedDiagnosticPage(user.id, attemptId, pageNumber);
  return image ? new Response(image, { headers: { ...headers, "Content-Type": "image/jpeg" } }) : Response.json({ error: "not_found" }, { status: 404, headers });
}
