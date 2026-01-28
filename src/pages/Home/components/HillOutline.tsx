import React, { useEffect, useRef, useState } from 'react';
import { MOUNTAIN_PATHS } from '../utils/terrain';

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
      const step = 5; // aumentado de 1 para 5, reduzindo pixels em 25x
      for (let x = 0; x < w; x += step) {
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
          } else {
            // Céu: pontos laranjas vibrantes cobrindo tudo
            cctx.fillStyle = 'rgba(255, 165, 0, 0.8)'; // laranja vibrante
            cctx.fillRect(x, y, step, step);
          }
        }
      }
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