import type { TreeRecord } from "../../../types/TreeRecord";

export function getMousePos(canvas: HTMLCanvasElement, e: PointerEvent | MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

export function hitTest(
  records: any[],
  x: number,
  y: number
): any | null {
  for (let i = records.length - 1; i >= 0; i--) {
    const t = records[i];
    const anchor = t.anchorY ?? 0.9;

    const left = t.x - t.w / 2;
    const right = t.x + t.w / 2;

    const top = t.y - t.h * anchor;
    const bottom = top + t.h;

    if (x >= left && x <= right && y >= top && y <= bottom) {
      return t;
    }
  }
  return null;
}

export function drawFallback(ctx: CanvasRenderingContext2D, t: TreeRecord) {
  ctx.fillStyle = "#8b5a2b";
  ctx.fillRect(t.x - 4, t.y - 18, 8, 18);

  ctx.fillStyle = "#197b2e";
  ctx.beginPath();
  ctx.arc(t.x, t.y - 24, 18, 0, Math.PI * 2);
  ctx.fill();
}

export default { getMousePos, hitTest, drawFallback };
