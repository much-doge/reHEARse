# Listening game mechanics review and next sprint

Work ID: LFL-019. Reviewed 2026-10-09. Status: review and proposed mechanics;
the answer effects and avatar release are a separate implementation slice.
Lead agent accepts the combined release. This review does not claim a new
classroom trial, learning gain, or deployment.

## Review decision

Keep the short listen–choose–replay–explain loop. Improve its feedback and
character visibility now. Remove the decorative snakes and ladders now: they
do not cause any movement. Do not describe this release as having working
snake slides or ladder shortcuts. Original four-choice questions and new
movement rules need their own versioned content/mechanics sprint.

Competition can come from visibly travelling beside classmates and reaching
the next checkpoint. A finish race under self-paced playback is recreational;
it cannot establish who understood best. Support, device speed, reading speed,
replays and start times differ. Do not give grades, classroom privileges or
exclusive learning resources to the earliest finishers.

## What the source actually does

Observed in `src/domain/ladder/model.ts`, `src/adapters/ladder/content.ts`,
`src/adapters/ladder/postgres-ladder.ts` and the learner/teacher components:

| Trigger | Current result | Implication |
|---|---|---|
| First matching choice | Three tiles forward, subject to finish gate | Movement reflects a game choice, not a learner diagnosis. |
| First non-matching choice | One tile forward; one repair is queued | It is a two-tile reduction from the usual advance, **not a backwards slide**. |
| “Not sure” | Three tiles forward; one repair is queued | Honest uncertainty is protected, but position cannot be interpreted as comparable correctness. |
| All four first choices recorded | Repairs become available | The whole first-listen sequence is preserved before recovery. |
| Failed repair choice | Saved explanation, no additional movement debt | Repeated difficulty cannot create an endless punishment. |
| Successful repair choice | Task closes; ordinary debt is removed | The choice checks one relation; the explanation is not automatically certified. |
| One repair attempted | Bounded teaching detail and supported closure become available | Learners have a finite exit without AI approval. |
| Two failed repair attempts | Further ordinary attempts rejected; supported route remains | Avoid a third indistinguishable failure screen. |
| Teacher assistance | One pending task closes with recorded reason | Assistance is a valid completion route. |
| All tasks closed | Finish tile, including supported completion | Closure is the game destination, not a mastery claim. |

The position formula is `min(11, firstChoices × 3 − unresolvedNonNull × 2)`
until all tasks close; then it is 12. Four first-pass mismatches reach tile 4.
Four uncertain choices reach tile 11 with four repairs still open. Closing
uncertain repairs can leave the token at tile 11 until the final closure.
That plateau needs clear checkpoint messaging; it is not meaningful backward
movement or four separate ladder climbs.

The initial content has four newly authored prompts with three choices each.
These are not the original questions. Current options include some easily
eliminated distractors, while the key can be the longest or most precise
option. The first-pass questions and options are all included in the learner
DTO, although only one is presented at a time. Keys, transcript text and
distractor explanations are withheld. Do not claim future prompts are secret.

Current saved events and compare-and-swap revisions protect action retries.
AI feedback is requested separately after saving and cannot hold movement
hostage. The explanation gate checks text length; it cannot establish that
a learner has explained the meaning. Local browser listening gates also do
not prove attention and are not cheat prevention.

## Risks and release gates

No new P0 security defect was established by this bounded source review. This
is not a penetration test or a replacement for the lead's integrated checks.

| Priority | Risk | Required response |
|---|---|---|
| P1, current release | Rule-bearing snake/ladder art promises movements absent from the reducer. Some notices also promise a ladder. | Remove inert art and revise those notices/accessibility labels. Restore only with defined transitions. |
| P1, current release | New animation may declare failure for “not sure,” a transport failure, an unchanged retry, or a supported finish. | Derive effects from a newly acknowledged server outcome. Neutral uncertainty/network states; equal completion celebration. Never replay an award just because a tab polls or reloads. |
| P1, current release | Large animated characters can obscure tiles, each other and name bubbles in a class. | Review 1, 10 and 30 participants, including everyone on the same tile. Keep aliases recoverable in the roster and expose overflow honestly; never silently hide participants. |
| P1, next content sprint | Swapping the single content constant or publishing a newer activity version would make older runs fail current version checks. | Resolve content and media by the run's stored immutable version. Test old and new runs side by side before enabling originals. |
| P1, next content sprint | Original questions are different targets, not a fourth distractor added to the present tasks. | Reauthor the item-to-span mapping and repair prompts around each original target; teacher review required. |
| P1, any competitive release | Finish order conflates uncertainty/support choices and device/start-time differences. | Show a friendly progress race, not a listening-ability leaderboard. No speed bonus or fastest-listener claim in this slice. |
| P2 | Red/green alone excludes some users; loud failures can embarrass. | Pair colour with an icon and bilingual text. Effects stay on the learner device; teacher projection never announces an individual's wrong choice. |
| P2 | One tiny explanation or a support click can close a task without demonstrated meaning. | Label it saved/reviewed, never understood/mastered. Add an optional fresh meaning task later; preserve the original outcome. |
| P2 | A slow learner can be identifiable even under an alias. | Offer private play/projector hiding in a later sprint; do not promise anonymity. Avoid highlighting last place. |
| P2 | Appearance changes could reset learning or invalidate concurrent submissions. | Persist cosmetics separately from the immutable learning events. Reject invalid asset IDs; preserve choices, explanations and progress. |

## Original questions with A, B, C and D

The user's preference replaces the earlier design preference for three choices
in this future slice. Preserve the original wording, four options and order
once their provenance, permitted use and answer interpretation are reviewed.
Do not invent a D option and label the result original. Do not shuffle the
original letter mapping in this mode.

The read-only local inventory contains five shared passages covering twenty
later questions, and separate spoken question-prompt clips. The archive
manifest records hashes/durations and audio capture, not an original option
licence. The inspected package-sequence capture records question/audio/form
metadata rather than a complete option bank; no complete original option bank
was established from that capture.

An unofficial web archive previously referenced by the source register still
shows four options for the first passage and the later passages. Its first
passage targets workload, the recommended research approach, why a particular
theme is raised, and the closing exchange. Those targets differ from the
bootstrap's constraint/benefit questions. This corroborates availability,
not official answer authority or a redistribution licence. Exact source
identifiers, archive URLs, original numbers and copied full content belong in
the protected source worksheet, not this public planning document or learner
screens. Inspect the operator's private source records to reproduce the lookup.

Required content worksheet for each neutral item ID:

- Original spoken prompt transcribed from the matching local audio; exact
  four options and order checked against the operator's authorized copy.
- Audio checksum; original-content revision; private provenance and permitted
  use; teacher-approved key with a reason for rejecting each distractor.
- Whole-conversation context and one or more contextual replay spans in
  integer milliseconds. Original questions can depend on non-adjacent turns;
  do not reuse the present four contiguous chunks automatically.
- English original preserved. Indonesian assistance is separately labelled
  as assistance, not passed off as original text; equal access to it in a
  recreational race. Hints cannot silently reveal the key.
- One bounded focus cue, one fresh follow-up prompt, acceptable brief English,
  Indonesian or mixed explanations, and a finite supported-review alternative.

First listen: preview one original A–D item, listen with enough context,
allow tentative selection, then commit after the relevant span. Allow wider
or complete replay; no answer countdown. A question whose answer depends on
later speech must not be confirmed early.

Repair: show the learner's earlier original selection and replay the relevant
span with one cue. Ask for a brief explanation and a **fresh** follow-up choice.
The original A–D item may be revisited, but a remembered letter is not fresh
listening. Preserve the first selection and each later event. Keep the key
server-side; reveal bounded teaching detail only at the declared supported
review stage. A translation or guided reveal never becomes a claim of
independent audio-only understanding.

## Real snakes and ladders: proposed rules

Keep the current rule version for existing runs. Introduce a new explicit
mechanics version for new runs only after reviewing a paper simulation.

Use a deterministic chapter route, not dice or random power advantages:

1. Every first-listen section reaches a visible chapter landing. A matching
   choice closes that chapter and takes its defined ladder to the next camp.
2. A non-matching choice registers **one** short snake from that landing to a
   named replay bay. Queue its replay until the conversation's first listen
   ends. The next first-listen chapter remains available; never replay an
   earlier whole passage as punishment.
3. A closed replay—revised or supported—takes a defined recovery ladder out
   of its bay. Another failed repair stays in that bay and offers assistance;
   it never creates another snake or resets earlier camps.
4. Uncertainty also opens a replay bay, without a punitive slide. Make that
   route explicit so honest uncertainty is welcome and cannot be sold as
   a comparable first-pass lead.
5. Finish is visible from the start and requires every chapter closed. The
   teacher opens the next floor only at a checkpoint; the goal never grows
   without notice. Equal celebration for all legitimate closure routes.

Before implementation, author exact `from`, `to`, `chapterId`, `cause`, and
route points for every transition, including the all-uncertain path. A
chapter-relative replay lane can coexist with a shared main board; the layout
must not pretend all learners occupy the same chronological task at a tile.
Store each accepted transition with its saved event ID and mechanics version.
The renderer follows that path; it cannot infer a snake from a position delta.
Remove or hide any connector that has no executable transition. Capped slides
must have visibly capped endpoints. No stacked snakes, loops or extra debt.

This is a proposed topology, not an approved replacement reducer. A small
simulation must settle its precise coordinates and transition table first.

## Energy, competition and fair recovery

Give learners anticipation and agency: a visible next camp, a character they
picked, a clear commit, a brief reveal, visible travel, and a rewarding
recovery. Green success effects and red non-matching feedback can be lively
without full-screen flashes, shaking the whole interface or public ridicule.
Treat effects as feedback on this selected answer, never a proficiency colour.

Pause effects and character idle loops during speech in the learner view.
Honor reduced motion with static acknowledgements and the same rewards.
Mute by default; speech has priority over music/chimes. Keep controls usable
through effects and never impose an unskippable celebration delay.

Recommended competitive format: short, teacher-opened floors; a shared camp
goal; visible travelling avatars; optional cheering when somebody reaches a
camp; a class celebration when the teacher advances. Avoid numbered ranks,
public mistake counts and public assistance labels. Fast finishers receive
an optional fresh listening puzzle or cosmetic interaction, not another lap
that makes the required finish recede for everyone else.

Useful assistance is guaranteed: replay, rate control, contextual cue, supported
review and private teacher help. Privately surface an aid after a stalled
repair; make it manually accessible to everyone. Surprise gifts can be leaf
trails, a character wave or a cosmetic accessory available on comparable terms.
Never secretly change keys, move a lagging player, remove another player's
progress or make necessary help depend on luck. These constraints keep the
game honest without claiming every player's finish time is equivalent.

## Prioritized delivery and acceptance

| Slice | Deliverable | Acceptance before release |
|---|---|---|
| Now, LFL-019 | Outcome-bound answer effects; selectable licensed animated characters; larger named markers; remove fake rule graphics | Lead reviews code/licences; preserve movement and saves; retry/poll/reload do not create false reveals; uncertainty neutral; reduced motion, speech priority and 30-token crowding checked; `pnpm check` plus database/browser journeys; named deployment receipt. |
| Next A | Original A–D content for one passage, with historical version resolution | Private provenance/permission review; teacher checks audio/prompts/key/distractors; all four option letters stable; no source identifiers in UI/DTO/bundles; every cut heard; old run still resumes alongside new run; versioned schema validates both three/four-choice content. |
| Next B | Real chapter snakes/recovery ladders and travel events | Exhaustive small state simulation: all match, all mismatch, all uncertain, mixed support and teacher close; finite exit; no repeat slide/debt; renderer endpoints equal server transitions; idempotency, stale tabs, refresh and reconnect preserve movement. |
| Then C | Teacher-opened multi-floor class journey and cosmetic rewards | Visible session goal; no silent finish extension; late/disconnected learner policy; early finisher activity; 30–40-person projection review; learning support unchanged by cosmetics. |
| Pilot | A short lesson with varied learners/devices | Observe purposeful replay and changed explanations; ask whether competition feels fair or exposing, whether effects interrupt speech, and whether everyone can reach a stopping point. Inspect a fresh listening task without publishing scores; repeat after novelty wears off. |

Verification must include provider outage, save timeout/confirmation, concurrent
same-key requests, changed-payload retry, ownership/teacher boundaries, closed
session, expired login with a draft, narrow screens, keyboard operation and
reduced motion. Source-complete, container-verified, deployed and classroom-
verified are separate receipt fields. Document actual results and omissions.

Rollback: deploy the previous application artifact for the appearance/effects
slice; retain additive appearance storage and all saved game/learning events.
For future content/mechanics, disable new starts for the new version and keep
version adapters available so existing runs remain readable/resumable. Never
rewrite historical choices, keys, media hashes or transitions to fit new rules.

## Research basis and limits

These findings inform the design; they do not validate this specific game.

- A semester study with 106 second-language learners compared process-guided
  listening against the same texts/repetitions without explicit process
  guidance. The guided group performed better on the final comprehension
  measure after initial differences were controlled. This supports purposeful
  prediction, monitoring and revisiting; it does not establish the value of
  a snake penalty. [Vandergrift and Tafaghodtari (2010)](https://doi.org/10.1111/j.1467-9922.2009.00559.x).
- A review of 93 Kahoot studies reports potential benefits and mixed results,
  with recurring problems including readability, connectivity, time stress,
  difficulty catching up, and speed incentives encouraging guessing. This is
  why the proposed race uses destination and reveal tension rather than a
  speed multiplier during listening. [Wang and Tahir (2020)](https://www.sciencedirect.com/science/article/pii/S0360131520300208).
- A meta-analysis finds positive average effects with variation; motivational
  and behavioural findings were less stable in a more rigorous subsample.
  Competition combined with collaboration was a useful moderator, not a
  guarantee for any particular classroom. The shared-camp proposal is our
  design inference, requiring a pilot. [Sailer and Homner (2020)](https://doi.org/10.1007/s10648-019-09498-w).

The finite repair route, neutral uncertainty, deterministic assistance and
cosmetic surprises are product judgments. Animated avatars and confetti alone
cannot demonstrate comprehension or sustained engagement.
