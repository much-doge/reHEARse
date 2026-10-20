# LFL-023 — integration acceptance checkpoint

Status: integrated source complete. Not published, deployed, or classroom
verified.

## Accepted integration

The content/backend lane's early checkpoint and final commit were integrated as
`1a8dc40` and `2233879`. The lead interface is `2e5456f`. The public
`part-a-workshop.v1` DTO and action union remained unchanged.

The integrated capability contains thirty privately reviewed Part A items in
five useful skill groups, five complete bilingual preparation cards, original
A-D ordering, item-specific replay guidance, a finite guided-relisten process,
three saved distractor explanations, a server-derived twelve-second first
choice window, teacher PIN/release/progression, and raw operational counts.
Historical classroom and ladder capabilities remain separate.

Review accepted the preparation material as direct, inquiry-led teaching text.
It explains the task, listening target, decision process, distractor mechanisms,
an analogous example, self-questions and needed language notes. It does not use
fantasy framing, mascot narration, points, rankings, mastery labels or AI
grading.

## Lead correction

The backend correctly returns the original acknowledgement for an idempotent
retry only when the complete original request is repeated. The first lead UI
checkpoint regenerated UUID keys after a lost response. Integration now stores
one pending mutation body in browser session storage per room/role, including
its original UUID, observed revision and action. It removes that body only
after acknowledgement and then polls GET for current state. Join recovery uses
the same rule without placing its private UUID in a URL or log.

Focused tests prove that a changed fresh body cannot replace an unacknowledged
request and that a new mutation is admitted only after acknowledgement.

## Verification

- Integrated `pnpm check`: ESLint, TypeScript, 44 Vitest files and 163 tests,
  and Next 16 production build.
- Actual private importer dry-run from the integrated checkout: thirty local
  hashes, byte sizes, MP3 codecs/types, pinned durations, schema, skill groups,
  preparation material and original option order passed without network or
  credentials.
- Both private artifacts are ignored and mode 0600.
- Worker evidence accepted: isolated production-shaped full check and real
  PostgreSQL/API authentication, ownership, timing, retry/race, privacy,
  completion and historical-reader journey.
- `git diff --check` passed before the integration-fix commit.

## Honest remaining gates

The source match is supported by independent local transcription, secondary
online option/script matches and semantic key checks. A separate human has not
yet listened through all thirty source clips while checking every option and
key. Publisher-authenticated provenance was unavailable. These limits do not
invalidate the private package, but they remain explicit content-acceptance
limits.

Live object publication and public range checks have not run. Migration 016 has
not been applied to production. The combined real-content teacher/learner
browser flow, keyboard/narrow-screen/reduced-motion checks, PCT128 deployment,
and classroom use have not run. No media, repository commit or deployment was
published by this checkpoint.

Rollback preserves migration 016, immutable published versions if any later
exist, and append-only workshop events. Disable navigation/new room creation or
restore the prior app image; never delete learner evidence or reuse a content
version for corrected source material.

