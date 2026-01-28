// Funções utilitárias para detectar terreno (céu vs terra)

// Constantes dos paths das montanhas
export const MOUNTAIN_PATHS = [
  { d: 'M0,220 Q150,120 300,200 T600,200 T1000,180 L1000,300 L0,300 Z', color: 'rgba(255, 0, 0, 0.8)', isForeground: false }, // fundo 1
  { d: 'M0,240 Q180,140 360,220 T720,220 T1000,200 L1000,300 L0,300 Z', color: 'rgba(0, 255, 0, 0.8)', isForeground: false }, // fundo 2
  { d: 'M0,260 Q200,160 400,240 T800,240 T1000,220 L1000,300 L0,300 Z', color: 'rgba(0, 0, 255, 0.8)', isForeground: false }, // fundo 3
  { d: 'M0,120 C200,40 400,40 600,120 C750,170 900,140 1000,120 L1000,200 L0,200 Z', color: 'rgba(255, 255, 0, 0.8)', isForeground: true }  // primeiro plano
];

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