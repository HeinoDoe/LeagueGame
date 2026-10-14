import type { FC } from 'react';
import type { GameData } from '../data/types';

export interface HoleProps {
  data: GameData;
  /** Same seed => same puzzle. Daily: "daily:<date>:<holeId>", range: random. */
  seed: string;
  par: number;
  /** Call exactly once when the hole is over. */
  onFinish: (result: { strokes: number; detail: string }) => void;
}

export interface HoleDef {
  id: string;
  name: string;
  tagline: string;
  howTo: string;
  par: number;
  /** procedural = generates itself from data forever; curated = needs your hand-made content */
  kind: 'procedural' | 'curated';
  Component: FC<HoleProps>;
}
