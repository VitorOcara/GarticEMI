/** Pontos por ordem de acerto (1º, 2º, 3º...) */
export const GUESS_POINTS_BY_ORDER = [100, 80, 60, 40, 20] as const;

/** Pontos que o desenhista recebe a cada acerto de outro jogador */
export const DRAWER_POINTS_PER_CORRECT_GUESS = 25;

export function pointsForGuessOrder(orderIndex: number): number {
  if (orderIndex < GUESS_POINTS_BY_ORDER.length) {
    return GUESS_POINTS_BY_ORDER[orderIndex];
  }
  return 10;
}
