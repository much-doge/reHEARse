# Avatar scaffold checkpoint

Work ID: LFL-019B. Status: incomplete scaffold, not integrated or deployed.

The 30 named compositions in `src/domain/ladder/avatars.ts`, layered renderer,
picker and CSS are a starting point for the other desktop Codex. The running
game does not import them yet. `pnpm check` passed with this scaffold present
(lint, TypeScript, 85 tests and production build); that does not verify its
artwork, animation or usability.

**Missing dependency:** `public/art/avatars/parts/` has not been populated.
Rendering the scaffold now will request missing PNGs. No avatar persistence,
appearance API, board integration, catalogue gallery or dedicated avatar tests
have been implemented. Complete and verify these before claiming this slice
source-complete.

Research handoff: the creator's [Monster Builder Pack page](https://kenney.nl/assets/monster-builder-pack)
identifies the artwork as CC0. The downloaded archive at
`/tmp/kenney-monsters.zip` contains the original licence; a contact sheet is at
`/tmp/monster-parts.jpg`. Temporary files may disappear: re-verify the creator
page, archive and licence if either is absent. Verify every referenced filename
before copying only required parts. Preserve the original licence in the asset
directory and record sources in `docs/AVATAR_LICENSES.md`.

Kenney supplies static modular artwork. The compositions and layered
blink/wave/bob animation are authored for this application. Do not claim the
source pack itself supplies animated characters. Thirty palette swaps alone
are insufficient: inspect the varied silhouettes, facial arrangements and
accessories at actual board sizes. The scaffold is replaceable if its visual
quality is poor, provided the agreed component/domain contracts are preserved.

Rollback: these unreferenced scaffold files can be removed without changing
the current application. Do not integrate them before assets are available.
