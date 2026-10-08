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

/** Tempo de “Preparar...” antes de cada rodada */
export const ROUND_PREPARE_MS = 2000;
/** Tempo da mensagem “Desenhar” / “Adivinhe o desenho” */
export const ROUND_ROLE_MSG_MS = 2000;
export const ROUND_INTRO_TOTAL_MS = ROUND_PREPARE_MS + ROUND_ROLE_MSG_MS;

export function roundIntroElapsedMs(
  roundStartedAt: string | null,
  nowMs: number = Date.now()
): number {
  if (!roundStartedAt) return ROUND_INTRO_TOTAL_MS;
  return nowMs - new Date(roundStartedAt).getTime();
}

export function isRoundIntroActive(
  roundStartedAt: string | null,
  nowMs: number = Date.now()
): boolean {
  return roundIntroElapsedMs(roundStartedAt, nowMs) < ROUND_INTRO_TOTAL_MS;
}

export function getRoundIntroText(
  roundStartedAt: string | null,
  isDrawer: boolean,
  nowMs: number = Date.now()
): string | null {
  if (!roundStartedAt || !isRoundIntroActive(roundStartedAt, nowMs)) return null;
  const elapsed = roundIntroElapsedMs(roundStartedAt, nowMs);
  if (elapsed < ROUND_PREPARE_MS) return "Preparar...";
  return isDrawer ? "Desenhar" : "Adivinhe o desenho";
}

export function remainingSeconds(
  roundStartedAt: string | null,
  roundDuration: number,
  nowMs: number = Date.now()
): number {
  if (!roundStartedAt) return roundDuration;
  const started = new Date(roundStartedAt).getTime();
  const introMs = ROUND_INTRO_TOTAL_MS;
  const gameplayStart = started + introMs;
  if (nowMs < gameplayStart) return roundDuration;
  const elapsed = Math.floor((nowMs - gameplayStart) / 1000);
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
