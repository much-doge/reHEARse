"use client";

import { useEffect, useState } from "react";

export const waitingFocuses = [
  {
    label: "The situation / Situasinya",
    en: "Who is speaking, and what problem or situation are they dealing with?",
    id: "Siapa yang bicara, dan masalah atau situasi apa yang sedang mereka hadapi?",
  },
  {
    label: "The speaker’s purpose / Maksud pembicara",
    en: "What does the speaker want the other person to understand or do?",
    id: "Apa yang ingin pembicara sampaikan atau minta dari orang lain?",
  },
  {
    label: "A detail to check / Detail untuk dicek",
    en: "Which word or phrase would you like to hear again? What might it change?",
    id: "Kata atau frasa mana yang ingin kamu dengar lagi? Apa pengaruhnya pada makna percakapan?",
  },
] as const;

export function FeedbackWait() {
  const [focus, setFocus] = useState(0);
  const [reflection, setReflection] = useState<"clear" | "check" | null>(null);
  const [takingLonger, setTakingLonger] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTakingLonger(true), 20_000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="feedback-wait">
      <div className="waiting-wave" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((x) => (
          <span key={x} />
        ))}
      </div>
      <p className="eyebrow">A moment to reflect / Waktu untuk meninjau</p>
      <h2>While you wait, think back. / Sambil menunggu, coba ingat lagi.</h2>
      <p role="status">
        {takingLonger
          ? "This is taking a little longer. You can keep reflecting or replay the audio. / Prosesnya agak lama. Kamu bisa lanjut meninjau atau memutar audio lagi."
          : "Your feedback is being prepared. Pick something to think about while you wait. / Umpan balikmu sedang disiapkan. Pilih satu hal untuk kamu pikirkan sambil menunggu."}
      </p>
      <div
        className="waiting-choices"
        aria-label="Choose a listening focus / Pilih fokus menyimak"
      >
        {waitingFocuses.map((x, i) => (
          <button
            type="button"
            key={x.label}
            aria-pressed={focus === i}
            onClick={() => {
              setFocus(i);
              setReflection(null);
            }}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="waiting-prompt" aria-live="polite">
        <p>{waitingFocuses[focus].en}</p>
        <p className="translation">{waitingFocuses[focus].id}</p>
      </div>
      <p className="waiting-question">
        How does that part feel? / Bagian itu terasa bagaimana buat kamu?
      </p>
      <div className="waiting-choices">
        <button
          type="button"
          aria-pressed={reflection === "clear"}
          onClick={() => setReflection("clear")}
        >
          I have an idea / Aku punya gambaran
        </button>
        <button
          type="button"
          aria-pressed={reflection === "check"}
          onClick={() => setReflection("check")}
        >
          I’d like another listen / Aku ingin dengar lagi
        </button>
      </div>
      {reflection && (
        <p className="waiting-reflection" role="status">
          {reflection === "clear"
            ? "Keep one word or detail in mind that helped you. / Ingat satu kata atau detail yang membantu kamu."
            : "Keep that question in mind when you replay. / Ingat pertanyaan itu saat kamu mendengarkan ulang."}
        </p>
      )}
      <small>
        Optional reflection, just for you. Your choices aren’t saved or sent. /
        Ini pilihanmu saja. Pilihan ini tidak disimpan atau dikirim.
      </small>
    </div>
  );
}
