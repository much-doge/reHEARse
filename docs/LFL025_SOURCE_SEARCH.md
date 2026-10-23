# LFL-025 package 1467 source search

Status: source gate open; no Part B/C items have been imported.

## Verified local package

The authorized ConTEFL takeout at
`/home/miko/Documents/playground/ConTEFL/artifacts/ConTEFL-2026-10-16-package-1467/`
contains the audio sequence and checksums, not a transcript or answer choices.
Its local listening README and manifest show five shared passage files:

| Questions | Local recording | Duration |
|---|---|---:|
| 31–33 | `31_33_Dialog.mp3` | 98.46 s |
| 34–37 | `34_37_Dialog.mp3` | 93.48 s |
| 38–42 | `38_42_Talk.mp3` | 128.50 s |
| 43–46 | `43_46_Talk.mp3` | 95.31 s |
| 47–50 | `47_50_Talk.mp3` | 75.74 s |

It also contains one spoken prompt clip per item (31–50). The package sequence
capture confirms these shared passages and prompts were played in order; it
does not include the A–D text, question-key mapping, or a script. Local
manifest paths: `listening/manifest.json`, `listening/LINKS.md`, and
`listening/README.md`; sequence evidence is in the separate ConTEFL private
evidence archive dated 2026-10-16.

## Online lookup

Exact searches for the package code, shared-file names, and the package URL did
not find a matching transcript/options set. The UNY BeSmart category does list
TOEFL Listening and ProTEFL practice courses:

- <https://besmart.uny.ac.id/v2/course/index.php?categoryid=149>
- Candidate course `TOEFL Listening P2B` (`id=6703`) could not be retrieved by
  the search interface (cache miss).
- Candidate `PRACTICE TESTS 2` (`id=1403`) redirects to UNY SSO. No course
  content was accessed.

The local scanned `96年12月北美真题.pdf` and its matching secondary script
refer to a different recording set captured as ConTEFL package 1163. Those
materials are not acceptable evidence for package 1467; their audio group
boundaries and recordings differ. Do not reuse their B/C transcript, options,
or keys for this work item.

No local speech-recognition model or transcription CLI was available in the
current environment. The captured audio was not sent to an external service.

## Import gate

Before importing B/C, obtain a source that can be checked against the actual
package-1467 audio: original A–D order for every item, the matching spoken
question prompt, a transcript or independently reviewed script, and the key
with an evidence-based rationale. Record the source URL/page or supplied file,
the matching group filename and SHA-256, and an independent human listening
review. Keep the full transcript and answer key private and out of learner
DTOs. Until those checks pass, prepare no invented dialogue topics, question
wording, options, keys, or bespoke replay clues.

## Longman design scope retained

The intended original bilingual preparation draws on Longman Intermediate
Skills 18–27: anticipate likely topics and questions, identify the topic, infer
who/what/when/where from evidence, and follow question/detail order. Part B
will be sequenced by conversation and Part C by talk, with paper notes rather
than an on-screen notes field. The Longman skills guide the teaching design;
they do not establish which content belongs to package 1467.
