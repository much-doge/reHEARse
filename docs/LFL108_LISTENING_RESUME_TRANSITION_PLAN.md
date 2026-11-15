# LFL-108 Listening resume and transition plan

## Reported behavior

When a mobile browser suspends the tab, the audio element can be recreated at
zero even though the server has already recorded Listening progress. Returning
to the tab therefore starts the player at the beginning. In Part B and Part C,
the first long-group question can also appear before the group context preview,
because the UI waits until the spoken question cue instead of the mapped group
context start.

## Package scope

The repair is package-agnostic and uses each registered package's existing
`listening-question-map` and `listening-pauses` data. The source audit covers the
registered full forms (`ets-volume1-practice-test-a` and
`ets-volume3-practice-test-a`). The Volume 3 Practice Test B directory remains a
partial, unregistered Listening source and is not changed by this work.

## Acceptance criteria

1. On visibility/pageshow restoration, the player seeks to the best known
   attempt position (server checkpoint plus a throttled local checkpoint) rather
   than silently returning to zero. Audio is not autoplayed without a user
   gesture.
2. The existing server timing gates remain authoritative; local resume data is
   only a playback convenience and cannot unlock an answer or mark a question
   heard.
3. At a Part B/C group `contextStartMs`, all questions in that mapped group are
   visible. At each question's mapped question cue, the view returns to that
   question and its answer controls.
4. Package-specific part transitions are derived from mapped group boundaries,
   not hard-coded assumptions about a single form. Existing Part A behavior and
   question-passed locking remain unchanged.
5. Existing attempts, audio events, answer events, and package metadata remain
   immutable. No migration is expected.

## Verification gate

Add pure timing/transition tests for both registered maps, run changed-path
ESLint, repository TypeScript, the full Vitest suite, production build, and
`git diff --check`. Deployment remains app-only after the gates pass.
