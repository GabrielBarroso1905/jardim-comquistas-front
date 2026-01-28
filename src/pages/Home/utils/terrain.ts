// Funções utilitárias para detectar terreno (céu vs terra)

// Constantes dos paths das montanhas
export const MOUNTAIN_PATHS = [
  { d: 'M0,220 Q150,120 300,200 T600,200 T1000,180 L1000,300 L0,300 Z', color: 'rgba(245, 0, 0, 0.8)', isForeground: false }, // fundo 1
  { d: 'M0,240 Q180,140 360,220 T720,220 T1000,200 L1000,300 L0,300 Z', color: 'rgba(0, 255, 0, 0.8)', isForeground: false }, // fundo 2
  { d: 'M0,260 Q200,160 400,240 T800,240 T1000,220 L1000,300 L0,300 Z', color: 'rgba(0, 0, 255, 0.8)', isForeground: false }, // fundo 3
  { d: 'M0,120 C200,40 400,40 600,120 C750,170 900,140 1000,120 L1000,200 L0,200 Z', color: 'rgba(255, 255, 0, 0.8)', isForeground: true }  // primeiro plano
];

// Constantes relacionadas ao terreno (uso em CanvasElements)
export const GROUND_PADDING = 0; // padding horizontal padrão para elementos do chão
export const TREE_MIN_SPACING = 20; // espaçamento mínimo horizontal entre árvores (px)
export const TREE_MAX_VERTICAL_NUDGE = 5; // deslocamento vertical máximo para reduzir sobreposição


// Função auxiliar para criar um Path2D escalado
const createScaledPath = (pathD: string, isForeground: boolean): Path2D => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const basePath = new Path2D(pathD);

  let scaleX: number, scaleY: number, offsetY: number;

  if (isForeground) {
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
  return scaledPath;
};

export const isGround = (x: number, y: number): boolean => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  // Criar paths escalados
  const scaledPaths = MOUNTAIN_PATHS.map(path => createScaledPath(path.d, path.isForeground));

  // Verificar se está em alguma montanha
  for (const scaledPath of scaledPaths) {
    if (ctx.isPointInPath(scaledPath, x, y)) {
      return true; // está na terra
    }
  }

  return false; // está no céu
};

export const isSky = (x: number, y: number): boolean => {
  return !isGround(x, y);
};

// Funções específicas para cada montanha
export const isMountain1 = (x: number, y: number): boolean => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const scaledPath = createScaledPath(MOUNTAIN_PATHS[0].d, MOUNTAIN_PATHS[0].isForeground);
  return ctx.isPointInPath(scaledPath, x, y);
};

export const isMountain2 = (x: number, y: number): boolean => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const scaledPath = createScaledPath(MOUNTAIN_PATHS[1].d, MOUNTAIN_PATHS[1].isForeground);
  return ctx.isPointInPath(scaledPath, x, y);
};

export const isMountain3 = (x: number, y: number): boolean => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const scaledPath = createScaledPath(MOUNTAIN_PATHS[2].d, MOUNTAIN_PATHS[2].isForeground);
  return ctx.isPointInPath(scaledPath, x, y);
};

export const isMountainForeground = (x: number, y: number): boolean => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const scaledPath = createScaledPath(MOUNTAIN_PATHS[3].d, MOUNTAIN_PATHS[3].isForeground);
  return ctx.isPointInPath(scaledPath, x, y);
};

// Função para encontrar o y do chão para um dado x
export const getBottomPx = (x: number): number => {
  const h = window.innerHeight;
  // Começar do fundo e subir até encontrar terra
  for (let y = h - 1; y >= 0; y--) {
    if (isGround(x, y)) {
      return y;
    }
  }
  return h - 50; // fallback se não encontrar
};

// Função para encontrar o y do topo da montanha do primeiro plano para um dado x
export const getTopPxForeground = (x: number): number => {
  // Começar do topo e descer até encontrar a montanha do primeiro plano
  for (let y = 0; y < window.innerHeight; y++) {
    if (isMountainForeground(x, y)) {
      return y;
    }
  }
  return 0; // fallback
};

// Retorna o Y máximo permitido para elementos do céu naquele X.
// Esse valor fica acima do topo da montanha de primeiro plano, com uma margem.
export const getSkyMaxY = (x: number, margin = 20): number => {
  const top = getTopPxForeground(x);
  const maxY = Math.max(0, top - margin);
  return maxY;
};

// Defaults e helpers para posicionamento de elementos do céu
export const SKY_PADDING = GROUND_PADDING; // padding horizontal padrão
export const SKY_MARGIN = 28; // margem vertical acima do topo da montanha
export const SKY_MIN_Y = 8; // Y mínimo permitido para elementos do céu
export const MIN_SKY_SPACING = 24; // espaçamento mínimo horizontal entre elementos do céu

export const getSkyYBounds = (x: number, margin = SKY_MARGIN, minY = SKY_MIN_Y) => {
  const maxY = getSkyMaxY(x, margin);
  return { minY, maxY };
};

// Retorna limites horizontais (minX, maxX) para posicionamento de elementos do céu.
export const getSkyXBounds = (padding = SKY_PADDING): { minX: number; maxX: number; viewportWidth: number } => {
  const viewportWidth = window.innerWidth || 1200;
  const minX = padding;
  const maxX = Math.max(viewportWidth - padding, minX + 1);
  return { minX, maxX, viewportWidth };
};

// Verifica se uma posição (x,y) está disponível para colocar algo no céu.
export const canPlaceInSky = (x: number, y: number, margin = 20): boolean => {
  const maxY = getSkyMaxY(x, margin);
  if (y < 0 || y > maxY) return false;
  return isSky(x, y);
};

// Linhas de altura do céu (frações da altura da viewport)
export const SKY_HEIGHT_LOW = 0.60;
export const SKY_HEIGHT_MID = 0.40;
export const SKY_HEIGHT_HIGH = 0.20;

// Converte uma fração (0..1) em Y em pixels
export const getSkyHeightY = (fraction: number): number => {
  const h = window.innerHeight || 800;
  return Math.max(0, Math.min(h, Math.round(h * fraction)));
};

// Retorna Y para nível 'low' | 'mid' | 'high'
export const getSkyHeightLevelY = (level: 'low' | 'mid' | 'high') => {
  if (level === 'low') return getSkyHeightY(SKY_HEIGHT_LOW);
  if (level === 'mid') return getSkyHeightY(SKY_HEIGHT_MID);
  return getSkyHeightY(SKY_HEIGHT_HIGH);
};

// Linhas de perspectiva (frações da altura da viewport) - do mais próximo (baixo) ao mais distante (alto)
export const PERSPECTIVE_LINE_FRACTIONS = [0.80, 0.60, 0.40, 0.20];
export const PERSPECTIVE_MIN_SCALE = 0.6; // escala mínima (mais distante)
export const PERSPECTIVE_MAX_SCALE = 1.2; // escala máxima (mais próximo)

export const getPerspectiveLinesY = (): number[] => PERSPECTIVE_LINE_FRACTIONS.map(f => getSkyHeightY(f));

// Retorna um fator de escala baseado em uma coordenada Y.
// map: y == topMostLine -> PERSPECTIVE_MIN_SCALE, y == bottomMostLine -> PERSPECTIVE_MAX_SCALE
export const getScaleForY = (y: number, minScale = PERSPECTIVE_MIN_SCALE, maxScale = PERSPECTIVE_MAX_SCALE): number => {
  const ys = getPerspectiveLinesY();
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  if (bottom === top) return (minScale + maxScale) / 2;
  const t = (y - top) / (bottom - top);
  const clamped = Math.max(0, Math.min(1, t));
  return minScale + clamped * (maxScale - minScale);
};

// Número de linhas radiais de perspectiva (linhas que convergem para o ponto de fuga)
export const PERSPECTIVE_RADIAL_COUNT = 12;

