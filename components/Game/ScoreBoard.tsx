import type { Player } from "@/types/player";
import { sortPlayers } from "@/hooks/usePlayers";

export function ScoreBoard({ players }: { players: Player[] }) {
  const sorted = sortPlayers(players.filter((p) => p.connected));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-slate-900">Placar final</h2>
      <ol className="space-y-2">
        {sorted.map((p, i) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
          >
            <span>
              <span className="mr-2 font-mono text-slate-400">{i + 1}.</span>
              {p.name}
            </span>
            <span className="font-mono font-semibold">{p.score} pts</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
