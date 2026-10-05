# Interactive feedback release receipt

LFL-010. Deployed 2026-10-06 (Asia/Jakarta).

Pending submissions, including revisions, now show optional listening-focus and
reflection buttons, a gentle animated signal, and an honest longer-wait message.
Audio remains available for replay. Choices stay in browser memory and are not
saved or sent. Keyboard controls, polite status announcements and reduced-motion
CSS are included. No artificial progress percentage or scoring.

Prompt `listening-review.2026-10-06.v3` requests concise direct you/kamu language,
short observations, and one listening nudge. Missing meaning must be elicited
without revealing omitted source answers in any feedback field. No-history
remarks are omitted on first responses. Narrow legacy display wording changes
use direct address; stored feedback records are unchanged. New generation rules
apply to new responses.

## Verification and artifact

- Application commit `80ebaa3`, pushed to main and pulled into `/opt/rehearse`
  inside PCT128 through the Proxmox host.
- App `rehearse-app:80ebaa3`,
  `sha256:9785f28ba488d81a41850c70b85b6c2093db004ef7eb624c2b4ddf5ea1b6649a`;
  matching tools image built. No migrations.
- Final `pnpm check`: lint, TypeScript, 58 tests and production build.
- Local browser preview: focus selection changed bilingual prompts; reflection
  selection changed guidance; keyboard activation worked; visual review. The
  temporary preview route was removed before the final check and commit.
- Live synthetic provider check: valid direct bilingual feedback and listening
  nudge; omitted names, day, location and weather detail were not disclosed.
  Only synthetic source/response content was sent. No raw output or credentials
  logged; no production learner response was created. This is one synthetic
  example, not a guarantee of behavior across all classroom responses.
- Deployed browser JavaScript includes waiting controls and no confidential
  source markers; deployed server includes the new prompt version.
- App healthy; LAN and public HTTPS health passed. All 13 unrelated container
  IDs/images/states unchanged. Room 357450 remained listen/index 2/revision 9.

No live classroom pilot or full new learner waiting journey was run. Interaction
checks used the local component preview; deployment artifact checks are separate.

Rollback: restore protected `.secrets/lfl010-env-before` (mode 600), then recreate
only the app service with production Compose `--no-deps`. Previous image
`84d1465` remains available. No stored-record rollback required.
