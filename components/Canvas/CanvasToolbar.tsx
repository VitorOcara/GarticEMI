"use client";

import { Eraser, Paintbrush, Trash2 } from "lucide-react";

const COLORS = [
  { id: "preto", value: "#1a1a1a", label: "Preto" },
  { id: "vermelho", value: "#ef4444", label: "Vermelho" },
  { id: "azul", value: "#3b82f6", label: "Azul" },
  { id: "verde", value: "#22c55e", label: "Verde" },
];

type Props = {
  color: string;
  size: number;
  eraser: boolean;
  disabled?: boolean;
  onColor: (c: string) => void;
  onSize: (s: number) => void;
  onEraser: (on: boolean) => void;
  onClear: () => void;
};

export function CanvasToolbar({
  color,
  size,
  eraser,
  disabled,
  onColor,
  onSize,
  onEraser,
  onClear,
}: Props) {
  return (
    <aside className="flex shrink-0 cursor-default flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Cores
      </p>
      <div className="flex flex-col gap-2">
        {COLORS.map((c) => {
          const active = !eraser && color === c.value;
          return (
            <button
              key={c.id}
              type="button"
              disabled={disabled}
              title={c.label}
              aria-label={`Pincel ${c.label}`}
              onClick={() => {
                onEraser(false);
                onColor(c.value);
              }}
              className={`cursor-pointer rounded-xl p-1.5 transition ${
                active
                  ? "bg-indigo-50 ring-2 ring-indigo-500 ring-offset-1"
                  : "hover:bg-slate-50"
              }`}
            >
              <Paintbrush
                className={`h-7 w-7 ${active ? "scale-110" : ""}`}
                style={{ color: c.value }}
                strokeWidth={2}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      <div className="my-1 h-px w-full bg-slate-100" />

      <button
        type="button"
        disabled={disabled}
        title="Borracha"
        aria-label="Borracha"
        onClick={() => onEraser(!eraser)}
        className={`cursor-pointer rounded-xl p-2 ${
          eraser ? "bg-amber-100 ring-2 ring-amber-400 ring-offset-1" : "hover:bg-slate-50"
        }`}
      >
        <Eraser
          className={`h-7 w-7 ${eraser ? "text-amber-800" : "text-slate-600"}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      <div className="flex flex-col items-center gap-1 px-1">
        <span className="text-[10px] font-medium text-slate-500">Tamanho</span>
        <input
          type="range"
          min={2}
          max={24}
          value={size}
          disabled={disabled}
          onChange={(e) => onSize(Number(e.target.value))}
          className="h-24 w-8 cursor-pointer accent-indigo-600"
          style={{ writingMode: "vertical-lr", direction: "rtl" }}
        />
        <span className="font-mono text-xs text-slate-600">{size}</span>
      </div>

      <div className="mt-auto pt-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          className="flex cursor-pointer items-center gap-1 rounded-xl bg-red-50 px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
          title="Limpar quadro"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Limpar
        </button>
      </div>
    </aside>
  );
}
