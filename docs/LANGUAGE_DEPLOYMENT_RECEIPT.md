# Language and confidentiality deployment receipt

Work ID: LFL-008. Deployed 2026-10-06 (Asia/Jakarta).

## Delivered behavior

Public activity labels and existing classroom titles use neutral teaching
language. Private source identifiers and original item ranges are excluded from
presentation. Landing, authentication, dashboard, individual practice and
classroom instructions now describe the next listening action in English and
Indonesian. Repeated assessment disclaimers and slogans were removed.

Learner-facing feedback uses response, explanation and details in the audio.
Previously saved feedback is transformed only for presentation; stored records
remain unchanged. Future OpenAI guidance uses prompt
`listening-review.2026-10-06.v2`. Game points and the learning/game boundary are
unchanged. The operator explicitly retained public repository visibility and
scoped this work to the live application.

## Release and verification

- Application commit: `bc58876`. Pushed to main and pulled into `/opt/rehearse`
  through root on the Proxmox host, exclusively inside PCT128.
- Running image: `rehearse-app:bc58876`,
  `sha256:f938991c3a0880b88a83dfe525b17ffece493833eecc0328a45901523b1b87ae`.
- Tools image: `rehearse-tools:bc58876`. Both targets built successfully.
- `pnpm check`: ESLint, TypeScript, 50 passing Vitest tests and production build.
- Browser JavaScript scan: no confidential source name or code.
- Read-only database-backed journey: dashboard activity and individual activity
  DTOs and the existing classroom DTO contained no confidential identifiers;
  neutral public labels asserted. No records were inserted or updated.
- LAN `192.168.8.63:3001/api/health` and public HTTPS `/api/health`: healthy.
- Browser verification on public HTTPS: landing, login, register, authenticated
  dashboard, individual listening page, teacher classroom and student join page.
  Revised instructions and neutral labels were visible.
- Existing room 357450 remained `listen`, round index 2, revision 9 before and
  after deployment. No teacher progression controls or student submissions used.
- All 13 unrelated container identities, images and states matched the baseline.

## Limits and rollback

No new live AI request or classroom pilot was run for this language-only release.
Feedback prompt and presentation behavior were checked with offline tests.
Prior audio, answer, moderation and scoring journeys remain documented in the
classroom deployment receipt. No migrations or media imports were required.

For rollback, restore the protected prior environment snapshot
`.secrets/lfl008-env-before` (mode 600), retaining image tag `9d2fcf2`, then
recreate only the app service using production Compose with `--no-deps`.
The previous image remains available. No database rollback is necessary.
