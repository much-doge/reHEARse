# LFL-023B — Content/backend handoff

Owner: other desktop content/backend lane. Base: `a5be797fa898fdedebf078a1cd19580da7f8281b`.
Branch: `codex/lfl023-content`; worktree: `/tmp/rehearse-lfl023-content`.
Status: container verified for the content/backend lane; lead integration/content
acceptance, media publication and deployment remain pending.

Early checkpoint: `bfa1e61956a9d5e5040230894dad910442215f1d`.

## Stable public boundary

`src/domain/workshop/contracts.ts` exports `part-a-workshop.v1`.
Learner actions: `listen_start {itemId}`, `choose {itemId,choice:A|B|C|D|null}`,
`explain {itemId,option:A|B|C|D,text}`, `next_item {itemId}`.
Teacher actions: `open_practice`, `next_group`, `close`.
Request/DTO field names are frozen in that file; no UI implementation is included.
API responses are the DTO directly, not `{view: DTO}`. Learner writes use
participant `revision`; host writes use room `revision`. Every write has UUID
`key`. Join uses `{kind:join,pin,key}` and an opaque HttpOnly membership cookie.
`listen_start` also starts the allowed replay; repeat starts cannot reset time.
`next_item` follows all three saved explanations. Teacher `next_group` opens
preparation for the next group or finishes after the last group.

## Group structure

The machine-aided source review found five actual primary groups, in this order:

| ID | Primary skill | Items |
|---|---|---|
| meaning-in-context | Restatement and sequence | 2 |
| supported-inference | Supported inference | 9 |
| negative-meaning | Negatives and near-negatives | 2 |
| speaker-intentions | Suggestions, responses and intentions | 10 |
| expressions-in-context | Idioms and multiword expressions | 7 |

Distractor recognition is secondary across these items. No passive-primary
item was identified; do not manufacture a group to fill the taxonomy.
Original source order remains inside each group. Full original bilingual
preparation cards are in `src/adapters/workshop/preparation.ts`.

All thirty items, including a representative from each group, have matched
original four-option sets and a separate semantic key check. This used local
CPU ASR of each complete operator-supplied clip plus an online matching option
copy and key corroboration. It is machine-aided source review; independent human
listening acceptance remains a lead gate. No transcript/options/source map is
committed. English prompts follow spoken questions; Indonesian prompts are
paired task translations. A local decoder mismatch was corrected before review.

Private inputs (ignored, mode 0600):
`/tmp/rehearse-lfl023-content/.secrets/lfl023-source-review.md` and
`/tmp/rehearse-lfl023-content/.secrets/lfl023-import.json`.
They contain source mapping, original ordered options, working transcripts,
private reasons, all thirty classifications, bespoke tips and local media pins.
The public preparation examples are newly authored and do not reproduce live
items. The private package assembly command is documented in its script.

## Backend and final checks

Dedicated migration 016, narrow port, PostgreSQL adapter and two route handlers
are included. The adapter serializes room/participant mutations, pins an
immutable content row, preserves accepted mutation results for retries, enforces
observed revisions and derives time from the database. Keys/private reasons and
future hints are projected out. Historical game/ladder files are unchanged.

Passed:

- Final `pnpm check` inside a production-shaped isolated Docker build: lint,
  TypeScript, **150 tests in 39 files**, and Next production build.
- Sixteen focused workshop schema/preparation/domain/projection tests, including
  the allowed-action matrix, exact first-choice boundaries and finite replay.
- Real private importer `--dry-run`: all thirty local hashes, byte sizes, MP3
  codec/type and pinned durations; schema and original A-D tuple order.
- Negative dry-runs reject corrupted hash, changed duration and an unreviewed
  item before publication. No credentials or network were needed.
- Dedicated local PostgreSQL with migrations 001–016, real API routes and
  `scripts/lfl023-local-journey.ts`: authentication, teacher ownership,
  same-origin checks, keyed membership/retry storage, original acknowledgements,
  changed text/action/revision conflicts, six-way listen/advance races, early
  and late timing, fixed deadlines across refresh, correct and finite replay/
  guided branches, all three immutable explanations, operational counts,
  teacher group release, preservation of earlier state, expiry/close, leakage
  checks, all thirty synthetic item completions, both group finishes and the
  final finished state, plus historical ladder/classroom readers.
- Final local app image:
  `sha256:7b866311eadc094140b56ac352bc409f8b54b55a4d8086195049432ebb3fa749`.
  This is a backend-only lab image, not the lead's combined UI or production.
- `git diff --check`; both private deliverables are ignored and mode 0600.

Failed checks that were corrected or bypassed explicitly:

- Host pnpm preflight could not open its SQLite store and tried dependency
  installation. Direct TypeScript/focused checks passed; the required complete
  `pnpm check` passed in the isolated container instead. No shared config changed.
- Local ASR decoder API mismatch was fixed with a compatible local decoder.
- Test-only JSON-key-order comparison and inconsistent expired-timer setup were
  corrected; final real API journey passed. The expired timer is deliberately
  adjusted only in the guarded synthetic database fixture.
- One test-script `prefer-const` lint failure was corrected before final checks.

Not run: lead UI/browser/confetti acceptance; real source-audio browser playback;
independent human listening review; publisher-authenticated source provenance;
150-participant load testing; live object import/range verification; production
or classroom tests. Public matching copies are secondary sources. Full dry-run
source checks and machine-aided semantic review are not a human classroom trial.
No production/storage operation or AI call was performed. No old game/ladder
source file, UI file, auth file, Compose config or existing migration was edited.

## Integration and operator instructions

The public contracts are unchanged from the early checkpoint. Cherry-pick the
remaining lane commits in order after that checkpoint. The main checkout was
observed to contain its lead-applied copy (`1a8dc40`) and the lead UI (`2e5456f`);
those are not worker commits or worker acceptance. Do not cherry-pick the early
checkpoint twice. Migration 016 has not changed since the early checkpoint.

Use `GET /api/workshop?pin=...` with the membership cookie, and authenticated
`GET /api/workshop/host?pin=...`. POST request shapes are exported in
`src/domain/workshop/contracts.ts`. All responses are direct DTOs. The host's
`activeGroup` is zero-based. Learner `revision` and room `roomRevision` are
separate; learner writes submit the former, host writes submit host `revision`.
Store the complete pending body so retries retain the original revision/key.
Accepted retries return the original view; poll GET to reconcile newer state.

`listen_start` starts either the first timed listen or the currently allowed
replay. First choice opens at pinned clip end; deadline is exactly 12 seconds
later, inclusive at that timestamp. After timeout, GET presents `relisten_1`;
its next listen start records the missed first choice and starts replay.
Replay choices require the accepted full clip duration to elapse and are then
untimed. Two misses lead to guided comparison and a final selection. The three
wrong-option fields are exposed only in the explanation/completed branch;
prose is length-checked but never semantically graded. `next_item` advances the
current group cursor. All-complete is also indicated by `groupComplete`.
Teacher `next_group` is a deliberate decision and can proceed with unfinished
participants; it never rewrites earlier item states or events.

A generated HttpOnly SameSite=Lax membership cookie is required after join.
Persist the private UUID join key for a lost-response retry; do not put it in
URLs or logs. The raw membership token is never stored. The join retry key in
storage is separately keyed so a database reader cannot replay its stored UUID
to obtain the browser credential. `SESSION_SECRET` must be at least 20 chars;
`SESSION_COOKIE_SECURE=false` is only for an explicit local HTTP lab.
Each browser cookie currently represents one workshop membership at a time.

After lead content/listening acceptance, run from the integrated checkout with
installed Node/tsx and ffprobe:

```sh
node --import tsx scripts/lfl023-import.ts /tmp/rehearse-lfl023-content/.secrets/lfl023-import.json --dry-run
```

The private manifest must retain mode 0600 and every referenced local MP3 must
remain available. Apply migration 016 with the normal migration runner. Live
publication is lead-owned and must use explicit `--publish`,
`ALLOW_WORKSHOP_IMPORT=true`, a configured `DATABASE_URL`, and the existing
public-mode `OBJECT_STORAGE_*` / `PUBLIC_MEDIA_BASE_URL` environment. Do not
publish from this worker lane. The importer needs ffprobe on its operator host;
the standard app/migrator container does not install it. No Compose change is
required for the runtime.

All local content/media is validated before any upload. The importer takes an
advisory transaction lock, rejects changed immutable versions, and gives an
identical re-import a no-op. It uploads fresh randomized neutral object keys,
checks full public bytes/hash/type and range-206 delivery, then publishes one
content row transactionally. Runtime learner audio URLs are direct public
object URLs; no app/tunnel/home-uplink media proxy is added. Canonical content
digests omit local paths/private source references, so relocating identical
inputs does not change the immutable content identity. Failed uploads may leave
unreferenced objects for operator reconciliation; no automatic bucket cleanup
was run. There is no public draft catalogue: presence of a committed immutable
content row is publication, and rooms pin that row plus all its versions/media.

The repeatable lab journey refuses any database URL other than the explicitly
named local `rehearse-lfl023-db` container and requires
`ALLOW_LOCAL_WORKSHOP_JOURNEY=true` plus `FEEDBACK_PROVIDER=template`.
It uses only sanitized synthetic workshop content and disposable users/rooms;
it must never be pointed at production. Baseline historical readers remain
unchanged. Normal UI/audio pacing remains the lead's browser acceptance gate.

Rollback keeps additive tables, pinned content and append-only history. Do not
reuse a published version for corrections, delete learning records, or deploy
this lane without lead acceptance. The worker did not push or deploy.

## Complete preparation-card text

The following is the complete original English/Indonesian preparation material.
It is source-independent and safe to include in the UI and projector.

### Restatement and sequence / Pernyataan ulang dan urutan

**Question task**

Identify the option that preserves what the speaker says, including who acts and when.

Pilih opsi yang mempertahankan maksud pembicara, termasuk siapa yang bertindak dan kapan.

**Listening target**

Track the second speaker's main statement, then connect time words and references to the first turn.

Ikuti pernyataan utama pembicara kedua, lalu hubungkan penanda waktu dan rujukannya dengan giliran pertama.

**Decision procedure**

1. State the main action in a short phrase before reading the choices. / Rumuskan tindakan utama dalam frasa singkat sebelum membaca pilihan.

2. Check the actor, object, and sequence in each candidate. / Periksa pelaku, objek, dan urutan dalam tiap pilihan.

3. Choose an equivalent meaning even when the vocabulary differs. / Pilih makna yang setara meskipun kosakatanya berbeda.

**Distractor patterns**

1. Repeated words can occur in an option that changes the action. / Kata yang diulang bisa muncul pada opsi yang mengubah tindakan.

2. A plausible plan can still reverse the stated order or change the time. / Rencana yang masuk akal tetap bisa membalik urutan atau mengubah waktu yang disebutkan.

**Original analogous example**

A: Can we use the seminar room now? B: The booking lasts until noon; after that it is available.

A: Bisa pakai ruang seminar sekarang? B: Pemesanannya sampai tengah hari; setelah itu tersedia.

When is the room available?

Kapan ruang itu tersedia?

The equivalent meaning is availability after noon. Being booked now does not mean it is unavailable all day.

Makna setaranya adalah tersedia setelah tengah hari. Dipesan sekarang bukan berarti tidak tersedia seharian.

**Inquiry prompts**

1. Who performs the action, and what happens first? / Siapa yang bertindak, dan apa yang terjadi lebih dulu?

2. Does this choice preserve the time and relationship? / Apakah pilihan ini mempertahankan waktu dan hubungannya?

**Language notes**

Before, after, until and once organize events; keep their order when paraphrasing.

Before, after, until, dan once mengatur urutan peristiwa; pertahankan urutannya saat menyatakan ulang.

### Supported inference / Inferensi yang didukung percakapan

**Question task**

Infer an action, situation, or attitude that the conversation supports without stating it directly.

Simpulkan tindakan, situasi, atau sikap yang didukung percakapan meskipun tidak dinyatakan langsung.

**Listening target**

Connect a stated detail with the question being asked. Use both turns when the connection depends on context.

Hubungkan detail yang disebutkan dengan pertanyaannya. Gunakan kedua giliran jika hubungan itu bergantung pada konteks.

**Decision procedure**

1. Identify whether the question asks about meaning, a next action, a situation, or an attitude. / Tentukan apakah pertanyaan menanyakan maksud, tindakan berikutnya, situasi, atau sikap.

2. Name the detail that makes your conclusion reasonable. / Sebutkan detail yang membuat simpulanmu masuk akal.

3. Reject conclusions that require an additional story the speakers did not provide. / Singkirkan simpulan yang membutuhkan cerita tambahan yang tidak disampaikan pembicara.

**Distractor patterns**

1. A choice may describe the topic correctly but answer a different question. / Pilihan bisa menggambarkan topiknya dengan benar tetapi menjawab pertanyaan lain.

2. An option can overstate a small clue as a definite intention or a general fact. / Opsi bisa melebihkan petunjuk kecil menjadi niat pasti atau fakta umum.

**Original analogous example**

A: Can you bring the display to the lecture? B: It is still in the repair shop, and they close after the lecture starts.

A: Bisa bawa layarnya ke kuliah? B: Masih di tempat servis, dan tempatnya tutup setelah kuliah mulai.

What can be inferred about using that display for the lecture?

Apa yang dapat disimpulkan tentang penggunaan layar itu untuk kuliah?

The reply makes timely use unlikely. It gives no reason to conclude the display is permanently broken or that the lecture is cancelled.

Jawaban itu membuat penggunaan tepat waktu kurang mungkin. Tidak ada alasan menyimpulkan layarnya rusak permanen atau kuliahnya dibatalkan.

**Inquiry prompts**

1. Which spoken detail supports my conclusion? / Detail lisan mana yang mendukung simpulanku?

2. Am I inferring the minimum needed, or adding an unsupported assumption? / Apakah aku menyimpulkan secukupnya, atau menambah asumsi yang tidak didukung?

**Language notes**

None needed for this card. / Tidak diperlukan catatan tambahan untuk kartu ini.

### Negatives and near-negatives / Makna negatif dan hampir negatif

**Question task**

Work out what did or did not happen when a reply includes a negative or a near-negative expression.

Tentukan apa yang terjadi atau tidak terjadi ketika jawaban memuat ungkapan negatif atau hampir negatif.

**Listening target**

Locate the negative word, identify its scope, and distinguish an actual event from something that nearly happened.

Temukan kata negatif, tentukan cakupannya, dan bedakan kejadian nyata dari sesuatu yang hampir terjadi.

**Decision procedure**

1. Attach the negative to its verb or description rather than to the whole conversation. / Hubungkan penanda negatif dengan kata kerja atau keterangan yang tepat, bukan dengan seluruh percakapan.

2. Rewrite the statement in plain words and keep its cause or qualification. / Nyatakan ulang dengan kata sederhana sambil mempertahankan sebab atau pembatasnya.

3. Check whether almost or hardly changes the conclusion you first expected. / Periksa apakah almost atau hardly mengubah simpulan yang semula kamu harapkan.

**Distractor patterns**

1. One choice may drop the negative and reverse the meaning. / Satu pilihan bisa menghilangkan penanda negatif dan membalik makna.

2. Another may treat an event that nearly happened as an event that actually happened. / Pilihan lain bisa memperlakukan hal yang hampir terjadi sebagai hal yang benar-benar terjadi.

**Original analogous example**

A: Did everyone catch the announcement? B: I nearly missed it, but the final sentence was clear.

A: Semua sempat mendengar pengumumannya? B: Aku hampir melewatkannya, tetapi kalimat terakhir terdengar jelas.

Did the second speaker hear any of the announcement?

Apakah pembicara kedua mendengar sebagian pengumumannya?

Nearly missed does not mean missed completely. The qualification confirms that some information was heard.

Nearly missed bukan berarti melewatkan seluruhnya. Keterangan lanjutannya menegaskan bahwa sebagian informasi terdengar.

**Inquiry prompts**

1. Exactly which event is being negated? / Kejadian mana tepatnya yang dinegasikan?

2. Did it happen, fail to happen, or only come close to happening? / Apakah hal itu terjadi, tidak terjadi, atau hanya hampir terjadi?

**Language notes**

Almost did not do X can still mean X happened, although it was difficult or unexpected.

Almost did not do X masih bisa berarti X terjadi, meskipun sulit atau tidak terduga.

### Suggestions, responses and intentions / Saran, tanggapan, dan maksud pembicara

**Question task**

Identify what the speaker is doing with the reply: suggesting, offering, declining, accepting, or reassuring.

Tentukan fungsi jawaban pembicara: menyarankan, menawarkan, menolak, menerima, atau menenangkan.

**Listening target**

Hear the response in relation to the preceding problem or invitation. Literal sentence form and conversational purpose can differ.

Dengarkan jawaban dalam kaitannya dengan masalah atau ajakan sebelumnya. Bentuk kalimat harfiah dan tujuan percakapan bisa berbeda.

**Decision procedure**

1. Identify the problem, request or offer in the first turn. / Kenali masalah, permintaan, atau tawaran pada giliran pertama.

2. Ask what response would follow naturally from the second turn. / Tanyakan tanggapan apa yang secara wajar mengikuti giliran kedua.

3. Match the implied action or stance, without adding a commitment the speaker did not make. / Cocokkan tindakan atau sikap yang tersirat tanpa menambah komitmen yang tidak dibuat pembicara.

**Distractor patterns**

1. An option may take a rhetorical question as a genuine request for information. / Opsi bisa menganggap pertanyaan retoris sebagai permintaan informasi yang sungguh-sungguh.

2. A response may mention an event while declining it; mentioning is not agreeing. / Jawaban bisa menyebut kegiatan sambil menolaknya; menyebut bukan berarti menyetujui.

**Original analogous example**

A: These notes are hard to read. B: Would the typed version on the course page help?

A: Catatan ini sulit dibaca. B: Bagaimana kalau pakai versi ketik di halaman mata kuliah?

What does the reply suggest?

Apa yang disarankan oleh jawaban itu?

The question proposes an alternative resource. It does not ask the first speaker to type a new document.

Pertanyaan itu mengusulkan sumber alternatif. Bukan meminta pembicara pertama mengetik dokumen baru.

**Inquiry prompts**

1. What problem or offer is the reply responding to? / Jawaban ini menanggapi masalah atau tawaran apa?

2. Is this a literal question, or is it performing another function? / Apakah ini pertanyaan harfiah, atau menjalankan fungsi lain?

**Language notes**

Why don't you, you might, and have you tried can introduce suggestions without using should.

Why don't you, you might, dan have you tried dapat menyampaikan saran tanpa kata should.

### Idioms and multiword expressions / Idiom dan ungkapan beberapa kata

**Question task**

Interpret an expression as a meaningful unit and connect it to the situation being discussed.

Tafsirkan ungkapan sebagai satu kesatuan makna dan hubungkan dengan situasi yang dibahas.

**Listening target**

Notice combinations whose conversational meaning cannot be obtained by translating each word separately.

Perhatikan gabungan kata yang makna percakapannya tidak dapat diperoleh dengan menerjemahkan setiap kata secara terpisah.

**Decision procedure**

1. Identify the expression and the person or action it describes. / Kenali ungkapan serta orang atau tindakan yang diterangkannya.

2. Use the surrounding situation to test a plain-language paraphrase. / Gunakan situasi di sekitarnya untuk menguji parafrasa dalam bahasa sederhana.

3. Eliminate literal interpretations that do not fit the exchange. / Singkirkan tafsiran harfiah yang tidak sesuai dengan percakapan.

**Distractor patterns**

1. A wrong option may reuse a concrete noun from a figurative expression. / Opsi salah dapat memakai kembali kata benda konkret dari ungkapan kiasan.

2. A familiar topic word can distract from the verb phrase that carries the actual meaning. / Kata topik yang akrab bisa mengalihkan perhatian dari frasa kerja yang membawa makna sebenarnya.

**Original analogous example**

A: Did the committee reject your proposal? B: No, it is still on the table.

A: Panitia menolak usulanmu? B: Tidak, usulannya masih dipertimbangkan.

What is the status of the proposal?

Bagaimana status usulan itu?

On the table means under consideration here. The location of a piece of paper is irrelevant to the decision.

On the table berarti masih dipertimbangkan dalam konteks ini. Letak selembar kertas tidak relevan dengan keputusan tersebut.

**Inquiry prompts**

1. Would a word-by-word translation make sense in this situation? / Apakah terjemahan kata per kata masuk akal dalam situasi ini?

2. Which plain expression keeps the same meaning and speaker attitude? / Ungkapan sederhana mana yang mempertahankan makna dan sikap pembicara?

**Language notes**

Particles can change a verb's meaning. Interpret the whole expression before comparing options.

Partikel dapat mengubah makna kata kerja. Tafsirkan seluruh ungkapan sebelum membandingkan opsi.

## Neutral item classification register

All entries below completed machine-aided audio/question/options and semantic
key review. Exact source numbering, original options, keys, source links,
secondary skills and confidence details remain in the private review/import
files. Independent human listening/content acceptance remains with the lead.

| Neutral item | Primary skill | Group |
|---|---|---|
| clip-bloom | idioms | expressions-in-context |
| clip-grove | idioms | expressions-in-context |
| clip-iris | idioms | expressions-in-context |
| clip-kelp | idioms | expressions-in-context |
| clip-quartz | idioms | expressions-in-context |
| clip-willow | idioms | expressions-in-context |
| clip-yarrow | idioms | expressions-in-context |
| clip-birch | restatement | meaning-in-context |
| clip-hazel | restatement | meaning-in-context |
| clip-pine | negatives | negative-meaning |
| clip-reed | negatives | negative-meaning |
| clip-acorn | functional-expressions | speaker-intentions |
| clip-cedar | functional-expressions | speaker-intentions |
| clip-clover | functional-expressions | speaker-intentions |
| clip-dune | functional-expressions | speaker-intentions |
| clip-fern | functional-expressions | speaker-intentions |
| clip-jade | functional-expressions | speaker-intentions |
| clip-larch | functional-expressions | speaker-intentions |
| clip-sage | functional-expressions | speaker-intentions |
| clip-teal | functional-expressions | speaker-intentions |
| clip-umber | functional-expressions | speaker-intentions |
| clip-amber | inference | supported-inference |
| clip-drift | inference | supported-inference |
| clip-echo | inference | supported-inference |
| clip-elm | inference | supported-inference |
| clip-maple | inference | supported-inference |
| clip-moss | inference | supported-inference |
| clip-ocean | inference | supported-inference |
| clip-violet | inference | supported-inference |
| clip-zephyr | inference | supported-inference |
