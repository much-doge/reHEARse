# LFL-059 — Twenty-card vocabulary batches and Word Desk modal

## Scope

Contextual vocabulary practice now deals 20 exposures per batch and uses the
same 20-exposure target for daily progress/streak calculations. The existing
card visual and gameplay remain intact; opening a set from Word Desk now opens
that practice inside a blurred modal so the learner keeps the desk context and
does not leave the page. The direct assignment route remains available for
deep-link compatibility.

New vocabulary invite codes use `LEX-` plus six Crockford-base32 characters;
older invite hashes remain valid because claim lookup is hash-based and does
not rewrite existing invitations.

Migration 037 widens the queue exposure counter from 12 to 20 without changing
existing attempts, events, lineages, or assignments.

## Verification and deployment

- Changed-path ESLint, repository TypeScript, and diff check passed.
- Next production build passed locally and in the PCT128 production-shaped image.
- Existing learner attempts remain pinned and append-only; no attempt was
  created for verification.
- Validated mode-600 pre-migration PostgreSQL custom dump:
  `.secrets/lfl059-pre-migration-fe5c590-20261111175133.dump` (2,722,884 bytes).
- Migration `037_vocabulary_contextual_queue_twenty.sql` applied once on
  PCT128 at `2026-11-11 10:55:40 UTC`.
- App image `rehearse-app:f75779f` is healthy on PCT128; LAN and public health
  checks returned HTTP 200. Signed-out vocabulary API remains private (401,
  `Cache-Control: private, no-store`). Authenticated learner/teacher playback
  remains unverified in a browser.
