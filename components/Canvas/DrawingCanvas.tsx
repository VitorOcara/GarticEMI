"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { denormalizePoint, appendPointToStroke, drawStrokeOnContext } from "@/lib/drawing";
import type { Stroke } from "@/types/drawing";
import { CanvasToolbar } from "./CanvasToolbar";
import { CanvasToolIndicator } from "./CanvasToolIndicator";

export type DrawingCanvasHandle = {
  clearLocal: () => void;
};

type Props = {
  canDraw: boolean;
  roomCode: string;
  playerId: string;
  round: number;
  sendStroke: (code: string, playerId: string, stroke: Stroke) => Promise<void>;
  clearCanvasRemote: (code: string, playerId: string) => Promise<void>;
};

type PointerPos = { x: number; y: number };

export const DrawingCanvas = forwardRef<HTMLCanvasElement, Props>(function DrawingCanvas(
  { canDraw, roomCode, playerId, round, sendStroke, clearCanvasRemote },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);
  /** Índice do último ponto já enviado como fim de segmento aos outros jogadores */
  const lastSentPointIndexRef = useRef(-1);

  const [color, setColor] = useState("#1a1a1a");
  const [size, setSize] = useState(5);
  const [eraser, setEraser] = useState(false);
  const [pointer, setPointer] = useState<PointerPos | null>(null);

  const getCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { w: 0, h: 0, dpr: 1 };
    const dpr = window.devicePixelRatio || 1;
    return {
      w: canvas.width / dpr,
      h: canvas.height / dpr,
      dpr,
    };
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    if (w <= 0 || h <= 0) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }, []);

  const clearCanvasWhite = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const { w, h } = getCanvasSize();
    if (ctx && w > 0 && h > 0) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
  }, [getCanvasSize]);

  useEffect(() => {
    resizeCanvas();
    clearCanvasWhite();
    const ro = new ResizeObserver(() => resizeCanvas());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", resizeCanvas);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [resizeCanvas, clearCanvasWhite, round]);

  useEffect(() => {
    setPointer(null);
  }, [round, canDraw]);

  const updatePointerFromEvent = (clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container || !canDraw) return;
    const rect = container.getBoundingClientRect();
    setPointer({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  };

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return denormalizePoint(
      e.clientX - rect.left,
      e.clientY - rect.top,
      rect.width,
      rect.height
    );
  };

  const flushStrokeSegments = useCallback(
    (stroke: Stroke) => {
      while (stroke.points.length > lastSentPointIndexRef.current + 1) {
        const fromIdx =
          lastSentPointIndexRef.current < 0 ? 0 : lastSentPointIndexRef.current;
        const segment: Stroke = {
          ...stroke,
          points: [stroke.points[fromIdx], stroke.points[fromIdx + 1]],
        };
        lastSentPointIndexRef.current = fromIdx + 1;
        void sendStroke(roomCode, playerId, segment);
      }
    },
    [roomCode, playerId, sendStroke]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    updatePointerFromEvent(e.clientX, e.clientY);
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastSentPointIndexRef.current = -1;
    const pt = getPoint(e);
    if (!pt) return;
    currentStrokeRef.current = {
      points: [pt],
      color: eraser ? "#000" : color,
      size,
      erase: eraser,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    updatePointerFromEvent(e.clientX, e.clientY);
    if (!canDraw || !drawingRef.current || !currentStrokeRef.current) return;
    const pt = getPoint(e);
    if (!pt) return;
    const stroke = appendPointToStroke(currentStrokeRef.current, pt);
    currentStrokeRef.current = stroke;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const { w, h } = getCanvasSize();
    if (canvas && ctx && stroke.points.length >= 2) {
      const segment: Stroke = {
        ...stroke,
        points: stroke.points.slice(-2),
      };
      drawStrokeOnContext(ctx, segment, w, h);
    }

    flushStrokeSegments(stroke);
  };

  const finishStroke = () => {
    if (!drawingRef.current || !currentStrokeRef.current) return;
    drawingRef.current = false;
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    if (stroke.points.length >= 2) {
      flushStrokeSegments(stroke);
    }
    lastSentPointIndexRef.current = -1;
  };

  const onPointerLeaveCanvas = () => {
    setPointer(null);
    void finishStroke();
  };

  const handleClear = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const { w, h } = getCanvasSize();
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    await clearCanvasRemote(roomCode, playerId);
  };

  return (
    <div className="flex w-full justify-center">
      <div className="flex max-w-full items-stretch justify-center gap-3">
        {canDraw && (
          <CanvasToolbar
            color={color}
            size={size}
            eraser={eraser}
            onColor={setColor}
            onSize={setSize}
            onEraser={setEraser}
            onClear={() => void handleClear()}
          />
        )}
        <div
          ref={containerRef}
          className="relative aspect-[4/3] h-[min(60vh,504px)] w-[min(calc(min(60vh,504px)*4/3),100%)] max-w-full shrink-0 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-inner"
        >
          {canDraw && pointer && (
            <CanvasToolIndicator
              x={pointer.x}
              y={pointer.y}
              toolSize={size}
              color={color}
              eraser={eraser}
            />
          )}
          <canvas
            ref={canvasRef}
            className={`block h-full w-full touch-none ${canDraw ? "cursor-none" : "cursor-default"}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => void finishStroke()}
            onPointerLeave={onPointerLeaveCanvas}
          />
        </div>
      </div>
    </div>
  );
});
