"use client";

import { useEffect, type CSSProperties } from "react";
import type { AnswerEffect as Effect } from "./answer-effect-state";
import styles from "./answer-effect.module.css";

export function AnswerEffect({ effect, onDone }: { effect: Effect; onDone: () => void }) {
  useEffect(() => {
    const timeout = setTimeout(onDone, 4200);
    return () => clearTimeout(timeout);
  }, [effect.id, onDone]);
  return (
    <div className={`${styles.effect} ${styles[effect.kind]}`} data-answer-effect={effect.kind}>
      <div className={styles.frame} aria-hidden="true" />
      {effect.kind !== "neutral" && (
        <div className={styles.particles} aria-hidden="true">
          {Array.from({ length: effect.kind === "celebrate" ? 32 : 9 }, (_, i) => (
            <i key={i} style={{
              "--x": `${((i * 37) % 97) + 1}%`,
              "--drift": `${((i * 29) % 150) - 75}px`,
              "--delay": `${(i % 6) * 0.055}s`,
              "--turn": `${i * 49}deg`,
              "--hue": `${88 + ((i * 43) % 90)}`,
            } as CSSProperties} />
          ))}
        </div>
      )}
      <div className={styles.toast} role="status" aria-live="polite" aria-atomic="true">
        <b aria-hidden="true">{effect.kind === "celebrate" ? "✦" : effect.kind === "revisit" ? "↻" : "◌"}</b>
        <div><strong>{effect.text.en}</strong><small lang="id">{effect.text.id}</small></div>
      </div>
    </div>
  );
}
