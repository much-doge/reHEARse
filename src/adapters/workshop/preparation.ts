import type { EnrichmentActivity, Preparation, Skill, Text } from "../../domain/workshop/contracts";

const t = (en: string, id: string): Text => ({ en, id });
const activity = (id: EnrichmentActivity["id"], title: string, titleId: string, instruction: string, instructionId: string): EnrichmentActivity => ({
  id, title: t(title, titleId), instruction: t(instruction, instructionId),
});

const replayActivities: EnrichmentActivity[] = [
  activity("cold-replay", "Reconstruct before comparing", "Rekonstruksi sebelum membandingkan", "Replay a completed recording with A–D covered. Hold a brief plain-language paraphrase in mind: who did or meant what? After playback, open the options and choose the one that preserves that meaning, not merely a familiar word.", "Putar ulang rekaman yang sudah selesai dengan pilihan A–D tertutup. Susun parafrasa singkat dalam pikiran: siapa melakukan atau bermaksud apa? Setelah audio selesai, buka pilihan dan pilih yang mempertahankan makna itu, bukan sekadar kata yang terasa akrab."),
  activity("focus-replay", "Test one listening cue", "Uji satu petunjuk menyimak", "Use the skill focus on this card and replay the real recording. Attend to one relation that could change the meaning—speaker, actor, polarity, degree, sequence, or intended function. Then choose the A–D option that keeps that relation intact.", "Gunakan fokus keterampilan pada kartu ini dan putar ulang rekaman asli. Perhatikan satu hubungan yang dapat mengubah makna—pembicara, pelaku, polaritas, tingkat, urutan, atau fungsi ujaran. Lalu pilih opsi A–D yang mempertahankan hubungan tersebut."),
  activity("delayed-replay", "Reconsider after a short pause", "Tinjau kembali setelah jeda singkat", "Take a short pause before reopening the recording. Listen again and make a fresh A–D choice. When your first response appears, compare the two choices: which audio cue supports the new choice, or why does the first still fit better?", "Berhentilah sejenak sebelum membuka kembali rekaman. Dengarkan lagi dan buat pilihan A–D yang baru. Setelah jawaban pertama muncul, bandingkan keduanya: petunjuk audio mana yang mendukung pilihan baru, atau mengapa pilihan pertama masih lebih sesuai?"),
];

const activities = (): EnrichmentActivity[] => structuredClone(replayActivities);

export const workshopGroups: Array<{ id: string; title: Text; skill: Skill; preparation: Preparation }> = [
  {
    id: "meaning-in-context", title: t("Restatement and sequence", "Pernyataan ulang dan urutan"), skill: "restatement",
    preparation: {
      questionTask: t("Track the meaning of the final line and how it relates to the exchange.", "Ikuti makna bagian akhir dan hubungannya dengan percakapan."),
      listeningTarget: t("The first turn frames the situation; the reply often carries the decisive meaning. Hear the reply as a whole, then check actor, action, time, and qualification.", "Giliran pertama memberi konteks; tanggapan sering memuat makna penentu. Dengarkan tanggapan secara utuh, lalu periksa pelaku, tindakan, waktu, dan batasannya."),
      procedure: [
        t("Use the first turn to establish the situation; give the second speaker's reply your closest attention.", "Gunakan giliran pertama untuk memahami situasi; perhatikan terutama tanggapan pembicara kedua."),
        t("Before scanning options, reduce the reply to a short meaning: who did, wants, or believes what?", "Sebelum menelusuri opsi, ringkas tanggapan menjadi makna singkat: siapa melakukan, menginginkan, atau meyakini apa?"),
        t("Match the meaning, not the wording. A correct option may replace a key word with a natural equivalent.", "Cocokkan maknanya, bukan kata-katanya. Opsi yang tepat dapat mengganti kata kunci dengan padanan yang wajar."),
        t("Keep the actor, action, object, time, and degree in the same relationship as the recording.", "Pertahankan pelaku, tindakan, sasaran, waktu, dan tingkat makna dalam hubungan yang sama seperti di rekaman."),
        t("Treat a sound-alike as a warning to check meaning, not as proof that an option is correct.", "Anggap kata yang bunyinya mirip sebagai alasan untuk memeriksa makna, bukan bukti bahwa opsi itu benar."),
      ],
      distractorPatterns: [
        t("Exact-word match: a repeated word can sound convincing while the option changes what happened.", "Kecocokan kata persis: kata yang diulang dapat terdengar meyakinkan meski opsi mengubah kejadian."),
        t("Sound-alike: an option borrows a similar sound but gives it an unrelated meaning.", "Bunyi mirip: opsi memakai bunyi yang serupa tetapi memberinya makna yang tidak berkaitan."),
        t("Role reversal: the topic stays the same, but the option switches who did or received the action.", "Pertukaran peran: topiknya tetap sama, tetapi opsi menukar pelaku dan penerima tindakan."),
        t("Time shift: the option changes whether an event is planned, happening, finished, or delayed.", "Perubahan waktu: opsi mengubah apakah peristiwa direncanakan, sedang berlangsung, selesai, atau tertunda."),
        t("Overreach: the option adds a reason, intention, or certainty that the exchange does not support.", "Simpulan berlebihan: opsi menambahkan alasan, niat, atau kepastian yang tidak didukung percakapan."),
      ],
      longmanReference: t("Adapted from Longman Part A, Skills 1–3. The course directs attention to the reply, then asks you to recognize a restatement rather than hunt for identical wording; similar-sounding distractors can imitate key words without preserving meaning. Here, use the first turn for context and test each option against the whole reply.", "Diadaptasi dari Longman Bagian A, Keterampilan 1–3. Materi mengarahkan perhatian pada tanggapan, lalu meminta kamu mengenali pernyataan ulang alih-alih mencari kata yang sama persis; pengecoh berbunyi mirip dapat meniru kata kunci tanpa mempertahankan makna. Di sini, gunakan giliran pertama sebagai konteks dan uji setiap opsi terhadap seluruh tanggapan."),
      extensionActivities: activities(),
      inquiryPrompts: [t("Which person performs the action in the option I chose?", "Siapa yang melakukan tindakan dalam pilihan saya?"), t("Did I preserve the time and sequence, or only repeat a familiar word?", "Apakah saya mempertahankan waktu dan urutan, atau hanya mengulang kata yang akrab?")],
      languageNotes: [t("A synonym preserves meaning while changing form; a related topic word may still describe a different action.", "Sinonim mempertahankan makna dengan bentuk berbeda; kata yang berkaitan dengan topik tetap dapat menggambarkan tindakan lain."), t("Until, before, after, and once establish event order. Preserve which event comes first and which condition ends it.", "Until, before, after, dan once membentuk urutan peristiwa. Pertahankan peristiwa mana yang lebih dahulu dan kondisi mana yang mengakhirinya."), t("A familiar sound is not semantic evidence: check what the option says the speaker means.", "Bunyi yang akrab bukan bukti semantik: periksa makna yang dinyatakan opsi sebagai maksud pembicara.")],
    },
  },
  {
    id: "supported-inference", title: t("Supported inference", "Inferensi yang didukung percakapan"), skill: "inference",
    preparation: {
      questionTask: t("Draw only the conclusion supported by the exchange and the requested detail.", "Tarik hanya simpulan yang didukung percakapan dan detail yang diminta."),
      listeningTarget: t("Combine contextual clues to infer a role, setting, or likely next action; then preserve who did what to whom.", "Gabungkan petunjuk konteks untuk menyimpulkan peran, tempat, atau langkah berikutnya; lalu pertahankan siapa melakukan apa kepada siapa."),
      procedure: [
        t("Listen for clues across both turns; a role, setting, or next step may be implied rather than named.", "Dengarkan petunjuk di kedua giliran; peran, tempat, atau langkah berikutnya dapat tersirat, bukan disebutkan langsung."),
        t("Combine at least two compatible clues before inferring who is speaking or where the exchange occurs.", "Gabungkan sedikitnya dua petunjuk yang selaras sebelum menyimpulkan siapa yang berbicara atau di mana percakapan berlangsung."),
        t("For a likely next action, follow the stated goal or unfinished task; do not invent a new plan.", "Untuk memperkirakan langkah berikutnya, ikuti tujuan atau tugas yang belum selesai; jangan mengarang rencana baru."),
        t("For active/passive restatements, map the agent, action, and affected person or thing before comparing options.", "Untuk pernyataan aktif/pasif, petakan pelaku, tindakan, dan orang atau benda yang terdampak sebelum membandingkan opsi."),
        t("When several nouns appear, keep each person's role attached to the correct action; then reject unsupported additions.", "Saat beberapa kata benda muncul, hubungkan peran setiap orang dengan tindakan yang tepat; lalu singkirkan tambahan yang tidak didukung."),
      ],
      distractorPatterns: [
        t("One clue only: a plausible job or place may fit a single word but not the full situation.", "Hanya satu petunjuk: pekerjaan atau tempat yang masuk akal dapat cocok dengan satu kata tetapi tidak dengan seluruh situasi."),
        t("Passive-role trap: the grammatical subject may receive the action rather than perform it.", "Pengecoh peran pasif: subjek tata bahasa dapat menerima tindakan, bukan melakukannya."),
        t("Switched participants: an option assigns the correct action to the wrong person or object.", "Peserta tertukar: opsi memberikan tindakan yang tepat kepada orang atau benda yang salah."),
        t("Unsupported next step: an option describes something possible in general but not indicated by the speakers' goal.", "Langkah berikutnya tanpa dukungan: opsi menyebut sesuatu yang mungkin secara umum tetapi tidak ditunjukkan oleh tujuan pembicara."),
        t("Over-inference: an option adds motive, cause, or certainty beyond the available clues.", "Inferensi berlebihan: opsi menambahkan motif, sebab, atau kepastian di luar petunjuk yang tersedia."),
      ],
      longmanReference: t("Adapted from Longman Part A, Skills 4–6. These skills move from conclusions about a speaker, setting, or probable next action to active/passive restatement and role tracking when several nouns appear. A sound inference uses the clues together; it is a limited conclusion, not a guess about everything that might be true.", "Diadaptasi dari Longman Bagian A, Keterampilan 4–6. Keterampilan ini bergerak dari simpulan tentang pembicara, tempat, atau kemungkinan tindakan berikutnya ke pernyataan ulang aktif/pasif dan pelacakan peran ketika beberapa kata benda muncul. Inferensi yang baik menggabungkan petunjuk; simpulannya terbatas, bukan tebakan tentang semua hal yang mungkin benar."),
      extensionActivities: activities(),
      inquiryPrompts: [t("What exact audio detail supports this choice?", "Detail audio apa yang secara tepat mendukung pilihan ini?"), t("Does the option add an assumption the speakers did not establish?", "Apakah pilihan ini menambahkan asumsi yang tidak disampaikan para pembicara?")],
      languageNotes: [t("In a passive clause, the grammatical subject is affected by the action; the agent may follow in a by-phrase or remain unstated.", "Dalam klausa pasif, subjek tata bahasa terdampak oleh tindakan; pelaku dapat muncul dalam frasa dengan by atau tidak disebutkan."), t("With multiple nouns, mark the relation rather than the order: who acted, what changed, and who or what was affected.", "Jika ada beberapa kata benda, tandai hubungannya, bukan urutannya: siapa bertindak, apa yang berubah, dan siapa atau apa yang terdampak."), t("A next-step inference should follow an explicit goal or practical consequence, not a stereotype about a setting.", "Inferensi langkah berikutnya harus mengikuti tujuan yang disebut atau konsekuensi praktis, bukan stereotip tentang suatu tempat.")],
    },
  },
  {
    id: "negative-meaning", title: t("Negatives and near-negatives", "Makna negatif dan hampir negatif"), skill: "negatives",
    preparation: {
      questionTask: t("Determine what happened, did not happen, or nearly happened.", "Tentukan hal yang terjadi, tidak terjadi, atau hampir terjadi."),
      listeningTarget: t("Hear the whole negative construction before deciding its scope, strength, and effect on a comparison.", "Dengarkan seluruh konstruksi negatif sebelum menentukan cakupan, kekuatan, dan pengaruhnya pada perbandingan."),
      procedure: [
        t("Locate the negative word, prefix, or limiting expression and identify exactly which action or description it affects.", "Temukan kata negatif, prefiks, atau ungkapan pembatas dan kenali tindakan atau keterangan yang dipengaruhinya."),
        t("Restate the proposition positively or negatively in plain words without dropping its scope.", "Nyatakan ulang proposisi secara positif atau negatif dengan kata sederhana tanpa menghilangkan cakupannya."),
        t("For a double-negative construction, inspect the grammar and both negative elements; their combined meaning is not always the same pattern.", "Untuk konstruksi negatif ganda, periksa tata bahasa dan kedua unsur negatif; makna gabungannya tidak selalu mengikuti pola yang sama."),
        t("Keep degree words exact: hardly/barely can mean almost none, while rarely/seldom concerns frequency, not amount.", "Pertahankan makna kata tingkat: hardly/barely dapat berarti hampir tidak ada, sedangkan rarely/seldom menyatakan frekuensi, bukan jumlah."),
        t("Read a negative comparative as a unit; it can express an extreme or superlative meaning.", "Baca perbandingan negatif sebagai satu kesatuan; maknanya dapat menyatakan tingkat paling tinggi atau sangat kuat."),
      ],
      distractorPatterns: [
        t("Polarity reversal: an option drops or moves the negative so the event changes direction.", "Pembalikan polaritas: opsi menghilangkan atau memindahkan unsur negatif sehingga arah peristiwa berubah."),
        t("Scope error: the negative modifies a different verb, person, time, or comparison in the option.", "Kesalahan cakupan: unsur negatif menerangkan kata kerja, orang, waktu, atau perbandingan yang berbeda dalam opsi."),
        t("Degree error: almost none becomes none, or almost never becomes never.", "Kesalahan tingkat: hampir tidak ada berubah menjadi tidak ada, atau hampir tidak pernah menjadi tidak pernah."),
        t("Double-negative error: an option treats every pair of negatives as a simple positive, ignoring the construction.", "Kesalahan negatif ganda: opsi menganggap setiap pasangan negatif sebagai positif sederhana dan mengabaikan konstruksinya."),
        t("Comparative error: a strong or top-rank meaning is weakened or reversed.", "Kesalahan perbandingan: makna yang sangat kuat atau paling tinggi dilemahkan atau dibalik."),
      ],
      longmanReference: t("Adapted from Longman Part A, Skills 7–10. The section treats ordinary negatives, combinations of negative forms, near-negative words, and negatives with comparatives as distinct patterns. Their force differs: a prefix, a frequency word, and a comparative each change a different part of meaning, so parse the whole construction before paraphrasing it.", "Diadaptasi dari Longman Bagian A, Keterampilan 7–10. Bagian ini membedakan bentuk negatif biasa, gabungan unsur negatif, kata yang hampir negatif, dan negatif dengan perbandingan. Kekuatan maknanya berbeda: prefiks, kata frekuensi, dan perbandingan mengubah bagian makna yang berbeda, jadi uraikan konstruksi secara utuh sebelum memparafrasakannya."),
      extensionActivities: activities(),
      inquiryPrompts: [t("Which exact action or description is negated?", "Tindakan atau keterangan mana tepatnya yang dinegasikan?"), t("Did the event happen, fail to happen, or come close to happening?", "Apakah peristiwa itu terjadi, tidak terjadi, atau hampir terjadi?")],
      languageNotes: [t("Regular negatives include not/n’t; negative meaning can also come from words such as nobody, none, nothing, never, or prefixes such as un-, in-, and dis-.", "Negatif biasa mencakup not/n’t; makna negatif juga dapat berasal dari nobody, none, nothing, never, atau prefiks seperti un-, in-, dan dis-."), t("Hardly and barely limit amount or degree; rarely and seldom limit frequency. They are close to zero, not automatically equal to zero.", "Hardly dan barely membatasi jumlah atau tingkat; rarely dan seldom membatasi frekuensi. Maknanya mendekati nol, bukan otomatis sama dengan nol."), t("A construction such as not impossible leaves possibility open; a negative agreement form such as neither can instead preserve a negative stance.", "Konstruksi seperti not impossible tetap membuka kemungkinan; bentuk persetujuan negatif seperti neither justru dapat mempertahankan sikap negatif."), t("A negative plus a comparative can create a very strong meaning; interpret the pair together rather than translating word by word.", "Negatif yang dipadukan dengan perbandingan dapat membentuk makna yang sangat kuat; tafsirkan keduanya bersama-sama, bukan kata demi kata.")],
    },
  },
  {
    id: "speaker-intentions", title: t("Suggestions, responses and intentions", "Saran, tanggapan, dan maksud pembicara"), skill: "functional-expressions",
    preparation: {
      questionTask: t("Recognize what a speaker is doing through a reply, not only its grammatical form.", "Kenali fungsi tanggapan pembicara, bukan hanya bentuk tata bahasanya."),
      listeningTarget: t("Identify the response's social function and degree of commitment: agreement, uncertainty, suggestion, or surprise.", "Kenali fungsi sosial dan tingkat komitmen dalam tanggapan: persetujuan, ketidakpastian, saran, atau keterkejutan."),
      procedure: [
        t("Identify what the second speaker is responding to: a claim, problem, invitation, or expectation.", "Kenali hal yang ditanggapi pembicara kedua: pendapat, masalah, ajakan, atau dugaan."),
        t("For agreement, keep the original proposition's polarity: agreement can affirm a positive or a negative view.", "Untuk persetujuan, pertahankan polaritas proposisi awal: persetujuan dapat menguatkan pandangan positif maupun negatif."),
        t("For uncertainty, keep the speaker's confidence limited; a tentative view is not a firm fact or promise.", "Untuk ketidakpastian, pertahankan keyakinan pembicara yang terbatas; pandangan tentatif bukan fakta atau janji pasti."),
        t("For a suggestion, identify the proposed action and the problem it addresses; do not treat the proposal as already accepted.", "Untuk saran, kenali tindakan yang diusulkan dan masalah yang dituju; jangan menganggap usulan itu sudah diterima."),
        t("For emphatic surprise, ask what the speaker seems to have expected before this new information.", "Untuk keterkejutan yang ditegaskan, tanyakan apa yang tampaknya diperkirakan pembicara sebelum menerima informasi baru."),
      ],
      distractorPatterns: [
        t("Polarity trap: a response may agree with a negative statement, not contradict it.", "Pengecoh polaritas: tanggapan dapat menyetujui pernyataan negatif, bukan membantahnya."),
        t("Certainty trap: an option turns a hedge or limited-knowledge phrase into certainty.", "Pengecoh kepastian: opsi mengubah ungkapan tentatif atau pengetahuan terbatas menjadi kepastian."),
        t("Commitment trap: an option treats a suggestion, offer, or possibility as an accepted plan.", "Pengecoh komitmen: opsi menganggap saran, tawaran, atau kemungkinan sebagai rencana yang sudah disetujui."),
        t("Literal-form trap: a question-shaped suggestion is read as a request for information.", "Pengecoh bentuk harfiah: saran yang berbentuk pertanyaan dibaca sebagai permintaan informasi."),
        t("Expectation trap: surprise is reduced to the new fact, while the implied earlier expectation is missed.", "Pengecoh dugaan: keterkejutan direduksi menjadi fakta baru, sedangkan dugaan sebelumnya terlewat."),
      ],
      longmanReference: t("Adapted from Longman Part A, Skills 11–13. These skills treat agreement, uncertainty/suggestion, and emphatic surprise as functions of a reply. Listen for the stance the reply takes toward the previous turn; emphasis can also signal that new information conflicts with what the speaker expected.", "Diadaptasi dari Longman Bagian A, Keterampilan 11–13. Keterampilan ini membahas persetujuan, ketidakpastian/saran, dan keterkejutan yang ditegaskan sebagai fungsi tanggapan. Dengarkan sikap tanggapan terhadap giliran sebelumnya; penekanan juga dapat menandakan bahwa informasi baru bertentangan dengan dugaan pembicara."),
      extensionActivities: activities(),
      inquiryPrompts: [t("What problem, request, or offer is the reply responding to?", "Masalah, permintaan, atau tawaran apa yang ditanggapi?"), t("What is the reply doing in this exchange?", "Apa fungsi tanggapan itu dalam percakapan ini?")],
      languageNotes: [t("Agreement markers such as so do I or neither do I take their polarity from the statement being answered.", "Penanda persetujuan seperti so do I atau neither do I mengikuti polaritas pernyataan yang ditanggapi."), t("Tag questions and phrases like as far as I know can soften certainty; preserve that qualification.", "Pertanyaan ekor dan frasa seperti as far as I know dapat membatasi kepastian; pertahankan batasan tersebut."), t("Why not and let's can introduce proposals. A proposal does not establish that anyone accepted or carried it out.", "Why not dan let's dapat memperkenalkan usulan. Usulan tidak membuktikan bahwa seseorang telah menyetujui atau melaksanakannya."), t("Stress on an auxiliary or modal can mark an unexpected outcome; connect it to the speaker's earlier assumption.", "Penekanan pada kata bantu atau modal dapat menandai hasil yang tidak terduga; hubungkan dengan dugaan awal pembicara.")],
    },
  },
  {
    id: "expressions-in-context", title: t("Idioms and multiword expressions", "Idiom dan ungkapan beberapa kata"), skill: "idioms",
    preparation: {
      questionTask: t("Interpret a multiword expression as a unit and test it against the situation.", "Tafsirkan ungkapan beberapa kata sebagai satu kesatuan dan uji kecocokannya dengan situasi."),
      listeningTarget: t("Treat the verb plus its particle, or the whole idiom, as one meaning unit and test that meaning against the situation.", "Perlakukan kata kerja beserta partikelnya, atau seluruh idiom, sebagai satu unit makna dan uji maknanya terhadap situasi."),
      procedure: [
        t("Listen for the complete verb phrase, including a particle such as up, out, off, or on; the particle can alter the verb's sense.", "Dengarkan seluruh frasa kerja, termasuk partikel seperti up, out, off, atau on; partikel dapat mengubah makna kata kerja."),
        t("Replace the complete phrase with a plain-language verb before evaluating A–D.", "Ganti seluruh frasa dengan kata kerja sederhana sebelum menilai opsi A–D."),
        t("For an idiom, infer the conventional figurative meaning from the situation rather than combining the literal word meanings.", "Untuk idiom, simpulkan makna kiasan yang lazim dari situasi, bukan dengan menggabungkan makna harfiah setiap kata."),
        t("Check whether the option preserves the phrase's action, direction, and tone in this context.", "Periksa apakah opsi mempertahankan tindakan, arah, dan nada ungkapan dalam konteks ini."),
        t("Use surrounding clues to constrain an unfamiliar expression; do not invent a definition from one word alone.", "Gunakan petunjuk sekitar untuk membatasi makna ungkapan yang belum dikenal; jangan mengarang definisi dari satu kata saja."),
      ],
      distractorPatterns: [
        t("Particle omission: the option follows the base verb but ignores the meaning added by its particle.", "Partikel diabaikan: opsi mengikuti kata kerja dasar tetapi mengabaikan makna yang ditambahkan partikelnya."),
        t("Literal idiom: the option describes the concrete image instead of the conventional meaning.", "Idiom harfiah: opsi menggambarkan citra konkret, bukan makna konvensionalnya."),
        t("Keyword lure: a familiar noun from the conversation hides an incorrect action or intention.", "Jebakan kata kunci: kata benda yang akrab dari percakapan menyamarkan tindakan atau niat yang keliru."),
        t("Context mismatch: a dictionary-like meaning may be possible elsewhere but not in this exchange.", "Ketidakcocokan konteks: makna seperti di kamus mungkin berlaku di tempat lain tetapi tidak dalam percakapan ini."),
        t("Over-interpretation: an idiom suggests a situation, but the option adds details that the speakers never establish.", "Tafsir berlebihan: idiom mengisyaratkan suatu situasi, tetapi opsi menambahkan detail yang tidak ditetapkan pembicara."),
      ],
      longmanReference: t("Adapted from Longman Part A, Skills 16–17. A particle can change the meaning of a verb, so the phrase must be interpreted as a unit. An idiom may describe one image while conventionally referring to another situation; the surrounding exchange helps distinguish the intended sense from a literal reading.", "Diadaptasi dari Longman Bagian A, Keterampilan 16–17. Partikel dapat mengubah makna kata kerja, jadi frasa harus ditafsirkan sebagai satu kesatuan. Idiom dapat menggambarkan satu citra tetapi secara konvensional merujuk pada situasi lain; percakapan di sekitarnya membantu membedakan makna yang dimaksud dari tafsiran harfiah."),
      extensionActivities: activities(),
      inquiryPrompts: [t("Does the literal meaning fit the situation?", "Apakah makna harfiahnya sesuai dengan situasi?"), t("Which plain-language phrase preserves the speaker's meaning?", "Frasa sederhana mana yang mempertahankan makna pembicara?")],
      languageNotes: [t("A multi-part verb is not always the sum of the base verb and particle; check the combined sense in context.", "Kata kerja multi-bagian tidak selalu sama dengan jumlah makna kata kerja dasar dan partikelnya; periksa makna gabungannya dalam konteks."), t("The same particle may not translate the same way in every verb, so learn the expression as a unit.", "Partikel yang sama belum tentu diterjemahkan dengan cara yang sama pada setiap kata kerja, jadi pelajari ungkapan sebagai satu unit."), t("An idiom's literal picture can be memorable but misleading; select the meaning that fits the exchange.", "Gambaran harfiah idiom dapat mudah diingat tetapi menyesatkan; pilih makna yang sesuai dengan percakapan.")],
    },
  },
];
