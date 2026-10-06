"use client";

import type { Player } from "@/types/player";

export function sortPlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.score - a.score || a.joined_at.localeCompare(b.joined_at));
}

export function getPlayer(players: Player[], id: string | null): Player | undefined {
  if (!id) return undefined;
  return players.find((p) => p.id === id);
}
