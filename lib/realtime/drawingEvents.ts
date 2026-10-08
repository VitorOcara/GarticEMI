import type { Stroke } from "@/types/drawing";

export const DRAW_STROKE_EVENT = "draw-stroke";
export const DRAW_CLEAR_EVENT = "draw-clear";

export type DrawStrokePayload = {
  round: number;
  stroke: Stroke;
};

export type DrawClearPayload = {
  round: number;
};
