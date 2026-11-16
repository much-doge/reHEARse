# LFL-111 — May 2005 TOEFL Listening package receipt

Status: source complete; PCT128 publication and authenticated learner journey pending.

## Package

- Code/version: `ets-toefl-pbt-2005-05-listening`, version 1.
- Candidate scope: Listening only, 50 items, Parts A/B/C; no Structure or Reading.
- Package directory: `apps/protefl-center/content/ets-toefl-pbt-2005-05-listening-v1/`.
- The 50 prompts and four choices per prompt are editable JSON. The answer key,
  timing metadata, and page index are served under the Test Center's existing
  server boundary; the audio is bundled privately for its authenticated route.
- No scan images, PDF, or full conversation transcript is candidate content.
- No score conversion table was found. It remains empty; results show raw
  Listening counts and item review without an estimated converted score.

## Source and key review

- The supplied recording fingerprint is SHA-256
  `ad16974fdf8435982ac0cb77cfeca160e1d85fec07067f4da9abe39126ee770e`;
  MP3, mono, 22,050 Hz, 48 kb/s, 1,993.295 seconds.
- The audio matches the May 2005 source through independent anchors: Museum of
  Fine Arts (Q1), bank job offer (Q15), Mike/instructor's manual (Q30), the
  Sister Carrie group (Q31–33), child language class (Q34–38), Canadian
  history (Q39–41), birdwatching/eggshells (Q42–46), and geology (Q47–50).
- Editable prompts/options were compared with the [May 2005 scan](https://pdfcoffee.com/toefl-2005-05-pdf-free.html)
  and spoken cues with the [matching transcript](https://tingroom.com/print_68978.html).
- The reference key string is recorded in the private answer-key JSON. Two
  reference letters conflicted with the recording and printed choices, so they
  were adjudicated against those sources: Q24 = D (the director has chosen the
  musical); Q32 = B (Dreiser does not punish Carrie to provide a moral lesson).
  The [secondary forum reference](https://bbs.gter.net/thread-394062-1-1.html)
  is not represented as an ETS-issued key.

## Timing and section map

Every question has its own `questionAudioStartMs`, `questionAudioEndMs`,
`contextStartMs`, and answer-window start/end in
`metadata/listening-question-map-v1.json`. All values are milliseconds from the
original MP3. The package's detailed direction/transition audit is
`metadata/listening-alignment-audit-v1.json`.

| Audio cue | Time |
|---|---:|
| Part A introduction | 00:00.000–00:15.550 |
| Q1 begins | 00:17.150 |
| Q15 bank job offer | 06:40.120 |
| Q30 Mike/instructor's manual | 13:34.210 |
| Part A end marker | 13:49.830–14:05.310 |
| Part B spoken directions | 14:39.780–15:18.450 |
| Part B Q31–33 context (Sister Carrie) | 15:34.500; group ends 17:11.354 |
| Part B Q34–38 context (child language) | 18:03.460; group ends 20:57.664 |
| Part B end marker | 21:08.940–21:13.000 |
| Part C spoken directions | 21:24.080–22:04.940 |
| Part C unscored sample demonstration | 22:04.940–24:34.930 |
| Part C Q39–41 context (Canadian history) | 24:38.650; group ends 26:24.515 |
| Part C Q42–46 context (birdwatching) | 27:20.550; group ends 28:26.997 |
| Part C Q47–50 context (geology) | 29:48.420; group ends 31:36.686 |
| Listening section-end directions | 32:45.540–33:07.840 |
| Recording ends | 33:13.295 |

The `ffmpeg silencedetect` scan (`-32 dB`, minimum 4 seconds) found 50 likely
answer windows plus a 4.956-second terminal tail. Four shorter windows are
preserved as observed: Q3 5.326s, Q17 7.716s, Q39 9.769s, and Q49 9.198s.
Silence detection locates response windows; the transcript and local ASR
locate spoken cues. This is sequence alignment, not classroom playback
verification.

### Post-deployment mechanics correction

The first deployed package was reviewed after publication. That review found
that direct playback for the first item in four multi-question groups started
at the preceding response-window end rather than at the verified group cue:
Q34 (1,079,520 → 1,083,460 ms), Q39 (1,268,924 → 1,478,650 ms), Q42
(1,632,882 → 1,640,550 ms), and Q47 (1,785,338 → 1,788,420 ms). In Q39 this
would have replayed Part B's end, Part C directions, and the sample before the
Canadian-history talk. The package map and shared player start helper now use
each group context cue. Regression coverage loads all five real groups,
confirms all group questions appear during the context lead-in, and checks
first playback begins at that cue. The initial publication had zero learner
assignments and attempts, so no learner evidence was repinned or changed.

## Integrity

The regenerated package manifest contains 10 unique file entries and records:

- Content hash: `8cf3118d73c1db65f7af06df694d2247e71e2daa780fc107b504e161ec95f7b7`
- Answer-key hash: `24e405b8e8434734d8d16252a2d04f9f4433686f6992564eb14acd8e7182b5db`
- Score-table hash: `d214bfa230e26cb3a57696f9c3a27359b784c19bc5a378b9be6d70edf7cc6225`
- Timing-map hash: `0074120ff13d8ad39cc7fa8cff4e51ab54530fa07c38bf0cc4ba56e24580d3b1`
- Corrected question-map file SHA-256: `e2f1f29b7af5959b02d043be2b926fd6b46fa9c12aa26ad382db0f90ecd5c032`

## Verification

- Package bootstrap: 50 questions and 50 response windows generated from the
  exact supplied MP3.
- `verify-diagnostic-package.py`: passed; count 50 Listening, zero Structure,
  zero Reading.
- Focused package/delivery/diagnostic/resource tests: 4 files, 33 tests passed
  after the timing correction.
- Full Vitest suite: 56 files, 221 tests passed after the correction.
- ESLint, TypeScript, and Next.js production build: passed.
- `docker compose config --quiet`: passed.
- `docker compose build app`: passed; local image
  `sha256:ea5e9ffc0fa91ca9654d9cdf3d54be67ad8ef6cdf5551a09ac8790ec1706a07f`
  includes the package. A disposable image check confirmed the bundled MP3
  SHA-256 matches the source fingerprint above.
- The server result route creates the standalone Listening result and exposes
  review only after completion. The focused missed/omitted retry now accepts a
  Listening-only root, creates an append-only child attempt, and preserves the
  original result. Test Center data remains separate from reHEARse diagnostics.
- PCT128 app and PostgreSQL containers are healthy with zero restarts after
  the corrected release. The package's MP3 and question-map hashes were
  checked inside the running image and match this receipt.
- LAN and public `/api/health`: HTTP 200. Signed-out package page: HTTP 307 to
  login. Unauthenticated Test Center resources and diagnostic audio: HTTP 401.
- The learner page was opened in the desktop browser and displayed sign-in.
  No authenticated learner account/session was available for a live candidate
  test, result-review, and retake walkthrough; classroom playback remains
  unverified.

## Deployment and classroom receipt

First publication: commit `4c8c7f2` deployed to PCT128. Additive migration
`045_seed_toefl_pbt_2005_05_listening.sql` was applied at
`2026-11-16 22:58:12.650811+00`; a mode-600 pre-migration database backup at
`/opt/rehearse/.secrets/lfl111-pre-migration-4c8c7f2.dump` was validated with
`pg_restore --list` before migration. The published catalog row was confirmed
with zero assignments.

Post-deployment review found and corrected the four group starts above. Final
app-only release: commit `8745689`, tree
`/opt/rehearse/.releases/8745689`, image `rehearse-app:8745689`, digest
`sha256:285c481dd197591bc2b4dabc3d58d69cf3c4c5a5e80b6ca8ff9108d9a8135696`.
No second migration was needed; migration 045 remains applied. Runtime status
and unauthenticated boundary checks are recorded under Verification. Rollback
is app-only to `rehearse-app:4c8c7f2`; keep additive migration 045 applied.

Deployment is verified, not classroom verified. No learner assignment or
attempt was created by package publication.
