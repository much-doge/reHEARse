# External service monitoring

Work ID: `LFL-101`

This repository now contains an external probe workflow at
`.github/workflows/healthchecks-probe.yml`. It runs from a GitHub-hosted
runner every five minutes and checks the public reHEARse health endpoint. On
success it sends a heartbeat to the matching Healthchecks.io check; on a failed
HTTP probe it sends the check's `/fail` signal. The workflow is deliberately
fail-closed when a required ping secret is missing.

The service list is a data file at `monitoring/services.json`, and the probing
logic is reusable in `scripts/healthchecks-probe.sh`. Adding a future service
is additive: add one service entry to the JSON template, expose its endpoint
and ping URL through environment/secret names, and do not fork the probe logic.

## What Healthchecks.io does—and does not do

Healthchecks.io is a dead-man's switch for periodic heartbeats. It records a
check as Up, Late, or Down when a scheduled signal arrives or is missed. It is
not itself an active website-uptime prober, so the GitHub workflow supplies the
external HTTP probe. GitHub schedules can be delayed; this is an operational
signal and incident alert, not a contractual uptime measurement.

For stronger minute-level uptime evidence, add a separate external HTTP
monitoring provider later. Keep its endpoint and status-page policy separate
from the Healthchecks heartbeat checks.

## Provider setup (one-time, outside Git)

Create this check in one Healthchecks.io project. Use a five-minute period and
a grace period long enough to cover a delayed GitHub runner (for example,
ten–fifteen minutes). Configure email/Telegram/etc. notifications on the
project, and give the check a clear name:

- `reHEARse public`

Copy each check's **Ping URL** into repository **Actions secrets**. The URL is a
credential and must never be committed or pasted into an issue:

- `HC_REHEARSE_PING_URL`

The public target URLs are repository variables, with safe defaults already in
the workflow. Override them only when the canonical public endpoint changes:

- `REHEARSE_HEALTH_URL` (default: `https://rehearse.najala.org/api/health`)

Run the workflow once with **Run workflow** after adding secrets. Confirm each
check receives a successful ping, then intentionally run a probe with a
temporary bad URL if you want to verify the Down notification. Restore the
canonical URL immediately afterward.

## Future private services without an always-on host

GitHub cannot reach a Home Assistant or PCT128 address that is private behind
the LAN/tunnel. When we add those services to the template, use a local
heartbeat that runs where the service is reachable:

```sh
if curl --fail --silent --max-time 5 http://127.0.0.1:8123/ >/dev/null; then
  curl --fail --silent --max-time 10 "$HC_PRIVATE_SERVICE_PING_URL" >/dev/null
else
  curl --fail --silent --max-time 10 "${HC_PRIVATE_SERVICE_PING_URL%/}/fail" >/dev/null || true
  exit 1
fi
```

Store the ping URL in the local service's protected environment or Home
Assistant secrets, not in this repository. A laptop is not an always-on
monitoring host: when it is asleep or offline, the heartbeat should go Late or
Down, which is an honest indication that the private service is not being
observed.

## Customer-facing incident information

Healthchecks can provide public status badges for a project, tag, or individual
check. When we expand beyond reHEARse, use those badges in a separately hosted
Najala status page (for example, a small static page on the external hosting
layer), and write a short incident note there when an outage is confirmed. Do
not put ping URLs on the public page—only badge URLs/status data. The status
page should be hosted independently from reHEARse so it remains reachable when
the application or its tunnel is down.

## Scope and safety

- This change does not touch the production database, PCT128, Cloudflare, DNS,
  Home Assistant, router configuration, or any learner data.
- The pasted router/ONU material is not used as a credential source. Rotate any
  credentials that were exposed in that material separately, and do not enable
  WAN management just to make monitoring easier.
- Provider-configured means the reHEARse Healthchecks check and Actions secret
  have been created and tested. Future services and an independent status page
  are additive follow-ups. Until then,
  this repository is source-complete but monitoring is not live.
