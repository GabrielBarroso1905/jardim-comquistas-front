import {
  canPlaceInSky,
  getSkyXBounds,
  getSkyYBounds,
  MIN_SKY_SPACING,
  getBottomPx,
  GROUND_PADDING,
  TREE_MIN_SPACING,
} from "./bounds";

import { TreeRecord } from "../../types/TreeRecord";

export type TerrainSlot = "sky" | "ground";

const usedSky: { x: number; y: number }[] = [];
const usedGround: { x: number; y: number }[] = [];

const isTooClose = (
  x: number,
  y: number,
  list: { x: number; y: number }[],
  minDist: number,
) =>
  list.some(p => Math.hypot(p.x - x, p.y - y) < minDist);

// ============================
// SKY ENGINE
// ============================
export const generateSkyPosition = (): { x: number; y: number } => {
  const { minX, maxX } = getSkyXBounds();
  let tries = 0;

  while (tries++ < 200) {
    const x = Math.random() * (maxX - minX) + minX;
    const { minY, maxY } = getSkyYBounds(x);
    const y = Math.random() * (maxY - minY) + minY;

    if (
      canPlaceInSky(x, y) &&
      !isTooClose(x, y, usedSky, MIN_SKY_SPACING)
    ) {
      usedSky.push({ x, y });
      return { x, y };
    }
  }

  // fallback
  return { x: minX + 50, y: 80 };
};

// ============================
// GROUND ENGINE
// ============================
export const generateGroundPosition = (): { x: number; y: number } => {
  const width = window.innerWidth;
  let tries = 0;

  while (tries++ < 200) {
    const x =
      Math.random() * (width - GROUND_PADDING * 2) + GROUND_PADDING;

    const y = getBottomPx(x) - 4;

    if (!isTooClose(x, y, usedGround, TREE_MIN_SPACING)) {
      usedGround.push({ x, y });
      return { x, y };
    }
  }

  return { x: width / 2, y: window.innerHeight - 60 };
};

// ============================
// PUBLIC API
// ============================
export const generatePositionForAchievement = (
  type: TreeRecord["typeKey"],
): { x: number; y: number; slot: TerrainSlot } => {
  if (type === "cloud" || type === "kite" || type === "bird") {
    const pos = generateSkyPosition();
    return { ...pos, slot: "sky" };
  }

  const pos = generateGroundPosition();
  return { ...pos, slot: "ground" };
};
