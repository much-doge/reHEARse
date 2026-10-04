export function GET() {
  return Response.json({
    status: "ok",
    service: "listening-foundation-lab",
    contractVersion: "health.v1",
  });
}

