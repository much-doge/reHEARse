# PCT128 deployment receipt — LFL-006

Implementation commit: 8a113f65dbbf9ee26d89252fbd7005f2a19a7403
Initial upstream revision: 17408dd5b5adfd9717c6899b961d4a4e50fb674f
Application image: rehearse-app:8a113f6
Application image digest: sha256:490bf74df2e4ad3a7d66b2aae5912769610770a68c357c2313c42d8df7c08c23
Tooling image digest: sha256:2c75361190c8e49ff7f13346740de84d0b1ebd56eb51898eff3afd135b935972

## State

- Source-complete: yes, pnpm check with lint, TypeScript, 37 tests and production build.
- Container-verified: yes, production image builds and Compose validation.
- Deployed: yes, PCT128 LAN origin http://192.168.8.63:3001, health HTTP 200.
- Provider-verified: yes, B2 and live gpt-5-nano synthetic canaries passed.
- Public HTTPS: verified at https://rehearse.najala.org with certificate validation.
- Browser UI observation: blocked by verifier local DNS negative result; public HTTP journey passed.
- Classroom-verified: no pilot occurred.

## Isolation and data

Compose: /opt/rehearse/compose.production.yaml; project rehearse.
Secrets: /opt/rehearse/.env.production, mode 600, ignored and outside builds.
Network: rehearse_rehearse. Volume: rehearse_rehearse_postgres.
App published only on 192.168.8.63:3001; PostgreSQL has no host port.
The operator authorized LAN binding for external Cloudflare; no 0.0.0.0 bind.
Migrations 001–007 recorded; migration service exit 0; app/PostgreSQL healthy.
Production validation rejected the local demo database password.
One generated administrator; no known demo accounts seeded. Repeated bootstrap
was rejected. Bootstrap password removed from the runtime environment file.

Only audio and content-free object metadata upload to
najala-dumpster/rehearse/media. No bucket config or unrelated object changed.
ConTEFL source-backed activity imported as version 2; prior version retained.
Media bytes: 1554968. SHA-256:
d728ede236948a4877dc38926114abdad19ff358dc35414f9be107ffbeed42c2
Object key:
rehearse/media/activities/89d93513-78f6-46aa-bdd7-61c4469aa396/v2/2e2a24ebaad2d8348193c31a5fbbc322-31_34_Dialog.mp3

## Verification receipts

Anonymous disposable WAV: 200, audio/wav, 16044 bytes, matching SHA-256,
206 for bytes 0–31. Confirmed origin:
https://archive.najala.org/file/najala-dumpster/rehearse/media
Only the exact disposable canary key was deleted.

Source-backed audio: anonymous checksum match, HTTP 206 range, authorized
media route 307 redirect, authorized activity DTO uses direct public URL.
App does not relay remote audio. No browser-network observation claimed.

Live gpt-5-nano: bilingual no-score schema passed; store:false observed in
actual request. Forced provider_connect_error retained the new attempt and
left prior evidence unchanged. Synthetic attempts/accounts retained as evidence;
synthetic activity archived and synthetic sessions revoked.

Checksum-validation and media-upload failure cases left zero new activities.
Administrator login 303, dashboard 200, Secure/HttpOnly/SameSite=Lax cookie.
Proxy test used X-Forwarded-Host rehearse.najala.org and X-Forwarded-Proto https.
Bad origin rejected 403; configured origin passed to auth boundary 401.

Writing Analysis Studio: all 12 baseline container IDs, start times, restart
counts and health states unchanged. API/PostgreSQL/SeaweedFS stayed healthy.
Port-8000 request returned the same HTTP 400 before and after (host validation);
no invasive checks, environment-file reads, restarts or workload writes occurred.
Only its LLM_API_KEY was copied under explicit operator authorization.

Runtime secrets never entered Git or logs. Administrator credentials are handed
to the operator separately on explicit request. Production commits reside in
the guest checkout and have not been pushed to GitHub.

## Rollback

Operator removes only the reHEARse Cloudflare route. Inside PCT128:

```sh
cd /opt/rehearse
docker compose --env-file .env.production -f compose.production.yaml -p rehearse stop app
docker compose --env-file .env.production -f compose.production.yaml -p rehearse stop postgres
```

Preserve rehearse_rehearse_postgres. No down -v, global prune or unrelated
container/network/volume operations. Restore only the prior reHEARse image and
configuration if required; retain additive migration history.

## Operator Cloudflare cutover verification

The operator configured the route. Public DNS A records were confirmed using
Cloudflare and Google DNS. The verifier local resolver/browser retained a
negative result, so local HTTPS checks used a verified Cloudflare address via
curl --resolve with full certificate validation, not a TLS bypass.

- Public /api/health: 200, health.v1, service rehearse; TLS verification result 0.
- Unknown path: 404. Unauthenticated media: 401. Unmatched Host header: 403.
- Actual public HTTPS administrator login: 303, secure/HttpOnly/SameSite cookie,
  dashboard 200, without injecting proxy headers.
- Actual public HTTPS synthetic learner page: 200. Rendered audio source is
  archive.najala.org directly. Audio seeking: 206, audio/mpeg, bytes 0–31/1554968.
- Cross-origin attempt POST: 403. Synthetic verification session revoked.
- Browser UI/network observation remains unverified because of local DNS;
  no classroom pilot occurred. No Cloudflare settings were changed by the agent.
