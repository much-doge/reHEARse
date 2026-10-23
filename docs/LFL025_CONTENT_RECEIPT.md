# LFL-025 Part B/C content receipt

Status: container-verified in the local checkout. Production publication, integrated browser acceptance and classroom review remain pending. Owner: integration lead.

## What the teacher can run

The workshop now has a separate immutable version for TOEFL ITP Listening Parts B and C. At room creation, the teacher chooses Part A or Parts B/C. The Part A v2 package stays the default for older and unversioned create requests; an active room pins its original package and keeps its saved learner attempts. The teacher can select any of the five dialogue/talk sections in the existing teacher view.

The B/C activity follows the source's shared-passage format. Students first read a bilingual preparation card and take notes on paper. For the first question in a section, the browser plays its shared conversation or talk followed by that question's spoken prompt. Later questions play their own prompt. The server opens a 12-second choice window after the required audio finishes. The learner screen shows only the question number and A–D choices, never the written stem or transcript. A wrong choice opens a finite, purpose-led replay of the shared passage and prompt with an item-specific bilingual focus. A supported choice triggers the existing small celebration and asks the learner to explain each distractor. Responses remain individual and unscored. Optional replays use the real passage and prompt audio with the original A–D choices.

The teacher projection retains only whether a first listen started and whether a replay was used. It does not expose a roster, participant denominator, unfinished count, answer correctness totals, or learner explanation text.

## Content set and instruction map

All 20 questions remain in their original order and are grouped by the five recordings, not by question type.

| Questions | Group | Part | Main listening work |
|---|---|---|---|
| 31–33 | Native American dance troupe interview | B | topic, interview purpose, supported reason |
| 34–37 | Apartment repair conversation | B | speaker roles, cause, planned action, limited inference |
| 38–42 | Effective-speaking lecture | C | central claim, recommendations, transitions and class task |
| 43–46 | Mail-delivery history museum talk | C | topic, chronological details, cause, contextual phrase and exhibit detail |
| 47–50 | Astronomy photography lecture | C | common belief, stated advantage, tool purpose and cause/effect |

The preparation cards apply Longman Part B Skills 18–22 and Part C Skills 23–27. Each card includes a bilingual listening target, paper-note plan, decision procedure, distractor patterns, inquiry prompts, language notes, and three optional extension modes. The wording is original and paraphrased; no textbook example or explanation was copied.

## Source and private files

Working sources:

- Teacher-supplied transcript: `/home/miko/Downloads/TOEFL_ITP_Listening_Transcript_1_50_Clean.docx`
- Teacher-supplied review deck: `/home/miko/Downloads/TOEFL_ITP_Listening_Review_Parts_A_B_C_FINAL_170_Slides.pptx`
- ConTEFL package 1467 audio: `/home/miko/Documents/playground/ConTEFL/artifacts/ConTEFL-2026-10-16-package-1467/listening/package-audio`

The 20 spoken prompts and five passage clips match the supplied materials by question numbering/group counts and by package capture manifest. All 20 option sets and keys were programmatically checked against their answer-reveal slides. The importer checks all 25 files against the package manifest, including relative path, category, byte size, duration and SHA-256. Human listening against every audio/key pair remains pending.

The source has one documented correction: Q36 option B says “Mr. Connors” on slide 134, while the transcript and answer explanation identify Ms. Connors. The private import uses “Ms. Connors,” preserves option B and records this correction.

Ignored, mode-0600 operator files:

- `.secrets/lfl025-source-review.json`
- `.secrets/lfl025-import.json`

The private source JSON includes the supplied source file paths, original answer options and keys, review evidence, item-specific distractor reasoning, and bilingual replay material. The generated import package includes only A–D, answer keys and private review, item-specific feedback, and the 25 audio references. It does not contain transcript text or written question stems. The runtime projection never returns answer keys or private review fields.

Regenerate and validate locally:

```sh
node --import tsx scripts/lfl025-build-private-package.ts \
  .secrets/lfl025-source-review.json .secrets/lfl025-import.json \
  /home/miko/Documents/playground/ConTEFL/artifacts/ConTEFL-2026-10-16-package-1467/listening/package-audio
node --import tsx scripts/lfl023-import.ts .secrets/lfl025-import.json --dry-run
```

The dry-run performs no network, object-store, or database write. Publication requires a separate explicit release action.

## Contract and release boundary

- Content version: `conversation-academic-talk-v1`.
- Learner contract: `part-bc-workshop.v1`.
- Grouping version: `dialogue-order-v1`.
- Pedagogy version: `longman-skills-18-27-paper-notes-v1`.
- Media: five shared-passage recordings plus twenty spoken question prompts, all delivered as public media objects by direct object URLs after release. No audio is served from the app host.
- Migration: none. Existing immutable workshop-content and room tables support an additive version row. No existing row, room, response, or attempt is rewritten.
- Publishing B/C must not change the Part A default. The UI explicitly sends the selected version and the repository keeps Part A v2 as its legacy/unversioned fallback.
- Rollback: hide the B/C selection or restore the previous app image. Keep the immutable content row, media, migration lineage and learner evidence; do not delete them.

## Verification record

Passed locally:

- Source match: 20 question numbers in order in the DOCX; all twenty answer keys and four-option sets match the named review slides, with only the logged Q36 correction.
- Private package build: 20 questions, five shared passages and 25 files; source capture manifest hashes, sizes, durations and media categories matched.
- Importer dry-run: 20 items in five groups; 25 local media checks passed; no network or credentials used.
- ESLint, TypeScript, 44 Vitest files / 169 tests, and Next production build passed. `pnpm check` itself was unavailable in this host shell; equivalent commands were run directly.
- Isolated disposable PostgreSQL/API journey passed against migrations 001–016. It covered the existing Part A journey and the new shared-passage B/C path, teacher selection, default-to-Part-A compatibility, passage/prompt timing, delayed answer window, replay, wrong/correct branches, private DTO boundaries and historical readers.
- Private importer dry-run passed for all 20 items, five passages and 25 captured assets.
- The production importer uses the `migrator` image; it includes `ffprobe` so publication rechecks audio type and duration rather than trusting the source manifest.
- Failed publishes report only a safe stage and error class/code, never raw provider text, paths, payloads or credentials.
- The object-store uniqueness probe distinguishes a missing key (404) from denied/unavailable preflight using only the sanitized HTTP status.
- Network/provider error names are also included in the safe preflight category when no HTTP response is available; raw messages remain redacted.

Not yet run: authenticated browser playback, public object publication/range verification, production deployment, and classroom acceptance. The 25 recordings have not received independent human listening review. Do not report B/C as live until publication and deployment pass.
