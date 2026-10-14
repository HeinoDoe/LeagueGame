import type { HoleDef } from '../games/types';
import { createRng, shuffle } from './random';

export const COURSE_SIZES = [3, 6, 9] as const;
export type CourseSize = (typeof COURSE_SIZES)[number];

export const COURSE_NAMES: Record<CourseSize, string> = {
  3: 'Quick Three',
  6: 'Half Course',
  9: 'Full Course',
};

/**
 * Today's 9 holes in a fixed order. A 3-hole round is the first 3,
 * a 6-hole round the first 6 — so you can start short and extend later.
 */
export function dailyLayout(date: string, holes: HoleDef[]): HoleDef[] {
  return shuffle(createRng(`course:${date}`), holes).slice(0, 9);
}

export function dailySeed(date: string, holeId: string): string {
  return `daily:${date}:${holeId}`;
}
