"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getOrCreatePlayerId,
  getPlayerName,
  rememberRoomSession,
} from "@/lib/session";
import { normalizeRoomCode } from "@/lib/room";

export function PlayMenuForm() {
  const router = useRouter();
  const [playerName, setPlayerNameState] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const name = getPlayerName();
    if (!name) {
      router.replace("/");
      return;
    }
    setPlayerNameState(name);
  }, [router]);

  const createRoom = async () => {
    if (!playerName) return;
    setLoading("create");
    setError(null);
    try {
      const playerId = getOrCreatePlayerId();
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName, playerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar sala");
      rememberRoomSession(data.code, data.player.id, playerName);
      router.push(`/sala/${data.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(null);
    }
  };

  const joinRoom = async () => {
    if (!playerName || !code.trim()) {
      setError("Informe o código da sala");
      return;
    }
    setLoading("join");
    setError(null);
    try {
      const playerId = getOrCreatePlayerId();
      const normalized = normalizeRoomCode(code);
      const res = await fetch(`/api/rooms/${encodeURIComponent(normalized)}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName, playerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao entrar");
      rememberRoomSession(normalized, data.player.id, playerName);
      router.push(`/sala/${normalized}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(null);
    }
  };

  if (!playerName) {
    return <p className="text-center text-slate-600">Carregando...</p>;
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Olá, {playerName}!</h1>
        <p className="mt-2 text-slate-600">Crie uma sala ou entre com um código</p>
        <Link href="/" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
          Trocar apelido
        </Link>
      </div>

      <button
        type="button"
        disabled={loading !== null}
        onClick={() => void createRoom()}
        className="w-full rounded-2xl bg-indigo-600 py-3 text-lg font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading === "create" ? "Criando..." : "Criar sala"}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-slate-500">ou entre em uma sala</span>
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Código da sala</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") void joinRoom();
          }}
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-lg uppercase outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="ABC123"
          maxLength={8}
        />
      </label>

      <button
        type="button"
        disabled={loading !== null}
        onClick={() => void joinRoom()}
        className="w-full rounded-2xl border-2 border-indigo-600 py-3 text-lg font-bold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
      >
        {loading === "join" ? "Entrando..." : "Entrar"}
      </button>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
