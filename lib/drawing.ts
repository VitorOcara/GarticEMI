import type { Stroke, StrokePoint } from "@/types/drawing";

export function drawStrokeOnContext(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  width: number,
  height: number
): void {
  if (stroke.points.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (stroke.erase) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
  }
  ctx.lineWidth = stroke.size;
  ctx.beginPath();
  const first = stroke.points[0];
  ctx.moveTo(first.x * width, first.y * height);
  for (let i = 1; i < stroke.points.length; i++) {
    const p = stroke.points[i];
    ctx.lineTo(p.x * width, p.y * height);
  }
  ctx.stroke();
  ctx.restore();
}

export function denormalizePoint(
  x: number,
  y: number,
  width: number,
  height: number
): StrokePoint {
  return { x: x / width, y: y / height };
}

export function appendPointToStroke(stroke: Stroke, point: StrokePoint): Stroke {
  return { ...stroke, points: [...stroke.points, point] };
}
