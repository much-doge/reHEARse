# Avatar lane status

Work ID: LFL-019B. Status: source-complete in the isolated avatar lane; not
integrated, pushed or deployed.

The earlier scaffold is now backed by 136 required local PNG parts from Kenney's
CC0 Monster Builder Pack 1.0 and its original licence. Thirty named compositions
render through `Avatar`, visibly animate through layered CSS, and remain still
when `animate={false}` or the user prefers reduced motion. The bilingual picker,
random choice, save controller, owned API, user preference, append-only change
record and learner/teacher DTO fields are implemented.

The persisted choice is a per-user cosmetic preference. It applies to all of
that user's owned ladder runs, including later runs, without changing immutable
learning records, gameplay revision, aliases, session membership or teacher
ownership. Users with no row receive a stable distributed fallback derived from
their user ID.

Open `/art/avatars/gallery.html` in a running build for the rendered catalogue.
See `docs/AVATAR_CATALOG.md`, `docs/AVATAR_LICENSES.md` and
`docs/AVATAR_IMPLEMENTATION_RECEIPT.md` for the exact catalogue, lineage,
contracts, checks and integration boundary.

The original desktop Codex still owns mounting the controls in `game.tsx`, board
markers/name bubbles/crowding, combined acceptance, push and deployment. This
lane has not edited those paths or claimed integrated release completion.
