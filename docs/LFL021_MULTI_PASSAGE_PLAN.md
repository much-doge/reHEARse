# LFL-021 — Complete listening journeys

Owner: integration lead. Status: deployed to PCT128 on 2026-10-09.
Runtime and verification: `docs/LFL021_DEPLOYMENT_RECEIPT.md`.

The operator requested one game containing both conversations and a separate
game containing all three talks. Each game has one saved run, one classroom PIN,
and one final finish. Passage checkpoints require completion of bounded replay
or supported review before the learner explicitly opens the next recording.

## Acceptance

- Conversation journey: two recordings, eight original A–D items.
- Talk journey: three recordings, twelve original A–D items (five, three, four).
- Correct media and contextual millisecond replay bounds at every passage.
- Persist ordered passage progression; refresh/retry cannot skip or double-advance.
- Pin every media version when the run/session starts. Later imports cannot change it.
- Teacher can view each passage board and see where participants are without exposing
  explanations, answers, repair counts, or proficiency judgments on projection.
- All snakes and ladders correspond to saved movement; finite support remains available.
- Preserve earlier content readers and saved sessions; additive migration only.
- No confidential source identifiers in new public material.
- Full check, real PostgreSQL/API and browser journeys, then app-only PCT128 deployment.

## Implementation decision

New content and mechanics versions extend the existing ladder capability. A
flattened immutable item list is partitioned into ordered passages. State retains
all choices plus the current passage index. A separately acknowledged `continue`
action opens the next recording and its board only after the current passage is
closed. Each passage uses its own functional three-node-per-item route.

Nullable JSON media-version lists on runs and sessions pin every recording. Existing
single-passage readers retain their historical contracts. No new service, scoring,
random progress boost, or AI dependency is introduced. AI remains advisory.

## Source review

Use operator-local audio, scanned options and the private question bank. Corroborate
talk meanings with the locally supplied script; unrelated transcript documents must
not be used. Keep source mapping and import inputs outside tracked/public files.
Record actual checks and unresolved limits in the release receipt.
