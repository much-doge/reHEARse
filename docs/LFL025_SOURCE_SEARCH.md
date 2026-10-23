# LFL-025 source matching record

Status: matching supplied sources found; content implementation is source-complete. Production publication and classroom verification are separate release gates.

## Supplied source set

The transcript and review presentation supplied by the teacher cover questions 31–50 in test order. Their five group boundaries and item counts align with the package-1467 audio manifest:

| Questions | Transcript/review topic | Shared audio | Prompt files |
|---|---|---|---|
| 31–33 | Native American dance troupe interview | `31_33_Dialog.mp3` | `31.mp3`–`33.mp3` |
| 34–37 | Apartment repair conversation | `34_37_Dialog.mp3` | `34.mp3`–`37.mp3` |
| 38–42 | Effective-speaking lecture | `38_42_Talk.mp3` | `38.mp3`–`42.mp3` |
| 43–46 | History of mail delivery museum talk | `43_46_Talk.mp3` | `43.mp3`–`46.mp3` |
| 47–50 | Photographing the skies lecture | `47_50_Talk.mp3` | `47.mp3`–`50.mp3` |

The supplied transcript gives each question once in increasing order, and the review deck contains a separate answer-reveal slide for each. All 20 A–D sets and keys were checked against those reveal slides. The audio build script additionally matches all 25 local media files to package 1467's captured manifest by relative path, category, byte size, SHA-256 and duration. The package capture identifies five `shared-passage` files and twenty `question-prompt` files.

Online exact-phrase searches did not establish a publisher-authenticated origin for this particular test set. They were not used to fill any source gap. The teacher-supplied transcript and slide deck are the working source for item wording, options and keys.

## Source correction

Review slide 134 keys option B for question 36 as “Talk to Mr. Connors.” The same slide's question and the supplied transcript name Ms. Connors, and the correct-answer excerpt says Paula will meet Ms. Connors. The private import corrects that single option to “Talk to Ms. Connors,” preserves the B position and key, and records the change in `.secrets/lfl025-source-review.json`. Do not silently restore the slide typo.

## Boundaries

- The complete transcript and question stems stay in the teacher-supplied source files. The runtime package does not include them; learner and host DTOs contain neither.
- During preparation, learner DTOs do not release group audio or question audio. Starting a question releases its audio sequence; answer choices appear in the learner interface only after playback timing permits.
- Part B/C is a new immutable workshop version. Part A v2 remains the default for an unversioned/older room-create request, and existing rooms remain pinned to their original content.
- A source-to-audio mapping by package number and captured hashes is not equivalent to an independent human review of every recording. Human listening acceptance remains outstanding.

## Longman reference

The supplied Deborah Phillips Longman preparation course lists Part B Skills 18–22 and Part C Skills 23–27. The cards use those skills to structure prediction, paper notes, topic recognition, contextual inference and answer order. They paraphrase the methods in original bilingual language and do not reproduce Longman examples or passages. The skills are applied to whole dialogue/talk groups, not used to split a passage by item type.
