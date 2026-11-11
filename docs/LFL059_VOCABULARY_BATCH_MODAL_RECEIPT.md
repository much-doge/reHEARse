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

## Verification

- Changed-path ESLint, repository TypeScript, and diff check passed.
- Next production build pending before deployment.
- Existing learner attempts remain pinned and append-only; no attempt was
  created for verification.
