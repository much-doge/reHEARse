# Save confirmation release receipt

LFL-011. Deployment date: 2026-10-06 (Asia/Jakarta).

The reported missing response was not found in production history. The existing
successful response remains immutable. The original browser connection failure
was not reproduced, so its exact cause remains unknown.

New forms retain one submission key for unchanged content while the form remains
open. The server serializes retries for that learner/key, returns the existing
attempt, and rejects changed content under the same key. New revisions use new
keys. After an ambiguous POST outcome, the client makes one owned, uncached
lookup; it never automatically repeats the POST. A confirmed saved response can
show feedback as pending, with a check button that only reads its status. Keys
stay in browser memory; refreshing the page does not preserve an unsaved draft.

The provider timeout now covers both HTTP headers and the JSON response body.
This fixes a separately identified timeout defect; it does not establish the
cause of the missing response, because attempts are committed before feedback.
No queue or background feedback worker was introduced.

## Verification

- Source commit `f4a2267`, pushed to main.
- `pnpm check`: lint, TypeScript, 63 tests and production build passed.
- Real local PostgreSQL/API journey: six concurrent identical submissions yielded
  one attempt and one feedback record; changed content with the same key returned
  409; unchanged retry returned the original ID; a new key created a revision
  linked to its predecessor. Owned confirmation succeeded; other learner,
  administrator and unauthenticated requests were denied.
- Local learner browser: new response saved and appeared in history.
- Unit coverage includes a lost POST response reconciled by GET without a second
  POST, unresolved lookup, role rejection, and timeout during provider JSON body.
- PCT128: source pulled, runner/tools `f4a2267` built; migration 009 applied.
  Running app image: `sha256:25626a44265b8a37f711529343def7cffd9e870d64ed14a9987080046ec23aca`.
- LAN and public HTTPS health passed; public confirmation returned unauthenticated
  401. All 13 unrelated container IDs/images/states, seven existing attempt IDs,
  and room 357450 (listen/index 2/revision 9) stayed unchanged.
- Deployed client/server bundles include the new confirmation contract; browser
  JavaScript contains no confidential source markers.
- No new production learner response or production privileged test session was
  created. The original user browser failure still needs a real user retry to
  establish that its connection now works; local journey checks and deployment
  checks are distinct.

## Rollback

Restore protected `.secrets/lfl011-env-before`, then recreate only the app service
with production Compose `--no-deps`. Previous image `80ebaa3` remains available.
Keep additive migration 009, which is compatible with the previous application;
do not remove stored attempts or roll back the database. The protected database
backup is `.secrets/lfl011-before.sql` inside PCT128.
