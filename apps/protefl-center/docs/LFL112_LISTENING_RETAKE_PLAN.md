# LFL-112 — Listening-only missed-question retake repair

## Reported issue

After completing a Listening-only assignment for the May 2005 form, the
candidate selects the missed-question retry button and the retry does not
start.

## Evidence and diagnosis

- Production was inspected read-only. The matching assignment has one
  completed root attempt represented as `scope=full`,
  `delivery_scope=listening`, with no parent attempt. No candidate identifiers
  or answer values were copied into this receipt.
- `startSectionRetake` recognizes a standalone root when `scope` equals the
  section, or accepts a full-scope root only when its delivery scope is also
  `full`. The persisted Listening-only root matches neither accepted parent
  query branch, so the API reports the attempt as unavailable.
- The existing unit fixture modeled the older section-scoped root shape and
  therefore did not exercise the production row shape.
- This is a result-to-retake lineage lookup issue. It does not require a
  migration, package-content change, audio change, or modification to the
  completed attempt.

## Acceptance criteria

1. A completed root `scope=full`, `delivery_scope=listening` attempt can create
   a Listening child retake for the same assignment and actor.
2. The retake selects only incorrect or omitted Listening questions from the
   selected completed attempt, remains pinned to the original Listening
   assignment, and is append-only under the root.
3. Full-test and existing legacy standalone section retries remain supported;
   wrong assignment, actor, scope, unpublished, expired, archived, and
   incomplete attempts remain denied.
4. A regression fixture matches the production row shape and asserts the
   selected question subset and root lineage.
5. The candidate’s prior result and answers remain unchanged. No schema change
   or migration is introduced.
6. Record test, build, deploy, and authenticated candidate verification states
   separately. Do not claim a live learner click-through unless observed.

## Verification and deployment receipt

See `LFL112_LISTENING_RETAKE_RECEIPT.md` for the completed fix, checks,
deployment state, and remaining candidate-side verification.
