import type { StoredAttempt } from "../adapters/db/listening-repository";
export type AttemptDraft = {
  slug: string;
  pseudonym: string;
  notes: string;
  reconstruction: string;
  submissionKey: string;
};
export class AttemptSaveFailure extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}
export async function confirmAttempt(
  submissionKey: string,
  fetcher: typeof fetch = fetch,
  byId = false,
): Promise<StoredAttempt | null> {
  const response = await fetcher(
    `/api/attempts?${byId ? "attemptId" : "submissionKey"}=${encodeURIComponent(submissionKey)}`,
    { cache: "no-store", signal: AbortSignal.timeout(8_000) },
  );
  if (!response.ok) return null;
  const payload = await response.json();
  if (payload.contractVersion !== "attempt-result.v2" || !payload.attempt?.id)
    return null;
  return payload.attempt;
}
export async function saveWithConfirmation(
  draft: AttemptDraft,
  fetcher: typeof fetch = fetch,
): Promise<StoredAttempt> {
  let failure = "save_unconfirmed";
  try {
    const response = await fetcher("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
      signal: AbortSignal.timeout(70_000),
    });
    const payload = await response.json().catch(() => null);
    if (
      response.ok &&
      payload?.contractVersion === "attempt-result.v2" &&
      payload.attempt?.id
    )
      return payload.attempt;
    if ([400, 401, 403, 404, 409, 415].includes(response.status))
      throw new AttemptSaveFailure(
        typeof payload?.error === "string" ? payload.error : "save_unconfirmed",
      );
  } catch (error) {
    if (error instanceof AttemptSaveFailure) throw error;
  }
  try {
    const saved = await confirmAttempt(draft.submissionKey, fetcher);
    if (saved) return saved;
  } catch {
    failure = "confirmation_unavailable";
  }
  throw new AttemptSaveFailure(failure);
}
