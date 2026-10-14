// The groups behind "Rift Connections": generated ones from official data
// (`npm run fetch-connections`) plus your hand-made ones in curated/connections.ts.

import generated from './generated/connections.json';
import { CURATED_GROUPS } from './curated/connections';
import { pick, sample, type Rng } from '../lib/random';

export interface ConnectionGroup {
  id: string;
  kind: string; // region, skinline, year, … — puzzles mix kinds
  level: number; // 0 = easiest (yellow) … 3 = trickiest (purple)
  label: string; // shown on the solved Connections band
  ask?: string; // the same group as a Deep Dive question ("Name a champion from Ionia")
  members: string[]; // Data Dragon champion ids
}

export const GROUPS: ConnectionGroup[] = [...generated.groups, ...CURATED_GROUPS];

/** Skins per champion — a rough stand-in for how often players think of them. */
export const SKIN_COUNTS: Record<string, number> = generated.skins;

/** A champion's home region ("Ionia", "Shadow Isles"), or "None". */
export function regionOf(id: string): string {
  const label = GROUPS.find((g) => g.kind === 'region' && g.members.includes(id))?.label;
  return label ? label.replace(/^From (the )?/, '') : 'None';
}

export interface PuzzleGroup {
  group: ConnectionGroup;
  picks: string[]; // the 4 champions shown for this group
}

/**
 * Picks a kind of group first, so the 160+ skin lines don't crowd out everything
 * else — but a kind with many groups still comes up more often than one with a
 * single group (which would otherwise repeat every few days).
 */
export function pickKind(rng: Rng, groups: ConnectionGroup[]): string {
  const counts = new Map<string, number>();
  for (const g of groups) counts.set(g.kind, (counts.get(g.kind) ?? 0) + 1);
  const weights = [...counts].map(([kind, n]) => [kind, Math.sqrt(n)] as const);
  let r = rng() * weights.reduce((sum, [, w]) => sum + w, 0);
  for (const [kind, w] of weights) if ((r -= w) <= 0) return kind;
  return weights[weights.length - 1][0];
}

/**
 * One group per difficulty, and 4 champions for each that fit no other group
 * in the puzzle — so every board has exactly one solution.
 */
export function makePuzzle(rng: Rng, available: Set<string>): PuzzleGroup[] | null {
  const levels = [0, 1, 2, 3].map((l) => GROUPS.filter((g) => g.level === l));
  for (let attempt = 0; attempt < 500; attempt++) {
    const chosen = levels.map((groups) => {
      const kind = pickKind(rng, groups);
      return pick(rng, groups.filter((g) => g.kind === kind));
    });
    const members = chosen.map((g) => new Set(g.members.filter((id) => available.has(id))));
    const only = members.map((m, i) => [...m].filter((id) => members.every((other, j) => j === i || !other.has(id))));
    if (only.every((ids) => ids.length >= 4)) return chosen.map((group, i) => ({ group, picks: sample(rng, only[i], 4) }));
  }
  return null;
}
