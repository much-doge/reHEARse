# Listening ladder: energy and reward plan — LFL-018

Status: proposed gameplay changes. This release implements teacher-stage size,
ambient animation and optional music only. No new reward rules are deployed.

## Aim and boundaries

Make listening feel like an unfolding adventure: anticipation, a clear action,
a visible response and a satisfying checkpoint. “More dopaminergic” is a design
request for energy; we make no claims about neurotransmitter effects. Keep
listening meaning, replay and revision central. Preserve bilingual guidance,
immutable attempts, private assistance and no-score learner diagnostics.

## Proposed rhythm for each section

1. **Listen:** show the choices, the next destination and a restrained audio
   waveform. No music, sound effects, confetti or moving scenery over speech.
   A learner can select and reconsider while listening.
2. **Commit:** after the span ends, use one clear confirmation action. Show a
   short 400–700 ms transition, then the result. Do not manufacture a long wait
   or pretend an AI decision is being calculated.
3. **Move:** animate the token along the actual route, including every detour
   and recovery. A matched interpretation gets a small leaf/star burst. An
   unresolved interpretation gets a gentle route change and a replay cue,
   without a buzzer, red flash or public mistake announcement.
4. **Recover:** replay the exact span with one attention cue, explain and select
   a fresh interpretation. Make a successfully closed repair as satisfying as
   first-pass progress. The saved explanation remains separate from the
   follow-up choice; AI cannot certify the whole explanation.
5. **Checkpoint:** use a brief 1–2 second confetti/leaf celebration, an optional
   quiet chime and a clear “Continue / Lanjut” control. Celebrate completion,
   including supported completion, with equal treatment. No repeated loops.

A replay should feel like a new route with useful information, rather than
repeating a failed screen. Retain the current finite supported exits.

## Fair rewards and support

- Give one cosmetic stamp per closed section, whether first-pass, revised or
  supported. Stamp awards are keyed to the saved event/section, not refreshes.
- Let students choose a token from the start. Later unlocks can offer colours,
  trail effects or camp decorations. Cosmetics never change answer difficulty,
  movement or available listening support.
- Offer replay, slower playback and one bounded cue predictably to everyone.
  After repeated difficulty, privately highlight these controls. Do not call
  anyone a weak learner or infer proficiency from game position.
- If surprise rewards are added, disclose that they are cosmetic and offer
  comparable opportunities to all players. No purchased/random advantages,
  speed points, streak loss or penalties that grow with repeated difficulty.
- Keep public projection on aliases, movement and checkpoints. Private help,
  explanations and repair counts stay off the projector.

## Tension without making listening a race against a timer

Use the next visible destination, route changes, a clear commit/reveal moment
and optional teacher-paced breaks. Keep response time unlimited. Avoid a beat
that speeds up while the audio is playing, countdown pressure, or a reward for
fast clicking. The board can show a friendly race, while each learner retains
an achievable finish. Fast finishers receive an optional deeper listening prompt
or cosmetic exploration; they do not start another competitive lap while
others are completing repairs.

A future class-wide celebration may acknowledge everyone reaching a checkpoint.
It must not identify the last learner, publish correctness totals or hold the
whole class waiting for one named person. The teacher can end a session or
assist privately, preserving saved work.

## Audio and motion policy

Sound is optional, default off, with a visible mute/volume control. Music may
run during the lobby or after everyone has finished, then stops when an active
learner joins. This teacher-stage release cannot detect individual playback
across devices, so it conservatively disables background music throughout
active listening. Future learner chimes require a shared media arbiter: speech
always wins, overlapping effects stop, and background tabs remain silent.

Reduced-motion users get static markers and textual acknowledgement; they
receive the same rewards. Effects must not capture input, shift controls,
flash rapidly or block the next action. Animation preference and sound
preference should be independently controllable in the future reward slice.

## Implementation sequence and acceptance

1. **Reward slice:** event-bound token travel, brief celebration on checkpoint,
   equal supported-completion celebration, optional chime, reduced-motion and
   mute controls. Verify retry/refresh cannot replay an award indefinitely.
2. **Replay variety:** friendly detour panel, bounded cue and explicit return
   to the route; record every explanation and preserve hidden-answer boundaries.
3. **Cosmetics:** token choice and cosmetic stamps with transparent rules.
   No change to progression or learner diagnostic contracts.
4. **More floors:** author and review remaining passages before expanding the
   route; visible floor/checkpoint navigation and teacher pacing. No fake
   infinite track or premature answer reveal.
5. **Classroom observation:** check whether students actually relisten and
   revise, whether effects distract during speech, whether support feels fair,
   whether slower participants can finish, and whether the projected tokens
   remain legible with a full class. Do not use completion as proficiency.

Before enabling rewards, test both first-pass and all-repair journeys, network
retry, refresh, multiple tabs, provider failure, mute, reduced motion, keyboard
use and narrow screens. A classroom trial decides whether to add intensity;
a polished animation alone is not proof of engagement or comprehension gain.
