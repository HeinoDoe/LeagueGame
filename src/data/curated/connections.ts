// Hand-made groups for "Rift Connections" — add your own!
// Members are Data Dragon ids (usually the name without spaces or apostrophes;
// watch out for "MonkeyKing" = Wukong and "Nunu" = Nunu & Willump).
// level: 0 = easiest (yellow), 1 = green, 2 = blue, 3 = trickiest (purple).
// A group needs at least 4 members; more members = more variety.

import type { ConnectionGroup } from '../connections';

export const CURATED_GROUPS: ConnectionGroup[] = [
  {
    id: 'curated:siblings',
    kind: 'curated',
    level: 1,
    label: 'Their sibling is also a champion',
    members: ['Garen', 'Lux', 'Vi', 'Jinx', 'Darius', 'Draven', 'Yasuo', 'Yone', 'Kayle', 'Morgana'],
  },
  {
    id: 'curated:arcane',
    kind: 'curated',
    level: 1,
    label: 'Characters in the Arcane series',
    members: ['Jinx', 'Vi', 'Caitlyn', 'Jayce', 'Viktor', 'Ekko', 'Heimerdinger', 'Singed', 'Mel', 'Ambessa', 'Warwick'],
  },
  {
    id: 'curated:riders',
    kind: 'curated',
    level: 2,
    label: 'Ride a mount or a vehicle',
    members: ['Sejuani', 'Nunu', 'Kled', 'Rell', 'Corki'],
  },
];
