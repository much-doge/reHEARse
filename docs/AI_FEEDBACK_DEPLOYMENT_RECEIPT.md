# AI feedback latency and reference deployment receipt

Work ID: LFL-013. Deployment date: 2026-10-06 (Asia/Jakarta).

## Release

- Implementation commit: `4956f4ff67d2d9c59d8643c404bb0b4e5954d02a`.
- PCT128 checkout fast-forwarded cleanly from `f6074d7` to `4956f4f`.
- Application image: `rehearse-app:4956f4f`.
- Image digest:
  `sha256:0b2b833810f9c63ecd39fd2be8c2660c325bf327e04821b97da792d21d06785e`.
- Production configuration validation passed with secrets omitted.
- Only `rehearse-app-1` was recreated with `--no-deps`.
- `rehearse-postgres-1` retained container ID `b8d72c028dc2` and remained
  healthy.

## Active feedback controls

The running application reports these non-secret settings:

```text
OPENAI_REASONING_EFFORT=minimal
OPENAI_MAX_OUTPUT_TOKENS=1200
OPENAI_TIMEOUT_MS=30000
```

Prompt version `listening-review.2026-10-06.v4` confines `you/your` and
`kamu/-mu` to the learner. Audio participants require an explicit role or
third-person reference. Successful future feedback records include
content-free request byte counts, token/reasoning usage, header latency and
total provider latency.

Previously stored feedback remains immutable. This deployment did not create a
learner attempt or make a live provider canary call, so the new wording and
latency are deployed but not yet verified against a new production response.

## Verification

- Pre-deployment: `pnpm check` passed lint, TypeScript, 63 tests and the
  production build; production Compose configuration and `git diff --check`
  passed.
- PCT128 app and tools images built successfully.
- `rehearse-app-1`: healthy, zero restarts.
- LAN `http://192.168.8.63:3001/api/health`: HTTP 200, `health.v1`.
- Public `https://rehearse.najala.org/api/health`: HTTP 200, TLS verification
  result 0.
- Public source audio byte range: HTTP 206, `audio/mpeg`, 32 requested bytes,
  TLS verification result 0.
- No error, exception, fatal, timeout, connection-failure or failed markers in
  the new app container's deployment-window logs.

All eight Writing Analysis Studio container IDs matched the pre-deployment
baseline. Its API, PostgreSQL, SeaweedFS, ClamAV, candidate scorer, Harper and
LanguageTool remained healthy; its worker remained running. None was recreated,
restarted or modified. Port 8000 and all Writing Analysis Studio data were out
of scope.

## Rollback

Inside PCT128, restore the protected pre-change environment file at
`/opt/rehearse/.secrets/lfl013-env-before`, set `REHEARSE_IMAGE_TAG=f4a2267`,
and recreate only the app service with the production Compose file and
`--no-deps`. Do not restart PostgreSQL, run `down -v`, prune Docker, or touch
Writing Analysis Studio. Image `rehearse-app:f4a2267` remains the prior release.

