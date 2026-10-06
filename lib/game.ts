import type { Player } from "@/types/player";

export function pickDrawer(players: Player[], previousDrawerId: string | null): Player | null {
  const eligible = players.filter((p) => p.connected);
  if (eligible.length === 0) return null;
  if (eligible.length === 1) return eligible[0];
  const withoutPrevious = previousDrawerId
    ? eligible.filter((p) => p.id !== previousDrawerId)
    : eligible;
  const pool = withoutPrevious.length > 0 ? withoutPrevious : eligible;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function remainingSeconds(
  roundStartedAt: string | null,
  roundDuration: number,
  nowMs: number = Date.now()
): number {
  if (!roundStartedAt) return roundDuration;
  const started = new Date(roundStartedAt).getTime();
  const elapsed = Math.floor((nowMs - started) / 1000);
  return Math.max(0, roundDuration - elapsed);
}

export function countGuessers(players: Player[], drawerId: string | null): number {
  return players.filter((p) => p.connected && p.id !== drawerId).length;
}

export function allGuessersFound(
  players: Player[],
  drawerId: string | null
): boolean {
  const guessers = players.filter((p) => p.connected && p.id !== drawerId);
  if (guessers.length === 0) return true;
  return guessers.every((p) => p.guessed_this_round);
}
