import React, { useEffect, useRef, useState } from 'react';
import { MOUNTAIN_PATHS, SKY_PADDING, SKY_MARGIN, SKY_MIN_Y, GROUND_PADDING, TREE_MIN_SPACING, TREE_MAX_VERTICAL_NUDGE, SKY_HEIGHT_LOW, SKY_HEIGHT_MID, SKY_HEIGHT_HIGH, getSkyHeightY, getPerspectiveLinesY, getScaleForY, PERSPECTIVE_RADIAL_COUNT, SKY_TOP_PADDING } from '../utils/terrain';

const HillOutline = () => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [hoveredCoords, setHoveredCoords] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const c = canvas as HTMLCanvasElement;
    const cctx = ctx as CanvasRenderingContext2D;

    function draw() {
      if (!mounted) return;
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      c.width = w;
      c.height = h;

      // Paths das montanhas (do Landscape)
      const paths = MOUNTAIN_PATHS;

      // Escalar todos os paths
      const scaledPaths: Path2D[] = [];
      for (const pathData of paths) {
        const basePath = new Path2D(pathData.d);
        let scaleX: number, scaleY: number, offsetY: number;

        if (pathData.isForeground) {
          // Primeiro plano: h-1/3
          const svgHeight = Math.round(h / 3);
          scaleX = w / 1000;
          scaleY = svgHeight / 200;
          offsetY = h - svgHeight;
        } else {
          // Fundo: h-1/2
          const svgHeight = Math.round(h / 2);
          scaleX = w / 1000;
          scaleY = svgHeight / 300;
          offsetY = h - svgHeight;
        }

        const scaledPath = new Path2D();
        const m = new DOMMatrix([scaleX, 0, 0, scaleY, 0, offsetY]);
        scaledPath.addPath(basePath, m);
        scaledPaths.push(scaledPath);
      }

      // Desenhar pontos em grid menos denso para performance
      // passo derivado do espaçamento mínimo entre elementos do chão
      const step = Math.max(1, Math.floor(TREE_MIN_SPACING / 4));
      const left = GROUND_PADDING;
      const right = Math.max(left + 1, w - GROUND_PADDING);

      // calcular posições das 3 linhas de altura do céu
      const yLow = getSkyHeightY(SKY_HEIGHT_LOW);
      const yMid = getSkyHeightY(SKY_HEIGHT_MID);
      const yHigh = getSkyHeightY(SKY_HEIGHT_HIGH);

      for (let x = left; x < right; x += step) {
        for (let y = 0; y < h; y += step) {
          let isInsideAny = false;
          let edgeColor = '';
          let isEdge = false;

          // Verificar em qual path está
          for (let i = 0; i < scaledPaths.length; i++) {
            const inside = cctx.isPointInPath(scaledPaths[i], x, y);
            if (inside) {
              isInsideAny = true;
              // Verificar se é borda
              const neighbors = [
                [x, y - step],
                [x, y + step],
                [x - step, y],
                [x + step, y]
              ];
              for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                  if (!cctx.isPointInPath(scaledPaths[i], nx, ny)) {
                    isEdge = true;
                    edgeColor = paths[i].color;
                    break;
                  }
                }
              }
              if (isEdge) break; // Priorizar borda do primeiro plano
            }
          }

          if (isEdge) {
            // Pintar borda com cor específica
            cctx.fillStyle = edgeColor;
            cctx.fillRect(x, y, step, step);
          } else if (isInsideAny) {
            // Pontos transparentes dentro
            cctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            cctx.fillRect(x, y, step, step);
          } else if (y >= SKY_TOP_PADDING) {
            // Céu: pontos laranjas vibrantes cobrindo tudo abaixo do padding
            cctx.fillStyle = 'rgba(255, 166, 0, 0.14)'; // laranja vibrante
            cctx.fillRect(x, y, step, step);
          }
        }
      }

      // Desenhar linhas horizontais indicativas das alturas do céu
      cctx.save();
      cctx.setLineDash([4, 4]);
      cctx.lineWidth = 1;
      cctx.strokeStyle = 'rgba(255,255,255,0.9)';
      // low
      cctx.beginPath();
      cctx.moveTo(left, yLow + 0.5);
      cctx.lineTo(right, yLow + 0.5);
      cctx.stroke();
      // mid
      cctx.beginPath();
      cctx.moveTo(left, yMid + 0.5);
      cctx.lineTo(right, yMid + 0.5);
      cctx.stroke();
      // high
      cctx.beginPath();
      cctx.moveTo(left, yHigh + 0.5);
      cctx.lineTo(right, yHigh + 0.5);
      cctx.stroke();
      cctx.setLineDash([]);
      // labels
      cctx.fillStyle = 'rgba(255,255,255,0.95)';
      cctx.font = `${12}px sans-serif`;
      cctx.fillText('LOW', left + 6, yLow - 6);
      cctx.fillText('MID', left + 6, yMid - 6);
      cctx.fillText('HIGH', left + 6, yHigh - 6);
      cctx.restore();

      // Desenhar linhas radiais de perspectiva convergindo para o ponto de fuga (yMid)
      const vanishingX = Math.round((left + right) / 2);
      const vanishingY = Math.round(yMid);
      const radialCount = Math.max(2, PERSPECTIVE_RADIAL_COUNT);
      cctx.save();
      cctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
      cctx.lineWidth = 1;
      cctx.setLineDash([2, 2]);
      for (let i = 0; i < radialCount; i++) {
        const t = i / Math.max(1, radialCount - 1);
        const sx = Math.round(left + t * (right - left));
        cctx.beginPath();
        cctx.moveTo(sx, Math.round(h));
        cctx.lineTo(vanishingX, vanishingY);
        cctx.stroke();
        // small tick at bottom
        cctx.beginPath();
        cctx.moveTo(sx - 4, h - 6);
        cctx.lineTo(sx + 4, h - 6);
        cctx.stroke();
      }
      // markers along each radial line to indicate near/mid/far (fractions from bottom -> vanishing)
      const bands = [
        { name: 'NEAR', f: 0.20, color: 'rgba(0,200,0,0.95)' },
        { name: 'MID', f: 0.50, color: 'rgba(255,200,0,0.95)' },
        { name: 'FAR', f: 0.80, color: 'rgba(255,80,80,0.95)' }
      ];
      for (let i = 0; i < radialCount; i++) {
        const t = i / Math.max(1, radialCount - 1);
        const sx = Math.round(left + t * (right - left));
        for (const b of bands) {
          const fx = sx + (vanishingX - sx) * b.f;
          const fy = Math.round(h + (vanishingY - h) * b.f);
          cctx.beginPath();
          cctx.fillStyle = b.color;
          cctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
          cctx.fill();
        }
      }
      // linhas radiais vindas do topo
      cctx.strokeStyle = 'rgba(255,255,255,0.9)';;
      for (let i = 0; i < radialCount; i++) {
        const t = i / Math.max(1, radialCount - 1);
        const sx = Math.round(left + t * (right - left));
        cctx.beginPath();
        cctx.moveTo(sx, 0);
        cctx.lineTo(vanishingX, vanishingY);
        cctx.stroke();
      }
      // linhas radiais das laterais (esquerda/direita) para o ponto de fuga
      cctx.strokeStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < radialCount; i++) {
        const t = i / Math.max(1, radialCount - 1);
        const sy = Math.round(t * h);
        // esquerda
        cctx.beginPath();
        cctx.moveTo(left, sy);
        cctx.lineTo(vanishingX, vanishingY);
        cctx.stroke();
        // direita
        cctx.beginPath();
        cctx.moveTo(right, sy);
        cctx.lineTo(vanishingX, vanishingY);
        cctx.stroke();
      }
      // draw vanishing point marker
      cctx.fillStyle = 'rgba(255,255,255,0.9)';
      cctx.beginPath();
      cctx.arc(vanishingX, vanishingY, 4, 0, Math.PI * 2);
      cctx.fill();
      cctx.restore();
    }

    draw();
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setHoveredCoords({ x: Math.round(x), y: Math.round(y) });
    };
    const handleMouseLeave = () => setHoveredCoords(null);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', draw);
    return () => {
      mounted = false;
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', draw);
    };
  }, []);

  return (
    <>
      <canvas ref={ref} className="absolute inset-0 w-full h-full z-50 pointer-events-auto" />
      {hoveredCoords && (
        <div
          className="absolute bg-black text-white px-2 py-1 rounded text-sm pointer-events-none z-50"
          style={{ left: hoveredCoords.x + 10, top: hoveredCoords.y - 30 }}
        >
          x: {hoveredCoords.x}, y: {hoveredCoords.y}
        </div>
      )}
    </>
  );
};

export default HillOutline;