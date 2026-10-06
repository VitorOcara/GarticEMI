"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { useGame } from "@/hooks/useGame";
import { RoomLobby } from "@/components/Room/RoomLobby";
import { GameBoard } from "@/components/Game/GameBoard";
import { GameFinished } from "@/components/Game/GameFinished";
import { RoomEnterScreen } from "@/components/Room/RoomEnterScreen";
import { RoomPlayerBadge } from "@/components/Room/RoomPlayerBadge";
import {
  clearRoomSession,
  getPlayerName,
  rememberRoomSession,
  resolvePlayerIdForRoom,
} from "@/lib/session";
import { normalizeRoomCode } from "@/lib/room";
import { getPlayer } from "@/hooks/usePlayers";

type Props = { code: string };

export function RoomPageClient({ code }: Props) {
  const router = useRouter();
  const normalized = useMemo(() => normalizeRoomCode(code), [code]);
  const [mounted, setMounted] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const reconnectAttempted = useRef(false);

  useEffect(() => {
    setMounted(true);
    reconnectAttempted.current = false;
    const name = getPlayerName();
    setPlayerName(name);
    if (name) {
      setPlayerId(resolvePlayerIdForRoom(normalized));
    } else {
      setPlayerId(null);
    }
  }, [normalized]);

  const { room, players, loading, error, refresh } = useRoom(normalized, roomId);
  const { secretWord, secondsLeft } = useGame(room, normalized, playerId);

  useEffect(() => {
    if (room?.id) setRoomId(room.id);
  }, [room?.id]);

  const ensureConnected = useCallback(async () => {
    const name = getPlayerName();
    if (!name || !playerId || !room || loading) return;
    const me = getPlayer(players, playerId);
    if (me?.connected) {
      rememberRoomSession(normalized, playerId, name);
      return;
    }
    if (reconnectAttempted.current) return;
    reconnectAttempted.current = true;
    setReconnecting(true);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(normalized)}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: name, playerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao reconectar");
      rememberRoomSession(normalized, data.player.id, name);
      setPlayerId(data.player.id);
      await refresh();
    } catch {
      setPlayerId(null);
      setPlayerName(null);
    } finally {
      setReconnecting(false);
    }
  }, [normalized, playerId, players, room, loading, refresh]);

  useEffect(() => {
    if (!mounted || !playerId || !playerName || !room) return;
    void ensureConnected();
  }, [mounted, playerId, playerName, room?.id, loading, players, ensureConnected]);

  useEffect(() => {
    if (!playerId) return;
    const leave = () => {
      void fetch(`/api/rooms/${encodeURIComponent(normalized)}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
        keepalive: true,
      });
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [normalized, playerId]);

  const handleLeave = () => {
    if (playerId) {
      void fetch(`/api/rooms/${encodeURIComponent(normalized)}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
    }
    clearRoomSession(normalized);
    router.push("/jogar");
  };

  const handleJoined = (id: string, name: string) => {
    setPlayerId(id);
    setPlayerName(name);
    void refresh();
  };

  const startGame = async () => {
    if (!playerId) return;
    const res = await fetch(`/api/rooms/${encodeURIComponent(normalized)}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Erro ao iniciar");
    await refresh();
  };

  const playAgain = async () => {
    if (!playerId) return;
    const res = await fetch(`/api/rooms/${encodeURIComponent(normalized)}/rematch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Erro ao reiniciar");
    if (playerName) rememberRoomSession(normalized, playerId, playerName);
    await refresh();
  };

  if (!mounted) {
    return <p className="text-center text-slate-600">Carregando...</p>;
  }

  const me = playerId ? getPlayer(players, playerId) : undefined;
  const displayName = me?.name ?? playerName;

  if (!playerId || !displayName) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4">
        <RoomEnterScreen roomCode={normalized} onJoined={handleJoined} />
      </main>
    );
  }

  if (loading && !room) {
    return <p className="text-center text-slate-600">Carregando sala...</p>;
  }

  if (reconnecting) {
    return <p className="text-center text-slate-600">Reconectando...</p>;
  }

  if (error || !room) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 text-center shadow">
        <p className="text-red-600">{error ?? "Sala não encontrada"}</p>
        <Link href="/jogar" className="mt-4 inline-block text-indigo-600">
          Menu do jogo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sala {room.code}</h1>
          <p className="text-sm text-slate-500">Gartic — uso pessoal</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {displayName && <RoomPlayerBadge name={displayName} />}
          <button
            type="button"
            onClick={handleLeave}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Sair da sala
          </button>
        </div>
      </header>

      {room.status === "waiting" && (
        <RoomLobby room={room} players={players} playerId={playerId} onStart={startGame} />
      )}

      {room.status === "playing" && (
        <GameBoard
          room={room}
          players={players}
          playerId={playerId}
          roomCode={normalized}
          secretWord={secretWord}
          secondsLeft={secondsLeft}
        />
      )}

      {room.status === "finished" && (
        <GameFinished
          room={room}
          players={players}
          playerId={playerId}
          playerName={displayName}
          roomCode={normalized}
          onPlayAgain={playAgain}
        />
      )}
    </div>
  );
}
