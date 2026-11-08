import { createHash, randomBytes } from "node:crypto";

const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateResourceCode(): string {
  const bytes = randomBytes(10);
  const raw = Array.from(bytes, (byte) => alphabet[byte & 31]).join("");
  return raw.slice(0, 5) + "-" + raw.slice(5);
}

export function normalizeResourceCode(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]/g, "");
}

export function isValidResourceCode(value: string): boolean {
  const normalized = normalizeResourceCode(value);
  return normalized.length === 10 && [...normalized].every((character) => alphabet.includes(character));
}

export function hashResourceCode(value: string): string {
  return createHash("sha256").update(normalizeResourceCode(value)).digest("hex");
}
