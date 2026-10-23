import type { EnrichmentActivity, Preparation, Skill, Text } from "../../domain/workshop/contracts";

const t = (en: string, id: string): Text => ({ en, id });
const activity = (id: EnrichmentActivity["id"], title: string, titleId: string, instruction: string, instructionId: string): EnrichmentActivity => ({
  id, title: t(title, titleId), instruction: t(instruction, instructionId),
});

const replayActivities: EnrichmentActivity[] = [
  activity("cold-replay", "Listen before looking at the choices", "Dengarkan sebelum melihat pilihan", "Replay a completed recording with the choices covered. Note its main point in a few words. When playback ends, open A–D and choose the option best supported by what you heard.", "Putar ulang rekaman yang sudah selesai dengan pilihan tertutup. Catat gagasan utamanya dalam beberapa kata. Setelah audio selesai, buka pilihan A–D dan pilih yang paling didukung oleh audio."),
  activity("focus-replay", "Listen for one specific cue", "Dengarkan satu petunjuk tertentu", "Use the skill focus on this card. Replay the recording, then compare the A–D options for one change in actor, time, meaning, or speaker purpose.", "Gunakan fokus keterampilan pada kartu ini. Putar ulang rekaman, lalu bandingkan pilihan A–D untuk menemukan perubahan pelaku, waktu, makna, atau tujuan pembicara."),
  activity("delayed-replay", "Compare a later response", "Bandingkan jawaban setelah jeda", "Pause before reopening the recording. Listen once more, make a fresh A–D choice, then compare it with your first response and identify the audio cue that did—or did not—change your view.", "Berhenti sejenak sebelum membuka kembali rekaman. Dengarkan sekali lagi, pilih A–D, lalu bandingkan dengan jawaban pertamamu dan tentukan petunjuk audio yang mengubah—atau tidak mengubah—pemahamanmu."),
];

const activities = (): EnrichmentActivity[] => structuredClone(replayActivities);

export const workshopGroups: Array<{ id: string; title: Text; skill: Skill; preparation: Preparation }> = [
  {
    id: "meaning-in-context", title: t("Restatement and sequence", "Pernyataan ulang dan urutan"), skill: "restatement",
    preparation: {
      questionTask: t("Track the meaning of the final line and how it relates to the exchange.", "Ikuti makna bagian akhir dan hubungannya dengan percakapan."),
      listeningTarget: t("First identify the main point in the response. Then check who acts, what changes, and when.", "Kenali gagasan utama dalam tanggapan. Lalu periksa siapa yang bertindak, apa yang berubah, dan kapan."),
      procedure: [
        t("Listen through once before comparing individual words with the choices.", "Dengarkan sampai selesai sebelum membandingkan kata satu per satu dengan pilihan."),
        t("Reduce the response to its actor, action, object, and time or sequence.", "Ringkas tanggapan menjadi pelaku, tindakan, sasaran, serta waktu atau urutannya."),
        t("Choose a paraphrase that preserves those relationships, even when its vocabulary is different.", "Pilih parafrasa yang mempertahankan hubungan itu meski kosakatanya berbeda."),
      ],
      distractorPatterns: [
        t("A repeated word can make an option familiar while its action or relationship is wrong.", "Kata yang diulang dapat membuat pilihan terasa akrab meski tindakan atau hubungannya keliru."),
        t("A similar-sounding word may be mistaken for the word actually heard.", "Kata yang bunyinya mirip dapat tertukar dengan kata yang benar-benar terdengar."),
        t("An option may preserve the topic but reverse who acts or when it happens.", "Pilihan dapat mempertahankan topik tetapi membalik pelaku atau waktu kejadian."),
      ],
      longmanReference: t("Longman Part A, Skills 1–3: attend to the last line, compare equivalent meaning, and watch for similar sounds.", "Longman Bagian A, Keterampilan 1–3: perhatikan bagian akhir, bandingkan kesetaraan makna, dan waspadai bunyi yang mirip."),
      extensionActivities: activities(),
      inquiryPrompts: [t("Which person performs the action in the option I chose?", "Siapa yang melakukan tindakan dalam pilihan saya?"), t("Did I preserve the time and sequence, or only repeat a familiar word?", "Apakah saya mempertahankan waktu dan urutan, atau hanya mengulang kata yang akrab?")],
      languageNotes: [t("Until, before, after, and once establish relationships between events. Keep their direction when you paraphrase.", "Until, before, after, dan once membentuk hubungan antarperistiwa. Pertahankan arahnya saat memparafrasakan.")],
    },
  },
  {
    id: "supported-inference", title: t("Supported inference", "Inferensi yang didukung percakapan"), skill: "inference",
    preparation: {
      questionTask: t("Draw only the conclusion supported by the exchange and the requested detail.", "Tarik hanya simpulan yang didukung percakapan dan detail yang diminta."),
      listeningTarget: t("Connect a spoken clue to the people, situation, place, or action it supports.", "Hubungkan petunjuk lisan dengan orang, situasi, tempat, atau tindakan yang didukungnya."),
      procedure: [
        t("Identify the kind of information the audio calls for: a person, action, place, situation, or next step.", "Kenali jenis informasi yang dibutuhkan dari audio: orang, tindakan, tempat, situasi, atau langkah berikutnya."),
        t("Name the spoken detail that supports your choice.", "Tentukan detail lisan yang mendukung pilihanmu."),
        t("Reject an option that adds a cause, intention, or certainty not established in the conversation.", "Singkirkan pilihan yang menambahkan sebab, niat, atau kepastian yang tidak ditetapkan dalam percakapan."),
      ],
      distractorPatterns: [
        t("A true detail can still answer a different point than the one being tested.", "Detail yang benar tetap dapat menjawab hal yang berbeda dari fokus yang diuji."),
        t("An option may turn a possibility into a certainty or extend one case into a general rule.", "Pilihan dapat mengubah kemungkinan menjadi kepastian atau memperluas satu kasus menjadi aturan umum."),
        t("When several people or things are mentioned, track which noun each pronoun or action refers to.", "Saat beberapa orang atau benda disebut, ikuti rujukan setiap kata ganti atau tindakan."),
      ],
      longmanReference: t("Longman Part A, Skills 4–6: infer who, what, or where; identify an agent in a passive statement; track multiple nouns.", "Longman Bagian A, Keterampilan 4–6: simpulkan siapa, apa, atau di mana; kenali pelaku dalam kalimat pasif; lacak beberapa kata benda."),
      extensionActivities: activities(),
      inquiryPrompts: [t("What exact audio detail supports this choice?", "Detail audio apa yang secara tepat mendukung pilihan ini?"), t("Does the option add an assumption the speakers did not establish?", "Apakah pilihan ini menambahkan asumsi yang tidak disampaikan para pembicara?")],
      languageNotes: [t("A passive statement may leave the agent unstated. Use the surrounding exchange to identify who performed the action.", "Kalimat pasif dapat tidak menyebutkan pelakunya. Gunakan percakapan di sekitarnya untuk mengenali siapa yang melakukan tindakan.")],
    },
  },
  {
    id: "negative-meaning", title: t("Negatives and near-negatives", "Makna negatif dan hampir negatif"), skill: "negatives",
    preparation: {
      questionTask: t("Determine what happened, did not happen, or nearly happened.", "Tentukan hal yang terjadi, tidak terjadi, atau hampir terjadi."),
      listeningTarget: t("Locate the negative expression and attach it to the correct action or description.", "Temukan ungkapan negatif dan hubungkan dengan tindakan atau keterangan yang tepat."),
      procedure: [
        t("Identify each negative or limiting expression and the verb or comparison it modifies.", "Kenali setiap ungkapan negatif atau pembatas serta kata kerja atau perbandingan yang diterangkannya."),
        t("Restate the event in plain words, keeping any qualification such as almost, hardly, or not until.", "Nyatakan ulang peristiwanya dengan kata sederhana dan pertahankan batasan seperti almost, hardly, atau not until."),
        t("Check whether a double or comparative negative changes the direction of meaning.", "Periksa apakah negatif ganda atau perbandingan negatif mengubah arah makna."),
      ],
      distractorPatterns: [
        t("A choice may omit a negative and reverse what happened.", "Pilihan dapat menghilangkan penanda negatif dan membalik kejadian."),
        t("A near-negative can be mistaken for a complete failure or a complete success.", "Ungkapan yang hampir negatif dapat disalahartikan sebagai kegagalan total atau keberhasilan total."),
        t("A comparative negative may express a preference, not the absence of both alternatives.", "Perbandingan negatif dapat menyatakan pilihan, bukan ketiadaan kedua alternatif."),
      ],
      longmanReference: t("Longman Part A, Skills 7–10: negatives, double negatives, near-negative expressions, and negatives with comparisons.", "Longman Bagian A, Keterampilan 7–10: bentuk negatif, negatif ganda, ungkapan hampir negatif, dan negatif dalam perbandingan."),
      extensionActivities: activities(),
      inquiryPrompts: [t("Which exact action or description is negated?", "Tindakan atau keterangan mana tepatnya yang dinegasikan?"), t("Did the event happen, fail to happen, or come close to happening?", "Apakah peristiwa itu terjadi, tidak terjadi, atau hampir terjadi?")],
      languageNotes: [t("Almost and hardly do not mean the same thing. Track the phrase as a whole before deciding.", "Almost dan hardly tidak bermakna sama. Ikuti frasa secara utuh sebelum memutuskan.")],
    },
  },
  {
    id: "speaker-intentions", title: t("Suggestions, responses and intentions", "Saran, tanggapan, dan maksud pembicara"), skill: "functional-expressions",
    preparation: {
      questionTask: t("Recognize what a speaker is doing through a reply, not only its grammatical form.", "Kenali fungsi tanggapan pembicara, bukan hanya bentuk tata bahasanya."),
      listeningTarget: t("Relate the response to the problem, request, invitation, or suggestion immediately before it.", "Hubungkan tanggapan dengan masalah, permintaan, ajakan, atau saran yang mendahuluinya."),
      procedure: [
        t("Identify the situation the speaker is responding to.", "Kenali situasi yang ditanggapi pembicara."),
        t("Listen for whether the reply agrees, hesitates, suggests, offers, declines, or expresses surprise.", "Dengarkan apakah tanggapan menyetujui, ragu, menyarankan, menawarkan, menolak, atau menunjukkan keterkejutan."),
        t("Choose the function best supported by the tone and wording; do not add a commitment that was not made.", "Pilih fungsi yang paling didukung oleh nada dan kata-katanya; jangan menambahkan komitmen yang tidak disampaikan."),
      ],
      distractorPatterns: [
        t("A rhetorical question may function as a suggestion rather than a request for information.", "Pertanyaan retoris dapat berfungsi sebagai saran, bukan permintaan informasi."),
        t("Mentioning an activity is not the same as accepting it.", "Menyebut suatu kegiatan tidak sama dengan menyetujuinya."),
        t("Uncertainty can qualify a response; do not treat it as a firm promise.", "Keraguan dapat membatasi suatu tanggapan; jangan menganggapnya sebagai janji pasti."),
      ],
      longmanReference: t("Longman Part A, Skills 11–13: agreement, uncertainty and suggestions, and expressions of surprise.", "Longman Bagian A, Keterampilan 11–13: persetujuan, keraguan dan saran, serta ungkapan keterkejutan."),
      extensionActivities: activities(),
      inquiryPrompts: [t("What problem, request, or offer is the reply responding to?", "Masalah, permintaan, atau tawaran apa yang ditanggapi?"), t("What is the reply doing in this exchange?", "Apa fungsi tanggapan itu dalam percakapan ini?")],
      languageNotes: [t("A suggestion may be phrased as a question. Interpret the exchange, not just the sentence form.", "Saran dapat disampaikan dalam bentuk pertanyaan. Tafsirkan percakapannya, bukan hanya bentuk kalimatnya.")],
    },
  },
  {
    id: "expressions-in-context", title: t("Idioms and multiword expressions", "Idiom dan ungkapan beberapa kata"), skill: "idioms",
    preparation: {
      questionTask: t("Interpret a multiword expression as a unit and test it against the situation.", "Tafsirkan ungkapan beberapa kata sebagai satu kesatuan dan uji kecocokannya dengan situasi."),
      listeningTarget: t("Attend to the full verb phrase or idiom rather than translating each word separately.", "Perhatikan seluruh frasa kerja atau idiom, bukan menerjemahkan kata satu per satu."),
      procedure: [
        t("Identify the expression and what person, plan, or event it describes.", "Kenali ungkapan serta orang, rencana, atau peristiwa yang diterangkannya."),
        t("Replace it with a plain-language meaning that fits the surrounding exchange.", "Ganti ungkapan itu dengan makna sederhana yang sesuai dengan percakapan di sekitarnya."),
        t("Choose the option that fits both the expression and the situation; reject a literal reading that does not fit.", "Pilih opsi yang sesuai dengan ungkapan dan situasinya; singkirkan tafsiran harfiah yang tidak cocok."),
      ],
      distractorPatterns: [
        t("A choice may repeat a concrete word from the idiom while missing its contextual meaning.", "Pilihan dapat mengulang kata konkret dari idiom tetapi melewatkan makna kontekstualnya."),
        t("A familiar topic word can distract from the multiword verb that carries the meaning.", "Kata topik yang akrab dapat mengalihkan perhatian dari kata kerja majemuk yang membawa makna."),
        t("A literal translation may sound possible but fail to fit the speakers' situation.", "Terjemahan harfiah mungkin terdengar masuk akal tetapi tidak sesuai dengan situasi pembicara."),
      ],
      longmanReference: t("Longman Part A, Skills 16–17: interpret multi-part verbs and idiomatic expressions in context.", "Longman Bagian A, Keterampilan 16–17: tafsirkan kata kerja majemuk dan ungkapan idiomatis dalam konteks."),
      extensionActivities: activities(),
      inquiryPrompts: [t("Does the literal meaning fit the situation?", "Apakah makna harfiahnya sesuai dengan situasi?"), t("Which plain-language phrase preserves the speaker's meaning?", "Frasa sederhana mana yang mempertahankan makna pembicara?")],
      languageNotes: [t("Particles can change a verb's meaning. Listen for the whole expression before choosing.", "Partikel dapat mengubah makna kata kerja. Dengarkan ungkapan secara utuh sebelum memilih.")],
    },
  },
];
