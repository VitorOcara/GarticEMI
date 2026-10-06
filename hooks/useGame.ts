"use client";

import { useEffect, useState } from "react";
import { remainingSeconds } from "@/lib/game";
import type { RoomPublic } from "@/types/room";

export function useGame(room: RoomPublic | null, code: string, playerId: string | null) {
  const [secretWord, setSecretWord] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!room || room.status !== "playing" || !playerId) {
      setSecretWord(null);
      return;
    }
    if (room.drawer_id !== playerId) {
      setSecretWord(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      const res = await fetch(
        `/api/rooms/${encodeURIComponent(code)}/word?playerId=${encodeURIComponent(playerId)}`
      );
      const data = await res.json();
      if (!cancelled && data.word) setSecretWord(data.word);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [room?.status, room?.drawer_id, room?.current_round, code, playerId, room]);

  useEffect(() => {
    if (!room?.round_started_at || room.status !== "playing") {
      setSecondsLeft(room?.round_duration ?? 0);
      return;
    }

    const tick = () => {
      setSecondsLeft(remainingSeconds(room.round_started_at, room.round_duration));
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [room?.round_started_at, room?.round_duration, room?.status, room?.current_round]);

  useEffect(() => {
    if (!code || !playerId || room?.status !== "playing") return;
    const ping = () => {
      void fetch(`/api/rooms/${encodeURIComponent(code)}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
    };
    ping();
    const id = window.setInterval(ping, 4000);
    return () => window.clearInterval(id);
  }, [code, playerId, room?.status, room?.current_round]);

  return { secretWord, secondsLeft };
}
