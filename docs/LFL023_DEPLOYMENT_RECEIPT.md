# LFL-023 — Part A workshop deployment receipt

Status: deployed to PCT128 on 2026-10-20 (Asia/Jakarta). Not classroom
verified.

Runtime source: `2dbc4f52a492`.
Image: `rehearse-app:2dbc4f5`.
Running image ID:
`sha256:d378cc133d9167a50e6bb6ef610b345cc09c2b7ce0891fc6bcf97525b0ef2b06`.

## Delivered

The deployed `part-a-workshop.v1` capability contains thirty privately
reviewed Part A recordings in five teaching groups. Each group has complete
bilingual preparation material: the question task, listening target,
procedure, distractor patterns, an analogous example, inquiry prompts and
language notes. The learner flow uses individual direct audio, a
server-enforced twelve-second first choice, correct-answer celebration,
bounded item-specific relistening, guided comparison and three saved
distractor explanations. The teacher owns the PIN, preparation/practice
release, group progression and raw operational counts.

The public DTO does not expose transcripts, answer keys, private review notes
or source paths. This instructional workshop does not calculate a score,
percentage, rank or proficiency judgement.

The final authentication correction preserves `/workshop` and an optional
validated six-digit PIN through sign-in. External destinations and unrelated
query data remain rejected.

## Publication and deployment

Before changing production, protected copies were saved in
`/opt/rehearse/.secrets/lfl023-env-before`,
`/opt/rehearse/.secrets/lfl023-db-before.dump` and
`/opt/rehearse/.secrets/lfl023-containers-before.txt`. The database dump is
191,383 bytes. The environment and accepted private import manifest remain
mode 0600.

Migration `016_part_a_workshop.sql` was applied once. The accepted guarded
import published one immutable content version and thirty direct public audio
objects in the existing shared bucket under the reHEARse scope. Before the
database commit, the importer verified every object's full bytes, SHA-256,
media type and byte-range response. Two initial publication attempts failed
closed before publication because the deployment-only source path and explicit
public-delivery mode had not yet been supplied; those operator inputs were
corrected without changing the accepted package.

The repository was fast-forwarded from `cbd9fb1` through the integrated release
and the authentication correction. Only `rehearse-app-1` was recreated.
PostgreSQL retained container ID
`b8d72c028dc252b4d53fb7df208e51ca9d0c7af99ea6d87fb7618095603b03e3`.
All eight Writing Analysis Studio containers retained their exact saved IDs and
images, and its port 8000 listener remained present. reHEARse remains isolated
on `192.168.8.63:3001` behind Cloudflare.

## Verification

- Final `pnpm check`: ESLint, TypeScript, 44 Vitest files / 163 tests and the
  Next 16 production build. The focused authentication suite passed six tests.
- Production migration query: migration 016 recorded once; five workshop
  tables present; one immutable content version contains 30 items, five groups
  and 30 media records.
- The production app is healthy. LAN and public HTTPS `/api/health` returned
  the `health.v1` response.
- Public browser inspection rendered the bilingual learner PIN page. The
  protected teacher route redirected to
  `/login?next=%2Fworkshop`, and the registration link retained the same safe
  destination.
- A short-lived production session exercised the authenticated teacher page,
  room creation, public learner join, teacher practice release and owned
  learner-state read. Every request returned 200 using
  `part-a-workshop.v1`; the learner payload contained a direct HTTPS audio URL
  and none of the guarded source fields. The temporary session, room,
  participant, join and event records were removed; final workshop room and
  participant counts returned to zero.
- A dedicated `teacher@rehearse.najala.org` account was provisioned with the
  teacher role. A live browser sign-in returned to `/workshop` and rendered the
  session creation and resume controls. Its password was delivered directly to
  the operator and is not stored in Git or this receipt.
- The production checkout is clean at `2dbc4f52a492`; environment and private
  import permissions are 0600; all 30 private deployment audio inputs are
  present for reproducible operations.

## Limits and private review material

No live class used this deployment, so classroom verification is not claimed.
The integrated interface has local browser coverage, while the production
acceptance used public visual boundary checks and a real HTTP/API journey, not
a complete timed thirty-question browser run.

Source matching is supported by private machine-aided transcription,
secondary public option/script matches and semantic key checks. An independent
human has not listened through all thirty recordings against every option and
key, and publisher-authenticated provenance was unavailable. The accepted
private review/import artifacts remain outside Git at:

- `/tmp/rehearse-lfl023-content/.secrets/lfl023-source-review.md`
- `/tmp/rehearse-lfl023-content/.secrets/lfl023-import.json`
- `/opt/rehearse/imports/private/lfl023/import.json`

## Rollback

Restore the protected environment and database dump only if data recovery is
required. For an application-only rollback, restore the previous compatible
`rehearse-app:ca07eae` image and disable workshop entry; do not remove migration
016, immutable media objects or learner evidence. An older app does not expose
the workshop route, so new workshop rooms must remain disabled until a
compatible image is restored.

The dedicated workshop teacher account can be disabled independently by
revoking its sessions and removing or rotating that single account; no content,
workshop history or other user record needs to change.
