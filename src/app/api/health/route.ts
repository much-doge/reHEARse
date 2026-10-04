import { getPool } from "@/adapters/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getPool().query("SELECT 1");
    return Response.json({
      status: "ok",
      service: "rehearse",
      contractVersion: "health.v1",
    });
  } catch {
    return Response.json(
      { status: "unavailable", service: "rehearse", contractVersion: "health.v1" },
      { status: 503 },
    );
  }
}
