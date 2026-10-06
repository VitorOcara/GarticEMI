export type StrokePoint = {
  x: number;
  y: number;
};

export type Stroke = {
  points: StrokePoint[];
  color: string;
  size: number;
  erase?: boolean;
  clear?: boolean;
};

export type DrawingEvent =
  | { type: "draw"; stroke: Stroke; round: number }
  | { type: "clear_canvas"; round: number };
