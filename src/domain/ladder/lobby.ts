/** Public game names are optional pseudonyms, never account names. */
export function validGameAlias(alias: string) {
  return alias.length >= 2 && alias.length <= 28 && /^[\p{L}\p{N} _'-]+$/u.test(alias);
}
export function lobbyPhase(ready: boolean, sessionStarted: boolean) {
  return !ready ? "setup" as const : !sessionStarted ? "waiting" as const : "playing" as const;
}
