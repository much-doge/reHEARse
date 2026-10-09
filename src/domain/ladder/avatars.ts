/** Cosmetic game identity only. Never use these choices as a learning metric. */
export const AVATAR_CATALOG_VERSION = "forest-companions.v1";

type Color = "green" | "red" | "blue" | "white" | "yellow" | "dark";
type Part = "A" | "B" | "C" | "D" | "E" | "F";
type Accessory = "antenna" | "ears" | "horns" | "round-ears" | "none";
type Motion = "bounce" | "sway" | "float";

export type AvatarDefinition = {
  id: string;
  name: string;
  color: Color;
  body: Part;
  arm: Exclude<Part, "F">;
  leg: Exclude<Part, "F">;
  eyes: 1 | 2 | 3;
  eye: "cute" | "human" | "human_blue";
  mouth: Part | "H" | "I" | "J" | "closed_happy";
  accessory: Accessory;
  motion: Motion;
};

export const AVATARS = [
  { id: "moss", name: "Moss", color: "green", body: "B", arm: "B", leg: "A", eyes: 2, eye: "cute", mouth: "closed_happy", accessory: "ears", motion: "bounce" },
  { id: "fern", name: "Fern", color: "green", body: "E", arm: "A", leg: "B", eyes: 1, eye: "human", mouth: "A", accessory: "antenna", motion: "sway" },
  { id: "sprout", name: "Sprout", color: "green", body: "F", arm: "C", leg: "C", eyes: 3, eye: "human_blue", mouth: "C", accessory: "horns", motion: "bounce" },
  { id: "pickle", name: "Pickle", color: "green", body: "C", arm: "D", leg: "E", eyes: 2, eye: "human", mouth: "H", accessory: "round-ears", motion: "sway" },
  { id: "clover", name: "Clover", color: "green", body: "A", arm: "E", leg: "D", eyes: 1, eye: "cute", mouth: "B", accessory: "horns", motion: "float" },
  { id: "ember", name: "Ember", color: "red", body: "D", arm: "C", leg: "B", eyes: 1, eye: "human_blue", mouth: "B", accessory: "horns", motion: "bounce" },
  { id: "chili", name: "Chili", color: "red", body: "E", arm: "E", leg: "D", eyes: 3, eye: "human", mouth: "I", accessory: "none", motion: "sway" },
  { id: "poppy", name: "Poppy", color: "red", body: "B", arm: "A", leg: "C", eyes: 2, eye: "cute", mouth: "A", accessory: "antenna", motion: "float" },
  { id: "ruby", name: "Ruby", color: "red", body: "A", arm: "D", leg: "E", eyes: 2, eye: "human_blue", mouth: "closed_happy", accessory: "ears", motion: "bounce" },
  { id: "sizzle", name: "Sizzle", color: "red", body: "F", arm: "B", leg: "A", eyes: 1, eye: "human", mouth: "J", accessory: "round-ears", motion: "sway" },
  { id: "bubbles", name: "Bubbles", color: "blue", body: "B", arm: "E", leg: "D", eyes: 3, eye: "cute", mouth: "A", accessory: "round-ears", motion: "float" },
  { id: "ripple", name: "Ripple", color: "blue", body: "C", arm: "A", leg: "C", eyes: 2, eye: "human", mouth: "C", accessory: "horns", motion: "sway" },
  { id: "comet", name: "Comet", color: "blue", body: "F", arm: "D", leg: "B", eyes: 1, eye: "human_blue", mouth: "H", accessory: "antenna", motion: "bounce" },
  { id: "pixel", name: "Pixel", color: "blue", body: "A", arm: "B", leg: "E", eyes: 3, eye: "human", mouth: "closed_happy", accessory: "none", motion: "sway" },
  { id: "fin", name: "Fin", color: "blue", body: "D", arm: "C", leg: "A", eyes: 2, eye: "cute", mouth: "B", accessory: "ears", motion: "float" },
  { id: "cloud", name: "Cloud", color: "white", body: "B", arm: "D", leg: "E", eyes: 1, eye: "cute", mouth: "closed_happy", accessory: "round-ears", motion: "float" },
  { id: "mochi", name: "Mochi", color: "white", body: "D", arm: "B", leg: "A", eyes: 2, eye: "human_blue", mouth: "A", accessory: "antenna", motion: "bounce" },
  { id: "wisp", name: "Wisp", color: "white", body: "E", arm: "E", leg: "C", eyes: 3, eye: "cute", mouth: "J", accessory: "horns", motion: "float" },
  { id: "frost", name: "Frost", color: "white", body: "F", arm: "A", leg: "D", eyes: 2, eye: "human", mouth: "C", accessory: "ears", motion: "sway" },
  { id: "marsh", name: "Marsh", color: "white", body: "A", arm: "C", leg: "B", eyes: 1, eye: "human_blue", mouth: "H", accessory: "none", motion: "bounce" },
  { id: "sunny", name: "Sunny", color: "yellow", body: "B", arm: "C", leg: "E", eyes: 2, eye: "human_blue", mouth: "H", accessory: "horns", motion: "bounce" },
  { id: "mango", name: "Mango", color: "yellow", body: "C", arm: "E", leg: "A", eyes: 1, eye: "cute", mouth: "C", accessory: "ears", motion: "sway" },
  { id: "spark", name: "Spark", color: "yellow", body: "F", arm: "B", leg: "D", eyes: 3, eye: "human", mouth: "A", accessory: "antenna", motion: "bounce" },
  { id: "butter", name: "Butter", color: "yellow", body: "A", arm: "A", leg: "C", eyes: 2, eye: "cute", mouth: "closed_happy", accessory: "round-ears", motion: "float" },
  { id: "noodle", name: "Noodle", color: "yellow", body: "E", arm: "D", leg: "B", eyes: 1, eye: "human", mouth: "B", accessory: "none", motion: "sway" },
  { id: "shadow", name: "Shadow", color: "dark", body: "E", arm: "C", leg: "C", eyes: 2, eye: "human_blue", mouth: "J", accessory: "horns", motion: "float" },
  { id: "inky", name: "Inky", color: "dark", body: "B", arm: "B", leg: "E", eyes: 3, eye: "cute", mouth: "H", accessory: "ears", motion: "bounce" },
  { id: "orbit", name: "Orbit", color: "dark", body: "A", arm: "E", leg: "B", eyes: 1, eye: "human_blue", mouth: "A", accessory: "antenna", motion: "float" },
  { id: "dusk", name: "Dusk", color: "dark", body: "C", arm: "D", leg: "A", eyes: 2, eye: "human", mouth: "closed_happy", accessory: "none", motion: "sway" },
  { id: "pebble", name: "Pebble", color: "dark", body: "F", arm: "A", leg: "D", eyes: 1, eye: "cute", mouth: "C", accessory: "round-ears", motion: "bounce" },
] as const satisfies readonly AvatarDefinition[];

export type AvatarId = (typeof AVATARS)[number]["id"];

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === "string" && AVATARS.some((avatar) => avatar.id === value);
}

/** Stable cosmetic assignment for existing runs without persisted appearance. */
export function avatarFor(seed: string): AvatarId {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
  }
  return AVATARS[(hash >>> 0) % AVATARS.length].id;
}

export function avatarDefinition(id: string): AvatarDefinition {
  return AVATARS.find((avatar) => avatar.id === id) ?? AVATARS[0];
}
