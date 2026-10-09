"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import { Avatar } from "./avatar";
import { boardGeometry, boardGroups, type BoardPlayer } from "./board-layout";
import "./board.css";

function placeName(tile: number) {
  return tile === 0 ? "Start / Mulai" : tile === 12 ? "Checkpoint / Titik akhir" : `Tile ${tile} / Petak ${tile}`;
}

export function LadderBoard({ players, ownAlias, ownId, wide = false, animate = true }: {
  players: BoardPlayer[];
  ownAlias?: string;
  ownId?: string;
  wide?: boolean;
  animate?: boolean;
}) {
  const { width, height, coords } = boardGeometry(wide);
  const groups = boardGroups(players, ownId, ownAlias);
  const [expanded, setExpanded] = useState<number | null>(null);
  const expandedGroup = groups.find((group) => group.tile === expanded);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const unique = useId().replace(/:/g, "");
  const forestId = `${unique}-forest`, shadowId = `${unique}-shadow`, groupId = `${unique}-group`;
  const markers = groups.flatMap((group) => group.visible.map((player, index) => ({
    player, crowded: group.visible.length > 1, offset: group.visible.length > 1 ? (index ? 1 : -1) : 0,
  })));
  function closeGroup() {
    setExpanded(null);
    returnFocus.current?.focus();
  }
  return (
    <section className={`ladder-board ${wide ? "ladder-board-wide" : ""} ${animate ? "" : "ladder-board-still"}`}
      aria-label="Listening route / Jalur menyimak">
      <div className="ladder-board-surface">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={forestId} x2="0" y2="1">
              <stop stopColor="#dfefda" /><stop offset="1" stopColor="#faf2d5" />
            </linearGradient>
            <filter id={shadowId}><feDropShadow dx="0" dy="4" stdDeviation="2" floodOpacity=".1" /></filter>
          </defs>
          <rect width={width} height={height} rx="30" fill={`url(#${forestId})`} />
          <path d={wide
            ? "M0 120L75 43L143 110L216 34L311 123L392 32L520 130L640 50L730 120L850 30L1040 135V145H0Z"
            : "M0 135L75 53L143 120L216 44L311 133L392 42L480 140V160H0Z"}
            fill="#b1cfad" opacity=".7" />
          <circle cx={wide ? 970 : 418} cy="42" r="22" fill="#f0c65f" />
          <path d={wide ? "M20 430Q170 449 320 430T620 430T1020 430" : "M18 606Q85 622 142 605T275 606T460 606"}
            stroke="#b8cfad" strokeWidth="17" fill="none" />
          <path d={coords.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ")}
            fill="none" stroke="#fffdf1" strokeWidth="27" strokeLinejoin="round" />
          {coords.map((p, tile) => (
            <g key={tile} filter={`url(#${shadowId})`}>
              <rect x={p.x - 39} y={p.y - 26} width="78" height="73" rx="19"
                fill={tile === 12 ? "#285f4b" : tile % 3 === 0 ? "#fae7a3" : "#fffdf3"} stroke="#d9dfc1" />
              <text x={p.x} y={p.y + 29} textAnchor="middle" fill={tile === 12 ? "white" : "#516c52"}
                fontSize={tile === 0 || tile === 12 ? "12" : "17"} fontWeight="600" fontFamily="sans-serif">
                {tile === 0 ? "START" : tile === 12 ? "FINISH" : tile}
              </text>
            </g>
          ))}
        </svg>
        <ul className="ladder-board-markers" aria-label="Players on the route / Peserta di jalur">
          {markers.map(({ player, crowded, offset }) => {
            const p = coords[player.tile];
            const own = ownId ? player.id === ownId : ownAlias === player.alias;
            return (
              <li key={player.key} data-position={player.tile}
                className={`ladder-board-marker ${crowded ? "is-crowded" : ""} ${own ? "is-own" : ""}`}
                style={{ left: `${p.x / width * 100}%`, top: `${p.y / height * 100}%`, "--marker-offset": offset } as CSSProperties}>
                <span className="ladder-marker-name">
                  {player.alias}
                  {own && <small>You / Kamu</small>}
                </span>
                {player.avatarId
                  ? <Avatar id={player.avatarId} size={112} animate={animate} />
                  : <span className="ladder-marker-placeholder" aria-hidden="true">{player.alias.slice(-2)}</span>}
                <span className="ladder-board-sr-only">{placeName(player.tile)}</span>
              </li>
            );
          })}
        </ul>
        {groups.filter((group) => group.hidden > 0).map((group) => {
          const p = coords[group.tile];
          return (
            <button type="button" key={group.tile} className="ladder-board-overflow"
              style={{ left: `${p.x / width * 100}%`, top: `${p.y / height * 100}%` }}
              aria-expanded={expanded === group.tile} aria-controls={groupId}
              aria-label={`${group.members.length} players at ${placeName(group.tile)}. Show everyone / Tampilkan semua peserta`}
              onClick={(event) => {
                returnFocus.current = event.currentTarget;
                setExpanded(expanded === group.tile ? null : group.tile);
              }}>
              +{group.hidden}<span className="ladder-board-sr-only"> more players / peserta lain</span>
            </button>
          );
        })}
        {wide && <div className="ladder-fireflies" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => <span key={i} style={{ left: `${12 + i * 10}%`, top: `${4 + (i % 3) * 8}%`, animationDelay: `${-i * 1.3}s` }} />)}
        </div>}
      </div>
      <div className="ladder-board-caption">
        <span>Listen. Replay. Keep going.</span><small>Dengarkan. Putar ulang. Lanjut lagi.</small>
      </div>
      {expandedGroup && (
        <section className="ladder-board-group" id={groupId} aria-label={`${placeName(expandedGroup.tile)}: ${expandedGroup.members.length} players / peserta`}
          onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); closeGroup(); } }}>
          <header>
            <div><strong>{placeName(expandedGroup.tile)}</strong><span>{expandedGroup.members.length} players here / peserta di sini</span></div>
            <button type="button" onClick={closeGroup}>Close / Tutup</button>
          </header>
          <ul>
            {expandedGroup.members.map((player) => (
              <li key={player.key}>
                <span className="ladder-marker-name">{player.alias}</span>
                {player.avatarId
                  ? <Avatar id={player.avatarId} size={88} animate={animate} />
                  : <span className="ladder-marker-placeholder" aria-hidden="true">{player.alias.slice(-2)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
