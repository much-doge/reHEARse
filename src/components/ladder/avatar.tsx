"use client";

import { useId, type CSSProperties } from "react";
import { paletteDefinition } from "@/domain/ladder/appearance";
import { avatarDefinition } from "@/domain/ladder/avatars";
import "./avatar.css";

const ROOT = "/art/avatars/parts/";
const BODY = {
  A: [58, 112, 112], B: [55, 124, 124], C: [48, 94, 138],
  D: [54, 116, 130], E: [38, 90, 154], F: [42, 112, 150],
} as const;

function Part({ file, x, y, width, height }: {
  file: string; x: number; y: number; width: number; height: number;
}) {
  return <image className={/^(body|arm|leg|detail)_/.test(file) ? "ladder-avatar-skin" : undefined} href={`${ROOT}${file}.png`} x={x} y={y} width={width} height={height} preserveAspectRatio="none" />;
}

/** Kenney CC0 parts; layered motion and creature compositions authored for reHEARse. */
export function Avatar({ id, size = 72, animate = true, paletteId = "original" }: {
  id: string; size?: number; animate?: boolean; paletteId?: string;
}) {
  const avatar = avatarDefinition(id);
  const palette = paletteDefinition(paletteId);
  const filterId = `skin-${useId().replaceAll(":", "")}`;
  const channels = [1, 3, 5].map((offset) => parseInt(palette.hex.slice(offset, offset + 2), 16) / 255);
  const [bodyY, bodyWidth, bodyHeight] = BODY[avatar.body];
  const eyeSize = avatar.eyes === 1 ? 45 : avatar.eyes === 2 ? 34 : 26;
  const eyeGap = avatar.eyes === 1 ? 0 : avatar.eyes === 2 ? 42 : 30;
  const eyeFile = avatar.eye === "cute" ? "eye_cute_light" : `eye_${avatar.eye}`;
  const eyeStart = 120 - ((avatar.eyes - 1) * eyeGap + eyeSize) / 2;
  return (
    <svg
      className={`ladder-avatar ladder-avatar-${avatar.motion}${animate ? " is-animated" : ""}`}
      width={size} height={size} viewBox="0 0 240 240"
      role="img" aria-label={`${avatar.name}, ${palette.en}`}
      style={{ "--avatar-skin-filter": palette.id === "original" ? "none" : `url(#${filterId})` } as CSSProperties}
    >
      <defs><filter id={filterId} colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="linear" slope={channels[0] * .55} intercept={channels[0] * .45} />
          <feFuncG type="linear" slope={channels[1] * .55} intercept={channels[1] * .45} />
          <feFuncB type="linear" slope={channels[2] * .55} intercept={channels[2] * .45} />
        </feComponentTransfer>
      </filter></defs>
      <ellipse className="ladder-avatar-shadow" cx="120" cy="218" rx="56" ry="9" fill="#213f38" opacity=".15" />
      <g className="ladder-avatar-creature">
        <g className="ladder-avatar-leg ladder-avatar-leg-left">
          <Part file={`leg_${avatar.color}${avatar.leg}`} x={80} y={151} width={34} height={65} />
        </g>
        <g className="ladder-avatar-leg ladder-avatar-leg-right">
          <g transform="translate(240 0) scale(-1 1)">
            <Part file={`leg_${avatar.color}${avatar.leg}`} x={80} y={151} width={34} height={65} />
          </g>
        </g>
        <g className="ladder-avatar-arm ladder-avatar-arm-left">
          <Part file={`arm_${avatar.color}${avatar.arm}`} x={37} y={80} width={44} height={95} />
        </g>
        <g className="ladder-avatar-arm ladder-avatar-arm-right">
          <g transform="translate(240 0) scale(-1 1)">
            <Part file={`arm_${avatar.color}${avatar.arm}`} x={37} y={80} width={44} height={95} />
          </g>
        </g>
        {avatar.accessory === "antenna" && <g className="ladder-avatar-accessory">
          <Part file={`detail_${avatar.color}_antenna_large`} x={91} y={12} width={28} height={56} />
          <g transform="translate(240 0) scale(-1 1)"><Part file={`detail_${avatar.color}_antenna_small`} x={88} y={25} width={24} height={42} /></g>
        </g>}
        {(avatar.accessory === "ears" || avatar.accessory === "round-ears" || avatar.accessory === "horns") && <g className="ladder-avatar-accessory">
          <Part file={`detail_${avatar.color}_${avatar.accessory === "ears" ? "ear" : avatar.accessory === "round-ears" ? "ear_round" : "horn_large"}`} x={57} y={bodyY - 13} width={38} height={42} />
          <g transform="translate(240 0) scale(-1 1)"><Part file={`detail_${avatar.color}_${avatar.accessory === "ears" ? "ear" : avatar.accessory === "round-ears" ? "ear_round" : "horn_large"}`} x={57} y={bodyY - 13} width={38} height={42} /></g>
        </g>}
        <Part file={`body_${avatar.color}${avatar.body}`} x={120 - bodyWidth / 2} y={bodyY} width={bodyWidth} height={bodyHeight} />
        <g className="ladder-avatar-eyes">
          {Array.from({ length: avatar.eyes }, (_, index) => <Part key={index} file={eyeFile} x={eyeStart + index * eyeGap} y={91} width={eyeSize} height={eyeSize} />)}
        </g>
        <Part file={`mouth${avatar.mouth.startsWith("closed") ? "_" : ""}${avatar.mouth}`} x={97} y={138} width={46} height={avatar.mouth === "closed_happy" ? 15 : 27} />
      </g>
    </svg>
  );
}
