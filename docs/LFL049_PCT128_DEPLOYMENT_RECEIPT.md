# LFL-049 PCT128 production deployment receipt

Date: 2026-11-10 (Asia/Jakarta)

Environment: Countryroad Proxmox PCT 128, public origin
`https://rehearse.najala.org`

Application commit/image: `7e1ccdc` / `rehearse-app:7e1ccdc`

## Release scope

Production was previously running `rehearse-app:77e9d93`. The clean
`/opt/rehearse` checkout fast-forwarded from documentation commit `0f531d6` to
`99c9968` using a Git bundle transferred through the Proxmox host. The runtime
image is pinned to the LFL-049 implementation commit `7e1ccdc`.

The release includes the already verified dev1 work from LFL-046 through
LFL-049: private/classroom access-code choice, teacher-only activity tags and
compact/expanded activity controls, the 80-character teacher-tag repair, and
focused Listening retakes that preserve the assignment's playback mode.

## Database and rollback boundary

Production was current through migration 026. Before applying the two pending
additive migrations, a PostgreSQL custom-format backup was written to
`.secrets/lfl049-pre-migration.dump` with mode 0600 and validated using
`pg_restore --list`. The prior protected environment was copied to
`.secrets/lfl049-env-before`, also mode 0600.

Migrations `027_classroom_resource_invites.sql` and
`028_resource_tags.sql` applied successfully and are present in
`app_migration`. They add classroom-invite and resource-tag support; they do
not rewrite diagnostic attempts, answer events, or results. Post-deployment
read-only counts were 11 diagnostic attempts, 927 events, 3 results, 17
resource invites including 1 classroom invite, and 0 tagged resources.

For an application rollback, restore `REHEARSE_IMAGE_TAG=77e9d93` from the
protected environment backup and recreate only the app service. Keep
migrations 027 and 028 in place because they are additive. Do not restore the
database dump over live learner evidence except as an explicit disaster
recovery decision.

## Verification

- Production Compose configuration validated with the protected environment.
- PCT128 built `rehearse-tools:7e1ccdc` and `rehearse-app:7e1ccdc`; the Next
  production build and TypeScript phase passed inside the image build.
- Only the application service was recreated after migration. PostgreSQL
  remained healthy.
- `rehearse-app-1` reports healthy with zero restarts on
  `rehearse-app:7e1ccdc`.
- PCT LAN `http://192.168.8.63:3001/api/health` and public
  `https://rehearse.najala.org/api/health` returned the `health.v1` success
  response.
- The logged-out diagnostic route returned HTTP 307 to the allowlisted login
  return path with `private, no-store` cache controls.
- Local final verification before release passed `pnpm check`: ESLint,
  TypeScript, 48 test files/182 tests, and the Next production build.

Authenticated teacher controls, a real classroom-code claim, and audible
focused-retake autoplay remain operator/browser verification. This receipt
does not claim classroom verification.
