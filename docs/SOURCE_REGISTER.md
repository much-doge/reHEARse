# Source register

## ConTEFL package 1163 — Questions 31–34

- Imported private asset: `media/contefl-1163-31-34.mp3`
- Source: `ConTEFL/artifacts/ConTEFL-listening-1163/package-audio/31_34_Dialog.mp3`
- Archive category: shared passage
- Duration: 97.115533 seconds
- SHA-256: `d728ede236948a4877dc38926114abdad19ff358dc35414f9be107ffbeed42c2`
- Question-paper match: 1996-12 North America, Listening 31–34
- Transcript corroboration: the paper's answer options match the three-papers,
  Romanticism, and chemistry-lab dialogue published at
  <https://pdfcoffee.com/master-cu-tep-i-completed-pdf-free.html>.

The imported copy is retained outside the public web root and is served only
through an authenticated activity-media route. The activity version stores its
source metadata so later transcript corrections create a new version rather
than silently changing learner evidence.

## PCT128 production delivery (LFL-006)

The same source-backed audio was imported as immutable activity version 2 into
najala-dumpster under rehearse/media/activities, with the original SHA-256 and
source lineage retained. Version 1 remains evidence. In this explicitly public
media deployment, authorized activity responses contain the stable archive
origin URL; the host does not relay remote audio. See DEPLOYMENT_RECEIPT.md.

## ConTEFL 1163 Part A recreational deck (LFL-007)

Operator-provided `package-audio/1.mp3` through `30.mp3` are authoritative.
A temporary local faster-whisper base.en model transcribed all 30 clips; no
source audio or learner data was uploaded to an external transcription service.
The locally captured dialogue situations were compared with the unofficial
December 1996 North America transcript and original option archive:
<https://daafoor.com/assets/dropzone/uploads/solutions/5c72ff19f363f/Audio%20script.pdf>
and <https://studylib.net/doc/8948667/96年12月北美真题>.
These corroborations are unofficial, not ETS-certified answer material.

`content/part-a-game.v1.json` contains newly authored prompts/options and
bilingual meaning/relisten cues based on the operator's audio, not a verbatim
copy of the original exam. Option positions therefore differ from that paper.
No full exam transcript is redistributed. Source ASR errors (especially Jan,
upper-level, and speaker labels) were checked against context; the authored
questions avoid relying on uncertain proper-name spelling. The game importer
stores per-clip source SHA-256, size and storage key with the immutable deck.

## LFL-021 — Three operator-supplied talks

Added neutral activities `room-for-next-year`, `body-temperature`, and
`work-beyond-the-office`, containing five, three and four original A–D items.
They form one twelve-question game; the two previously reviewed conversations
form one eight-question game. Source mapping and operator import manifests stay
in protected ignored storage. Original choice order was cross-checked with the
local question bank and scanned options; talk meanings were corroborated against
the matching local script. An unrelated local transcript was excluded.

Replay bounds use local speech alignment with sentence-context padding; broad
main-topic questions retain broad spans. No audio was sent to an external
transcription provider. Alignment is timing assistance, not a certified transcript
or classroom approval. Audio rights remain under the existing operator-supplied
source policy. No new artwork or music was required for this change.

## LFL-025 — ConTEFL package 1467 Parts B/C

The operator supplied `/home/miko/Downloads/TOEFL_ITP_Listening_Transcript_1_50_Clean.docx` and `/home/miko/Downloads/TOEFL_ITP_Listening_Review_Parts_A_B_C_FINAL_170_Slides.pptx`. The transcript's question numbers and the review deck's answer reveals map to the five shared passage files and twenty spoken prompts captured in ConTEFL package 1467. The private package builder requires each selected file to match `listening/manifest.json` in relative path, media category, byte size, SHA-256 and duration.

The review deck's question stems and transcript do not enter the runtime package or learner/host DTOs. The imported item record carries only A–D choices, the private key/review, bilingual replay guidance and its own spoken-prompt audio. Each dialogue/talk group's separate passage audio is released only when a learner starts its first question or an authorized replay. Longman Part B Skills 18–22 and Part C Skills 23–27 inform original bilingual preparation; no textbook examples or test questions are copied into those cards.

The slide deck has one option-text correction: Q36 option B says “Mr. Connors,” while the supplied transcript and answer explanation identify Ms. Connors. The import uses “Ms. Connors,” retains position B and records the correction in protected operator review. The mapping is source-consistent but still awaits independent human listening across every prompt and passage. Protected import materials are ignored under `.secrets/lfl025-source-review.json` and `.secrets/lfl025-import.json`; see `docs/LFL025_SOURCE_SEARCH.md` and `docs/LFL025_CONTENT_RECEIPT.md`.
