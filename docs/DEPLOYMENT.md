# Production deployment (LFL-006)

Target: PCT128, /opt/rehearse, project rehearse. Proxmox is only an SSH
transport for guest commands. All deployment operations execute in the guest.
Never operate on Writing Analysis Studio, its port 8000, networks or volumes.

## Configuration and validation

Production secrets live in .env.production (Git-ignored, mode 600), outside
Docker build context. Do not print resolved Compose config or container env.
Run pnpm check, development and production Compose config --quiet, and build
the runner/migrator images before starting services. Production startup checks
strong generated database/session secrets, secure cookies, an HTTPS origin,
and explicit OpenAI provider/key/model. PostgreSQL waits for that gate.

Production has no demo seed. Its one-shot bootstrap refuses to run when any
administrator already exists, never overwrites accounts and omits credentials.
Use the tools profile and bootstrap-admin service once. Preserve generated
administrator credentials in a protected handoff file, then remove the bootstrap
password from the runtime environment file after successful creation.

Default binding is 127.0.0.1:3001. For this deployment the operator explicitly
authorized APP_BIND_ADDRESS=192.168.8.63 so external Cloudflare can reach it.
Check ports with ss before starting. PostgreSQL has no published port.
The operator owns https://rehearse.najala.org and the Cloudflare route to
http://192.168.8.63:3001; no Cloudflare service or DNS is changed by this repo.
Public HTTPS and unmatched Cloudflare ingress are separate verification gates.

## Commands (inside PCT128 only)

```sh
cd /opt/rehearse
docker compose --env-file .env.production -f compose.production.yaml -p rehearse config --quiet
docker compose --env-file .env.production -f compose.production.yaml -p rehearse build
docker compose --env-file .env.production -f compose.production.yaml -p rehearse up -d postgres migrate
docker compose --env-file .env.production -f compose.production.yaml -p rehearse --profile tools run --rm bootstrap-admin
docker compose --env-file .env.production -f compose.production.yaml -p rehearse up -d app
```

Only public authorized audio uploads to najala-dumpster/rehearse/media. Keep
private manifests and receipts in imports/private and .secrets respectively.
Use OBJECT_STORAGE_* and MEDIA_DELIVERY_MODE=public. Confirm the exact public
base with an anonymous canary before publishing activities. Verify type, length,
SHA-256 and HTTP 206. A successful upload alone is not successful publication.

## Scoped rollback

The operator removes only the reHEARse Cloudflare route. Then:

```sh
cd /opt/rehearse
docker compose --env-file .env.production -f compose.production.yaml -p rehearse stop app
docker compose --env-file .env.production -f compose.production.yaml -p rehearse stop postgres
```

Preserve rehearse_rehearse_postgres. Do not use down -v, prune, or global cleanup.
Keep the previous reHEARse image tag and config for image rollback; never roll
back additive database migrations by restoring another application's data.
Delete only exact identified canary keys if cleanup is authorized and needed.

Source-complete, container-verified, deployed, provider-verified and classroom-
verified evidence remain distinct. No classroom pilot has occurred.
