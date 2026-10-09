# LFL-019F character colours and anonymous names

Date: 2026-10-09. Status: container-verified; deployment pending.

Thirty existing animated character compositions now support independent colour
selection: original, mint, teal, ocean, sky, violet, lilac, rose, coral, amber,
gold, fern and slate. Unconfigured players receive a stable varied colour.
Existing saved character preferences retain original colouring until changed.
SVG recolouring affects body, limbs and accessories; eyes and mouths remain
unaltered. Artwork stays local and the Kenney CC0 notice is preserved. The
standalone catalogue includes mixed-colour and single-colour previews.

The public listening-ladder contract advances to v3 with `avatarPalette` on
owned and host DTOs. The appearance endpoint accepts an optional whitelisted
`paletteId`; old character-only requests preserve the current palette. Additive
migration 012 extends preferences and append-only appearance changes. A
colour-only save does not mutate a listening event, answer, revision or task.
Repeated identical saves remain no-ops and actor locking serializes changes
from different owned runs. Uncertain responses use the same owned reconciliation
path as character saves.

New runs use a random-run-ID-derived adjective and animal name, such as
Curious Otter. No real name or UUID fragment is exposed. Existing stored
aliases remain untouched; legacy Listener names are transformed only in the
read projection. The learner and teacher share the same collision-aware
projection. Numeric collision suffixes distinguish identities, not ranks.
There are 32 adjectives and 64 animals; uniqueness within a class is handled
by suffixing rather than pretending combinations cannot repeat.

Verification: `pnpm check` passed lint, TypeScript, 105 tests across
28 files and production build. Local migration 012 applied. Chromium board
preview passed 1/10/30-player name placement, 30-player same-tile expansion,
keyboard focus return, phone overflow and reduced motion. Integrated PostgreSQL/API checks passed palette-only save/no-op, invalid palette
rejection, ownership/authentication, concurrent writes, projection, persistence,
and unchanged learning revisions. The complete game API journey passed.
Actual learner Chromium checks passed colours, animation pause during audio,
retained draft/choice, green/red/neutral effects, supported review, reload,
lost-response reconciliation, phone and reduced motion. The actual teacher
session showed 30 distinct animal aliases and 12 saved palettes; its projected
board exceeded 1600 CSS pixels and all 30 same-tile players were accessible.
The gallery's arm animation nesting was corrected and bounded limb/overflow
checks passed for desktop and phone. Production receipt remains pending.

Rollback: restore the previous application image; retain additive columns and
cosmetic history. No source content, game movement, proficiency interpretation,
learner response or teacher authority changes.
