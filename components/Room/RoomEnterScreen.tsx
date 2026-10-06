"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getOrCreatePlayerId,
  getPlayerName,
  rememberRoomSession,
} from "@/lib/session";

type Props = {
  roomCode: string;
  onJoined: (playerId: string, playerName: string) => void;
};

export function RoomEnterScreen({ roomCode, onJoined }: Props) {
  const savedName = getPlayerName() ?? "";
  const [name, setName] = useState(savedName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enter = async (useName: string) => {
    const trimmed = useName.trim();
    if (!trimmed) {
      setError("Informe seu apelido");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const playerId = getOrCreatePlayerId();
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: trimmed, playerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível entrar");
      rememberRoomSession(roomCode, data.player.id, trimmed);
      onJoined(data.player.id, trimmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">Entrar na sala</h2>
        <p className="mt-1 font-mono text-lg text-indigo-600">{roomCode}</p>
      </div>

      {savedName ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void enter(savedName)}
          className="w-full rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Entrando..." : `Continuar como ${savedName}`}
        </button>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          {savedName ? "Ou use outro apelido" : "Seu apelido"}
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Seu apelido"
        />
      </label>

      <button
        type="button"
        disabled={loading}
        onClick={() => void enter(name)}
        className="w-full rounded-2xl border-2 border-indigo-600 py-3 text-lg font-bold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Entrar na sala"}
      </button>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="text-center text-xs text-slate-500">
        Seu apelido fica salvo neste navegador.{" "}
        <Link href="/jogar" className="text-indigo-600 hover:underline">
          Menu do jogo
        </Link>
      </p>
    </div>
  );
}
