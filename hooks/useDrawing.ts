"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { drawStrokeOnContext } from "@/lib/drawing";
import {
  DRAW_CLEAR_EVENT,
  DRAW_STROKE_EVENT,
  type DrawClearPayload,
  type DrawStrokePayload,
} from "@/lib/realtime/drawingEvents";
import type { Stroke } from "@/types/drawing";

type UseDrawingOptions = {
  roomId: string | null;
  round: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** true = desenhista (envia broadcast); false = espectadores (recebem) */
  enabled: boolean;
  onRemoteClear?: () => void;
};

function getLogicalCanvasSize(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  return { w: canvas.width / dpr, h: canvas.height / dpr };
}

export function useDrawing({
  roomId,
  round,
  canvasRef,
  enabled,
  onRemoteClear,
}: UseDrawingOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const roundRef = useRef(round);
  const isDrawerRef = useRef(enabled);
  const applyStrokeRef = useRef<(stroke: Stroke) => void>(() => {});

  roundRef.current = round;
  isDrawerRef.current = enabled;

  const applyStroke = useCallback(
    (stroke: Stroke) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (stroke.clear) {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        onRemoteClear?.();
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { w, h } = getLogicalCanvasSize(canvas);
      drawStrokeOnContext(ctx, stroke, w, h);
    },
    [canvasRef, onRemoteClear]
  );

  applyStrokeRef.current = applyStroke;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [round, canvasRef]);

  useEffect(() => {
    if (!roomId) return;
    const supabase = getSupabaseBrowserClient();
    const channel = supabase.channel(`drawing:${roomId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: DRAW_STROKE_EVENT }, (message) => {
        if (isDrawerRef.current) return;
        const payload = message.payload as DrawStrokePayload;
        if (payload.round !== roundRef.current) return;
        applyStrokeRef.current(payload.stroke);
      })
      .on("broadcast", { event: DRAW_CLEAR_EVENT }, (message) => {
        if (isDrawerRef.current) return;
        const payload = message.payload as DrawClearPayload;
        if (payload.round !== roundRef.current) return;
        applyStrokeRef.current({ points: [], color: "", size: 0, clear: true });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  const sendStroke = useCallback(
    async (_code: string, _playerId: string, stroke: Stroke) => {
      if (!enabled || !roomId) return;
      const channel = channelRef.current;
      if (!channel) return;
      const payload: DrawStrokePayload = { round: roundRef.current, stroke };
      void channel.send({
        type: "broadcast",
        event: DRAW_STROKE_EVENT,
        payload,
      });
    },
    [enabled, roomId]
  );

  const clearCanvasRemote = useCallback(
    async (_code: string, _playerId: string) => {
      if (!enabled || !roomId) return;
      const channel = channelRef.current;
      if (!channel) return;
      const payload: DrawClearPayload = { round: roundRef.current };
      void channel.send({
        type: "broadcast",
        event: DRAW_CLEAR_EVENT,
        payload,
      });
    },
    [enabled, roomId]
  );

  return { sendStroke, clearCanvasRemote, applyStroke };
}
