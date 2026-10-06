# Large teacher stage — LFL-018

Status: locally container-verified; production pending.

Teacher-only landscape route (940×380 SVG) replaces the narrow portrait
projection. Controls use a compact sidebar; projector mode expands the board
and compacts the alias roster. Native fullscreen has a graceful fallback.
Individual route geometry, progression, saved events and role guards are
unchanged. Original forest artwork uses CSS-animated Kenney CC0 star particles,
with a static reduced-motion presentation.

Optional self-hosted “Carefree” by Kevin MacLeod uses CC BY 4.0. Visible credits
name the author, track, source, license and Ogg/loop/volume adaptations; the
asset register and CREDITS.txt retain the same information. Music is default
off, has a volume slider, pauses on hidden tabs and cannot play during an
active learner session. When a learner joins it pauses automatically. It is
available in the lobby and when all learners finish/session closes. It is
never loaded by learner pages. No proprietary quiz music is included.

GAMEPLAY_ENERGY_PLAN.md proposes reward/tension changes; those rules are not
implemented in this release.

Verification: pnpm check passed lint, TypeScript, 80 tests and production build. Final local runner image f31b68423ebe built. Local browser verified landscape/projector views, native fullscreen entry/exit and opt-in music playback without media errors. After a real local learner join, the music button was disabled and the audio was paused with no media error. No classroom pilot claimed.

Rollback: restore the protected pre-release app image tag (52ccf61), then
recreate only the app service with --no-deps. No migrations or record changes.
