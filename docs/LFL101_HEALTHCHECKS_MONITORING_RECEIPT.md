# LFL-101 Healthchecks monitoring receipt

Status: source-complete; provider configuration pending

## Delivered

- `.github/workflows/healthchecks-probe.yml` runs an external probe every five
  minutes and can be started manually.
- The public reHEARse probe is enabled by default through the service template.
- Future services (including Home Assistant/PCT128) can be added to the same
  template without changing the probe logic.
- Probe failures send `/fail` and never print Healthchecks ping URLs.
- `docs/HEALTHCHECKS_MONITORING.md` documents provider setup, private heartbeat
  handling, incident/status-page separation, and the limitation of scheduled
  GitHub runners.

## Verification

- Workflow reviewed for fail-closed missing-secret behavior.
- No provider secrets, router credentials, URLs containing credentials, or
  learner data were added to the repository.
- A read-only external check during implementation returned HTTP 200 for
  `https://rehearse.najala.org/api/health`.
- `git diff --check`, workflow YAML parsing, and shell syntax validation passed.
- Existing application checks passed before the monitoring-only template
  refinement: ESLint, TypeScript, 55 Vitest files/211 tests, and Next production
  build. The refinement changes only the monitoring template/workflow/docs.
- No Healthchecks account or check was changed from this workspace because no
  provider API key or existing ping URLs were supplied.

## Remaining operator gate

Create the reHEARse Healthchecks check, save its Ping URL as the documented
GitHub Actions secret, and run the workflow manually. Future services and an
independent status page remain additive follow-ups. Until this gate is
completed, report this as source-complete rather than live monitoring.
