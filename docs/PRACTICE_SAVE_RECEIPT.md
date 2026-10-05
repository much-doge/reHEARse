# Practice save repair receipt

LFL-009, deployed 2026-10-06 (Asia/Jakarta).

The operator confirmed the failure occurred while signed in as administrator.
The existing API only accepts learner responses, but the page previously
displayed an editable form to every authenticated role and hid the rejection
behind a generic save error. Teacher/admin pages now show a disabled preview
and no save button. Learner pages retain saving; typed API failures receive
paired guidance, input limits match validation, and uncertain saves recommend
checking history before retrying. No automatic retries or broader permissions.

Application commits: `c52e090`, final `84d1465`, pushed to main and pulled into
`/opt/rehearse` inside PCT128 via the Proxmox host. Running image
`rehearse-app:84d1465`,
`sha256:f731e577a5b52bb729f6119933639456772ac588b39109b3421a533ed8563c98`.
Corresponding tools image built. No migrations or source-media changes.

Verification:

- Final `pnpm check`: lint, TypeScript, 55 tests, production build. Tests cover
  preview/learner rendering, input limits and specific/uncertain error guidance.
- Existing local container API journey: administrator returned 403 with
  `learner_role_required`; learner returned 201 with persisted response and
  completed template feedback. Temporary local test sessions were revoked.
  The underlying save endpoint was unchanged. No external AI request.
- Live public browser: authenticated administrator preview, disabled response
  fields, clear bilingual guidance, no save button or misleading save prompt.
  Operator's original tab was not refreshed or navigated.
- LAN/public HTTPS health passed. All 13 unrelated container IDs/images/states
  unchanged. Room 357450 stayed `listen`, round index 2, revision 9.
- Browser bundle confidential-source scan passed. No production learner test
  response was created; no classroom pilot or new live AI check performed.

Rollback: restore protected `.secrets/lfl009-env-before` (mode 600) and recreate
only the production app service with `--no-deps`; previous image `bc58876` is
retained. Stored learning records require no rollback.
