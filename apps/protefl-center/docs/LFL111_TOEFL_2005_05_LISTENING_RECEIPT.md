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

## Integrity

The regenerated package manifest contains 10 unique file entries and records:

- Content hash: `288f35271c5eeaaecb939769f015c88c89c56b9fcbf1fc97b95f8116646fd0da`
- Answer-key hash: `24e405b8e8434734d8d16252a2d04f9f4433686f6992564eb14acd8e7182b5db`
- Score-table hash: `d214bfa230e26cb3a57696f9c3a27359b784c19bc5a378b9be6d70edf7cc6225`
- Timing-map hash: `2db3aa30752732acf25fb89f4aa9967ac911a8ee37b9cdcd217e5139a8a1593b`

## Verification

- Package bootstrap: 50 questions and 50 response windows generated from the
  exact supplied MP3.
- `verify-diagnostic-package.py`: passed; count 50 Listening, zero Structure,
  zero Reading.
- Focused package/delivery/diagnostic/resource tests: 4 files, 32 tests passed.
- Full Vitest suite: 56 files, 219 tests passed.
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
- Deployment is not claimed yet. Database resource seeding, runtime health,
  signed-out route/audio access checks, and authenticated learner review/retry
  remain pending on PCT128.

## Deployment and classroom receipt

Complete after publication with the release commit/image, additive migration
time, resource readback, zero-new-assignment check, runtime/audio asset check,
health and auth checks, rollback point, and explicit browser/classroom status.
