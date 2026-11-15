# LFL-102 section-reset sprint plan

Status: in progress

## Problem

The current teacher control is rendered only for a completed full root, while
the learner delivery path selects one arbitrary active attempt. That makes an
active full attempt hide the reset controls and makes independently issued
section resets ambiguous on the learner side.

## Invariants

- A full diagnostic root remains immutable after completion.
- A teacher section reset is a separate child attempt pinned to the parent
  package/version and assignment settings.
- A completed teacher reset changes only the effective projection for its
  section; it never rewrites the parent result.
- Focused learner retries remain practice-only and never enter the effective
  score projection.
- Multiple sections may have active teacher resets at once, but the learner
  must choose an explicit attempt rather than receiving an arbitrary one.
- A section-only assignment has a section-only result lineage and never grows a
  synthetic full-test score.
- Existing attempts, events, and results are append-only evidence.

## Sprint order

1. **Workspace read model** — expose one active root plus all active reset
   children, with explicit attempt opening and no answer-key leakage.
2. **Reset lifecycle** — allow completed full roots and completed section-only
   roots, preserve idempotence per section, and keep score projection rules.
3. **Learner delivery** — render a reset queue, explicit resume actions, and a
   post-reset path back to the recalculated full result.
4. **Teacher workspace** — keep controls visible with clear unavailable,
   active, completed, and archived states.
5. **Regression gates** — cover full, section-only, concurrent resets,
   repeated resets, archival, assignment isolation, and immutable scoring.

## Rollback

The first implementation slices are app-only and additive. No participant rows
are rewritten and no existing attempt is migrated. A release can be rolled back
to the previous image while preserving newly-created append-only child attempts;
the old UI will continue to show their parent history.

## Acceptance

- A learner with one active reset opens that exact section.
- A learner with multiple active resets sees a queue and can open each by ID.
- Completing a reset shows section review and an updated effective full result.
- The original full result remains available and unchanged.
- Section-only assignments reset and review only their own section.
- Teacher controls never disappear solely because another section is active.
