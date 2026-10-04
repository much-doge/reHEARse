import type { ListeningFeedback } from "./feedback";

export const sampleActivity = {
  id: "campus-radio",
  eyebrow: "Part B foundation · Campus conversation",
  title: "A change of plans",
  prompt:
    "What do you think is happening, and what does each speaker decide to do?",
  promptId:
    "Menurutmu apa yang sedang terjadi, dan apa yang diputuskan oleh masing-masing pembicara?",
  duration: "01:28",
  listens: 0,
  syntheticScript:
    "Hi Professor Lee. Do you have a minute? I wanted to ask about Friday's field trip. I signed up, but my chemistry lab was moved to the same afternoon. I see. The museum requires our final list tomorrow, but another student asked to switch into the morning group. If you can attend in the morning, I can exchange your places. That would work. Should I email the lab instructor too? Yes, confirm the lab schedule first, then send me a message before noon tomorrow.",
} as const;

export const sampleFeedback: ListeningFeedback = {
  contractVersion: "listening-feedback.v1",
  summary: {
    en: "You captured the scheduling problem and the possibility of changing groups. Your reconstruction does not yet show the order of the two actions the student must take.",
    id: "Kamu menangkap masalah jadwal dan kemungkinan pindah kelompok. Rekonstruksimu belum menunjukkan urutan dua tindakan yang harus dilakukan mahasiswa itu.",
  },
  observations: [
    {
      kind: "captured",
      message: {
        en: "The field trip conflicts with another academic commitment, and the morning group may solve it.",
        id: "Kunjungan lapangan berbenturan dengan kegiatan akademik lain, dan kelompok pagi mungkin menjadi solusinya.",
      },
    },
    {
      kind: "unclear",
      message: {
        en: "Your notes mention an email, but they do not show who must be contacted first.",
        id: "Catatanmu menyebut email, tetapi belum menunjukkan siapa yang harus dihubungi terlebih dahulu.",
      },
    },
    {
      kind: "insufficient_evidence",
      message: {
        en: "I cannot tell from this reconstruction whether you noticed the deadline.",
        id: "Dari rekonstruksi ini, belum dapat diketahui apakah kamu menangkap batas waktunya.",
      },
    },
  ],
  nextListeningTarget: {
    en: "Listen for the professor's final instruction: what should happen first, and by when?",
    id: "Dengarkan instruksi terakhir profesor: apa yang harus dilakukan lebih dulu, dan sebelum kapan?",
  },
};

