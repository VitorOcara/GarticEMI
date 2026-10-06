"use client";

import Link from "next/link";
import { getLastRoomCode, getPlayerName } from "@/lib/session";

export function ContinueLastRoom() {
  const code = getLastRoomCode();
  const name = getPlayerName();
  if (!code || !name) return null;

  return (
    <div className="mx-auto mb-6 w-full max-w-md rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
      <p className="text-sm text-indigo-800">
        Olá, <strong>{name}</strong> — continuar na sala{" "}
        <span className="font-mono font-bold">{code}</span>?
      </p>
      <Link
        href={`/sala/${code}`}
        className="mt-3 block w-full rounded-xl bg-indigo-600 py-2.5 text-center text-sm font-bold text-white hover:bg-indigo-700"
      >
        Voltar para a sala
      </Link>
    </div>
  );
}
