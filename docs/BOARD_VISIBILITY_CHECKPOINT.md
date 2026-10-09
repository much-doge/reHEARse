# Board visibility checkpoint

Work ID: LFL-019D. Date: 2026-10-09. Status: locally verified board layout;
avatar integration, container verification and deployment remain pending.

## Accepted layout decisions

The board draws the actual existing game route and current positions. Inert
snakes and ladders were removed, including the accessible label promising
their mechanics. This change does not add slides, shortcuts or a new movement
rule. Existing choices, repairs, supported exits and game positions are intact.

Markers have a full game-alias bubble above them. Run IDs identify markers so
two identical generated aliases do not share a React key. Larger marker sizes
vary by portrait/teacher projection and whether a tile has one or two visible
players. Avatar rendering is a separate layer; SVG scenery sizing cannot resize
the nested character SVG accidentally. The learner board accepts an animation
pause flag during speech.

A tile shows up to two named markers. Additional occupants are explicitly
counted by a `+N` button. The button opens a current group list containing every
occupant, with names and large markers; it does not place hidden players on
another tile. The local player stays visible when their own crowded tile is
shown. The teacher roster also retains all players. This is grouping of game
positions, not a correctness total or listening rank.

Group controls are keyboard accessible, expose expanded state and support
close/Escape with focus returned to the initiating button. Motion follows
reduced-motion preferences. The group list changes layout below the board,
rather than covering listening controls with an overlay.

## Verification

- `pnpm check`: lint, TypeScript, 91 tests in 24 files and production build.
- Six new grouping/layout checks: 30 same-tile occupants retained; local token
  visibility; separate positions and duplicate aliases; malformed visual
  coordinates bounded; route endpoints contained in both geometries; no
  invented players on an empty board.
- Local headless Chromium preview of the actual bundled board component and
  application CSS, using synthetic aliases and **fallback markers**, at
  1440 × 1000: 1, 10 and 30 players; no overlapping name bubbles in the checked
  distributed layouts. Thirty players spread across thirteen tiles produce
  26 visible markers and four explicit overflow buttons.
- All 30 at one tile: two markers plus `+28`; opening the group exposes all 30
  occupants; close/Escape restores focus to the trigger.
- Portrait at 390 × 844: local token remains visible, no horizontal overflow;
  reduced-motion transition is effectively disabled; no browser page errors.
- `git diff --check` passed. Preview scripts/screenshots are temporary local
  aids under `/tmp/rehearse-board-preview/`, not a committed browser test suite.

## Remaining acceptance

LFL-019B is being implemented in the other desktop's isolated worktree. Its
artwork, saved preferences and public avatar DTOs have not been integrated into
this checkpoint. Current callers therefore use the functional fallback markers;
do not call this the finished avatar release. Recheck character silhouettes,
name bubbles and group lists with the real licensed artwork after integration.

Lead acceptance still includes persisted picker wiring without losing draft
text, owned API/concurrent save checks, real game outcome effects, provider
failure behavior, production-shaped container journeys and deployment. No
classroom trial is claimed. No source content, credentials or learner text was
used in the synthetic layout preview.

Rollback: revert the board presentation commit. There is no schema, saved
learning event, source content or movement change in this checkpoint.
