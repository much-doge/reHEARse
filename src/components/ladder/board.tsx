"use client";
const coords = Array.from({ length: 13 }, (_, i) => {
  const r = Math.floor(i / 4),
    c = i % 4;
  return { x: 70 + (r % 2 ? 3 - c : c) * 110, y: 450 - r * 110 };
});
export function LadderBoard({
  players,
  ownAlias,
}: {
  players: Array<{ alias: string; position: number }>;
  ownAlias?: string;
}) {
  return (
    <div className="ladder-board">
      <svg
        viewBox="0 0 480 540"
        role="img"
        aria-label="Snakes and ladders listening journey / Perjalanan menyimak ular tangga"
      >
        <defs>
          <linearGradient id="forest" x2="0" y2="1">
            <stop stopColor="#e1efdc" />
            <stop offset="1" stopColor="#f7f1db" />
          </linearGradient>
          <filter id="tile-shadow">
            <feDropShadow dx="0" dy="3" stdDeviation="2" floodOpacity=".12" />
          </filter>
        </defs>
        <rect width="480" height="540" rx="30" fill="url(#forest)" />
        <path
          d="M0 105 L75 33 L133 90 L196 24 L281 103 L362 22 L480 110 V170 H0Z"
          fill="#a8c8ab"
          opacity=".55"
        />
        <circle cx="412" cy="44" r="23" fill="#f2c866" />
        <path
          d="M18 505 Q85 520 142 504 T275 505 T460 505"
          stroke="#b8cfad"
          strokeWidth="18"
          fill="none"
        />
        <path
          d={coords.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ")}
          fill="none"
          stroke="#fffdf1"
          strokeWidth="24"
          strokeLinejoin="round"
        />
        {coords.map((p, i) => (
          <g key={i} filter="url(#tile-shadow)">
            <rect
              x={p.x - 36}
              y={p.y - 35}
              width="72"
              height="70"
              rx="18"
              fill={i === 12 ? "#285f4b" : i % 3 === 0 ? "#fae7a3" : "#fffdf3"}
              stroke="#dde0c5"
            />
            <text
              x={p.x}
              y={p.y + 5}
              textAnchor="middle"
              fill={i === 12 ? "white" : "#77907a"}
              fontSize="17"
              fontFamily="sans-serif"
            >
              {i === 0 ? "START" : i === 12 ? "FINISH" : i}
            </text>
          </g>
        ))}
        <g
          stroke="#c58d4c"
          strokeWidth="9"
          strokeLinecap="round"
          transform="rotate(-20 232 326)"
        >
          <path d="M219 365V268M246 365V268" />
          <path
            d="M219 350H246M219 330H246M219 310H246M219 290H246"
            stroke="#e8b96c"
            strokeWidth="6"
          />
        </g>
        <g fill="none" strokeLinecap="round">
          <path
            d="M400 233 C445 245 443 281 408 283 S365 313 400 344"
            stroke="#fdf6df"
            strokeWidth="22"
          />
          <path
            d="M400 233 C445 245 443 281 408 283 S365 313 400 344"
            stroke="#d17a65"
            strokeWidth="15"
          />
          <path
            d="M400 233 C445 245 443 281 408 283 S365 313 400 344"
            stroke="#e69a80"
            strokeWidth="4"
            strokeDasharray="2 13"
          />
        </g>
        <ellipse cx="400" cy="231" rx="13" ry="17" fill="#ca705f" />
        <circle cx="395" cy="225" r="2.5" fill="#3e4033" />
        <circle cx="405" cy="225" r="2.5" fill="#3e4033" />
        <g
          stroke="#c58d4c"
          strokeWidth="9"
          strokeLinecap="round"
          transform="rotate(20 112 156)"
        >
          <path d="M98 203V103M126 203V103" />
          <path
            d="M98 185H126M98 165H126M98 145H126M98 125H126"
            stroke="#e8b96c"
            strokeWidth="6"
          />
        </g>
        {players.map((player, i) => {
          const p = coords[Math.max(0, Math.min(12, player.position))];
          const stacked = players
            .slice(0, i)
            .filter((x) => x.position === player.position).length;
          return (
            <g
              key={player.alias}
              className="ladder-token"
              transform={`translate(${p.x + ((stacked % 3) - 1) * 16},${p.y - 12 - Math.floor(stacked / 3) * 13})`}
            >
              <title>
                {player.alias}
                {ownAlias === player.alias ? " · You / Kamu" : ""}
              </title>
              <circle
                r="17"
                fill={
                  ["#305f50", "#356bc0", "#a85476", "#94702e", "#62589e"][i % 5]
                }
                stroke="white"
                strokeWidth="4"
              />
              <text
                y="5"
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="700"
              >
                {ownAlias === player.alias ? "YOU" : player.alias.slice(-2)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="board-caption">
        <span>One floor. A way forward.</span>
        <small>Satu perjalanan. Selalu ada jalan lanjut.</small>
      </div>
    </div>
  );
}
