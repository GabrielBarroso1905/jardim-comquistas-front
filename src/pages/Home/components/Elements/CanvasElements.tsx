import React, { useRef, useEffect, useState } from "react";
import { useAchievements } from "../../hooks/useAchievements";
import { getTopPxForeground } from "../../utils/terrain";
import { preloadTrees, TREE_IMAGES } from "./Trees/treeImageCache";
import type { TreeRecord } from "../../../../types/TreeRecord";
import { getMousePos, hitTest, drawFallback } from "../../utils/canvasUtils";

const CanvasElements: React.FC = () => {
  const { achievements, loading } = useAchievements();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const treeMapRef = useRef<TreeRecord[]>([]);
  const [hovered, setHovered] = useState<TreeRecord | null>(null);
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // rodar quando o canvas estiver disponível (após loading)
    if (loading) return;

    const dpr = window.devicePixelRatio || 1;

    const compute = async () => {
      await preloadTrees();

      const viewportWidth = window.innerWidth || 1200;
      const padding = 40;
      const minX = padding;
      const maxX = Math.max(viewportWidth - padding, minX + 1);
      const denom = Math.max(achievements.length - 1, 1);

      const records: TreeRecord[] = achievements.map((achievement, index) => {
        const baseX = Math.round(minX + (index / denom) * (maxX - minX));
        const baseY = getTopPxForeground(baseX);

        const seed = achievement.id;
        const prng = (n: number) =>
          Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;

        const x = baseX + Math.round((prng(seed) - 0.5) * 60);
        const y =
          baseY +
          Math.round(prng(seed + 1) * 70) +
          Math.round((prng(seed + 2) - 0.5) * 20);

        const typeKey =
          index % 3 === 0 ? "tree" : index % 3 === 1 ? "tree2" : "tree3";

        return { id: achievement.id, x, y, w: 90, h: 95, achievement, typeKey };
      });

      treeMapRef.current = records;

      const rect = canvas.getBoundingClientRect();

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, rect.width, rect.height);

      for (const t of records) {
        const img = TREE_IMAGES[t.typeKey];
        const drawX = t.x - t.w / 2;
        const drawY = t.y - t.h + 8;

        if (img) {
          ctx.drawImage(img, drawX, drawY, t.w, t.h);
        } else {
          drawFallback(ctx, t);
        }
        // 🔴 DEBUG: desenha a hitbox da árvore
        // ctx.strokeStyle = "red";
        // ctx.lineWidth = 1;
        // ctx.strokeRect(t.x - t.w / 2, t.y - t.h + 8, t.w, t.h);
        //  DEBUG: desenha a posição da árvore
        // ctx.fillStyle = "blue";
        // ctx.font = "12px monospace";
        // ctx.fillText(
        //   `(${Math.round(t.x)}, ${Math.round(t.y)})`,
        //   t.x - t.w / 2,
        //   t.y - t.h - 5,
        // );
      }
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [achievements]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { x, y } = getMousePos(canvas, e);

      mouseRef.current = { x, y };
      setMouseCoords({ x: Math.round(x), y: Math.round(y) });

      const found = hitTest(treeMapRef.current, x, y);

      setHovered(found ? { ...found } : null);
    };

    const handleLeave = () => {
      setHovered(null);
      setMouseCoords(null);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleLeave);
    };
  }, [loading]);

  // 🎯 Hover sem re-render de canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
  }, []);

  if (loading) return null;

  
  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0 pointer-events-auto"
        style={{ width: "100%", height: "100%" }}
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

export default CanvasElements;

// drawFallback moved to ./utils/canvasUtils
