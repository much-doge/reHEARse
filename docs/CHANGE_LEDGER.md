# Change ledger

| Work ID | Status | Outcome | Verification | Implementation |
|---|---|---|---|---|
| LFL-001 | source_complete | Design, governance, stack, visual walking skeleton, and feedback contract | ESLint; TypeScript; 4 Vitest tests; Next production build; Compose config; browser interaction and responsive visual review | `118dd70` |
| LFL-002 | container_verified | Local identity, guarded learner/teacher/admin demo roles, immutable individual learning loop, and provenance-tracked ConTEFL 1163 activity | ESLint; TypeScript; 11 Vitest tests; Next production build; Compose config; image build `3117a9a19f9d`; migrations 001–004; atomic guarded seed; public-media 404 and unauthenticated-media 401; authenticated full/range audio 200/206 with source SHA-256; non-learner attempt 403; database-down/recovered health 503/200; two-attempt API lineage; learner, teacher, and admin browser sign-in; learner feedback journey | `79d5cde`, `6c6c75c` |
| LFL-003 | in_progress | Source-complete bounded OpenAI feedback, Backblaze-compatible direct private media delivery, and versioned activity-package import; browser teacher authoring and live-provider verification remain | ESLint; TypeScript; 23 Vitest tests; Next production build; Compose config; app image `142d6ddace72`; migration 006; health 200; offline strict Responses fixture; offline 10-minute B2 signed URL; Docker importer dry-run; reversible draft import stored one question and one transcript segment, then exact cleanup; no OpenAI/B2 credentials and no live external call | `f5d9476` |
| LFL-004 | planned | Classroom hardening and pilot gate | Not run | Pending |
| LFL-005 | container_verified | Removed the synthetic campus-radio TTS page, browser speech synthesis, generated script/audio, and learner listing while preserving migration lineage | ESLint; TypeScript; 16 Vitest tests; Next production build; Compose config; image build `36f4783f09b8`; migration 005 recorded; campus-radio archived with zero attempts; removed route 404; authenticated learner dashboard shows zero waiting and only the source-backed ConTEFL activity | `0cd37de` |

The LFL-002 fallback remains immediate, bilingual, teacher-authored guidance.
LFL-003 now has an explicitly selected live adapter and operator import path,
but Backblaze/OpenAI connection tests and browser teacher authoring remain open.
Deployment: not deployed. Classroom verification: not run. The original
LFL-001 synthetic prototype is retired by LFL-005 and is not part of the
persistent MVP acceptance journey.
