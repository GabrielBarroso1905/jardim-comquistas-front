import TREE_SVGS from './treeSvgs';

export const TREE_IMAGES: Record<string, HTMLImageElement> = {};
let loaded = false;
export function preloadTrees(): Promise<void> {
  if (loaded) return Promise.resolve();

  const promises = Object.entries(TREE_SVGS).map(([key, svg]) => {
    return new Promise<void>((res, rej) => {
      const img = new Image();

      img.onload = () => {
        TREE_IMAGES[key] = img;
        res();
      };

      img.onerror = (e) => {
        console.error('Erro ao carregar SVG:', key, e);
        res(); // não trava tudo
      };

      img.src =
        'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(svg);
    });
  });

  return Promise.all(promises).then(() => {
    loaded = true;
  });
}
