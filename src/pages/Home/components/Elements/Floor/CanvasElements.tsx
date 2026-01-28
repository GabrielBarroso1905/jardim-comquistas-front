import React, { useRef, useEffect, useState } from "react";
import { useAchievements } from "../../../hooks/useAchievements";
import { getTopPxForeground, getSkyXBounds, GROUND_PADDING, TREE_MIN_SPACING, TREE_MAX_VERTICAL_NUDGE } from "../../../utils/terrain";
import { preloadTrees, TREE_IMAGES } from "./Elements/FloorElements/treeImageCache";
import type { TreeRecord } from "../../../../../types/TreeRecord";
import { getMousePos, hitTest, drawFallback } from "../../../utils/canvasUtils";

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

      const { minX, maxX } = getSkyXBounds(GROUND_PADDING);
      const groundAchievements = achievements.filter((a: any) => a.type !== "sky");
      const denom = Math.max(groundAchievements.length - 1, 1);

      // Apenas elementos do terreno (árvores)
      const records: TreeRecord[] = groundAchievements.map((achievement, index) => {
        const baseX = Math.round(minX + (index / denom) * (maxX - minX));
        const seed = achievement.id;
        const prng = (n: number) => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;

        const x = baseX + Math.round((prng(seed) - 0.5) * 60);
        const baseY = getTopPxForeground(baseX);
        const y =
          baseY +
          Math.round(prng(seed + 1) * 70) +
          Math.round((prng(seed + 2) - 0.5) * 20);

        const typeKey = index % 3 === 0 ? "tree" : index % 3 === 1 ? "tree2" : "tree3";

        return { id: achievement.id, x, y, w: 90, h: 95, achievement, typeKey };
      });

      // ---- Configuráveis (definidos em utils/terrain.ts) ----
      const MIN_TREE_SPACING = TREE_MIN_SPACING;
      const MAX_VERTICAL_NUDGE = TREE_MAX_VERTICAL_NUDGE;
      // ---------------------------------------------------------------

      // Ordena por X para aplicar espaçamento horizontal mínimo
      records.sort((a, b) => a.x - b.x);
      for (let i = 1; i < records.length; i++) {
        const prev = records[i - 1];
        const cur = records[i];
        if (cur.x - prev.x < MIN_TREE_SPACING) {
          cur.x = prev.x + MIN_TREE_SPACING;
        }
      }

      // Garante que não saiam dos limites calculados
      for (const r of records) {
        r.x = Math.max(minX, Math.min(r.x, maxX));
      }

      // Ajuste vertical simples para reduzir sobreposição de hitboxes
      for (let i = 0; i < records.length - 1; i++) {
        const a = records[i];
        const b = records[i + 1];
        const aLeft = a.x - a.w / 2;
        const aRight = aLeft + a.w;
        const aTop = a.y - a.h + 8;
        const aBottom = aTop + a.h;
        const bLeft = b.x - b.w / 2;
        const bRight = bLeft + b.w;
        const bTop = b.y - b.h + 8;
        const bBottom = bTop + b.h;
        const overlapX = Math.max(0, Math.min(aRight, bRight) - Math.max(aLeft, bLeft));
        const overlapY = Math.max(0, Math.min(aBottom, bBottom) - Math.max(aTop, bTop));
        // Se houver sobreposição significativa, empurra a árvore mais "frontal" para baixo
        if (overlapX > 10 && overlapY > 10) {
          const front = a.y > b.y ? a : b;
          front.y += Math.min(MAX_VERTICAL_NUDGE, Math.ceil(overlapY / 2));
        }
      }

      // Ordena por Y (profundidade) para desenhar em z-order e para o hit-testing
      const zSorted = [...records].sort((a, b) => a.y - b.y);
      treeMapRef.current = zSorted; // hitTest usa esta lista

      const rect = canvas.getBoundingClientRect();

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, rect.width, rect.height);

      for (const t of zSorted) {
        const drawX = t.x - t.w / 2;
        const drawY = t.y - t.h + 8;

        const img = TREE_IMAGES[t.typeKey];

        if (img) {
          ctx.drawImage(img, drawX, drawY, t.w, t.h);
        } else {
          drawFallback(ctx, t);
        }
        // 🔴 DEBUG: desenha a hitbox da árvore
        // ctx.strokeStyle = "red";
        // ctx.lineWidth = 1;
        // ctx.strokeRect(t.x - t.w / 4, t.y - t.h + 8, t.w, t.h);
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
      const rect = canvas.getBoundingClientRect();
      const cx = (e as MouseEvent).clientX;
      const cy = (e as MouseEvent).clientY;
      if (cx < rect.left || cx > rect.right || cy < rect.top || cy > rect.bottom) {
        setHovered(null);
        setMouseCoords(null);
        return;
      }

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

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleLeave);
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

