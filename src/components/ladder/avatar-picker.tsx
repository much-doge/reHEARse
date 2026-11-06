"use client";

import { AVATARS, avatarDefinition } from "@/domain/ladder/avatars";
import { Avatar } from "./avatar";

export function AvatarPicker({ value, onChange, disabled = false, animate = true, paletteId = "original" }: {
  value: string; onChange: (id: string) => void; disabled?: boolean; animate?: boolean; paletteId?: string;
}) {
  const selected = avatarDefinition(value);
  function surprise() {
    const alternatives = AVATARS.filter((avatar) => avatar.id !== selected.id);
    const roll = new Uint32Array(1);
    crypto.getRandomValues(roll);
    onChange(alternatives[roll[0] % alternatives.length].id);
  }
  return (
    <section className="ladder-avatar-picker" aria-label="Choose your character">
      <div className="ladder-avatar-picker-heading">
        <div>
          <h3>Your companion</h3>
          <p>Pick your character before you begin.</p>
        </div>
        <button type="button" className="ladder-avatar-surprise" disabled={disabled} onClick={surprise}>Surprise me</button>
      </div>
      <p className="ladder-avatar-selected" aria-live="polite">Selected: <strong>{selected.name}</strong></p>
      <div className="ladder-avatar-grid">
        {AVATARS.map((avatar) => (
          <button key={avatar.id} type="button" aria-pressed={selected.id === avatar.id}
            aria-label={`Choose ${avatar.name}`} disabled={disabled}
            className="ladder-avatar-choice" onClick={() => onChange(avatar.id)}>
            <Avatar id={avatar.id} size={88} animate={animate} paletteId={paletteId} />
            <span>{avatar.name}</span>
            {selected.id === avatar.id && <span className="ladder-avatar-check" aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
      <p className="ladder-avatar-credit">Character parts by Kenney · CC0</p>
    </section>
  );
}
