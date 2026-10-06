# Two-phase feedback deployment receipt

Work ID: LFL-014. Deployment date: 2026-10-06 (Asia/Jakarta).

## Release

- Implementation commit: `228c1abfe354853c3d5ca4673b1916176cfb5dbe`.
- Application image: `rehearse-app:228c1ab`.
- Image digest:
  `sha256:b36ab76dc86502ed2eb960529e9c44f973ee3c00bcce6020d6e4266a11be0334`.
- Production configuration validation passed with secrets omitted.
- Only `rehearse-app-1` was recreated with `--no-deps`.
- `rehearse-postgres-1` retained container ID `b8d72c028dc2` and remained
  healthy.
- No database migration was required.

## Behavior

`POST /api/attempts` now commits and acknowledges the response without calling
OpenAI. The client then makes a separate owned `POST /api/feedback` request.
PostgreSQL advisory locking serializes generation for an attempt, and the
unique feedback row makes repeated generation requests return the existing
result. An interrupted feedback request leaves a durable pending attempt.

Prompt `listening-review.2026-10-06.v5` requires a direct conversation with the
student and bans reviewer narration such as `the learner notes`. Conservative
presentation-only normalization repairs common third-person reviewer phrases
in existing or nonconforming feedback without rewriting the stored record.

This release makes saving independent of provider latency. It does not claim
that OpenAI inference itself is faster than the LFL-013 minimal-reasoning,
1,200-token, 30-second controls.

## Verification

- `pnpm check`: lint, TypeScript, 65 tests and production build passed.
- Production Compose configuration and `git diff --check` passed.
- PCT128 app/tools images built successfully.
- `rehearse-app-1`: healthy, zero restarts.
- LAN health: HTTP 200, `health.v1`.
- Public HTTPS health: HTTP 200, TLS verification result 0.
- Unauthenticated public `POST /api/feedback`: HTTP 401
  `authentication_required`, confirming the new route is deployed and guarded.
- Prompt v5 is present in the deployed checkout.
- No relevant error markers appeared in the deployment-window app logs.

All eight Writing Analysis Studio container IDs matched the pre-deployment
baseline and retained their prior running/healthy states. None was modified or
restarted.

No production learner account, attempt or live provider call was created for
this deployment check. The next real learner response is the live acceptance
test for save acknowledgement time, prompt-v5 wording and provider timing.

## Rollback

Restore `/opt/rehearse/.secrets/lfl014-env-before`, set
`REHEARSE_IMAGE_TAG=4956f4f`, and recreate only the app service with production
Compose and `--no-deps`. Do not restart PostgreSQL, remove volumes, prune
Docker, or touch Writing Analysis Studio. No schema rollback is needed.

