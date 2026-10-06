"use client";

import { Eraser, Paintbrush } from "lucide-react";

type Props = {
  x: number;
  y: number;
  /** Mesmo valor do slider Tamanho (espessura do traço em px). */
  toolSize: number;
  color: string;
  eraser: boolean;
};

export function CanvasToolIndicator({ x, y, toolSize, color, eraser }: Props) {
  const d = Math.max(toolSize, 4);
  const iconSize = Math.min(16, Math.max(8, d * 0.55));

  return (
    <div
      className="pointer-events-none absolute z-10 flex items-center justify-center"
      style={{
        left: x,
        top: y,
        width: d,
        height: d,
        transform: "translate(-50%, -50%)",
      }}
      aria-hidden
    >
      <div
        className={`absolute inset-0 rounded-full ${
          eraser
            ? "border-2 border-slate-500 bg-white/50"
            : "border border-white shadow-sm"
        }`}
        style={
          eraser
            ? undefined
            : {
                backgroundColor: color,
              }
        }
      />
      {eraser ? (
        <Eraser
          className="relative text-slate-600"
          style={{ width: iconSize, height: iconSize }}
          strokeWidth={2}
        />
      ) : (
        <Paintbrush
          className="relative text-white drop-shadow"
          style={{ width: iconSize, height: iconSize }}
          strokeWidth={2.5}
        />
      )}
    </div>
  );
}
