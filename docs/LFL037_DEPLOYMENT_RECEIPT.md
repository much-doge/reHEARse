# LFL-037 deployment receipt

Status: deployed to PCT128 on 2026-11-08 (Asia/Jakarta). No authenticated
production candidate or classroom journey was performed.

## Release

- Source commit: `28ed527b0f488a27c0b76a9094c303fff230654d`.
- Target: reHEARse in PCT128, checkout `/opt/rehearse`.
- Runtime image: `rehearse-app:28ed527`, container healthy.
- PCT128 fast-forwarded from `9126a97` using a verified Git bundle because the
  guest could not reach GitHub directly.
- Applied additive migration `022_protefl_section_retakes.sql` using the
  matching `rehearse-tools:9126a97` image. The application image was built
  from the current checked-out `28ed527` source and then only the app service
  was recreated.
- PostgreSQL container was left running; no destructive data operation was
  performed.

## Verification

- The production-shaped app image built successfully on PCT128.
- Container health: `healthy` on `rehearse-app:28ed527`.
- Public `https://rehearse.najala.org/api/health`: HTTP 200.
- Public diagnostic route while logged out: HTTP 307 to sign-in with its
  private/no-store policy.
- Logged-out HTML does not contain the legacy `Listening Comprehension
  Questions` page-text payload. The new structured item endpoint is present
  in the deployed build.
- Local authenticated renders, package verification, fresh silence-window
  comparison, ESLint, TypeScript, 47 test files / 175 tests, production build,
  and focused retake persistence checks are recorded under LFL-037 in the
  change ledger.
- The guest's direct loopback curl to port 3001 was unavailable in its shell;
  the public HTTPS health check passed. No authenticated production browser
  journey or classroom playback observation was performed.

## Rollback

Restore the previous value of `REHEARSE_IMAGE_TAG` in the protected
PCT128 `.env.production` file and recreate only the app service. Keep migration
022 in place; its columns are additive. Preserve all diagnostic attempts and
results.
