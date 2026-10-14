import type { HoleDef } from '../games/types';
import { createRng, shuffle } from './random';

export const COURSE_SIZES = [3, 6, 9] as const;
export type CourseSize = (typeof COURSE_SIZES)[number];

export const COURSE_NAMES: Record<CourseSize, string> = {
  3: 'Skirmish',
  6: 'Teamfight',
  9: 'Full Game',
};

/** Rough time to play, shown on the home page. */
export const COURSE_MINUTES: Record<CourseSize, number> = { 3: 5, 6: 10, 9: 15 };

/**
 * Bump this to reset the daily for everyone: today's progress is forgotten
 * and every day gets a fresh set of puzzles.
 */
export const DAILY_VERSION = 2;

/**
 * Today's 9 games in a fixed order. A 3-game round is the first 3,
 * a 6-game round the first 6 — so you can start short and extend later.
 */
export function dailyLayout(date: string, holes: HoleDef[]): HoleDef[] {
  return shuffle(createRng(`course:v${DAILY_VERSION}:${date}`), holes).slice(0, 9);
}

export function dailySeed(date: string, holeId: string): string {
  return `daily:v${DAILY_VERSION}:${date}:${holeId}`;
}
