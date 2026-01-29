import { useMemo } from 'react';
import { getGroundYPercentAt } from '../core/terrain/bounds';

// Tipos exportados para facilitar manutenção e tipagem em componentes
export type PointType = 'sky' | 'ground' | 'contour' | 'obstacle' | 'empty';

export type Point = {
  xIndex: number; // coluna
  yIndex: number; // linha (0 em cima)
  xPercent: number; // 0..1 (posição relativa horizontal)
  yPercent: number; // 0..1 (posição relativa vertical, 0 = topo)
  type: PointType;
  occupied?: boolean;
};

export type Grid = Point[][];

export const DEFAULT_COLS = 48;
export const DEFAULT_ROWS = 32;



/**
 * Função que retorna a altura do solo (yPercent: 0..1) para uma dada posição xPercent (0..1).
 * Mantenha simples aqui; pode ser substituída por uma versão que case exatamente com o SVG.
 */
export function groundHeightAt(xPercent: number): number {
  // Aproximação simples de colinas: combina duas ondas para dar variação
  const valley = 0.72 + 0.08 * Math.sin(xPercent * Math.PI * 2);
  const mountain = 0.5 + 0.22 * Math.cos((xPercent - 0.2) * Math.PI * 2);
  const h = Math.min(1, Math.max(0, 0.6 * valley + 0.4 * mountain));
  return h;
}

/** Cria uma grade vazia com pontos contendo coordenadas percentuais */
export function createGrid(cols = DEFAULT_COLS, rows = DEFAULT_ROWS): Grid {
  const grid: Grid = [];
  for (let y = 0; y < rows; y++) {
    const row: Point[] = [];
    for (let x = 0; x < cols; x++) {
      const xPercent = cols === 1 ? 0.5 : x / (cols - 1);
      const yPercent = rows === 1 ? 0.5 : y / (rows - 1);
      row.push({ xIndex: x, yIndex: y, xPercent, yPercent, type: 'empty', occupied: false });
    }
    grid.push(row);
  }
  return grid;
}

/** Classifica todos os pontos como 'ground' ou 'sky' e marca o primeiro ponto de ground como 'contour' */
export function classifyGrid(grid: Grid, gh: (x: number) => number = groundHeightAt): Grid {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;
  const classified = grid.map((row) => row.map((p) => ({ ...p })));
  for (let x = 0; x < cols; x++) {
    const px = classified[0][x].xPercent;
    const groundYPercent = gh(px); // 0..1 from top
    for (let y = 0; y < rows; y++) {
      const p = classified[y][x];
      p.type = p.yPercent >= groundYPercent ? 'ground' : 'sky';
    }
    // marcar o primeiro ground como contour
    for (let y = 0; y < rows; y++) {
      const p = classified[y][x];
      if (p.type === 'ground') {
        p.type = 'contour';
        break;
      }
    }
  }
  return classified;
}

export function snapToGround(
  xPercent: number,
  getGroundY: (x: number) => number
) {
  const groundY = getGroundY(xPercent);
  return Math.max(0, Math.min(1, groundY));
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}


/** Procura um ponto livre para a camada solicitada. Retorna null se não houver. */
export function findFreePoint(grid: Grid, layer: 'sky' | 'ground'): Point | null {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;

  const colOrder = shuffle(Array.from({ length: cols }, (_, i) => i));

  for (const x of colOrder) {
    if (layer === 'ground') {
      // começa da linha de contorno pra baixo
      for (let y = 0; y < rows; y++) {
        const p = grid[y][x];
        if ((p.type === 'ground' || p.type === 'contour') && !p.occupied) {
          return p;
        }
      }
    } else {
      // céu: começa do topo e desce
      for (let y = 0; y < rows; y++) {
        const p = grid[y][x];
        if (p.type === 'sky' && !p.occupied) {
          return p;
        }
      }
    }
  }

  return null;
}


export function occupyPoint(grid: Grid, point: Point): void {
  const r = grid[point.yIndex];
  if (!r) return;
  const p = r[point.xIndex];
  if (p) p.occupied = true;
}

/**
 * Hook / função central para criar e retornar uma grid classificada.
 * Não renderiza nada — apenas retorna a estrutura e utilitários.
 */
export function useTerrainGrid(cols = DEFAULT_COLS, rows = DEFAULT_ROWS) {
  const result = useMemo(() => {
    const raw = createGrid(cols, rows);
   const classified = classifyGrid(raw, getGroundYPercentAt);
    return {
      grid: classified,
      helpers: {
        groundHeightAt,
        findFreePoint: (layer: 'sky' | 'ground') => findFreePoint(classified, layer),
        occupyPoint: (p: Point) => occupyPoint(classified, p),
      },
    } as const;
  }, [cols, rows]);

  return result;
}

// hooks/useTerrainGrid.ts
let cachedGroundY: number[] = [];

export function generateGroundY(windowWidth: number, windowHeight: number) {
  const hillPath = 'M0,120 C200,40 400,40 600,120 C750,170 900,140 1000,120 L1000,200 L0,200 Z';
  const basePath = new Path2D(hillPath);

  const scaleX = windowWidth / 1000;
  const svgPixelHeight = Math.round(windowHeight / 3);
  const scaleY = svgPixelHeight / 200;
  const offsetY = windowHeight - svgPixelHeight;

  const scaledPath = new Path2D();
  const m = new DOMMatrix([scaleX, 0, 0, scaleY, 0, offsetY]);
  scaledPath.addPath(basePath, m);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  cachedGroundY = [];
  for (let x = 0; x < windowWidth; x++) {
    let yFound = false;
    for (let y = 0; y < windowHeight; y++) {
      if (ctx.isPointInPath(scaledPath, x, y)) {
        cachedGroundY[x] = y;
        yFound = true;
        break;
      }
    }
    if (!yFound) cachedGroundY[x] = windowHeight * 0.12; // fallback
  }
}

// retorna y do chão para um x (em pixels)
export function getGroundYForX(leftPx: number) {
  if (!cachedGroundY.length) return 0;
  const x = Math.min(Math.max(0, Math.round(leftPx)), cachedGroundY.length - 1);
  return cachedGroundY[x];
}

export default useTerrainGrid;
