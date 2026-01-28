import React, { useRef, useEffect, useState } from 'react';
import { useAchievements } from '../../hooks/useAchievements';
import { getTopPxForeground } from '../../utils/terrain';
import TREE_SVGS from './treeSvgs';

type TreeRecord = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  achievement: any;
  typeKey: string;
};

const CanvasElements: React.FC = () => {
  const { achievements, loading } = useAchievements();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [treeMap, setTreeMap] = useState<TreeRecord[]>([]);
  const [hovered, setHovered] = useState<TreeRecord | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let raf = 0;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // prepare image cache from SVG strings
    const imageCache: { [k: string]: HTMLImageElement | null } = {};
    const loadPromises: Promise<void>[] = [];
    Object.keys(TREE_SVGS).forEach((k) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const svg = TREE_SVGS[k as keyof typeof TREE_SVGS];
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      imageCache[k] = null;
      const p = new Promise<void>((res) => {
        img.onload = () => {
          imageCache[k] = img;
          res();
        };
        img.onerror = () => {
          // ignore and keep null; will fallback to simple draw
          res();
        };
      });
      loadPromises.push(p);
    });

    const compute = () => {
      const viewportWidth = window.innerWidth || 1200;
      const visible = achievements;
      const padding = 40;
      const minX = padding;
      const maxX = Math.max(viewportWidth - padding, minX + 1);
      const denom = Math.max(visible.length - 1, 1);

      const records: TreeRecord[] = visible.map((achievement, index) => {
        const baseX = Math.round(minX + (index / denom) * (maxX - minX));
        const baseY = getTopPxForeground(baseX);
        const seed = achievement.id;
        const prng = (n: number) => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
        const jitterX = Math.round((prng(seed) - 0.5) * 60);
        const jitterYDown = Math.round(prng(seed + 1) * 120);
        const slightVertical = Math.round((prng(seed + 2) - 0.5) * 20);
        const treeX = baseX + jitterX;
        const treeY = baseY + Math.round(jitterYDown * 0.6) + slightVertical;

        // visual footprint matching original SVGs (treeHeight=95, treeWidth=90)
        const w = 90;
        const h = 95;
        // choose svg type
        const typeKey = index % 3 === 0 ? 'tree' : index % 3 === 1 ? 'tree2' : 'tree3';
        return { id: achievement.id, x: treeX, y: treeY, w, h, achievement, typeKey };
      });

      setTreeMap(records);

      // resize canvas for DPR
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // wait for images to load, then draw (but don't block - draw simple if not)
      Promise.all(loadPromises).then(() => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        for (const t of records) {
          const img = imageCache[t.typeKey];
          if (img && img.width && img.height) {
            // draw with same positioning as original SVGs: left: x - w/2, top: y - h + 8
            const drawX = t.x - t.w / 2;
            const drawY = t.y - t.h + 8;
            ctx.drawImage(img, drawX, drawY, t.w, t.h);
          } else {
            drawTree(ctx, t);
          }
        }
      });
    };

    const drawTree = (ctx2: CanvasRenderingContext2D, t: TreeRecord) => {
      // trunk
      ctx2.fillStyle = '#8b5a2b';
      const trunkW = 8;
      const trunkH = 18;
      ctx2.fillRect(t.x - trunkW / 2, t.y - trunkH, trunkW, trunkH);

      // foliage (three circles)
      ctx2.fillStyle = '#197b2e';
      ctx2.beginPath();
      ctx2.arc(t.x, t.y - trunkH - 6, 18, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.beginPath();
      ctx2.arc(t.x - 14, t.y - trunkH + 2, 14, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.beginPath();
      ctx2.arc(t.x + 14, t.y - trunkH + 2, 14, 0, Math.PI * 2);
      ctx2.fill();
    };

    const handleResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, [achievements]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const toCanvas = (clientX: number, clientY: number) => {
      const x = (clientX - rect.left) * (canvas.width / rect.width) / dpr;
      const y = (clientY - rect.top) * (canvas.height / rect.height) / dpr;
      return { x, y };
    };

    const onMove = (e: PointerEvent) => {
      const p = toCanvas(e.clientX, e.clientY);
      const found = treeMap.find(t => {
        const left = t.x - t.w / 2;
        const right = t.x + t.w / 2;
        const top = t.y - t.h + 8; // match drawY
        const bottom = t.y;
        return p.x >= left && p.x <= right && p.y >= top && p.y <= bottom;
      }) || null;
      setHovered(found);
    };

    const onLeave = () => setHovered(null);

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);

    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [treeMap]);

  if (loading) return null;

  return (
    <div className="absolute inset-0 pointer-events-auto">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      {hovered && (
        <div
          className="absolute bg-black text-white px-3 py-2 rounded text-sm pointer-events-none z-50 max-w-xs"
          style={{ left: hovered.x + 10, top: hovered.y - 30 }}
        >
          <div><strong>{hovered.achievement?.title || 'Sem título'}</strong></div>
          <div>{hovered.achievement?.description || 'Sem descrição'}</div>
          <div className="mt-1 text-xs">x: {hovered.x}, y: {hovered.y}</div>
        </div>
      )}
    </div>
  );
};

export default CanvasElements;