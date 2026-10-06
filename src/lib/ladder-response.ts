import { LadderError } from "@/domain/ladder/model";
const headers = { "Cache-Control": "private, no-store" };
export function ladderFailure(e: unknown) {
  return Response.json(
    { error: e instanceof LadderError ? e.code : "game_unavailable" },
    {
      status:
        e instanceof LadderError
          ? e.status
          : e instanceof SyntaxError
            ? 400
            : 503,
      headers,
    },
  );
}
