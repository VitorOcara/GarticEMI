"use client";

import { useState } from "react";
import { ScoreBoard } from "@/components/Game/ScoreBoard";
import type { Player } from "@/types/player";
import type { RoomPublic } from "@/types/room";

type Props = {
  room: RoomPublic;
  players: Player[];
  playerId: string;
  playerName: string;
  roomCode: string;
  onPlayAgain: () => Promise<void>;
};

export function GameFinished({
  room,
  players,
  playerId,
  playerName,
  roomCode,
  onPlayAgain,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isHost = room.host_id === playerId;

  const handleRematch = async () => {
    setLoading(true);
    setError(null);
    try {
      await onPlayAgain();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao reiniciar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <p className="text-center text-slate-600">
        Fim de partida, <strong>{playerName}</strong>. Você continua nesta sala — não precisa
        voltar à página inicial.
      </p>
      <ScoreBoard players={players} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <p className="text-sm text-slate-500">Continuar na mesma sala</p>
        <p className="font-mono text-2xl font-bold tracking-widest text-indigo-600">
          {roomCode}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Os jogadores permanecem na sala; os pontos serão zerados.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-center text-sm text-red-700">
          {error}
        </p>
      )}

      {isHost ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleRematch()}
          className="w-full rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Preparando..." : "Jogar novamente"}
        </button>
      ) : (
        <p className="text-center text-slate-600">
          Aguardando o host clicar em <strong>Jogar novamente</strong>...
        </p>
      )}

    </div>
  );
}
