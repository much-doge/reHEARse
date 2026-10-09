# LFL-020A lead UI checkpoint

Date: 2026-10-09. Status: source-complete UI; integrated backend and deployment
acceptance pending. This checkpoint does not claim executable production
snakes/ladders before the other desktop's saved reducer is accepted.

The lead implemented an optional registered chapter map alongside the unchanged
legacy board. Four replay/listening bays, four trigger nodes and four camps
lead to a distinct finish node. Every snake and ladder is supplied by the
frozen executable map; absent/unknown maps render the legacy route without
connectors. Actual marker motion and painted connectors share geometric samples.

Only a newly observed consecutive saved transition can animate. Refresh,
initial mount, stale/skipped revisions and inconsistent endpoints snap to the
saved final node instead of inventing travel. Cosmetic rerenders do not cancel
an active route. Speech, reduced-motion changes, layout changes and unmount
cancel movement. Same-tile grouping retains every player and the local marker.

The learner UI supports ordered A–D arrays and legacy three-choice items,
uses actual item counts, shows private listening/replay checkpoints and exact
millisecond bounds, and plays complete conversation audio from zero through
its metadata duration. Task changes clear stale seek targets; premature audio
end no longer automatically declares a requested span complete. Existing
appearance/draft safeguards and equal supported celebration remain.

Both teacher and learner lobbies consume the frozen neutral catalogue.
Solo starts send the selected activity; PIN joins defer to the teacher's pinned
session. A teacher create with an uncertain response locks the selected
conversation and retains its idempotency key for retry. Source keys,
transcripts, archive identifiers and learner diagnostics do not enter these
new UI contracts.

Verification completed:

- `pnpm check`: lint, TypeScript, 112 tests across 30 files, production build.
- Local UI runner built and actual legacy learner browser journey passed:
  playback/span gate, green/red/neutral feedback, speech priority, repair
  draft/choice preservation through colour saves, supported review, reload,
  lost-response reconciliation, phone, reduced motion and catalogue artwork.
- Synthetic chapter fixture: 1/10/30 players, eight registered connectors,
  no name overlaps at checked desktop dimensions, 30 same-node expansion,
  snake/recovery travel, cosmetic rerender continuity, audio cancellation,
  reload without replay, reduced motion and phone overflow.
- Synthetic frozen-contract UI: both activity selectors, A–D ordering,
  D submitted as index 3, registered chapter map, complete replay from zero,
  phone overflow, teacher failed-create selection lock and same-key/activity
  retry. These responses are mocked and do not prove the new backend.
- Operator audio inventory: both conversations match manifest SHA-256/size;
  durations approximately 97.1s and 99.0s. No source file was changed/uploaded.

The final timestamp display refinement passed the complete native check after
the local UI-runner journey. A final combined image and real new-version
PostgreSQL/API/browser journeys remain release gates. The second desktop owns
content, keys/spans, version pinning, movement persistence and import material.
The lead will review actual commits and private source worksheet before push,
media import or PCT128 deployment. Current production remains f24a97c.

Rollback at this checkpoint: revert the UI commit; the frozen coordination
contract is additive and no database records or runtime configuration changed.
