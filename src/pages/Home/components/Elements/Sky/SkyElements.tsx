import React, { useRef, useEffect, useState } from "react";
import { useAchievements } from "../../../hooks/useAchievements";
import { getSkyMaxY, canPlaceInSky, getSkyXBounds, SKY_MARGIN, SKY_MIN_Y, MIN_SKY_SPACING, SKY_HEIGHT_LOW, SKY_HEIGHT_MID, SKY_HEIGHT_HIGH, getSkyHeightY, SKY_TOP_PADDING } from "../../../utils/terrain";
import { preloadSkies, SKY_IMAGES } from "./Elements/skyElements/skyImageCache";
import type { TreeRecord } from "../../../../../types/TreeRecord";
import { getMousePos, hitTest } from "../../../utils/canvasUtils";

const SkyElements: React.FC = () => {
  const { achievements, loading } = useAchievements();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const skyMapRef = useRef<TreeRecord[]>([]);
  const [hovered, setHovered] = useState<TreeRecord | null>(null);
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (loading) return;

    const dpr = window.devicePixelRatio || 1;

    const compute = async () => {
      await preloadSkies();
      const { minX, maxX } = getSkyXBounds();
      const skyAchievements = achievements.filter((a: any) => a.type === "sky");
      const denom = Math.max(skyAchievements.length - 1, 1);

      const prng = (seed: number, n: number) =>
        Math.abs(Math.sin(n * 12.9898 + seed) * 43758.5453) % 1;

      const skyRecords: TreeRecord[] = skyAchievements.map((achievement, idx) => {
        const baseX = Math.round(minX + (idx / denom) * (maxX - minX));
        const seed = achievement.id;
        const x = baseX + Math.round((prng(seed, 1) - 0.5) * 60);
        const margin = SKY_MARGIN;
        const maxY = getSkyMaxY(x, margin);
        const minY = Math.max(SKY_MIN_Y, SKY_TOP_PADDING);
        const y = Math.round(Math.max(minY, Math.min(maxY, minY + prng(seed, 2) * Math.max(1, maxY - minY))));
        // usar chave 'cloud' por padrão (podes adicionar outras chaves em skySvgs)
        return { id: achievement.id, x, y, w: 40, h: 30, achievement, typeKey: "cloud" };
      });

      // espaçamento horizontal
      skyRecords.sort((a, b) => a.x - b.x);
      for (let i = 1; i < skyRecords.length; i++) {
        const prev = skyRecords[i - 1];
        const cur = skyRecords[i];
        if (cur.x - prev.x < MIN_SKY_SPACING) cur.x = prev.x + MIN_SKY_SPACING;
      }

      // garante limites
      for (const r of skyRecords) {
        r.x = Math.max(minX, Math.min(r.x, maxX));
      }

      // filtra por canPlaceInSky
      const valid = skyRecords.filter((r) => canPlaceInSky(r.x, r.y, SKY_MARGIN));

      skyMapRef.current = valid.sort((a, b) => a.y - b.y);

      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, rect.width, rect.height);

      // calcular thresholds em pixels
      const yLow = getSkyHeightY(SKY_HEIGHT_LOW);
      const yMid = getSkyHeightY(SKY_HEIGHT_MID);
      const yHigh = getSkyHeightY(SKY_HEIGHT_HIGH);

      for (const t of skyMapRef.current) {
        const drawX = t.x - t.w / 2;
        const drawY = t.y - t.h + 8;
        const img = SKY_IMAGES[t.typeKey];

        // escolher cor baseada na altura (y maior = mais baixo na tela)
        let tint = "#ffffff"; // abaixo do low -> branco
        if (t.y >= yLow) tint = "#ffffff"; // low (mais baixo)
        else if (t.y >= yMid) tint = "#FFD54F"; // entre low e mid -> amarelo
        else if (t.y >= yHigh) tint = "#9E9E9E"; // entre mid e high -> cinza
        else tint = "#64B5F6"; // acima do high -> azul

        if (img) {
          // desenha imagem e aplica tint usando source-atop
          ctx.drawImage(img, drawX, drawY, t.w, t.h);
          ctx.save();
          ctx.globalCompositeOperation = "source-atop";
          ctx.fillStyle = tint;
          ctx.fillRect(drawX, drawY, t.w, t.h);
          ctx.restore();
        } else {
          // fallback: desenhar forma simples de nuvem com cor
          ctx.save();
          ctx.fillStyle = tint;
          const cx = t.x;
          const cy = t.y - Math.round(t.h / 3);
          ctx.beginPath();
          ctx.arc(cx - 10, cy, 8, 0, Math.PI * 2);
          ctx.arc(cx, cy - 4, 10, 0, Math.PI * 2);
          ctx.arc(cx + 12, cy, 8, 0, Math.PI * 2);
          ctx.rect(cx - 20, cy, 40, 12);
          ctx.fill();
          ctx.restore();
        }

        // 🔴 DEBUG: desenha a hitbox do elemento do céu
        // ctx.strokeStyle = "red";
        // ctx.lineWidth = 1;
        // ctx.strokeRect(t.x - t.w / 4, t.y - t.h + 8, t.w, t.h);
        //  DEBUG: desenha a posição do elemento do céu
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
  }, [achievements, loading]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = (e as MouseEvent).clientX;
      const cy = (e as MouseEvent).clientY;
      // se fora do canvas, tratar como leave
      if (cx < rect.left || cx > rect.right || cy < rect.top || cy > rect.bottom) {
        setHovered(null);
        setMouseCoords(null);
        return;
      }

      const { x, y } = getMousePos(canvas, e as any);
      setMouseCoords({ x: Math.round(x), y: Math.round(y) });
      const found = hitTest(skyMapRef.current, x, y);
      setHovered(found ? { ...found } : null);
    };

    const handleLeave = () => {
      setHovered(null);
      setMouseCoords(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleLeave);
    };
  }, [loading]);

  if (loading) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
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
    </>
  );
};

export default SkyElements;
