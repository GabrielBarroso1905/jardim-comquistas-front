import React, { useRef, useEffect, useState } from "react";
import { useAchievements } from "../../../../../hooks/useAchievements";
import {
  getTopPxForeground,
  getSkyXBounds,
  GROUND_PADDING,
  TREE_MIN_SPACING,
  TREE_MAX_VERTICAL_NUDGE,
} from "../../../../../core/terrain/bounds";
import {
  preloadTrees,
  TREE_IMAGES,
} from "../../../../../core/cache/treeImageCache";
import type { TreeRecord } from "../../../../../types/TreeRecord";
import { getMousePos, hitTest, drawFallback } from "../../../utils/canvasUtils";

const FloorElements: React.FC = () => {
  const { achievements, loading } = useAchievements();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const treeMapRef = useRef<TreeRecord[]>([]);
  const [hovered, setHovered] = useState<TreeRecord | null>(null);
  const [mouseCoords, setMouseCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  
  const anchorMap: Record<string, number> = {
    tree: 0.88,
    tree2: 0.9,
    tree3: 0.87,
  };

  useEffect(() => {
    if (!canvasRef.current || loading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const compute = async () => {
      await preloadTrees();

      const { minX, maxX } = getSkyXBounds(GROUND_PADDING);
      const groundAchievements = achievements.filter(
        (a: any) => a.type !== "sky",
      );
      const denom = Math.max(groundAchievements.length - 1, 1);

      const records: TreeRecord[] = groundAchievements.map(
        (achievement, index) => {
          const baseX = Math.round(minX + (index / denom) * (maxX - minX));
          const seed = achievement.id;
          const prng = (n: number) =>
            Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;

          const x = baseX + Math.round((prng(seed) - 0.5) * 60);

          // 🔥 ANCORADO NO CONTORNO REAL
          const baseY = getTopPxForeground(x);
          const y = baseY + Math.round((prng(seed + 1) - 0.5) * 12);

          const typeKey =
            index % 3 === 0 ? "tree" : index % 3 === 1 ? "tree2" : "tree3";

          return {
            id: achievement.id,
            x,
            y: baseY, // AGORA y é o chão real
            w: 90,
            h: 95,
            achievement,
            typeKey,
            anchorY: anchorMap[typeKey] ?? 0.9,
          };
        },
      );

      const MIN_TREE_SPACING = TREE_MIN_SPACING;
      const MAX_VERTICAL_NUDGE = TREE_MAX_VERTICAL_NUDGE;

      // 🌿 espaçamento horizontal
      records.sort((a, b) => a.x - b.x);
      for (let i = 1; i < records.length; i++) {
        const prev = records[i - 1];
        const cur = records[i];
        if (cur.x - prev.x < MIN_TREE_SPACING) {
          cur.x = prev.x + MIN_TREE_SPACING;
        }
      }

      for (const r of records) {
        r.x = Math.max(minX, Math.min(r.x, maxX));
        r.y = getTopPxForeground(r.x);
      }

      // 🌳 ajuste de sobreposição
      for (let i = 0; i < records.length - 1; i++) {
        const a = records[i];
        const b = records[i + 1];

        const aLeft = a.x - a.w / 2;
        const aRight = aLeft + a.w;
        const aTop = a.y - a.h;
        const aBottom = a.y;

        const bLeft = b.x - b.w / 2;
        const bRight = bLeft + b.w;
        const bTop = b.y - b.h;
        const bBottom = b.y;

        const overlapX = Math.max(
          0,
          Math.min(aRight, bRight) - Math.max(aLeft, bLeft),
        );
        const overlapY = Math.max(
          0,
          Math.min(aBottom, bBottom) - Math.max(aTop, bTop),
        );

        if (overlapX > 10 && overlapY > 10) {
          const front = a.y > b.y ? a : b;
          front.y += Math.min(MAX_VERTICAL_NUDGE, Math.ceil(overlapY / 2));
        }
        
      }

      // 🧭 profundidade real
      const zSorted = [...records].sort((a, b) => a.y + a.h - (b.y + b.h));
      treeMapRef.current = zSorted;

      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      for (const t of zSorted) {
        const drawX = t.x - t.w / 2;
        const anchor = t.anchorY ?? 0.9;
        const drawY = t.y - t.h * anchor;
        const img = TREE_IMAGES[t.typeKey];
        if (img) ctx.drawImage(img, drawX, drawY, t.w, t.h);
        else drawFallback(ctx, t);

//         ctx.strokeStyle = "red";
// ctx.lineWidth = 1;
// ctx.strokeRect(
//   t.x - t.w / 2,
//   t.y - t.h * (t.anchorY ?? 0.9),
//   t.w,
//   t.h
// );
      }

      
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [achievements, loading]);

  useEffect(() => {
    if (loading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { x, y } = getMousePos(canvas, e);
      setMouseCoords({ x: Math.round(x), y: Math.round(y) });
      const found = hitTest(treeMapRef.current, x, y);
      setHovered(found ? { ...found } : null);
    };

    const handleLeave = () => {
      setHovered(null);
      setMouseCoords(null);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleLeave);
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleLeave);
    };
  }, [loading]);

  if (loading) return null;

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0 pointer-events-auto"
      />

      {mouseCoords && hovered && (
        <div
          className="absolute bg-black text-white px-3 py-2 rounded text-sm pointer-events-none z-50"
          style={{ left: mouseCoords.x + 10, top: mouseCoords.y - 30 }}
        >
          <strong>{hovered.achievement?.title}</strong>
          <div>{hovered.achievement?.description}</div>
        </div>
      )}
    </div>
  );
};

export default FloorElements;
