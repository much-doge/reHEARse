# LFL-105 section-reset teacher UI receipt

## Scope

This sprint keeps section-reset controls discoverable and makes attempt
navigation explicit. A completed full diagnostic exposes Listening, Structure,
and Reading reset buttons. A completed section-only diagnostic exposes only its
own section. An in-progress root keeps the reset panel visible with a clear
explanation rather than presenting an unexplained missing control.

Opening a historical, pending, or completed attempt through the learner history
or teacher-reset queue now also resets the active question context to that
attempt's first applicable question. This prevents a previously selected
question number from leaking into the newly opened record.

## Safety and compatibility

- No database migration is required; the existing independent-reset indexes and
  append-only attempt lineage remain unchanged.
- Buttons are disabled while a matching reset is already in progress, but the
  other eligible section buttons remain independently usable after the root is
  complete.
- Existing answers, results, and archived history are not rewritten.

## Verification

- `corepack pnpm exec tsc --noEmit`
- `corepack pnpm exec eslint src/components/test-center/resources.tsx src/components/test-center/diagnostic-test.tsx apps/protefl-center/src/adapters/postgres-diagnostic.ts`
- `corepack pnpm exec vitest run apps/protefl-center/src/adapters/postgres-resources.test.ts apps/protefl-center/src/adapters/postgres-diagnostic.test.ts apps/protefl-center/src/application/diagnostic-effective-result.test.ts`
- `git diff --check`

Deployment and authenticated browser verification remain pending for this
source-complete sprint.
