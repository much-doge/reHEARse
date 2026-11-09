# LFL-043 deployment receipt

Status: deployed to Countryroad PCT128 on 2026-11-09 (Asia/Jakarta).
Authenticated human playback remains pending.

## Correction

Autoplay previously changed the visible question at the later of its mapped
audio start or seven seconds before the answer window. For Part A this delayed
Question 2 by about eight seconds after its numbered cue. The client now uses
the mapped `questionAudioStartMs` for Part A and for subsequent questions in
Part B/C. The first question of each long conversation/talk keeps the bounded
pre-answer fallback because its mapped audio start is also the beginning of the
long context, before the numbered question is spoken.

## Release and verification

- Source commit/runtime image: `765c340` / `rehearse-app:765c340`.
- Production Compose configuration and PCT128 Next production build passed.
- Only the app container was rebuilt and replaced. No migration or direct data
  update ran.
- Changed-path ESLint, project TypeScript check, and `git diff --check` passed.
- PCT128 reports the app healthy; in-container and public health returned 200
  with private/no-store behavior.
- Production event inspection before the change showed the active autoplay
  attempt reaching questions 1 and 2 with accepted answer events. Active
  learner traffic continued during deployment, so aggregate record counts were
  not used as proof of preservation. The newest attempt remained in progress
  with two answer events after replacement.
- No participant account was impersonated and no authenticated playback was
  observed. The candidate must refresh the page to load this client change.

## Rollback

Set `REHEARSE_IMAGE_TAG=cd61a40` in PCT128 `.env.production` and recreate only
the app service with production Compose `--no-deps`. Preserve PostgreSQL and
all active attempts.
