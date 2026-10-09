/** Cosmetic colours only; never encode correctness or listening ability. */
export const PALETTES = [
  { id: "original", en: "Original", idLabel: "Asli", hex: "#9ab873" },
  { id: "mint", en: "Mint", idLabel: "Mint", hex: "#65d9ab" },
  { id: "teal", en: "Teal", idLabel: "Toska", hex: "#25b7bc" },
  { id: "ocean", en: "Ocean", idLabel: "Laut", hex: "#367eea" },
  { id: "sky", en: "Sky", idLabel: "Langit", hex: "#83cfff" },
  { id: "violet", en: "Violet", idLabel: "Ungu", hex: "#955deb" },
  { id: "lilac", en: "Lilac", idLabel: "Lila", hex: "#cf9cf1" },
  { id: "rose", en: "Rose", idLabel: "Mawar", hex: "#ed75b4" },
  { id: "coral", en: "Coral", idLabel: "Koral", hex: "#f57e69" },
  { id: "amber", en: "Amber", idLabel: "Jingga", hex: "#f3a339" },
  { id: "gold", en: "Gold", idLabel: "Emas", hex: "#f3d551" },
  { id: "fern", en: "Fern", idLabel: "Pakis", hex: "#83b54c" },
  { id: "slate", en: "Slate", idLabel: "Abu kebiruan", hex: "#748fa9" },
] as const;
export type AvatarPaletteId = (typeof PALETTES)[number]["id"];
export function isAvatarPaletteId(value: unknown): value is AvatarPaletteId {
  return typeof value === "string" && PALETTES.some((palette) => palette.id === value);
}
export function paletteDefinition(id: string) {
  return PALETTES.find((palette) => palette.id === id) ?? PALETTES[0];
}
export function paletteFor(seed: string): AvatarPaletteId {
  let hash = 5381;
  for (const char of seed) hash = Math.imul(hash, 33) ^ char.charCodeAt(0);
  return PALETTES[1 + (hash >>> 0) % (PALETTES.length - 1)].id;
}
