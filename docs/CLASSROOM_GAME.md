# Teacher-led Part A game — LFL-007

Open `/classroom` after teacher/admin sign-in, create a room, and project it.
Students open `/play` and enter the six-digit PIN; one phone per pair/team works.
A generated Team alias avoids collecting names. The room lasts 24 hours. Keep
its URL to resume it after refresh. Browser cookies restore student membership.

1. **Listen:** play the current clip on the teacher's classroom speaker. Student
   devices receive phase state, not synchronized audio. Replay if needed.
2. **Comprehend:** invite a brief partner explanation, then one short meaning or
   uncertainty per team. Open Moderation and approve phrases for the cloud.
   Hide a displayed phrase with ×. Frequency indicates shared wording, not truth.
3. **Quiz:** choose 20–90 seconds, then open the quiz. Timing begins on the server
   after comprehension; the first answer is immutable. A correct game answer
   earns 1000 points plus at most 200 for speed. Incorrect answers earn zero.
4. **Review:** reveal the meaning and one bilingual listening cue. Replay with
   that cue, compare competing interpretations, and ask what changed. There is
   no instructional score, diagnostic judgment or proficiency inference.
5. **Next:** repeat. Finish early whenever useful; do not rush all 30 clips.

For a lively 45-minute lesson: allow 3 minutes to join, use 8–12 rounds with
2–3 minutes of discussion/replay each, and finish with a pair explaining a cue
that changed their interpretation. All 30 clips are available for longer
sessions. If Wi-Fi fails, play/replay on the teacher device and collect meanings
or A–D choices on paper; resume the room when service returns. Late joins get
the current phase and have no retroactive points. Speed is recreational only;
choose a longer answer window for slower devices or readers.

## Evidence and scope

Vandergrift & Tafaghodtari (2010), *Teaching L2 Learners How to Listen Does Make
a Difference*, supports guided prediction, verification, monitoring and reflection
rather than listening repeatedly without a purpose:
<https://doi.org/10.1111/j.1467-9922.2009.00559.x>.
This multiweek study does not establish gains from one game lesson.

Wang & Tahir (2020), *The effect of using Kahoot! for learning – A literature
review*, reports engagement benefits and mixed learning findings, including
technical problems and time pressure:
<https://doi.org/10.1016/j.compedu.2020.103818>.
We keep the comprehension discussion untimed and cap the speed bonus.
The cloud is an externalization/discussion aid; we do not claim that cloud
visualization alone improves comprehension.

## Contract and operational boundaries

`classroom-game.v1` freezes a `game_deck` version at room creation. A narrow
RoomPort connects the framework-free phase/scoring rules to PostgreSQL. Separate
game tables have no foreign keys to listening attempts or feedback. All room
changes serialize on a row lock; teacher transitions require the observed
revision. Student first answers and cloud evidence are append-only. Moderation
is an append-only decision log. Phase reads reconcile an ambiguous request.
Polling every two seconds replaces a broker; deadlines use database time.
Teacher-only audio is deliberate: there is no promise of device clock alignment.
Keys/cues are absent before review, options appear only at quiz/review, and
only the owner controls the room. PIN possession alone cannot read room state:
a random HttpOnly membership token is required and stored only as a hash.

Rooms expire after 24 hours and deny reads/writes then. Evidence remains in the
private database; no automatic retention purge is implemented in this MVP.
Rooms cap at 150 teams and ten active rooms per teacher. This is suitable for a
supervised pilot, not an anonymous Internet-scale event; distributed abuse rate
limiting and large-class load tests are still open. No learner cloud text is
sent to an AI provider. The local source ASR tool is a temporary preparation
utility, not a runtime dependency.

## Import and rollback

`pnpm exec tsx scripts/import-game.ts content/part-a-game.v1.json AUDIO_DIR`
uses the existing operator-configured public media adapter and uploads only
source MP3s under fresh `rehearse/media/activities/UUID/v1/random-N.mp3` keys.
Checksums, size and object lineage are private `game-source.v1` evidence.
The manifest's example.invalid URLs are import placeholders, never production
playback URLs. Publication is one transaction after every upload succeeds;
a failed import may leave unreferenced objects requiring reconciliation.
Re-importing the same version is a no-op. Corrections require a new version.

Roll back by restoring the previously verified app image; migration 008 is
additive and can remain. Never drop game evidence or alter individual attempts.
