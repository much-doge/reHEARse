# LFL-091 — Vocabulary double-tap advance

Status: deployed

After feedback is shown, a learner can tap the already selected answer twice
within the short gesture window to advance to the next card. On the final card
the same gesture completes the round. Other role buttons remain available for
correction, and no additional answer or history event is created by the
shortcut.

The behavior is implemented for both the contextual single-choice flow and
the legacy multi-role flashcard flow.

Verification: changed-path ESLint, TypeScript, and `git diff --check` passed.
Deployed in PCT128 app image `rehearse-app:3732bca`; app and public health
endpoint are healthy (`health.v1`, HTTP 200).
