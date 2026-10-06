# Large teacher stage — LFL-018

Status: deployed to PCT128 on 2026-10-06. Runtime source `424e94d`.
Runner image `sha256:8839f82a305eaea2bc75727748d361197f61c4621e55d952ca70454bc22966d6`, healthy with zero restarts. Public HTTPS health, particle and music returned 200; music range returned 206, TLS verification 0. Existing owned teacher board and projector view were observed in the public browser. Other container IDs/images/states remained unchanged.

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

Rollback: restore `/opt/rehearse/.secrets/lfl018-env-before` (image tag 52ccf61), then
recreate only the app service with --no-deps. No migrations or record changes.
