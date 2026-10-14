// One score for every game: 0–100 points, shown as a League rank (Iron → Challenger).
// Each game turns its own result into points with the helpers at the bottom,
// so totally different games can be averaged and compared.

export interface Rank {
  id: string; // also the Community Dragon file name
  name: string;
  min: number; // lowest score that reaches this rank
  emoji: string; // for the copy-and-share text
}

/** Highest first. Tune `min` to make ranks easier or harder to reach. */
export const RANKS: Rank[] = [
  { id: 'challenger', name: 'Challenger', min: 95, emoji: '👑' },
  { id: 'grandmaster', name: 'Grandmaster', min: 90, emoji: '🔥' },
  { id: 'master', name: 'Master', min: 85, emoji: '🔮' },
  { id: 'diamond', name: 'Diamond', min: 75, emoji: '💎' },
  { id: 'emerald', name: 'Emerald', min: 65, emoji: '💚' },
  { id: 'platinum', name: 'Platinum', min: 55, emoji: '💠' },
  { id: 'gold', name: 'Gold', min: 45, emoji: '🥇' },
  { id: 'silver', name: 'Silver', min: 35, emoji: '🥈' },
  { id: 'bronze', name: 'Bronze', min: 20, emoji: '🥉' },
  { id: 'iron', name: 'Iron', min: 0, emoji: '🔩' },
];

export function rankOf(score: number): Rank {
  return RANKS.find((r) => score >= r.min) ?? RANKS[RANKS.length - 1];
}

const RANKED = 'https://raw.communitydragon.org/16.20/plugins/rcp-fe-lol-static-assets/global/default/images';

/** The rank's crest (SVG, sharp at any size). */
export const crestUrl = (rank: Rank) => `${RANKED}/ranked-mini-crests/${rank.id}.svg`;

/** Average of several game scores, rounded. */
export function averageScore(scores: number[]): number {
  return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

/** One square per game for the share text. */
export function shareSquare(score: number): string {
  if (score >= 70) return '🟩';
  if (score >= 40) return '🟨';
  return '🟥';
}

// ---- Turning a game's result into points -----------------------------------

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Guess-the-champion games (6 guesses): 1st guess 100, then 15 less per guess; missed 0. */
export function scoreFromGuesses(guessesUsed: number | null): number {
  return guessesUsed === null ? 0 : clamp(115 - 15 * guessesUsed);
}

/** Share of correct answers (higher/lower calls). */
export function scoreFromCorrect(correct: number, total: number): number {
  return total ? clamp((100 * correct) / total) : 0;
}

/**
 * Slider games: 100 when spot on, falling smoothly the further off you are.
 * `error` is 0 for a perfect guess; `steepness` sets how quickly points drop.
 */
export function scoreFromError(error: number, steepness: number): number {
  return clamp(100 * Math.exp(-steepness * error));
}
