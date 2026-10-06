import type { BilingualText } from "@/domain/feedback";
import type { LadderItemView } from "@/domain/ladder/model";
export const pair = (en: string, id: string): BilingualText => ({ en, id });
export const ladderContent = {
  slug: "three-papers-one-thread",
  version: "three-papers-ladder.2026-10-06.v1",
  audioHash: "d728ede236948a4877dc38926114abdad19ff358dc35414f9be107ffbeed42c2",
  items: [
    {
      id: "library",
      title: pair("The situation", "Situasinya"),
      startMs: 8250,
      endMs: 26500,
      prompt: pair(
        "Why has the student spent so much time in the library?",
        "Kenapa mahasiswa itu sering berada di perpustakaan?",
      ),
      options: [
        pair(
          "He is preparing several papers.",
          "Dia sedang menyiapkan beberapa makalah.",
        ),
        pair(
          "He is helping a friend with research.",
          "Dia sedang membantu riset temannya.",
        ),
        pair(
          "He is looking for a quieter place to eat.",
          "Dia mencari tempat makan yang lebih tenang.",
        ),
      ],
      first: 0,
      repairKey: 2,
      repair: {
        prompt: pair(
          "Which account fits his explanation?",
          "Penjelasan mana yang sesuai dengan ceritanya?",
        ),
        options: [
          pair(
            "One shared paper is taking all his time.",
            "Satu makalah bersama menyita waktunya.",
          ),
          pair(
            "His friend has asked him to find some books.",
            "Temannya meminta dia mencari beberapa buku.",
          ),
          pair(
            "Several separate assignments are keeping him busy.",
            "Beberapa tugas terpisah membuatnya sibuk.",
          ),
        ],
        focus: pair(
          "Listen to his reply about what he is working on. What makes it a lot of work?",
          "Dengarkan jawabannya tentang tugas yang sedang dikerjakan. Apa yang membuatnya banyak pekerjaan?",
        ),
        hint: pair(
          "Follow the shift from the woman's question to his correction.",
          "Perhatikan bagaimana dia mengoreksi pertanyaan pembicara perempuan.",
        ),
        supportedMeaning: pair(
          "He is working on three separate papers in different subjects. That is why he has spent so much time in the library.",
          "Dia mengerjakan tiga makalah terpisah untuk mata kuliah berbeda. Itulah sebabnya dia sering berada di perpustakaan.",
        ),
      },
      transcript:
        "The woman asks if he is working on a paper. The man says he wishes it were one paper: he is working on three, in anthropology, English literature and history.",
      reasons: [
        "Several papers is explicitly stated.",
        "Helping a friend is not his explanation.",
        "Eating is a playful opening question, not his library purpose.",
      ],
    },
    {
      id: "constraint",
      title: pair("The obstacle", "Hambatannya"),
      startMs: 26500,
      endMs: 45050,
      prompt: pair(
        "Why can't he submit one paper for all three classes?",
        "Kenapa dia tidak bisa menyerahkan satu makalah untuk tiga kelas itu?",
      ),
      options: [
        pair(
          "The classes cover unrelated periods.",
          "Kelas-kelasnya membahas periode yang berbeda.",
        ),
        pair(
          "The professors will not accept that plan.",
          "Para dosen tidak mengizinkan rencana itu.",
        ),
        pair(
          "He has not found a topic for the paper.",
          "Dia belum menemukan topik makalahnya.",
        ),
      ],
      first: 1,
      repairKey: 0,
      repair: {
        prompt: pair(
          "What is the constraint on his work?",
          "Apa batasan dalam tugasnya?",
        ),
        options: [
          pair(
            "He still has to produce separate papers.",
            "Dia tetap harus membuat makalah terpisah.",
          ),
          pair(
            "He needs to study a different period in each class.",
            "Dia harus membahas periode berbeda di tiap kelas.",
          ),
          pair(
            "He must wait until the professors choose his topic.",
            "Dia harus menunggu dosen memilih topiknya.",
          ),
        ],
        focus: pair(
          "Listen to why he rejects the single-paper idea. Whose decision matters?",
          "Dengarkan alasan dia menolak ide satu makalah. Keputusan siapa yang menentukan?",
        ),
        hint: pair(
          "Check what he says after 'the professors'.",
          "Cek apa yang dia katakan setelah menyebut para dosen.",
        ),
        supportedMeaning: pair(
          "The classes share a broad period, but the professors will not allow one submission for all three—even a much longer paper.",
          "Ketiga kelas membahas periode yang sama, tetapi dosen tidak mengizinkan satu makalah untuk semuanya—meskipun makalahnya jauh lebih panjang.",
        ),
      },
      transcript:
        "He studies the nineteenth-century British Empire in all three classes, but the professors will not let him write one paper for all three, even if he makes it three times as long. The woman suggests three aspects of one topic.",
      reasons: [
        "The period is shared, not unrelated.",
        "The professors' refusal is the stated constraint.",
        "Not having a topic is not the reason given.",
      ],
    },
    {
      id: "approach",
      title: pair("The suggestion", "Sarannya"),
      startMs: 45050,
      endMs: 71300,
      prompt: pair(
        "How does the woman suggest organizing the work?",
        "Bagaimana pembicara perempuan menyarankan penyusunan tugasnya?",
      ),
      options: [
        pair(
          "Divide one paper into three equal sections.",
          "Membagi satu makalah menjadi tiga bagian sama panjang.",
        ),
        pair(
          "Use a different historical period for each paper.",
          "Menggunakan periode sejarah berbeda untuk setiap makalah.",
        ),
        pair(
          "Use one theme with a different angle in each subject.",
          "Menggunakan satu tema dengan sudut pandang berbeda di tiap mata kuliah.",
        ),
      ],
      first: 2,
      repairKey: 1,
      repair: {
        prompt: pair(
          "What stays shared, and what changes?",
          "Apa yang tetap sama, dan apa yang berbeda?",
        ),
        options: [
          pair(
            "The argument stays identical; only the paper length changes.",
            "Argumennya tetap sama; hanya panjang makalah yang berubah.",
          ),
          pair(
            "The theme stays shared; each subject has its own focus.",
            "Temanya tetap sama; tiap mata kuliah punya fokus sendiri.",
          ),
          pair(
            "The subject stays identical; each paper uses a different period.",
            "Mata kuliahnya tetap sama; tiap makalah memakai periode berbeda.",
          ),
        ],
        focus: pair(
          "Listen to the three examples. How are they connected without being identical?",
          "Dengarkan tiga contohnya. Bagaimana ketiganya terhubung tanpa menjadi sama persis?",
        ),
        hint: pair(
          "Compare what she says for anthropology, history and English.",
          "Bandingkan contoh untuk antropologi, sejarah, dan sastra Inggris.",
        ),
        supportedMeaning: pair(
          "Her plan keeps Romanticism as a shared theme, while the papers examine culture, foreign policy, and poems from different disciplinary angles.",
          "Rencananya memakai Romantisisme sebagai tema bersama, tetapi makalah membahas budaya, kebijakan luar negeri, dan puisi dari sudut tiap disiplin.",
        ),
      },
      transcript:
        "The woman proposes Romanticism: its cultural basis for anthropology, Romantic poets' influence on British foreign policy for history, and analysis of Romantic poems for English.",
      reasons: [
        "Three sections of one paper would not meet the constraint.",
        "She changes the disciplinary angle, not the period.",
        "One shared theme with distinct disciplinary focuses matches the examples.",
      ],
    },
    {
      id: "response",
      title: pair("What changes", "Apa yang berubah"),
      startMs: 71300,
      endMs: 97000,
      prompt: pair(
        "Why does the student find the suggestion useful?",
        "Kenapa mahasiswa itu merasa sarannya berguna?",
      ),
      options: [
        pair(
          "He can build on research he has already started.",
          "Dia bisa memakai riset yang sudah dimulai.",
        ),
        pair(
          "His friend offers to write the papers for him.",
          "Temannya menawarkan untuk menulis makalahnya.",
        ),
        pair(
          "He can replace the papers with a chemistry report.",
          "Dia bisa mengganti makalah dengan laporan kimia.",
        ),
      ],
      first: 0,
      repairKey: 2,
      repair: {
        prompt: pair(
          "How would the suggestion help his next step?",
          "Bagaimana saran itu membantu langkah berikutnya?",
        ),
        options: [
          pair(
            "It removes the need to do any more research.",
            "Dia tidak perlu melakukan riset lagi.",
          ),
          pair(
            "It lets someone else finish his assignments.",
            "Orang lain bisa menyelesaikan tugasnya.",
          ),
          pair(
            "It gives his existing research a useful direction.",
            "Riset yang sudah ada bisa dikembangkan dengan arah yang sesuai.",
          ),
        ],
        focus: pair(
          "Listen to his first reply after the examples. What work can he use?",
          "Dengarkan balasan pertamanya setelah contoh-contoh tadi. Pekerjaan apa yang bisa dia gunakan?",
        ),
        hint: pair(
          "Separate his reply about research from the later chemistry joke.",
          "Pisahkan balasannya tentang riset dari candaan kimia setelahnya.",
        ),
        supportedMeaning: pair(
          "He likes the suggestion because he has already started research for one paper and can use it. The chemistry exchange is a playful offer, not a change to his assignments.",
          "Dia menyukai sarannya karena sudah memulai riset untuk satu makalah dan bisa memakainya. Percakapan kimia setelahnya adalah candaan, bukan penggantian tugas.",
        ),
      },
      transcript:
        "He says that is not a bad idea and he has already started research for one paper, so he can use it. He asks how to repay her. She jokes about her chemistry lab; he says he has never taken chemistry. She ends by advising him to get some sleep.",
      reasons: [
        "He explicitly says his existing research can be used.",
        "She does not offer to write his papers.",
        "The chemistry lab is a separate playful exchange.",
      ],
    },
  ],
};
export const contentKeys = ladderContent.items.map((x) => ({
  first: x.first,
  repair: x.repairKey,
}));
export function publicItems(
  state: import("@/domain/ladder/model").LadderState,
): LadderItemView[] {
  return ladderContent.items.map((item, i) => {
    const task = state.choices[i];
    return {
      id: item.id,
      title: item.title,
      prompt: item.prompt,
      options: item.options,
      startMs: item.startMs,
      endMs: item.endMs,
      ...(task?.outcome === "repair" ||
      task?.outcome === "revised" ||
      task?.outcome === "supported"
        ? {
            repair: {
              prompt: item.repair.prompt,
              options: item.repair.options,
              focus: item.repair.focus,
              hint: item.repair.hint,
              ...(task.tries >= 1 || task.outcome === "supported"
                ? { supportedMeaning: item.repair.supportedMeaning }
                : {}),
            },
          }
        : {}),
    };
  });
}
