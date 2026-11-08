# LFL-038 deployment receipt

Status: deployed to PCT128 on 2026-11-08 (Asia/Jakarta). Authenticated
candidate/staff browser review and classroom verification were not performed.

## Release

- Commit: `0136117` (`feat(test-center): refine diagnostic and teaching workflows`).
- Target: reHEARse in PCT128, checkout `/opt/rehearse`.
- Runtime image: `rehearse-app:0136117`, healthy after replacement.
- Migrator image: `rehearse-tools:0136117`.
- PCT128 fast-forwarded from `28ed527` using a Git bundle.
- Before migration 023, a private mode-600 PostgreSQL custom-format backup
  was created in `/opt/rehearse/.secrets/` and its archive table of contents
  was validated with `pg_restore --list`.
- Additive migration `023_diagnostic_focus_and_teacher_view.sql` completed
  successfully. PostgreSQL was not recreated. Only the Rehearse app container
  was replaced after the migration.
- Existing full/section attempt events and results were not rewritten. New
  retry subsets are stored on new attempts, and new listening question-text
  visibility is pinned when an attempt is created.

## Verification

- Local changed-path ESLint and TypeScript passed; all 47 test files / 175
  tests passed; local production build and PCT128 app-image build passed.
- Compose configuration passed locally and in PCT128.
- Migration 023 was applied in local PostgreSQL and PCT128; PCT128 records the
  migration and the migrator exited successfully.
- PCT128 app container reports healthy on `rehearse-app:0136117`.
- Public `https://rehearse.najala.org/api/health` returned HTTP 200.
- Logged-out `/test-center/teaching` redirects to sign-in. The old
  `/test-center/manage` URL redirects to `/test-center/teaching`.
- No authenticated teacher/candidate journey, visual browser review, audio
  playback observation, or classroom use was verified in production.

## Rollback

Set `REHEARSE_IMAGE_TAG=28ed527` in the protected PCT128
`.env.production` file and recreate only the app service. Leave additive
migration 023 applied and preserve all attempts and results. The validated
pre-migration backup remains in the private `.secrets` directory if a database
recovery is ever required.
