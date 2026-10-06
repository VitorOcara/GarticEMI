"use client";

import { useCallback, useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { drawStrokeOnContext } from "@/lib/drawing";
import type { Stroke } from "@/types/drawing";

type UseDrawingOptions = {
  roomId: string | null;
  round: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  enabled: boolean;
  onRemoteClear?: () => void;
};

export function useDrawing({
  roomId,
  round,
  canvasRef,
  enabled,
  onRemoteClear,
}: UseDrawingOptions) {
  const strokesLoaded = useRef(false);

  const redrawAll = useCallback(
    (strokes: Stroke[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const stroke of strokes) {
        if (stroke.clear) continue;
        drawStrokeOnContext(ctx, stroke, canvas.width, canvas.height);
      }
    },
    [canvasRef]
  );

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
      drawStrokeOnContext(ctx, stroke, canvas.width, canvas.height);
    },
    [canvasRef, onRemoteClear]
  );

  useEffect(() => {
    strokesLoaded.current = false;
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

    const loadExisting = async () => {
      const { data } = await supabase
        .from("drawing_strokes")
        .select("stroke")
        .eq("room_id", roomId)
        .eq("round_number", round)
        .order("created_at", { ascending: true });
      if (data && !strokesLoaded.current) {
        strokesLoaded.current = true;
        redrawAll(data.map((r) => r.stroke as Stroke));
      }
    };
    void loadExisting();

    if (!enabled) {
      const channel = supabase
        .channel(`strokes-${roomId}-${round}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "drawing_strokes",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            const row = payload.new as { round_number: number; stroke: Stroke };
            if (row.round_number !== round) return;
            applyStroke(row.stroke);
          }
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    }
  }, [roomId, round, applyStroke, redrawAll, enabled]);

  const sendStroke = useCallback(
    async (code: string, playerId: string, stroke: Stroke) => {
      if (!enabled) return;
      await fetch(`/api/rooms/${encodeURIComponent(code)}/stroke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, stroke, round }),
      });
    },
    [enabled, round]
  );

  const clearCanvasRemote = useCallback(
    async (code: string, playerId: string) => {
      if (!enabled) return;
      await fetch(`/api/rooms/${encodeURIComponent(code)}/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, round }),
      });
    },
    [enabled, round]
  );

  return { sendStroke, clearCanvasRemote, applyStroke };
}
