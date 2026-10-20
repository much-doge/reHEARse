type MutationStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function pendingMutation(
  storage: MutationStorage,
  slot: string,
  freshBody: object,
) {
  const saved = storage.getItem(slot);
  if (saved) {
    try { return JSON.parse(saved) as object; }
    catch { storage.removeItem(slot); }
  }
  storage.setItem(slot, JSON.stringify(freshBody));
  return freshBody;
}

export function acknowledgeMutation(storage: MutationStorage, slot: string) {
  storage.removeItem(slot);
}

