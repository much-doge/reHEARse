# LFL-085 — Generic structured package verifier

## Problem

The existing Practice Test A verifier is valuable but intentionally tied to one
form: its totals, passage count, filenames, group ranges, and score example are
all fixed. Future agents could copy the workflow while silently validating the
wrong shape.

## Change

`apps/protefl-center/scripts/verify-diagnostic-package.py` now provides the
reusable structural gate. Given a package directory, it:

- verifies every manifest file size and SHA-256;
- derives section counts from that package's answer key;
- checks structured question counts and complete A–D options;
- checks Structure completion blanks and error-identification choices when those
  sections exist; and
- checks Listening pause/question-map sequence and optional alignment evidence
  without assuming a particular form name or passage count.

The bootstrap guide documents the command and distinguishes a valid partial
source checkpoint (such as Listening-only Practice Test B) from a registered,
candidate-ready full package.

## Verification state

Source-complete. The generic verifier passed on Practice Test A with counts
50/40/50 and on the Listening-only Practice Test B checkpoint with counts
50/0/0. No database or learner-data changes were made. Publication, descriptor
registration, deployment, and authenticated browser gates remain package-specific.
