# LFL-111 — May 2005 TOEFL Listening-only package

## Objective

Add the owner-authorized May 2005 TOEFL PBT Listening section as a distinct,
versioned and assignment-scoped Test Center package. The package contains all
50 prompts, four editable choices per item, a reviewed answer key, section and
Part A/B/C directions, the supplied recording, exact answer windows, and
context/question timing for every Part B conversation and Part C talk.

Students assigned this Listening-only form must finish into a standalone
Listening result, view their own post-completion review, and use the existing
append-only Listening retake workflow. The package must not expose Structure
or Reading, nor enter reHEARse learning history or diagnostics.

## Authorization and sources

- The owner confirmed in the current request that they own or have permission
  to digitize and deliver the complete May 2005 Listening form to their
  students.
- Owner-supplied recording: `/media/miko/nextcloud-transit/TEMP/data g/PPB UNY/2013/AUDIO/2005-05.mp3`.
- Web source used to identify the matching form and transcribe printed
  Listening prompts/options: [TOEFL 2005-05 scan](https://pdfcoffee.com/toefl-2005-05-pdf-free.html).
- Matching spoken transcript used for cue comparison: [May 2005 Listening
  transcript](https://tingroom.com/print_68978.html).
- Secondary reference for the 50-item Listening answer key and linked
  recording: [May 2005 TOEFL forum post](https://bbs.gter.net/thread-394062-1-1.html).
- Candidate content is re-entered as editable structured items. The web scan
  and its page images are not delivered to candidates or copied into the
  package as candidate content.

## Scope

- Stable package code: `ets-toefl-pbt-2005-05-listening`.
- Package version: 1.
- Delivery scope: `listening` only, 50 questions.
- Source recording retained byte-for-byte if codec compatibility permits;
  codec, duration and SHA-256 recorded in the manifest.
- No score-conversion table will be invented. If no source-backed conversion
  table is located, the completed result reports the source-supported raw
  Listening counts and item review with conversion unavailable.

## Acceptance criteria

1. Audio match is confirmed from the filename/tag, duration/fingerprint, and
   independent spoken anchors spanning Parts A, B and C.
2. All 50 source items appear exactly once, with the correct prompt, A-D
   choices, part membership, and cited source location in private audit data.
3. Answer-key provenance and every key entry are recorded and reviewed; any
   unresolved key prevents publication.
4. Every answer interval and question cue is mapped to the original audio;
   Part B/C questions retain the complete group context start and their own
   spoken-question start/end. Directions and transitions have explicit
   timestamps in the alignment audit.
5. The package verifier passes; manifest inventories and all package hashes
   are regenerated after final edits.
6. The package loader serves only the Listening section, audio and permitted
   question DTO. Keys and conversion data stay server-side until completion.
7. A Listening-only assignment creates a standalone result, preserves
   append-only history, permits the standard missed/omitted-question retake,
   and shows the result/review only after completion.
8. Additive resource registration and deployment evidence are recorded. No
   learner assignment is created by publication.
9. Local, container, deployed and classroom verification states are recorded
   separately. Do not issue learner codes until unresolved source/audio/key
   issues are closed.

## Known repository support

The Test Center has a Listening-only package example, a package descriptor
catalogue, private/no-store candidate routes, section-only results, and
append-only section retakes. This work adds the May 2005 package to those
boundaries and verifies the selected Listening-only path without changing
existing attempts or assignments.

## Initial verification

- Audio metadata: MP3, mono, 22,050 Hz, 48 kb/s, 1,993.295 seconds.
- SHA-256: `ad16974fdf8435982ac0cb77cfeca160e1d85fec07067f4da9abe39126ee770e`.
- `ffmpeg silencedetect` at `-32 dB` for 4 seconds found 50 candidate response
  windows plus a 4.956-second terminal tail. This detector setting is a
  locating aid; spoken cues were aligned locally to the matching transcript
  and recorded in the timing audit.
- The owner's clues and scan match the supplied form. Spoken anchors span
  Parts A, B, and C; the private receipt records the exact times and the two
  key-letter adjudications.

## Final receipt

See `LFL111_TOEFL_2005_05_LISTENING_RECEIPT.md` for source-complete evidence,
the final hashes, exact checks, deployment status and remaining gates.
