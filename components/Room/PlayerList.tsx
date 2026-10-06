import type { Player } from "@/types/player";
import { sortPlayers } from "@/hooks/usePlayers";

type Props = {
  players: Player[];
  hostId: string | null;
  drawerId: string | null;
  currentPlayerId: string | null;
};

export function PlayerList({ players, hostId, drawerId, currentPlayerId }: Props) {
  const sorted = sortPlayers(players.filter((p) => p.connected));

  return (
    <ul className="space-y-2">
      {sorted.map((p) => (
        <li
          key={p.id}
          className={`flex items-start justify-between gap-2 rounded-xl px-3 py-2 text-sm ${
            p.id === currentPlayerId ? "bg-indigo-50 font-semibold" : "bg-slate-50"
          }`}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate">{p.name}</span>
            <span className="mt-1 flex flex-wrap gap-1">
              {p.id === hostId && (
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-800">
                  host
                </span>
              )}
              {p.id === drawerId && (
                <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-xs font-normal text-violet-800">
                  desenhando
                </span>
              )}
            </span>
          </span>
          <span className="shrink-0 pt-0.5 font-mono text-slate-600">{p.score}</span>
        </li>
      ))}
    </ul>
  );
}
