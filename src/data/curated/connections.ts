// Hand-made groups for "Rift Connections" — add your own!
// Members are Data Dragon ids (usually the name without spaces or apostrophes;
// watch out for "MonkeyKing" = Wukong and "Nunu" = Nunu & Willump).
// level: 0 = easiest (yellow), 1 = green, 2 = blue, 3 = trickiest (purple).
// `ask` makes the group usable as a Deep Dive question too. Deep Dive reads the
// member order as rarity: put the answers everyone thinks of first.
// A group needs at least 4 members; more members = more variety.

import type { ConnectionGroup } from '../connections';

export const CURATED_GROUPS: ConnectionGroup[] = [
  {
    id: 'curated:siblings',
    kind: 'curated',
    level: 1,
    label: 'Their sibling is also a champion',
    ask: 'Name a champion whose sibling is also a champion',
    members: ['Jinx', 'Vi', 'Yasuo', 'Yone', 'Garen', 'Lux', 'Darius', 'Draven', 'Kayle', 'Morgana'],
  },
  {
    id: 'curated:arcane',
    kind: 'curated',
    level: 1,
    label: 'Characters in the Arcane series',
    ask: 'Name a champion who appears in Arcane',
    members: ['Jinx', 'Vi', 'Caitlyn', 'Jayce', 'Viktor', 'Ekko', 'Heimerdinger', 'Singed', 'Warwick', 'Mel', 'Ambessa'],
  },
  {
    id: 'curated:riders',
    kind: 'curated',
    level: 2,
    label: 'Ride a mount or a vehicle',
    ask: 'Name a champion who rides a mount or a vehicle',
    members: ['Sejuani', 'Nunu', 'Kled', 'Corki', 'Rell'],
  },
];
