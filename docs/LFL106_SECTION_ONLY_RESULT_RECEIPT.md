# LFL-106 section-only result receipt

## Scope

Section-only assignments are root attempts, not retakes. The runtime now
classifies a completed root with `scope = delivery_scope != full` and no parent
attempt as an assigned-section result. A teacher-issued child reset remains a
separate retake result. This prevents a learner who was assigned Reading-only
from receiving the generic retake screen or an incompatible full-diagnostic
result.

When a teacher reset child for a section-only root is completed, the latest
completed child result is shown as the current section result. The original root
result and the child remain immutable in history.

## Safety

- No schema or data migration is needed; existing parent/child attempt fields
  and append-only result rows are sufficient.
- Full diagnostics keep their existing effective-result projection unchanged.
- Archived children are excluded from the current projection.

## Verification

- `corepack pnpm exec tsc --noEmit`
- `corepack pnpm exec eslint apps/protefl-center/src/adapters/postgres-diagnostic.ts apps/protefl-center/src/adapters/postgres-diagnostic.test.ts`
- `corepack pnpm exec vitest run apps/protefl-center/src/adapters/postgres-resources.test.ts apps/protefl-center/src/adapters/postgres-diagnostic.test.ts apps/protefl-center/src/application/diagnostic-effective-result.test.ts`
- `git diff --check`

Deployment and authenticated learner verification remain pending.
