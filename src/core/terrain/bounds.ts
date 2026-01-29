// ============================
// TERRENO / MONTANHAS
// ============================

// Constantes dos paths das montanhas
export const MOUNTAIN_PATHS = [
  {
    d: 'M0,220 Q150,120 300,200 T600,200 T1000,180 L1000,300 L0,300 Z',
    color: 'rgba(245, 0, 0, 0.8)',
    isForeground: false,
  }, // fundo 1
  {
    d: 'M0,240 Q180,140 360,220 T720,220 T1000,200 L1000,300 L0,300 Z',
    color: 'rgba(0, 255, 0, 0.8)',
    isForeground: false,
  }, // fundo 2
  {
    d: 'M0,260 Q200,160 400,240 T800,240 T1000,220 L1000,300 L0,300 Z',
    color: 'rgba(0, 0, 255, 0.8)',
    isForeground: false,
  }, // fundo 3
  {
    d: 'M0,120 C200,40 400,40 600,120 C750,170 900,140 1000,120 L1000,200 L0,200 Z',
    color: 'rgba(255, 255, 0, 0.8)',
    isForeground: true,
  }, // primeiro plano
];

// Constantes relacionadas ao terreno (uso em CanvasElements)
export const GROUND_PADDING = 20;
export const TREE_MIN_SPACING = 20;
export const TREE_MAX_VERTICAL_NUDGE = 5;

// ============================
// PATHS ESCALADOS
// ============================

const createScaledPath = (pathD: string, isForeground: boolean): Path2D => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const basePath = new Path2D(pathD);

  let scaleX: number, scaleY: number, offsetY: number;

  if (isForeground) {
    const svgHeight = Math.round(h / 3);
    scaleX = w / 1000;
    scaleY = svgHeight / 200;
    offsetY = h - svgHeight;
  } else {
    const svgHeight = Math.round(h / 2);
    scaleX = w / 1000;
    scaleY = svgHeight / 300;
    offsetY = h - svgHeight;
  }

  const scaledPath = new Path2D();
  const m = new DOMMatrix([scaleX, 0, 0, scaleY, 0, offsetY]);
  scaledPath.addPath(basePath, m);
  return scaledPath;
};

let cachedPaths: Path2D[] | null = null;

const getScaledPaths = () => {
  if (!cachedPaths) {
    cachedPaths = MOUNTAIN_PATHS.map(p =>
      createScaledPath(p.d, p.isForeground),
    );
  }
  return cachedPaths;
};

// ============================
// DETECÇÃO CÉU / CHÃO
// ============================

export const isGround = (x: number, y: number): boolean => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const scaledPaths = getScaledPaths();

  for (const scaledPath of scaledPaths) {
    if (ctx.isPointInPath(scaledPath, x, y)) {
      return true;
    }
  }

  return false;
};

export const isSky = (x: number, y: number): boolean => !isGround(x, y);

// ============================
// MONTANHAS INDIVIDUAIS
// ============================

const isMountain = (index: number, x: number, y: number): boolean => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const p = MOUNTAIN_PATHS[index];
  const scaledPath = createScaledPath(p.d, p.isForeground);
  return ctx.isPointInPath(scaledPath, x, y);
};

export const isMountain1 = (x: number, y: number) => isMountain(0, x, y);
export const isMountain2 = (x: number, y: number) => isMountain(1, x, y);
export const isMountain3 = (x: number, y: number) => isMountain(2, x, y);
export const isMountainForeground = (x: number, y: number) =>
  isMountain(3, x, y);

// ============================
// ALTURA DO CHÃO
// ============================

export const getBottomPx = (x: number): number => {
  const h = window.innerHeight;
  for (let y = h - 1; y >= 0; y--) {
    if (isGround(x, y)) return y;
  }
  return h - 50;
};

export const getTopPxForeground = (x: number): number => {
  for (let y = 0; y < window.innerHeight; y++) {
    if (isMountainForeground(x, y)) return y;
  }
  return 0;
};

// ============================
// LIMITES DO CÉU
// ============================

export const SKY_PADDING = 50;
export const SKY_MARGIN = 28;
export const SKY_MIN_Y = 8;
export const SKY_TOP_PADDING = 60;
export const MIN_SKY_SPACING = 24;

export const getSkyMaxY = (x: number, margin = SKY_MARGIN): number => {
  const top = getTopPxForeground(x);
  return Math.max(0, top - margin);
};

export const getSkyYBounds = (
  x: number,
  margin = SKY_MARGIN,
  minY = SKY_MIN_Y,
) => {
  const maxY = getSkyMaxY(x, margin);
  return { minY, maxY };
};

export const getSkyXBounds = (padding = SKY_PADDING) => {
  const viewportWidth = window.innerWidth || 1200;
  const minX = padding;
  const maxX = Math.max(viewportWidth - padding, minX + 1);
  return { minX, maxX, viewportWidth };
};

export const canPlaceInSky = (
  x: number,
  y: number,
  margin = SKY_MARGIN,
): boolean => {
  const maxY = getSkyMaxY(x, margin);
  const minYAllowed = Math.max(SKY_MIN_Y, SKY_TOP_PADDING);
  if (y < minYAllowed || y > maxY) return false;
  return isSky(x, y);
};

// ============================
// ALTURAS DO CÉU
// ============================

export const SKY_HEIGHT_LOW = 0.6;
export const SKY_HEIGHT_MID = 0.4;
export const SKY_HEIGHT_HIGH = 0.2;

export const getSkyHeightY = (fraction: number): number => {
  const h = window.innerHeight || 800;
  return Math.max(0, Math.min(h, Math.round(h * fraction)));
};

export const getSkyHeightLevelY = (level: 'low' | 'mid' | 'high') => {
  if (level === 'low') return getSkyHeightY(SKY_HEIGHT_LOW);
  if (level === 'mid') return getSkyHeightY(SKY_HEIGHT_MID);
  return getSkyHeightY(SKY_HEIGHT_HIGH);
};

// ============================
// PERSPECTIVA
// ============================

export const PERSPECTIVE_LINE_FRACTIONS = [0.8, 0.6, 0.4, 0.2];
export const PERSPECTIVE_MIN_SCALE = 0.6;
export const PERSPECTIVE_MAX_SCALE = 1.2;

export const getPerspectiveLinesY = (): number[] =>
  PERSPECTIVE_LINE_FRACTIONS.map(f => getSkyHeightY(f));

export const getScaleForY = (
  y: number,
  minScale = PERSPECTIVE_MIN_SCALE,
  maxScale = PERSPECTIVE_MAX_SCALE,
): number => {
  const ys = getPerspectiveLinesY();
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  if (bottom === top) return (minScale + maxScale) / 2;

  const t = (y - top) / (bottom - top);
  const clamped = Math.max(0, Math.min(1, t));
  return minScale + clamped * (maxScale - minScale);
};

export const PERSPECTIVE_RADIAL_COUNT = 12;



// ============================
// NOVAS FUNÇÕES QUE N SEI ONDE POR
// ============================

export function getGroundYPercentAt(xPercent: number): number {
  const w = window.innerWidth || 1200;
  const h = window.innerHeight || 800;

  const xPx = Math.round(xPercent * w);
  const yPx = getBottomPx(xPx);

  return Math.max(0, Math.min(1, yPx / h));
}