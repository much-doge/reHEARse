# Session navigation — LFL-017

Status: container-verified; production pending.

Brand links open the public homepage. The homepage reflects the current
database-backed session. Signed-in login/register requests bypass their forms.
Protected redirects and failed authentication retain validated internal paths
and class PINs; external destinations and auth loops are rejected. Logout
revokes the current session, clears its cookie and returns to the homepage.
A private no-store session-status endpoint returns only an authenticated
boolean. Mounted protected pages check it every 15 seconds and on focus,
showing a bilingual new-tab sign-in link on expiry without navigating away
from unsaved text. A failed network check does not mark the session expired.
Thirty-day session expiry and all role/ownership guards remain unchanged.

Verification: pnpm check passed lint, TypeScript, 77 tests and production build.
Local runner/tools containers built. Database-backed valid/expired sessions,
public/signed-in home, auth-page bypass, preserved PIN return, safe destination
and no-store checks passed. Local browser home and signed-in login bypass
passed. Further browser checks, including expired draft recovery and logout,
are reserved for the user at their request. No production session was expired
or revoked for verification.

Rollback: restore the protected pre-release environment image tag (d0b9619)
and recreate only the app with production Compose --no-deps. No migrations.
