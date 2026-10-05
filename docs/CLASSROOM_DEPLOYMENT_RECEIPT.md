# LFL-007 classroom deployment receipt

Verified 2026-10-05, Asia/Jakarta. Status: deployed and ready for a supervised
classroom pilot. Actual classroom observation has not occurred.

## Artifact and environment

- Source implementation: `9d2fcf2bfd80526adccff4a774d0063b865e2531`
- Initial classroom implementation: `9c39a39eeef2f7418608f0c17759652452288529`
- App tag: `rehearse-app:9d2fcf2`
- App image: `sha256:569b1da9a01453eae6fee1a9cb91ac3a7b3bd9af0bbbb3afe60fa05e82574c8b`
- Tools tag: `rehearse-tools:9d2fcf2`
- Proxmox transport: root SSH to 192.168.8.50, then `pct exec 128`; no host changes.
- Guest checkout: `/opt/rehearse`; pulled main with `--ff-only` after local pushes.
- Own Compose project: `rehearse`; app remains 192.168.8.63:3001.
- Public origin: <https://rehearse.najala.org>; operator-managed Cloudflare route.
- PostgreSQL additive migrations 001–008 applied. Existing individual evidence
  and prior activity versions retained. No demo seeding or unrelated restarts.

## Source and media

The immutable `contefl-1163-part-a-game.v1` deck contains 30 rounds, authored from
operator-provided MP3s and local speech recognition, with online corroboration
listed in SOURCE_REGISTER.md. Original exam option positions are not reused.
Each round has four authored English choices plus English/Indonesian meaning
and purposeful replay guidance. No full copyrighted exam transcript is published.

All 30 MP3s were imported through the existing media adapter into fresh keys
under `rehearse/media/activities`, without bucket listing or replacement of
existing objects. Per-clip SHA-256, size and storage lineage are stored with the
deck. All 30 anonymous downloads matched those hashes/sizes, returned audio/mpeg,
and supported HTTP 206 for bytes 0–31. The browser played clip 1 to its full
11.520476-second duration with no media error. No OpenAI transcription upload
occurred; local temporary speech recognition is not a runtime dependency.

## Verification actually run

- Local `pnpm check`: ESLint, TypeScript, 46 Vitest tests, Next production build.
- Isolated local PostgreSQL migrations 001–008 and API journey.
- Production-shaped PCT128 tools/app image builds completed.
- Expanded API/PostgreSQL journey against final artifact via public HTTPS:
  teacher/origin guards, unauthorized reads, membership recovery, only one
  concurrent transition, locked keys/options/media, immutable first answers
  and cloud terms, teacher moderation, aggregation and hiding duplicate phrases,
  bounded game-only points, next-round reset, database deadline rejection,
  and finished-room join denial. Synthetic verification sessions revoked.
- Actual browser normal administrator sign-in, room creation, speaker playback,
  logout and guest joining, phrase submission, teacher approval, guest quiz
  submission/locking, bilingual review, game leaderboard, next clip and finish
  were observed on the initial artifact. The final artifact's clean lobby and
  corrected teacher label were then observed after deployment.
- Final phone-width lobby: body and scroll width both 390px; visible controls
  and wrapped join address, no horizontal overflow. Viewport override reset.
- Final public `/api/health` and `/play`: 200 with TLS verification result 0.
- Final application health: healthy. The eight unrelated running containers
  retained exact names, images and container IDs throughout the deployment.
- A new operator-owned room was left untouched: lobby, revision 0, first round,
  30 total rounds, zero players. It expires 2026-10-06 22:18:56 Asia/Jakarta.
  Its PIN and host/student URLs were handed off privately in chat.
- Local temporary dev server stopped and only the work-labelled disposable
  LFL-007 database/container volume removed. Existing local containers preserved.

Python-urllib requests received the public edge's 403 bot-agent response.
Normal curl requests, Node's public API journey and the actual browser passed;
no certificate bypass or Cloudflare configuration change was used.

## Rollback and remaining pilot limits

The prior `rehearse-app:8a113f6` remains available. A protected pre-change database
snapshot and env snapshot are in `/opt/rehearse/.secrets/lfl007-before.sql` and
`lfl007-before.env` (mode 600). Restoring the previous app tag is sufficient for
application rollback; retain additive migration 008 and all game evidence.
Do not run down -v, global prune, or unrelated Compose commands. Snapshot
restoration itself was not tested in this slice.

Rooms use teacher speaker playback and two-second polling, not synchronized
student audio. No real classroom or large-class load test has occurred. Evidence
remains private after room expiry; automatic retention purge and distributed
abuse limiting are not implemented. The classroom is ready for a supervised
pilot, with the paper fallback described in CLASSROOM_GAME.md.
