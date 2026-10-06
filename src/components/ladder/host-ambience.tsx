"use client";
import { useEffect, useRef, useState } from "react";
export function HostAmbience({ quiet }: { quiet: boolean }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.1);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (quiet) audio.current?.pause();
  }, [quiet]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) audio.current?.pause();
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  async function toggle() {
    if (!audio.current) return;
    setError(false);
    if (playing) audio.current.pause();
    else {
      try {
        audio.current.volume = volume;
        await audio.current.play();
      } catch {
        setError(true);
      }
    }
  }
  return (
    <footer className="ladder-ambience">
      <audio
        ref={audio}
        src="/audio/carefree.ogg"
        preload="none"
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setError(true)}
      />
      <button disabled={quiet} onClick={toggle} aria-pressed={playing}>
        {quiet
          ? "Listening time · music paused / Waktu menyimak · musik dijeda"
          : playing
            ? "Pause music / Jeda musik"
            : "Play gentle music / Putar musik pelan"}
      </button>
      <label>
        Volume / Volume{" "}
        <input
          type="range"
          min="0"
          max="0.3"
          step="0.01"
          value={volume}
          onChange={(e) => {
            const v = Number(e.target.value);
            setVolume(v);
            if (audio.current) audio.current.volume = v;
          }}
        />
      </label>
      <details>
        <summary>Music & art credits / Kredit musik dan gambar</summary>
        <p>
          “Carefree” by{" "}
          <a
            href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400037"
            target="_blank"
            rel="noreferrer"
          >
            Kevin MacLeod (incompetech.com)
          </a>
          ,{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
          . Re-encoded to Ogg; played at reduced volume and looped. Icons and
          particle textures by{" "}
          <a
            href="https://kenney.nl/assets/particle-pack"
            target="_blank"
            rel="noreferrer"
          >
            Kenney
          </a>
          , CC0. Animation and board artwork by reHEARse.
        </p>
      </details>
      {error && (
        <p role="alert">
          Music could not play. Try again when connected. / Musik belum bisa
          diputar. Coba lagi saat terhubung.
        </p>
      )}
    </footer>
  );
}
