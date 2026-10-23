# LFL-024 — Longman Part A materials deployment receipt

Date: 2026-10-23 (Asia/Jakarta). Status: deployed; classroom verification
pending.

## Release

- Work ID: LFL-024.
- Source commit: `1bbf939483132c9d95caea6475e475407935707d`.
- Branch: `main`; pushed to `origin/main` before deployment.
- Runtime image: `rehearse-app:1bbf939`.
- Runtime image ID: `sha256:61c030ae6767ab076d789e93310c26f7b236d63197ba7bf8d0a2b7198dcba8d1`.
- Tools image: `rehearse-tools:1bbf939`.
- Tools image ID: `sha256:14e8ac4288060ba675fc84d5913bb399b4d3073eb0725e746af4dc0d4f88b935`.
- Target: reHEARse only, PCT128; Git checkout `/opt/rehearse`.

## Material and publication change

The five preparation groups now teach the specific Longman Part A skills that
match their current questions. Each bilingual card contains an original
explanation, a five-step decision process, five concrete distractor patterns,
and three or four language notes. The content is paraphrased from the supplied
Deborah Phillips book, not copied from its example dialogues or test items.
Skills 14–15 (wishes and untrue conditions) are not forced into a group because
the reviewed item groups do not call for them. The printed page references and
complete mapping are in `docs/LFL024_PART_A_PILOT_REVISION.md`.

The saved package is `short-conversation-workshop-v2`, with pedagogy version
`longman-part-a-practice-v2`. The guarded publisher inserted one immutable v2
row. The v1 row, historical room pins and learner records were not rewritten.
The server projection applies the revised safe preparation card to legacy v1
rooms without changing their stored content. All thirty original A–D choices,
keys, item ordering, and media SHA/size/duration/key/URL lineage were checked
against v1 before publication. The audio objects and shared bucket were not
changed; there was no upload and no migration.

Enrichment copy now describes three purposeful replays: reconstruct before
comparing choices, test one skill cue against the actual recording, and
reconsider after a pause before comparing the first response. Only existing
audio and original A–D options are used. No synthetic speech, written source
stems, or dialogues were added. No learner free-text response was read.

## Verification

- Local `pnpm check`: ESLint, TypeScript, 44 Vitest files / 165 tests, and the
  Next production build all passed.
- Four focused preparation/projection tests passed. The legacy-v1 test confirms
  the richer card is projected while the immutable stored room remains byte-for-
  byte unchanged and its written example is not exposed.
- Production Compose configuration passed `config --quiet`.
- PCT128 built both images above; the app's Next production build and TypeScript
  checks passed inside the image build.
- The guarded production dry-run passed for thirty clips, five Longman-aligned
  groups, original option order/keys, and unchanged public-media lineage. It
  confirmed no written prompt, upload, or DB write in dry-run mode.
- The guarded publish reported one immutable v2 row. Read-only version listing
  then returned both `short-conversation-workshop-v1` and
  `short-conversation-workshop-v2`.
- Only `rehearse-app-1` was recreated using `--no-deps`. It runs
  `rehearse-app:1bbf939` and reports healthy. The `health.v1` endpoint returned
  `status: ok` through both the configured LAN address and public HTTPS from
  PCT128.
- Container ID/image comparison against the pre-release snapshot matched all
  nine non-app containers, including the PostgreSQL container and all eight
  Writing Analysis Studio containers. No Writing Analysis Studio service was
  restarted or modified.
- No migration, learner activity, test account, attempt, response, or classroom
  session was created for this release.

## Remaining acceptance

The app is deployed and the immutable content is published, but this receipt
does not claim a complete authenticated teacher/student browser run of the
activity or a classroom pilot. The teacher should review the five cards in the
live preparation view and choose the group to play before the timed questions.
Independent human review of all thirty audio/key pairs remains outstanding
from the source review. No Part B/C package was changed or added.

## Rollback

If the UI/runtime must be rolled back, set
`REHEARSE_IMAGE_TAG=8089b99` and recreate only the app service with production
Compose and `--no-deps`. Keep the immutable v2 row and media objects; do not
delete content, roll back migrations, restore the old full database dump over
newer participant activity, or restart PostgreSQL/Writing Analysis Studio.
The prior runtime uses the same v2 contract shape. If v2 must be withheld from
new rooms, use an explicit source-controlled start-version change rather than
deleting its published row.
