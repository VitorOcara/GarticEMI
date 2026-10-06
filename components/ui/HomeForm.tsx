"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPlayerName, setPlayerName } from "@/lib/session";

export function HomeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = getPlayerName();
    if (saved) setName(saved);
  }, []);

  const play = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Informe seu apelido para jogar");
      return;
    }
    setError(null);
    setPlayerName(trimmed);
    router.push("/jogar");
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-indigo-600">GARTIC</h1>
        <p className="mt-2 text-slate-600">Desenhe e adivinhe com seus amigos</p>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Nome</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") play();
          }}
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Seu apelido"
          maxLength={24}
        />
      </label>

      <button
        type="button"
        onClick={play}
        className="w-full rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white hover:bg-indigo-700"
      >
        Jogar
      </button>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
