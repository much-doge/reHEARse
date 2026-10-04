export function GET() {
  return Response.json({
    status: "ok",
    service: "rehearse",
    contractVersion: "health.v1",
  });
}
