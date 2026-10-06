# Reuse register

This project studies patterns from existing local systems but remains an
independent repository. Reuse is selective and provenance is explicit.

## Writing Analysis Studio

Reference: `/home/miko/Documents/playground/writing-analysis-studio`

Adopted patterns:

- immutable learner source and versioned derived evidence;
- DTOs separated from storage rows and provider payloads;
- strict, server-validated structured AI output;
- server-owned provenance and prompt/contract versions;
- safe provider failure that preserves useful deterministic/stored work;
- deny-by-default authorization and private data minimization;
- learner-facing evidence language without implementation jargon or false
  certainty;
- explicit distinction between source-complete, deployed, and live-verified.
- S3-compatible object-storage boundaries with generated keys, checksums,
  bounded uploads, private credentials, and safe provider failure;
- Responses API discipline: strict JSON Schema output, `store: false`, bounded
  request/output sizes, validated results, and content-free errors.

Implementation note: the TypeScript adapters are native reHEARse code. They
adapt the reviewed Python implementation rather than importing its runtime or
copying its multi-service topology.

Not copied:

- the Python linguistic analysis pipeline;
- its mature multi-service deployment topology;
- IELTS task-review domain models;
- Sites-specific proxy/deployment machinery;
- its full governance apparatus.

Reason: those solve a different product and would make the first listening
slice slower and harder to operate.

## Consumer / Firefly Ingest

Reference: `/home/miko/Documents/playground/Consumer/AGENTS.md`

Adopted patterns:

- functional vertical slices;
- rhizomatic ports-and-adapters modularity;
- self-hosted durable control plane with bounded cloud inference;
- avoiding brokers and services before measured need;
- provider-neutral AI boundary and redacted logs.

Adaptation: the human approval boundary becomes teacher-owned source/publish
authority plus server validation; AI feedback remains advisory.

## Kenney Board Game Icons — LFL-016

Selected SVG icons: book_open, campfire, pawn, arrow_clockwise and token.
Source: https://opengameart.org/content/board-game-icons (uploaded by Kenney),
corroborated by https://kenney-assets.itch.io/board-game-icons.
License: Creative Commons Zero 1.0 Universal (CC0). The downloaded pack's
`License.txt` is retained at `public/art/kenney/License.txt`. No attribution is
required; visible Kenney credit is included. Only five icons are shipped.
The serpentine board, background, snakes, ladders and token drawing are original
SVG/React artwork; they are not represented as part of the Kenney pack.

## Teacher-stage particles and music — LFL-018

Kenney Particle Pack: https://kenney.nl/assets/particle-pack, CC0. Downloaded
from the creator's asset-page link. Only `PNG (Transparent)/star_01.png` is
shipped, with original License.txt in public/art/kenney/particles. The source
texture is static; reHEARse adds restrained CSS firefly animation.

“Carefree”, Kevin MacLeod (incompetech.com), ISRC USUAN1400037:
https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400037.
Creator lists Creative Commons Attribution 4.0 International:
https://creativecommons.org/licenses/by/4.0/. Downloaded creator MP3,
re-encoded to Ogg Vorbis; reduced playback volume and looped in application.
Full visible title/author/source/license/adaptation credit appears beside the
music controls, with public/audio/CREDITS.txt also shipped. No proprietary
quiz-platform music is used. Audio is self-hosted, default off, and stopped
throughout active learner sessions; no external media requests from the UI.
