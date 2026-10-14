import type { FC } from 'react';
import type { GameData } from '../data/types';

export interface HoleProps {
  data: GameData;
  /** Same seed => same puzzle. Daily: "daily:<version>:<date>:<holeId>", free play: random. */
  seed: string;
  /** Call exactly once when the game is over. `score` is 0–100 (see src/lib/scoring.ts). */
  onFinish: (result: { score: number; detail: string }) => void;
}

export interface HoleDef {
  id: string;
  name: string;
  tagline: string;
  howTo: string;
  /** procedural = generates itself from data forever; curated = needs your hand-made content */
  kind: 'procedural' | 'curated';
  Component: FC<HoleProps>;
}
