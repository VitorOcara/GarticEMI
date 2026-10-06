"use client";

import { useState } from "react";
import { PlayerList } from "./PlayerList";
import type { RoomPublic } from "@/types/room";
import type { Player } from "@/types/player";

type Props = {
  room: RoomPublic;
  players: Player[];
  playerId: string;
  onStart: () => Promise<void>;
};

export function RoomLobby({ room, players, playerId, onStart }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isHost = room.host_id === playerId;
  const connectedCount = players.filter((p) => p.connected).length;

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      await onStart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao iniciar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-500">Código da sala</p>
        <p className="font-mono text-4xl font-black tracking-widest text-indigo-600">
          {room.code}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Compartilhe o código ou o link com seus amigos
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Jogadores</h2>
        <PlayerList
          players={players}
          hostId={room.host_id}
          drawerId={null}
          currentPlayerId={playerId}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-center text-sm text-red-700">
          {error}
        </p>
      )}

      {isHost ? (
        <button
          type="button"
          disabled={loading || connectedCount < 2}
          onClick={() => void handleStart()}
          className="w-full rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Iniciando..." : "INICIAR PARTIDA"}
        </button>
      ) : (
        <p className="text-center text-slate-600">Aguardando o host iniciar a partida...</p>
      )}

      {isHost && connectedCount < 2 && (
        <p className="text-center text-sm text-amber-700">
          São necessários pelo menos 2 jogadores conectados.
        </p>
      )}
    </div>
  );
}
