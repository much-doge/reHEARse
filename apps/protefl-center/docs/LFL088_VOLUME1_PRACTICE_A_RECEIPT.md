# LFL-088 — ETS TOEFL ITP Level 1 Volume 1 Practice Test A

Status: source_complete

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

## Remaining gates

- The catalogue descriptor and additive migration 042 exist, but the database
  resource remains `draft` until the package publication gates are approved.
- Deployment, authenticated candidate/teacher journey checks, and classroom
  playback verification have not been performed in this turn. No existing
  Volume 3 package or attempt was changed.

## Safety and rollback

The work is additive. Existing `ets-volume3-practice-test-a` resources,
assignments, package files, and attempts remain untouched. If the new package
fails any gate, it stays unregistered/hidden and can be removed or corrected
without changing existing runtime data.
