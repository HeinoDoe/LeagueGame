// Golf scoring. Every hole turns its own result into "strokes",
// so totally different games can be added up on one scorecard.

/** Worst score allowed on a hole (like a "max triple bogey" house rule). */
export const MAX_OVER_PAR = 3;

export function capStrokes(strokes: number, par: number): number {
  return Math.max(1, Math.min(Math.round(strokes), par + MAX_OVER_PAR));
}

export function scoreLabel(strokes: number, par: number): string {
  if (strokes === 1) return 'Hole in one!';
  const diff = strokes - par;
  if (diff <= -3) return 'Albatross';
  if (diff === -2) return 'Eagle';
  if (diff === -1) return 'Birdie';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  if (diff === 2) return 'Double bogey';
  return 'Triple bogey';
}

export type ScoreTone = 'under' | 'par' | 'over' | 'way-over';

export function scoreTone(strokes: number, par: number): ScoreTone {
  const diff = strokes - par;
  if (diff < 0) return 'under';
  if (diff === 0) return 'par';
  if (diff === 1) return 'over';
  return 'way-over';
}

export function scoreEmoji(strokes: number, par: number): string {
  const diff = strokes - par;
  if (strokes === 1) return '⛳';
  if (diff <= -2) return '🦅';
  if (diff === -1) return '🐦';
  if (diff === 0) return '🟩';
  if (diff === 1) return '🟨';
  return '🟥';
}

export function formatToPar(diff: number): string {
  if (diff === 0) return 'E';
  return diff > 0 ? `+${diff}` : `${diff}`;
}

/**
 * For estimation holes (par 3): turn the average % error into strokes.
 * Tune these thresholds once you've played a few rounds.
 */
export function strokesFromAvgError(avgError: number): number {
  if (avgError <= 0.03) return 1;
  if (avgError <= 0.08) return 2;
  if (avgError <= 0.15) return 3;
  if (avgError <= 0.25) return 4;
  if (avgError <= 0.4) return 5;
  return 6;
}
