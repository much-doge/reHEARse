"use client";

import { useEffect, useState } from "react";

export const waitingFocuses = [
  {
    label: "The situation",
    en: "Who is speaking, and what problem or situation are they dealing with?",
    id: "Siapa yang bicara, dan masalah atau situasi apa yang sedang mereka hadapi?",
  },
  {
    label: "The speaker’s purpose",
    en: "What does the speaker want the other person to understand or do?",
    id: "Apa yang ingin pembicara sampaikan atau minta dari orang lain?",
  },
  {
    label: "A detail to check",
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
      <p className="eyebrow">A moment to reflect</p>
      <h2>While you wait, think back.</h2>
      <p role="status">
        {takingLonger
          ? "This is taking a little longer. You can keep reflecting or replay the audio."
          : "Your feedback is being prepared. Pick something to think about while you wait."}
      </p>
      <div
        className="waiting-choices"
        aria-label="Choose a listening focus"
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
      </div>
      <p className="waiting-question">
        How does that part feel?</p>
      <div className="waiting-choices">
        <button
          type="button"
          aria-pressed={reflection === "clear"}
          onClick={() => setReflection("clear")}
        >
          I have an idea</button>
        <button
          type="button"
          aria-pressed={reflection === "check"}
          onClick={() => setReflection("check")}
        >
          I’d like another listen</button>
      </div>
      {reflection && (
        <p className="waiting-reflection" role="status">
          {reflection === "clear"
            ? "Keep one word or detail in mind that helped you."
            : "Keep that question in mind when you replay."}
        </p>
      )}
      <small>Your reflection choices aren’t saved or sent.</small>
    </div>
  );
}
