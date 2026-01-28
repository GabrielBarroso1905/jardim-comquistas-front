import type { TreeRecord } from "../../../types/TreeRecord";

export function getMousePos(canvas: HTMLCanvasElement, e: PointerEvent | MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

export function hitTest(records: TreeRecord[], x: number, y: number): TreeRecord | null {
  return (
    records.find((t) => {
      const left = t.x - t.w / 2;
      const right = t.x + t.w / 2;
      const top = t.y - t.h + 8;
      const bottom = t.y + 8;

      return x >= left && x <= right && y >= top && y <= bottom;
    }) || null
  );
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
