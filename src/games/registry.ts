// The list of every hole in the game. To add a new hole:
//   1. build a component that takes HoleProps and calls onFinish once
//   2. add an entry below (unique id, a par, and your component)
// The daily course picks 9 of these per day (in a fixed daily order),
// so 3 holes = the first 3, 6 = the first 6, 9 = all of them.

import type { HoleDef } from './types';
import { RedactedLoreHole } from './redactedLore';
import { StatCheckHole } from './statCheck';
import { ProPlayHole } from './proPlay';
import { BigNumbersHole } from './bigNumbers';
import { SilhouetteHole } from './silhouette';
import { SplashZoomHole } from './splashZoom';
import { ConnectionsHole } from './connections';
import { SizeUpHole } from './sizeUp';
import { DeepDiveHole } from './deepDive';

export const HOLES: HoleDef[] = [
  {
    id: 'redacted-lore',
    name: 'Redacted Lore',
    tagline: 'Whose bio is this?',
    howTo: 'A champion bio with the name blacked out. Guess the champion — each miss reveals a hint.',
    par: 4,
    kind: 'procedural',
    Component: RedactedLoreHole,
  },
  {
    id: 'stat-check',
    name: 'Stat Check',
    tagline: 'Higher or lower: champion stats',
    howTo: 'Is the next champion’s stat higher or lower? The stat changes every round — health, armor, move speed, range … 5 calls.',
    par: 4,
    kind: 'procedural',
    Component: StatCheckHole,
  },
  {
    id: 'pro-play',
    name: 'Pro Play',
    tagline: 'Higher or lower: real Worlds stats',
    howTo: 'Players, champions or teams at Worlds: more or fewer kills, games, picks, wins? 5 calls, real stats from the official esports feed.',
    par: 4,
    kind: 'procedural',
    Component: ProPlayHole,
  },
  {
    id: 'big-numbers',
    name: 'Big Numbers',
    tagline: 'Estimate something huge',
    howTo: 'Guess a big number on a slider from 1 to a billion (or type it). Do the maths if you can. 3 rounds, scored by how close you get.',
    par: 3,
    kind: 'procedural',
    Component: BigNumbersHole,
  },
  {
    id: 'silhouette',
    name: 'Silhouette',
    tagline: 'Name the champion from their shadow',
    howTo: 'A champion’s 3D model turns as a black silhouette. Every miss turns the lights up a little and unlocks a hint. Up to 6 guesses.',
    par: 4,
    kind: 'procedural',
    Component: SilhouetteHole,
  },
  {
    id: 'splash-zoom',
    name: 'Splash Zoom',
    tagline: 'Name the champion from a tiny piece of splash art',
    howTo: 'You see a zoomed-in piece of a splash art. Every miss zooms out and unlocks a hint. Up to 6 guesses.',
    par: 4,
    kind: 'procedural',
    Component: SplashZoomHole,
  },
  {
    id: 'rift-connections',
    name: 'Rift Connections',
    tagline: 'Find four groups of four',
    howTo: 'Sort 16 champions into 4 hidden groups — a region, a skin line, a release year, a quirk of their name… Pick four and submit. 4 mistakes allowed.',
    par: 4,
    kind: 'procedural',
    Component: ConnectionsHole,
  },
  {
    id: 'size-up',
    name: 'Size Up',
    tagline: 'Resize a champion’s 3D model to scale',
    howTo: 'Slide until the second model is the right height next to the first. Last round: something from the Rift. 3 rounds.',
    par: 3,
    kind: 'procedural',
    Component: SizeUpHole,
  },
  {
    id: 'deep-dive',
    name: 'Deep Dive',
    tagline: '5 categories — the rarer your answer, the deeper you dive',
    howTo: 'Five different categories, one answer each: champions, pro play, Worlds trivia … Obvious answers score 1, deep cuts score 4. 3 tries per category.',
    par: 5,
    kind: 'curated',
    Component: DeepDiveHole,
  },
];

export const HOLES_BY_ID = new Map(HOLES.map((h) => [h.id, h]));
