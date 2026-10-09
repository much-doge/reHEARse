import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  AVATARS,
  avatarDefinition,
  avatarFor,
  isAvatarId,
} from "./avatars";

function filesFor(avatar: (typeof AVATARS)[number]) {
  const files = [
    `body_${avatar.color}${avatar.body}.png`,
    `arm_${avatar.color}${avatar.arm}.png`,
    `leg_${avatar.color}${avatar.leg}.png`,
    avatar.eye === "cute" ? "eye_cute_light.png" : `eye_${avatar.eye}.png`,
    `mouth${avatar.mouth.startsWith("closed") ? "_" : ""}${avatar.mouth}.png`,
  ];
  if (avatar.accessory === "antenna")
    files.push(
      `detail_${avatar.color}_antenna_large.png`,
      `detail_${avatar.color}_antenna_small.png`,
    );
  if (avatar.accessory !== "none" && avatar.accessory !== "antenna")
    files.push(
      `detail_${avatar.color}_${
        avatar.accessory === "ears"
          ? "ear"
          : avatar.accessory === "round-ears"
            ? "ear_round"
            : "horn_large"
      }.png`,
    );
  return files;
}

describe("forest companion catalogue", () => {
  it("contains 30 unique named and structurally distinct choices", () => {
    expect(AVATARS).toHaveLength(30);
    expect(new Set(AVATARS.map(({ id }) => id)).size).toBe(30);
    expect(new Set(AVATARS.map(({ name }) => name)).size).toBe(30);
    expect(
      new Set(
        AVATARS.map(
          ({ body, arm, leg, eyes, eye, mouth, accessory }) =>
            [body, arm, leg, eyes, eye, mouth, accessory].join(":"),
        ),
      ).size,
    ).toBe(30);
  });

  it("resolves every referenced local part and the original licence", async () => {
    const root = path.resolve("public/art/avatars/parts");
    const files = new Set(AVATARS.flatMap(filesFor));
    await Promise.all([...files].map((file) => access(path.join(root, file))));
    const licence = await readFile(
      path.resolve("public/art/avatars/source/License.txt"),
      "utf8",
    );
    expect(licence).toContain("Monster Builder Pack (1.0)");
    expect(licence).toContain("Creative Commons Zero, CC0");
  });

  it("uses a stable valid fallback and rejects arbitrary asset paths", () => {
    expect(avatarFor("same-user")).toBe(avatarFor("same-user"));
    expect(isAvatarId(avatarFor("same-user"))).toBe(true);
    expect(isAvatarId("../../secret")).toBe(false);
    expect(avatarDefinition("../../secret")).toBe(AVATARS[0]);
  });
});
