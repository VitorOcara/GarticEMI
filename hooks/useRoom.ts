"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RoomPublic } from "@/types/room";
import type { Player } from "@/types/player";

export function useRoom(code: string, roomId: string | null) {
  const [room, setRoom] = useState<RoomPublic | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar sala");
      setRoom(data.room);
      setPlayers(data.players);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!roomId) return;
    const supabase = getSupabaseBrowserClient();

    const roomChannel = supabase
      .channel(`db-room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setRoom((prev) =>
            prev
              ? {
                  ...prev,
                  host_id: row.host_id as string | null,
                  status: row.status as RoomPublic["status"],
                  current_round: row.current_round as number,
                  total_rounds: row.total_rounds as number,
                  drawer_id: row.drawer_id as string | null,
                  round_started_at: row.round_started_at as string | null,
                  round_duration: row.round_duration as number,
                }
              : prev
          );
        }
      )
      .subscribe();

    const playersChannel = supabase
      .channel(`db-players-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(roomChannel);
      void supabase.removeChannel(playersChannel);
    };
  }, [roomId, refresh]);

  return { room, players, loading, error, refresh, setPlayers, setRoom };
}
