# LFL-088 — ETS TOEFL ITP Level 1 Volume 1 Practice Test A

Status: deployed

## Objective

Bootstrap a new, immutable full diagnostic package for **ETS TOEFL ITP Level 1
Practice Tests, Volume 1 — Practice Test A** inside the separately bounded
ProTEFL Test Center. The package must be a structured web-native assessment,
not a PDF/image viewer, and must not replace or mutate the existing Volume 3
package or any active attempts.

## Source and authorization

- Owner-supplied book: `/home/miko/Downloads/toefl-itp-practice-tests-level-1-volume-1.pdf`
- Owner-supplied Listening recording: `/media/miko/nextcloud-transit/TEMP/data g/PPB UNY/2013/AUDIO/2016 - 1062.mp3`
- Owner confirmed in the current request that the supplied recording is the
  correct source to use and asked for the complete Test A to be digitized.
- The source PDF and recording remain Test Center source artifacts. They must
  not enter reHEARse learning diagnostics/history or public/static candidate
  payloads.

## Planned package identity

```yaml
package: ets-volume1-practice-test-a
version: 1
sections: [listening, structure, reading]
counts: {listening: 50, structure: 40, reading: 50}
listening_parts: [A, B, C]
structure_parts: [A, B]
structure_minutes: 25
reading_minutes: 55
```

The final package directory will be additive, for example
`apps/protefl-center/content/ets-volume1-practice-test-a-v1/`.

## Required package artifacts

- Complete source PDF and layout-preserving extraction in the private package;
- editable directions for Listening overview/Parts A–C, Structure overview/
  Parts A–B, and Reading overview;
- all 50 Listening prompts/options with Part A/B/C group membership;
- all 15 Structure Part A completion items with explicit blanks;
- all 25 Structure Part B error-identification items with exact underlined
  spans represented as tokens;
- all 50 Reading items, five passages, source line references, and passage
  relationships;
- source-checked answer key and Volume 1 score-conversion table;
- preserved supplied audio, duration/codec/hash metadata, quiet-window map,
  question map, Part B/C context ranges, and transcript-anchor audit;
- manifest, content/key/score/timing hashes, README, and source-page audit map.

## Gates before registration/publication

1. Source PDF and supplied audio are copied without re-encoding and hashed.
2. Every item has a prompt, four non-empty A–D choices, one valid key, and a
   source-page reference; no page crop or extracted page-text dump is served to
   candidates.
3. Listening directions and all Part A/B/C context/question transitions are
   mapped to the supplied recording. Part B/C questions retain full group
   context and direct question playback.
4. Structure blanks/underlines and Reading passages/line references render as
   editable web content.
5. The package verifier, changed-path checks, package tests, build, and the
   authenticated candidate/teacher journeys pass.
6. The package is registered under an explicit catalogue code only after the
   content, key, audio, layout, access-control, review-state, and deployment
   gates are complete.

## Source-complete evidence

- The source PDF is copied byte-for-byte to
  `content/ets-volume1-practice-test-a-v1/source/ets-toefl-itp-level1-volume1.pdf`
  and the owner-supplied MP3 is copied byte-for-byte to
  `source/practice-test-a-listening.mp3`; the manifest records size and SHA-256
  for both.
- The generated package contains 50 Listening items, 15 Structure Part A
  completion items, 25 Structure Part B underlined-token items, 50 Reading
  items, and five line-preserving passages. The package verifier passed all
  counts, A–D option checks, blanks, underlined choices, and 50 listening maps.
- The listening map preserves the 50 native answer windows detected with
  `ffmpeg silencedetect` at `-42 dB`/4 seconds. Part B groups are 31–34 and
  35–38; Part C talks are 39–42, 43–46, and 47–50. The first cue is recorded as
  a structural 142000 ms anchor and still requires classroom playback
  confirmation.
- The answer key and score-conversion table are transcribed from the Volume 1
  Practice Test A source pages, and the importer is retained at
  `scripts/bootstrap-volume1-practice-a.py` for reproducible future packages.

## Deployment evidence (2026-11-13)

- Release commit: `891b8f9` (`feat(test-center): bootstrap Volume 1 Practice Test A`).
- Target: Consumer PCT 128, release tree
  `/opt/rehearse/.releases/891b8f9`.
- Runtime image: `rehearse-app:891b8f9`; the app container is healthy and the
  Postgres container remained healthy during the rollout.
- The slim release archive was transferred over the Proxmox transport and its
  SHA-256 was verified on the guest as
  `3a220492bf89c8e1e97e6ea720060d03979739ce03296264e3b6873812481954`.
- Additive migration `042_seed_volume1_practice_test_a.sql` applied at
  `2026-11-13 08:28:21.964755+00`.
- A pre-migration custom-format backup was created at
  `/opt/rehearse/.secrets/lfl088-pre-migration-891b8f9.dump` (mode `600`,
  3,199,249 bytes) and validated with `pg_restore --list`.
- The resource is published in the database as
  `ets-volume1-practice-test-a | published | version 1`, with zero assignments
  created by this rollout. Existing counts were unchanged:
  `app_user=93`, `protefl_resource_assignment=75`,
  `protefl_diagnostic_attempt=94`, `protefl_diagnostic_event=7825`,
  `protefl_diagnostic_result=67`.
- The guest health endpoint returned HTTP 200 with `health.v1`; the public
  health endpoint also returned HTTP 200. Signed-out Test Center pages redirect
  to login and the unauthenticated audio endpoint returns HTTP 401 with
  private/no-store headers.
- The new package's source PDF, metadata, and MP3 are present inside the
  running app image. The MP3 route now advertises `audio/mpeg`, while existing
  M4A packages retain `audio/mp4`.

## Remaining verification gates

- No authenticated browser session was available in this rollout, so a full
  signed-in teacher/candidate journey and classroom audio playback spot-check
  remain explicitly unverified. The signed-out access-control boundary,
  database publication, runtime assets, and health checks are verified.
- The first listening cue remains the structural `142000 ms` anchor from the
  source alignment audit; confirm that cue in a real classroom playback before
  issuing learner codes.

## Safety and rollback

The work is additive. Existing `ets-volume3-practice-test-a` resources,
assignments, package files, and attempts remain untouched. To roll back the
application only, redeploy the previous known-good app image
`rehearse-app:b04cd97`; leave migration 042 applied because it is additive. If
database recovery is ever required, use the validated backup
`/opt/rehearse/.secrets/lfl088-pre-migration-891b8f9.dump` under the normal
restore procedure rather than deleting rows by hand.
