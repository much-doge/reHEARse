# LFL-019 integrated game release

Date: 2026-10-09. Status: deployed; classroom trial not performed.

Application release: `f24a97cff7cc338486ee93b04d4c8f4171167e02`.
Running PCT128 image: `rehearse-app:f24a97c`.
Image digest: `sha256:052c606e0e2988fe9b2c2ef39aed77113bc7ee382bf977b81950062f3fdb36cc`.
Source was pushed to main, pulled by fast-forward into `/opt/rehearse`, built
there and switched by recreating only the reHEARse application. Additive
migrations 011 and 012 completed before the switch. Matching tools were built.

## Shipped behaviour

- Thirty selectable Kenney CC0 character compositions with authored layered
  body, blink, arm, leg and accessory animation; pause during learner audio;
  reduced-motion accommodation; persisted owned character settings.
- Twelve extra independent skin palettes plus the original colours, varied
  initial defaults, saved colours across runs and matching host projection.
  Face details remain uncoloured. The public gallery supports mixed and
  single-colour review and its arm animation nesting was corrected.
- Random adjective-and-animal names, collision-aware within a class. Existing
  stored aliases and learning records remain unchanged. Legacy Listener names
  receive a read-only display alias shared by learner and host.
- Large named teacher-board characters and honest same-tile grouping. Every
  player remains accessible; no fabricated position spread or rank. Inert
  snake/ladder decorations removed rather than promising absent movement.
- Green correct/revised celebration and red replay feedback on newly confirmed
  outcomes; neutral uncertainty; equal supported completion celebration.
  Effects stop for audio, do not repeat on poll/reload and respect reduced motion.
- Appearance writes serialize across an actor's runs. Cosmetic responses cannot
  undo a newer task; explanation/choice drafts survive appearance changes.
  A committed-but-lost response is reconciled through an owned read.

The manual second-desktop LFL-019B handoff was reviewed and integrated as
`22c30e2`, `ec5ee5f`, `935b987`; root acceptance fixes are `d2c3f00` and
colour/name additions are `f24a97c`. Earlier root board/effect commits are
included in this release. The other desktop did not push or deploy.

## Verification and limits

`pnpm check` passed lint, TypeScript, 105 tests in 28 files and production
build. Final runner and tools built locally; migrations applied to the guarded
local fixture database. Actual PostgreSQL/API checks covered authentication,
ownership, invalid palette/path rejection, no-op saves, six simultaneous
cross-run appearance writes producing one cosmetic change, concurrent answer
preservation, host/later-run colour persistence and the complete finite
repair/support/teacher-assistance/finish/closure journey.

Signed-in local Chromium journeys covered actual playback plus synthetic
span-end seeking, green/red/neutral effects, animation silence during audio,
retained drafts and selections, palette saving, supported closure, refresh,
lost-response recovery, phone overflow and reduced motion. Teacher acceptance
used an actual local session with thirty stored coloured characters, twelve
palettes and thirty distinct animal names; its projected board exceeded 1600
CSS pixels. Layout previews separately covered 1/10/30 distributed players,
30 on one tile, group keyboard close/focus return and phone own-marker visibility.
These fixtures and span seeks are synthetic checks, not a classroom trial.

Live PCT128 application is healthy. LAN `192.168.8.63:3001` and public HTTPS
health returned 200. Public media byte range returned 206. Public HTTPS gallery
matched the committed bytes and rendered all thirty characters and palette
modes with no missing artwork or browser page errors. Phone/reduced-motion,
unauthenticated appearance 401 and safe ladder-to-login redirect passed live.
The initial guest-side Python default request agent received 403 from public
checks; browser-compatible requests passed. No Cloudflare settings changed.
No signed-in production save or new live AI request was created for this release.

The protected before/after baseline confirms all ten prior listening attempts
and five prior game runs remain present; classroom room phase/index/revision
is unchanged. All nine non-app container IDs and images are unchanged:
reHEARse PostgreSQL plus eight Writing Analysis Studio services. Backups and
runtime credentials remain private and outside Git/build contexts.

## Mechanics planning boundary and rollback

`docs/MECHANICS_REVIEW_AND_SPRINT.md` records the fairness review, finite
support, race limitations and next immutable-content sprint for original A–D
questions. This release retains the existing three-choice bootstrap content
and movement reducer. It does not claim functioning snake slides, ladder
shortcuts, listening proficiency ranks or classroom learning gains.

Rollback to `rehearse-app:424e94d` by restoring the previous image tag and
recreating only app. Retain additive cosmetic tables/columns and immutable
learning history. Protected pre-release database/config backups exist in
PCT128. The subsequent documentation receipt commit is pulled without
rebuilding; the runtime code artifact remains `f24a97c`.
