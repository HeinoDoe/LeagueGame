// The list of every hole in the game. To add a new hole:
//   1. build a component that takes HoleProps and calls onFinish once
//   2. add an entry below (unique id, a par, and your component)
// The daily course picks 9 of these per day (in a fixed daily order),
// so 3 holes = the first 3, 6 = the first 6, 9 = all of them.

import type { HoleDef } from './types';
import { RedactedLoreHole } from './redactedLore';
import { SilhouetteHole } from './silhouette';
import { ConnectionsHole } from './connections';
import { makeHigherLowerHole } from './higherLower';
import { makeEstimateHole } from './estimate';
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
    id: 'gold-rush',
    name: 'Gold Rush',
    tagline: 'Higher or lower: item gold cost',
    howTo: 'Does the next item cost more or less gold? 5 calls in a row. A perfect run is an eagle.',
    par: 4,
    kind: 'procedural',
    Component: makeHigherLowerHole({
      question: 'Does the next item cost more or less?',
      format: (v) => `${v.toLocaleString()}g`,
      pool: (d) => d.items.filter((i) => i.total >= 300).map((i) => ({ key: i.id, label: i.name, img: d.itemImg(i), value: i.total })),
    }),
  },
  {
    id: 'health-bar',
    name: 'Health Bar',
    tagline: 'Higher or lower: base HP',
    howTo: 'Does the next champion have more or less base health at level 1? 5 calls in a row.',
    par: 4,
    kind: 'procedural',
    Component: makeHigherLowerHole({
      question: 'More or less base HP at level 1?',
      format: (v) => `${Math.round(v)} HP`,
      pool: (d) => d.champions.map((c) => ({ key: c.id, label: c.name, img: d.championImg(c), value: c.hp })),
    }),
  },
  {
    id: 'range-finder',
    name: 'Range Finder',
    tagline: 'Estimate a champion’s attack range',
    howTo: 'Slide to the champion’s base attack range. 3 rounds, scored by how close you get.',
    par: 3,
    kind: 'procedural',
    Component: makeEstimateHole({
      question: () => 'Base attack range?',
      min: 100,
      max: 700,
      step: 25,
      unit: 'units',
      pool: (d) => d.champions.map((c) => ({ key: c.id, label: c.name, img: d.championImg(c), value: c.attackRange })),
    }),
  },
  {
    id: 'price-check',
    name: 'Price Check',
    tagline: 'Estimate an item’s total cost',
    howTo: 'Slide to the item’s total gold cost. 3 rounds, scored by how close you get.',
    par: 3,
    kind: 'procedural',
    Component: makeEstimateHole({
      question: () => 'Total gold cost?',
      min: 0,
      max: 4000,
      step: 25,
      unit: 'gold',
      pool: (d) => d.items.filter((i) => i.total >= 500).map((i) => ({ key: i.id, label: i.name, img: d.itemImg(i), value: i.total })),
    }),
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
