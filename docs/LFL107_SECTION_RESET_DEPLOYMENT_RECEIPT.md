# LFL-107 section-reset deployment receipt

Date: 2026-11-15 (Asia/Jakarta)

Environment: Countryroad Proxmox PCT 128, public origin
`https://rehearse.najala.org`

## Release

- Source commit: `0e0ed19`
- Release tree: `/opt/rehearse/.releases/0e0ed19`
- Application image: `rehearse-app:0e0ed19`
- Image digest: `sha256:138ff7916972ecafdb5fc212816b0469e3c6be5823e41b2f0f187da7c30ae8a2`

The production app was rebuilt from the exact committed source in an isolated
release worktree. The existing production checkout's unrelated working-tree
changes were not used or overwritten.

## Delivered behavior

LFL-105 keeps reset controls visible and understandable while LFL-106 gives
section-only roots their own result state. A teacher can see the eligible
section buttons on a completed full root, can see why buttons are unavailable
while the root is still in progress, and can continue independently active
section work. Opening a history item or pending reset selects that attempt's
own question context. A completed section-only root is not misclassified as a
retake, and a completed teacher reset becomes the current section result while
the original and reset remain in history.

## Database and rollback boundary

- App-only deployment; PostgreSQL was left running and no migration was
  required or executed.
- Existing attempt, answer, event, and result rows were not modified.
- Rollback is app-only to the retained prior image
  `rehearse-app:dde63e5` from its release tree. Do not roll back or restore the
  database for this release.

## Verification

Source and container gates:

- `corepack pnpm exec eslint .`
- `corepack pnpm exec tsc --noEmit`
- `corepack pnpm exec vitest run` — 55 files, 214 tests passed
- `corepack pnpm exec next build`
- `git diff --check`
- Compose production config validation and app image build passed in PCT128.

Runtime gates after replacement:

- app container healthy; restart count `0`
- PostgreSQL container remained healthy
- LAN `/api/health`: HTTP 200
- public `/api/health`: HTTP 200
- logged-out `/test-center/teaching`: HTTP 307
- unauthenticated `/api/test-center/resources`: HTTP 401

Authenticated teacher/learner browser walkthrough and classroom verification
remain operator checks; this receipt records a deployed release, not classroom
verification.
