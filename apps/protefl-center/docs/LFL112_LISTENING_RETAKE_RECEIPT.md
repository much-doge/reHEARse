# LFL-112 — Listening-only missed-question retake receipt

Status: deployed to PCT128; authenticated candidate click-through remains
unverified.

## Finding

The owner completed a Listening-only assignment and reported that the
post-completion retake button did not start a retry. A read-only production
query found the relevant completed root represented as `scope=full`,
`delivery_scope=listening`, with no parent. The retake parent lookup accepted
only full/full roots or legacy section/listening roots, so this valid attempt
was rejected as unavailable. The existing regression had used the older
section/listening row shape and did not catch the deployed shape.

The production application logs did not record the candidate API request or
error code, so no private request body or answer data was needed or read. The
root-row shape and the focused regression reproduced the lookup mismatch.

## Change

- Accept a completed Listening-only root when its attempt, delivery, and
  assignment scopes match the requested Listening section.
- Preserve the actor, assignment, published-resource, unarchived-completed
  attempt, and active-assignment-window checks.
- Derive the retry subset from the selected completed review and create a new
  child attempt under that root. The original result and answers remain
  unchanged.
- Replace the previous legacy-shaped test fixture with the production row
  shape and assert missed-question selection and root lineage.
- No package content, timing, database schema, migration, or learner data was
  changed.

## Verification

- Focused adapter regression: 1 file, 4 tests passed.
- Full Vitest suite: 56 files, 221 tests passed.
- ESLint, TypeScript, local Next production build, Compose config, and
  `git diff --check`: passed.
- Production read-only eligibility aggregate: one completed Listening-only
  root is eligible for retry and has missed items. No attempt was created by
  verification.
- PCT128 app and PostgreSQL are healthy with zero restarts. The app responds
  HTTP 200 on its container health route; public health is HTTP 200. The
  signed-out package route redirects (307) and unauthenticated Test Center
  resources remain denied (401).
- Three `Failed to find Server Action` entries appeared in the sanitized
  deployment log scan and included Next's stale-client hint. Reload an already
  open candidate page to fetch the current release before continuing.
- No authenticated candidate session was available to click the button in a
  live browser. The exact production attempt shape is covered by the regression
  and its retake eligibility was confirmed read-only; do not label this
  classroom-verified.

## Deployment

- Source commit: `1de97fa`.
- PCT128 release tree: `/opt/rehearse/.releases/1de97fa`.
- App image: `rehearse-app:1de97fa`, image ID
  `sha256:e591cd4d9b1c56aeedbf7ba592ff73dd9ac55291e11a7ab6b89c26b8011af591`.
- App-only rollout used `docker compose up -d --no-deps app`. PostgreSQL was
  not recreated. No migration or database write was performed.
- Rollback: restore `REHEARSE_IMAGE_TAG=8745689` and recreate only the `app`
  service from `/opt/rehearse/.releases/8745689`.
