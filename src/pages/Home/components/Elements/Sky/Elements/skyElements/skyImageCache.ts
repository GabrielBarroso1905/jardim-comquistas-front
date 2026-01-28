import SKY_SVGS from './skySvgs';

export const SKY_IMAGES: Record<string, HTMLImageElement> = {};
let loaded = false;
export function preloadSkies(): Promise<void> {
  if (loaded) return Promise.resolve();

  const promises = Object.entries(SKY_SVGS).map(([key, svg]) => {
    return new Promise<void>((res) => {
      const img = new Image();
      img.onload = () => {
        SKY_IMAGES[key] = img;
        res();
      };
      img.onerror = (e) => {
        console.error('Erro ao carregar SVG (sky):', key, e);
        res();
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  });

  return Promise.all(promises).then(() => {
    loaded = true;
  });
}
