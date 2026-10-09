export type BoardPlayer = {
  id?: string;
  alias: string;
  position: number;
  avatarId?: string;
};
export type PlacedPlayer = BoardPlayer & { key: string; tile: number };

export function boardTile(position: number) {
  return Number.isFinite(position)
    ? Math.max(0, Math.min(12, Math.round(position)))
    : 0;
}

/** Group the actual game positions; overflow never invents another tile. */
export function boardGroups(players: BoardPlayer[], ownId?: string, ownAlias?: string) {
  const groups = new Map<number, PlacedPlayer[]>();
  players.forEach((player, index) => {
    const tile = boardTile(player.position);
    const members = groups.get(tile) ?? [];
    members.push({ ...player, key: player.id ?? `${player.alias}:${index}`, tile });
    groups.set(tile, members);
  });
  return [...groups].map(([tile, members]) => {
    // Keep the local player's token visible without presenting a public rank.
    const own = members.findIndex((player) => ownId
      ? player.id === ownId
      : ownAlias !== undefined && player.alias === ownAlias);
    const visible = members.slice(0, 2);
    if (own >= 2) visible[1] = members[own];
    return { tile, members, visible, hidden: members.length - visible.length };
  });
}

export function boardGeometry(wide: boolean) {
  return {
    width: wide ? 1040 : 480,
    height: wide ? 480 : 640,
    coords: Array.from({ length: 13 }, (_, tile) => {
      if (wide) return { x: 90 + (tile < 7 ? tile : 13 - tile) * 140, y: tile < 7 ? 360 : 170 };
      const row = Math.floor(tile / 4), col = tile % 4;
      return { x: 70 + (row % 2 ? 3 - col : col) * 110, y: 550 - row * 145 };
    }),
  };
}
