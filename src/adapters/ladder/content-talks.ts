import { validateLadderContent, type LadderContent } from "./content-schema";

export const housingTalk = validateLadderContent({
  "activityId": "room-for-next-year",
  "slug": "room-for-next-year",
  "title": {
    "en": "Room for next year",
    "id": "Tempat tinggal tahun depan"
  },
  "version": "room-for-next-year.2026-10-09.v1",
  "questionFormat": "original-four",
  "mechanicsVersion": "chapter-route.v1",
  "durationMs": 103886,
  "audioHash": "bfb40e006f6a97c9ae52580b340c126c496dd8c54dc274125c085005e79a4f85",
  "items": [
    {
      "id": "room-for-next-year-focus-1",
      "title": {
        "en": "The housing process",
        "id": "Proses tempat tinggal"
      },
      "startMs": 10000,
      "endMs": 103886,
      "prompt": {
        "en": "What aspect of student housing does the talk mainly focus on?",
        "id": "Aspek tempat tinggal mahasiswa apa yang terutama dibahas?"
      },
      "options": [
        {
          "en": "Possibilities for off-campus housing.",
          "id": "Pilihan tempat tinggal di luar kampus."
        },
        {
          "en": "The method used to assign housing.",
          "id": "Cara penentuan tempat tinggal."
        },
        {
          "en": "The impact of dormitory repairs on the housing situation.",
          "id": "Dampak perbaikan asrama pada situasi tempat tinggal."
        },
        {
          "en": "The cost of student housing.",
          "id": "Biaya tempat tinggal mahasiswa."
        }
      ],
      "first": 1,
      "repairKey": 0,
      "repair": {
        "prompt": {
          "en": "Which process connects the numbers and room choices?",
          "id": "Proses apa yang menghubungkan nomor dengan pemilihan kamar?"
        },
        "options": [
          {
            "en": "Students choose in an order set by a housing lottery.",
            "id": "Mahasiswa memilih sesuai urutan undian tempat tinggal."
          },
          {
            "en": "Students pay more to choose earlier.",
            "id": "Mahasiswa membayar lebih untuk memilih lebih awal."
          },
          {
            "en": "Students are assigned rooms by their subject.",
            "id": "Mahasiswa mendapat kamar berdasarkan jurusan."
          }
        ],
        "focus": {
          "en": "Follow how the speaker moves from drawing a number to choosing a room.",
          "id": "Ikuti penjelasan dari pengambilan nomor hingga pemilihan kamar."
        },
        "hint": {
          "en": "Separate the selection process from the later warning about available rooms.",
          "id": "Bedakan proses pemilihan dari peringatan tentang ketersediaan kamar."
        },
        "supportedMeaning": {
          "en": "Housing choices are ordered by a lottery, with priority groups based on time at the school.",
          "id": "Urutan pemilihan tempat tinggal ditentukan undian, dengan kelompok prioritas berdasarkan lama belajar di kampus."
        }
      },
      "transcript": "Housing choices are ordered by a lottery, with priority groups based on time at the school.",
      "reasons": [
        "This choice does not describe the relationship asked about in the recording.",
        "The recording supports this relationship.",
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording."
      ]
    },
    {
      "id": "room-for-next-year-focus-2",
      "title": {
        "en": "A change next year",
        "id": "Perubahan tahun depan"
      },
      "startMs": 10000,
      "endMs": 25100,
      "prompt": {
        "en": "Why do the students attending the meeting need the information that is given?",
        "id": "Mengapa mahasiswa yang menghadiri pertemuan ini membutuhkan informasi tersebut?"
      },
      "options": [
        {
          "en": "They are going to have part-time jobs in the housing office.",
          "id": "Mereka akan bekerja paruh waktu di kantor perumahan."
        },
        {
          "en": "They are training to become resident advisers in dormitories.",
          "id": "Mereka sedang berlatih menjadi pendamping penghuni asrama."
        },
        {
          "en": "They haven't lived off campus before.",
          "id": "Mereka belum pernah tinggal di luar kampus."
        },
        {
          "en": "They haven't selected housing before.",
          "id": "Mereka belum pernah memilih tempat tinggal."
        }
      ],
      "first": 3,
      "repairKey": 1,
      "repair": {
        "prompt": {
          "en": "What changes between the students’ first year and next year?",
          "id": "Apa yang berubah dari tahun pertama ke tahun depan?"
        },
        "options": [
          {
            "en": "The office will choose their major.",
            "id": "Kantor akan memilih jurusan mereka."
          },
          {
            "en": "They will choose housing that was previously assigned to them.",
            "id": "Mereka akan memilih tempat tinggal yang sebelumnya ditentukan kampus."
          },
          {
            "en": "They must all move away from campus.",
            "id": "Mereka semua harus pindah ke luar kampus."
          }
        ],
        "focus": {
          "en": "Compare what the school did when the students first arrived with what they will do next.",
          "id": "Bandingkan tindakan kampus saat mereka masuk dengan yang akan mereka lakukan berikutnya."
        },
        "hint": {
          "en": "Listen for the contrast introduced by “but next year.”",
          "id": "Dengarkan perbedaan setelah ungkapan “but next year”."
        },
        "supportedMeaning": {
          "en": "As first-year students, they were assigned a dorm and roommate; next year they choose them.",
          "id": "Saat tahun pertama, kampus menentukan asrama dan teman sekamar; tahun depan mereka memilih sendiri."
        }
      },
      "transcript": "As first-year students, they were assigned a dorm and roommate; next year they choose them.",
      "reasons": [
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording.",
        "The recording supports this relationship."
      ]
    },
    {
      "id": "room-for-next-year-focus-3",
      "title": {
        "en": "Priority groups",
        "id": "Kelompok prioritas"
      },
      "startMs": 33750,
      "endMs": 71200,
      "prompt": {
        "en": "What determines which group a student is placed in to choose housing for the next year?",
        "id": "Apa yang menentukan kelompok mahasiswa untuk memilih tempat tinggal tahun berikutnya?"
      },
      "options": [
        {
          "en": "The dormitory the student currently lives in.",
          "id": "Asrama yang ditempati saat ini."
        },
        {
          "en": "Whether the student is willing to live off campus.",
          "id": "Kesediaan untuk tinggal di luar kampus."
        },
        {
          "en": "The student's major.",
          "id": "Jurusan mahasiswa."
        },
        {
          "en": "How long the student has been at the school.",
          "id": "Lama mahasiswa belajar di kampus itu."
        }
      ],
      "first": 3,
      "repairKey": 2,
      "repair": {
        "prompt": {
          "en": "What decides the block of lottery numbers a student receives?",
          "id": "Apa yang menentukan kelompok nomor undian mahasiswa?"
        },
        "options": [
          {
            "en": "Which dorm the student prefers.",
            "id": "Asrama yang diinginkan mahasiswa."
          },
          {
            "en": "How many courses the student takes.",
            "id": "Jumlah mata kuliah mahasiswa."
          },
          {
            "en": "How many years the student has attended the school.",
            "id": "Berapa tahun mahasiswa telah belajar di kampus itu."
          }
        ],
        "focus": {
          "en": "Listen to the sequence of student years and number blocks.",
          "id": "Dengarkan urutan tahun mahasiswa dan kelompok nomor."
        },
        "hint": {
          "en": "Distinguish the priority group from the number drawn inside that group.",
          "id": "Bedakan kelompok prioritas dari nomor yang diambil dalam kelompok itu."
        },
        "supportedMeaning": {
          "en": "Students who have attended longer receive earlier blocks of lottery numbers.",
          "id": "Mahasiswa yang lebih lama belajar mendapat kelompok nomor undian lebih awal."
        }
      },
      "transcript": "Students who have attended longer receive earlier blocks of lottery numbers.",
      "reasons": [
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording.",
        "The recording supports this relationship."
      ]
    },
    {
      "id": "room-for-next-year-focus-4",
      "title": {
        "en": "Who needs the lottery?",
        "id": "Siapa yang perlu undian?"
      },
      "startMs": 77500,
      "endMs": 87500,
      "prompt": {
        "en": "Who is not expected to participate in the housing lottery?",
        "id": "Siapa yang tidak perlu mengikuti undian tempat tinggal?"
      },
      "options": [
        {
          "en": "Students who want to live off campus.",
          "id": "Mahasiswa yang ingin tinggal di luar kampus."
        },
        {
          "en": "Third-year students.",
          "id": "Mahasiswa tahun ketiga."
        },
        {
          "en": "Students living in North Campus dormitories.",
          "id": "Mahasiswa yang tinggal di asrama Kampus Utara."
        },
        {
          "en": "Students with older roommates.",
          "id": "Mahasiswa dengan teman sekamar yang lebih senior."
        }
      ],
      "first": 0,
      "repairKey": 0,
      "repair": {
        "prompt": {
          "en": "Which housing plan makes the lottery unnecessary?",
          "id": "Rencana tempat tinggal mana yang tidak memerlukan undian?"
        },
        "options": [
          {
            "en": "Arranging to live outside the campus.",
            "id": "Berencana tinggal di luar kampus."
          },
          {
            "en": "Choosing a roommate from an earlier year.",
            "id": "Memilih teman sekamar yang lebih senior."
          },
          {
            "en": "Requesting a different dorm on campus.",
            "id": "Meminta asrama lain di kampus."
          }
        ],
        "focus": {
          "en": "Listen for the condition that removes the need to enter.",
          "id": "Dengarkan syarat yang membuat peserta tidak perlu mengikuti undian."
        },
        "hint": {
          "en": "Ask whether the planned room is part of campus housing.",
          "id": "Perhatikan apakah kamar yang direncanakan termasuk tempat tinggal kampus."
        },
        "supportedMeaning": {
          "en": "Students who plan to live off campus do not need the campus housing lottery.",
          "id": "Mahasiswa yang berencana tinggal di luar kampus tidak perlu mengikuti undian tempat tinggal kampus."
        }
      },
      "transcript": "Students who plan to live off campus do not need the campus housing lottery.",
      "reasons": [
        "The recording supports this relationship.",
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording."
      ]
    },
    {
      "id": "room-for-next-year-focus-5",
      "title": {
        "en": "A limit on space",
        "id": "Keterbatasan tempat"
      },
      "startMs": 87400,
      "endMs": 103886,
      "prompt": {
        "en": "What special problem will affect housing next year?",
        "id": "Masalah khusus apa yang akan memengaruhi tempat tinggal tahun depan?"
      },
      "options": [
        {
          "en": "Older students will no longer be allowed to live off campus.",
          "id": "Mahasiswa senior tidak lagi diizinkan tinggal di luar kampus."
        },
        {
          "en": "There will be an unusually large number of first-year students.",
          "id": "Jumlah mahasiswa tahun pertama akan luar biasa banyak."
        },
        {
          "en": "Some dormitories will be temporarily closed.",
          "id": "Beberapa asrama akan ditutup sementara."
        },
        {
          "en": "The housing office will have fewer employees.",
          "id": "Pegawai kantor perumahan akan lebih sedikit."
        }
      ],
      "first": 2,
      "repairKey": 1,
      "repair": {
        "prompt": {
          "en": "Why will fewer campus rooms be available?",
          "id": "Mengapa kamar kampus yang tersedia akan lebih sedikit?"
        },
        "options": [
          {
            "en": "More offices will be built inside every dorm.",
            "id": "Lebih banyak kantor akan dibangun di setiap asrama."
          },
          {
            "en": "Some dorms will close while they are renovated.",
            "id": "Beberapa asrama akan ditutup saat direnovasi."
          },
          {
            "en": "All rooms will be reserved for first-year students.",
            "id": "Semua kamar akan dikhususkan untuk mahasiswa tahun pertama."
          }
        ],
        "focus": {
          "en": "Listen to the cause given after the warning about tight dorm space.",
          "id": "Dengarkan penyebab setelah peringatan tentang terbatasnya ruang asrama."
        },
        "hint": {
          "en": "Separate temporary building work from the lottery itself.",
          "id": "Bedakan pekerjaan bangunan sementara dari undiannya."
        },
        "supportedMeaning": {
          "en": "North Campus dorms will close for renovations, reducing available campus housing.",
          "id": "Asrama Kampus Utara akan ditutup untuk renovasi, sehingga tempat tinggal kampus berkurang."
        }
      },
      "transcript": "North Campus dorms will close for renovations, reducing available campus housing.",
      "reasons": [
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording.",
        "The recording supports this relationship.",
        "This choice does not describe the relationship asked about in the recording."
      ]
    }
  ]
} satisfies LadderContent);

export const temperatureTalk = validateLadderContent({
  "activityId": "body-temperature",
  "slug": "body-temperature",
  "title": {
    "en": "Body temperature",
    "id": "Suhu tubuh"
  },
  "version": "body-temperature.2026-10-09.v1",
  "questionFormat": "original-four",
  "mechanicsVersion": "chapter-route.v1",
  "durationMs": 87035,
  "audioHash": "c0a4ce2dccfd0e24f074fcca2e0c4a15aa02ba8217cb8542d3729f3ba8c78da3",
  "items": [
    {
      "id": "body-temperature-focus-1",
      "title": {
        "en": "Two temperature patterns",
        "id": "Dua pola suhu"
      },
      "startMs": 6300,
      "endMs": 87035,
      "prompt": {
        "en": "What is the main topic of the lecture?",
        "id": "Apa topik utama kuliah ini?"
      },
      "options": [
        {
          "en": "The effects of hot weather on animals.",
          "id": "Dampak cuaca panas pada hewan."
        },
        {
          "en": "How animals survive in extreme temperatures.",
          "id": "Cara hewan bertahan pada suhu ekstrem."
        },
        {
          "en": "How changes in location affected dinosaurs.",
          "id": "Dampak perubahan lokasi pada dinosaurus."
        },
        {
          "en": "The differences between warm- and cold-blooded animals.",
          "id": "Perbedaan hewan berdarah panas dan berdarah dingin."
        }
      ],
      "first": 3,
      "repairKey": 2,
      "repair": {
        "prompt": {
          "en": "Which contrast organizes the lecture?",
          "id": "Perbedaan apa yang menjadi dasar kuliah ini?"
        },
        "options": [
          {
            "en": "Large animals compared with small animals.",
            "id": "Hewan besar dibandingkan dengan hewan kecil."
          },
          {
            "en": "Modern animals compared only with extinct animals.",
            "id": "Hewan modern dibandingkan hanya dengan hewan punah."
          },
          {
            "en": "Animals that maintain body temperature compared with animals that follow environmental temperature.",
            "id": "Hewan yang mempertahankan suhu tubuh dibandingkan dengan hewan yang mengikuti suhu lingkungan."
          }
        ],
        "focus": {
          "en": "Track the two groups introduced before the dinosaur example.",
          "id": "Ikuti dua kelompok yang diperkenalkan sebelum contoh dinosaurus."
        },
        "hint": {
          "en": "The dinosaur finding illustrates a contrast already explained.",
          "id": "Temuan tentang dinosaurus menggambarkan perbedaan yang sudah dijelaskan."
        },
        "supportedMeaning": {
          "en": "The lecture compares warm- and cold-blooded temperature regulation, then applies the contrast to a dinosaur finding.",
          "id": "Kuliah membandingkan pengaturan suhu hewan berdarah panas dan dingin, lalu menerapkannya pada temuan dinosaurus."
        }
      },
      "transcript": "The lecture compares warm- and cold-blooded temperature regulation, then applies the contrast to a dinosaur finding.",
      "reasons": [
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording.",
        "The recording supports this relationship."
      ]
    },
    {
      "id": "body-temperature-focus-2",
      "title": {
        "en": "When the air cools",
        "id": "Saat udara mendingin"
      },
      "startMs": 40600,
      "endMs": 62300,
      "prompt": {
        "en": "What is likely to happen to cold-blooded animals when the weather is cold?",
        "id": "Apa yang mungkin terjadi pada hewan berdarah dingin ketika cuaca dingin?"
      },
      "options": [
        {
          "en": "Their ability to survive is diminished.",
          "id": "Kemampuan bertahan hidupnya berkurang."
        },
        {
          "en": "Their body temperature goes down.",
          "id": "Suhu tubuhnya turun."
        },
        {
          "en": "Their ability to digest food improves.",
          "id": "Kemampuan mencerna makanannya meningkat."
        },
        {
          "en": "Their level of energy and activity increases.",
          "id": "Energi dan aktivitasnya meningkat."
        }
      ],
      "first": 1,
      "repairKey": 0,
      "repair": {
        "prompt": {
          "en": "How does a cold environment affect the body temperature described?",
          "id": "Bagaimana lingkungan dingin memengaruhi suhu tubuh yang dijelaskan?"
        },
        "options": [
          {
            "en": "The animal’s body temperature falls with the environment.",
            "id": "Suhu tubuh hewan turun mengikuti lingkungan."
          },
          {
            "en": "The animal keeps the same temperature by producing more heat.",
            "id": "Hewan mempertahankan suhu dengan menghasilkan lebih banyak panas."
          },
          {
            "en": "The animal’s body temperature rises above the environment.",
            "id": "Suhu tubuh hewan naik melebihi lingkungan."
          }
        ],
        "focus": {
          "en": "Listen for what these animals cannot produce internally and the example that follows.",
          "id": "Dengarkan apa yang tidak cukup dihasilkan dalam tubuh hewan ini serta contoh setelahnya."
        },
        "hint": {
          "en": "Follow the direction of the temperature change.",
          "id": "Ikuti arah perubahan suhu."
        },
        "supportedMeaning": {
          "en": "Cold-blooded animals cannot generate enough internal heat to maintain a higher temperature, so their temperature falls in cool surroundings.",
          "id": "Hewan berdarah dingin tidak menghasilkan cukup panas internal untuk menjaga suhu lebih tinggi, sehingga suhu tubuh turun di lingkungan dingin."
        }
      },
      "transcript": "Cold-blooded animals cannot generate enough internal heat to maintain a higher temperature, so their temperature falls in cool surroundings.",
      "reasons": [
        "This choice does not describe the relationship asked about in the recording.",
        "The recording supports this relationship.",
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording."
      ]
    },
    {
      "id": "body-temperature-focus-3",
      "title": {
        "en": "The dinosaur finding",
        "id": "Temuan dinosaurus"
      },
      "startMs": 62000,
      "endMs": 87035,
      "prompt": {
        "en": "Why does the speaker discuss Tyrannosaurus rex?",
        "id": "Mengapa pembicara membahas Tyrannosaurus rex?"
      },
      "options": [
        {
          "en": "It was larger than other dinosaurs.",
          "id": "Ukurannya lebih besar daripada dinosaurus lain."
        },
        {
          "en": "It was older than originally thought.",
          "id": "Usianya lebih tua daripada perkiraan awal."
        },
        {
          "en": "The composition of its bones confirmed earlier findings.",
          "id": "Komposisi tulangnya mengonfirmasi temuan sebelumnya."
        },
        {
          "en": "It was probably warm-blooded.",
          "id": "Kemungkinan hewan itu berdarah panas."
        }
      ],
      "first": 3,
      "repairKey": 1,
      "repair": {
        "prompt": {
          "en": "What does the bone comparison suggest about the dinosaur?",
          "id": "Apa yang disiratkan perbandingan tulang tentang dinosaurus itu?"
        },
        "options": [
          {
            "en": "It lived only in very hot places.",
            "id": "Hewan itu hanya hidup di tempat sangat panas."
          },
          {
            "en": "It may have maintained a narrow internal temperature range.",
            "id": "Hewan itu mungkin mempertahankan rentang suhu internal yang sempit."
          },
          {
            "en": "It was smaller than other reptiles.",
            "id": "Hewan itu lebih kecil daripada reptil lain."
          }
        ],
        "focus": {
          "en": "Connect the bone composition to the temperature pattern named at the end.",
          "id": "Hubungkan komposisi tulang dengan pola suhu yang disebutkan pada akhir."
        },
        "hint": {
          "en": "Distinguish the former general belief about dinosaurs from this particular finding.",
          "id": "Bedakan pandangan umum sebelumnya tentang dinosaurus dari temuan khusus ini."
        },
        "supportedMeaning": {
          "en": "The bone composition resembles that of animals with a narrow internal temperature range, suggesting this dinosaur was warm-blooded.",
          "id": "Komposisi tulangnya mirip hewan dengan rentang suhu internal sempit, sehingga dinosaurus ini diduga berdarah panas."
        }
      },
      "transcript": "The bone composition resembles that of animals with a narrow internal temperature range, suggesting this dinosaur was warm-blooded.",
      "reasons": [
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording.",
        "The recording supports this relationship."
      ]
    }
  ]
} satisfies LadderContent);

export const workplaceTalk = validateLadderContent({
  "activityId": "work-beyond-the-office",
  "slug": "work-beyond-the-office",
  "title": {
    "en": "Work beyond the office",
    "id": "Bekerja di luar kantor"
  },
  "version": "work-beyond-the-office.2026-10-09.v1",
  "questionFormat": "original-four",
  "mechanicsVersion": "chapter-route.v1",
  "durationMs": 85569,
  "audioHash": "f4e7dbd9fcf50e8722a5f30f622f2251c652ae4147f252f9134ca041755730db",
  "items": [
    {
      "id": "work-beyond-the-office-focus-1",
      "title": {
        "en": "The coming talk",
        "id": "Pembicaraan berikutnya"
      },
      "startMs": 7200,
      "endMs": 75200,
      "prompt": {
        "en": "What will the topic of Allen Lambert's talk be?",
        "id": "Apa yang akan menjadi topik pembicaraan Allen Lambert?"
      },
      "options": [
        {
          "en": "Technological changes in the workplace.",
          "id": "Perubahan teknologi di tempat kerja."
        },
        {
          "en": "Improving interpersonal communication in the workplace.",
          "id": "Peningkatan komunikasi antarorang di tempat kerja."
        },
        {
          "en": "Developing technical writing skills.",
          "id": "Pengembangan keterampilan menulis teknis."
        },
        {
          "en": "Managing time at work.",
          "id": "Pengelolaan waktu kerja."
        }
      ],
      "first": 0,
      "repairKey": 2,
      "repair": {
        "prompt": {
          "en": "What connects the examples to the guest’s planned topic?",
          "id": "Apa yang menghubungkan contoh-contoh dengan topik tamu?"
        },
        "options": [
          {
            "en": "They describe the best routes to an office.",
            "id": "Contohnya menggambarkan rute terbaik ke kantor."
          },
          {
            "en": "They describe the history of handwritten letters.",
            "id": "Contohnya menggambarkan sejarah surat tulisan tangan."
          },
          {
            "en": "They show technology changing where and how people work.",
            "id": "Contohnya menunjukkan teknologi mengubah tempat dan cara orang bekerja."
          }
        ],
        "focus": {
          "en": "Listen for the guest’s research area and the closing description of the coming talk.",
          "id": "Dengarkan bidang riset tamu dan gambaran topik pada akhir pengantar."
        },
        "hint": {
          "en": "Ask what email and working away from the office have in common.",
          "id": "Pikirkan hubungan antara email dan bekerja jauh dari kantor."
        },
        "supportedMeaning": {
          "en": "The guest will discuss workplace changes associated with technology.",
          "id": "Tamu akan membahas perubahan tempat kerja yang berkaitan dengan teknologi."
        }
      },
      "transcript": "The guest will discuss workplace changes associated with technology.",
      "reasons": [
        "The recording supports this relationship.",
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording."
      ]
    },
    {
      "id": "work-beyond-the-office-focus-2",
      "title": {
        "en": "A show of hands",
        "id": "Angkat tangan"
      },
      "startMs": 25000,
      "endMs": 46600,
      "prompt": {
        "en": "Why does the speaker ask the people to raise their hands?",
        "id": "Mengapa pembicara meminta peserta mengangkat tangan?"
      },
      "options": [
        {
          "en": "To see how many people are familiar with the research discussed.",
          "id": "Untuk mengetahui siapa yang mengenal riset yang dibahas."
        },
        {
          "en": "To identify who communicates with their office electronically.",
          "id": "Untuk mengetahui siapa yang berkomunikasi dengan kantornya secara elektronik."
        },
        {
          "en": "To find out how many people know Ellen Lambert.",
          "id": "Untuk mengetahui siapa yang mengenal Ellen Lambert."
        },
        {
          "en": "To see who has individual questions.",
          "id": "Untuk mengetahui siapa yang memiliki pertanyaan pribadi."
        }
      ],
      "first": 1,
      "repairKey": 0,
      "repair": {
        "prompt": {
          "en": "What experience is the speaker asking the audience to identify?",
          "id": "Pengalaman apa yang diminta pembicara untuk ditunjukkan peserta?"
        },
        "options": [
          {
            "en": "Working away from the office while communicating by computer.",
            "id": "Bekerja jauh dari kantor sambil berkomunikasi lewat komputer."
          },
          {
            "en": "Having met the guest at an earlier reception.",
            "id": "Pernah bertemu tamu di resepsi sebelumnya."
          },
          {
            "en": "Planning to ask a private question after the talk.",
            "id": "Berencana mengajukan pertanyaan pribadi setelah pembicaraan."
          }
        ],
        "focus": {
          "en": "Listen to the request for raised hands and how the speaker describes those people afterward.",
          "id": "Dengarkan permintaan mengangkat tangan dan penjelasan tentang orang-orang itu setelahnya."
        },
        "hint": {
          "en": "The question about hands comes before the invitation for individual questions.",
          "id": "Pertanyaan tentang angkat tangan muncul sebelum undangan untuk pertanyaan pribadi."
        },
        "supportedMeaning": {
          "en": "The show of hands identifies people who already telecommute at least part of the time.",
          "id": "Angkat tangan menunjukkan peserta yang sudah melakukan telecommuting setidaknya sebagian waktu."
        }
      },
      "transcript": "The show of hands identifies people who already telecommute at least part of the time.",
      "reasons": [
        "This choice does not describe the relationship asked about in the recording.",
        "The recording supports this relationship.",
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording."
      ]
    },
    {
      "id": "work-beyond-the-office-focus-3",
      "title": {
        "en": "Working at a distance",
        "id": "Bekerja dari jauh"
      },
      "startMs": 32900,
      "endMs": 52300,
      "prompt": {
        "en": "What does telecommuting involve?",
        "id": "Apa yang dilakukan dalam telecommuting?"
      },
      "options": [
        {
          "en": "Listening to radio reports to avoid traffic jams.",
          "id": "Mendengarkan laporan radio untuk menghindari kemacetan."
        },
        {
          "en": "Using public transportation to get to work.",
          "id": "Menggunakan transportasi umum untuk bekerja."
        },
        {
          "en": "Communicating through computers.",
          "id": "Berkomunikasi melalui komputer."
        },
        {
          "en": "Traveling long distances to get to work.",
          "id": "Menempuh perjalanan jauh untuk bekerja."
        }
      ],
      "first": 2,
      "repairKey": 1,
      "repair": {
        "prompt": {
          "en": "What allows the home worker to stay connected to the office?",
          "id": "Apa yang memungkinkan pekerja di rumah tetap terhubung dengan kantor?"
        },
        "options": [
          {
            "en": "A faster journey on public transport.",
            "id": "Perjalanan lebih cepat dengan transportasi umum."
          },
          {
            "en": "Communication through a computer.",
            "id": "Komunikasi melalui komputer."
          },
          {
            "en": "A daily radio traffic report.",
            "id": "Laporan lalu lintas radio harian."
          }
        ],
        "focus": {
          "en": "Listen to the explanation immediately after the speaker counts the raised hands.",
          "id": "Dengarkan penjelasan tepat setelah pembicara menghitung tangan yang terangkat."
        },
        "hint": {
          "en": "Separate communication from commuting as a physical journey.",
          "id": "Bedakan komunikasi dari perjalanan fisik ke kantor."
        },
        "supportedMeaning": {
          "en": "Telecommuting means working away from the office and communicating with it through a computer.",
          "id": "Telecommuting berarti bekerja jauh dari kantor dan berkomunikasi dengannya melalui komputer."
        }
      },
      "transcript": "Telecommuting means working away from the office and communicating with it through a computer.",
      "reasons": [
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording.",
        "The recording supports this relationship.",
        "This choice does not describe the relationship asked about in the recording."
      ]
    },
    {
      "id": "work-beyond-the-office-focus-4",
      "title": {
        "en": "Choosing when to reply",
        "id": "Memilih waktu membalas"
      },
      "startMs": 46500,
      "endMs": 69300,
      "prompt": {
        "en": "What is one effect of electronic mail?",
        "id": "Apa salah satu dampak surat elektronik?"
      },
      "options": [
        {
          "en": "Letter-writing skills are valued less.",
          "id": "Keterampilan menulis surat menjadi kurang dihargai."
        },
        {
          "en": "More secretarial staff is required.",
          "id": "Dibutuhkan lebih banyak staf sekretariat."
        },
        {
          "en": "The location of a person's work gains importance.",
          "id": "Lokasi kerja seseorang menjadi lebih penting."
        },
        {
          "en": "People have more flexibility in managing their time.",
          "id": "Orang lebih leluasa mengatur waktu."
        }
      ],
      "first": 3,
      "repairKey": 2,
      "repair": {
        "prompt": {
          "en": "What extra control does email give the worker in this example?",
          "id": "Kendali tambahan apa yang diberikan email dalam contoh ini?"
        },
        "options": [
          {
            "en": "They can decide where every colleague must work.",
            "id": "Mereka dapat menentukan tempat kerja setiap rekan."
          },
          {
            "en": "They can avoid communicating with anyone.",
            "id": "Mereka dapat menghindari semua komunikasi."
          },
          {
            "en": "They can choose when to read and answer messages.",
            "id": "Mereka dapat memilih kapan membaca dan membalas pesan."
          }
        ],
        "focus": {
          "en": "Listen for the contrast between receiving a message and responding to it.",
          "id": "Dengarkan perbedaan antara menerima pesan dan menanggapinya."
        },
        "hint": {
          "en": "Compare the timing of email with relying only on the telephone.",
          "id": "Bandingkan waktu penggunaan email dengan hanya mengandalkan telepon."
        },
        "supportedMeaning": {
          "en": "Email can arrive immediately, but workers choose when to read and respond, giving them more control of their time.",
          "id": "Email dapat tiba segera, tetapi pekerja memilih kapan membaca dan membalas, sehingga lebih leluasa mengatur waktu."
        }
      },
      "transcript": "Email can arrive immediately, but workers choose when to read and respond, giving them more control of their time.",
      "reasons": [
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording.",
        "This choice does not describe the relationship asked about in the recording.",
        "The recording supports this relationship."
      ]
    }
  ]
} satisfies LadderContent);
