// "Nerd fact of the day" on the home page: a real number from the game data
// or the Worlds stats, a different one every day (same for everyone).

import type { Champion, GameData } from '../data/types';
import { GROUPS, SKIN_COUNTS } from '../data/connections';
import { PRO, PRO_YEARS } from '../data/proplay';
import { createRng, pick } from './random';

export interface Fact {
  before: string;
  value: string; // shown big
  after: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const hp18 = (c: Champion) => c.stats.hp + 17 * (c.stats.hpperlevel ?? 0);
const top = <T,>(list: T[], by: (x: T) => number) => [...list].sort((a, b) => by(b) - by(a))[0];

function allFacts(data: GameData): Fact[] {
  const champs = data.champions;
  const facts: Fact[] = [];

  const skins = champs.reduce((n, c) => n + (SKIN_COUNTS[c.id] ?? 0), 0);
  facts.push({ before: `All ${champs.length} champions together own `, value: fmt(skins), after: ' skins.' });
  const skinKing = top(champs, (c) => SKIN_COUNTS[c.id] ?? 0);
  facts.push({ before: 'Most skins: ', value: skinKing.name, after: `, with ${SKIN_COUNTS[skinKing.id]}.` });
  const tank = top(champs, hp18);
  facts.push({ before: 'Most health at level 18: ', value: tank.name, after: `, with ${fmt(hp18(tank))} HP.` });
  const sniper = top(champs, (c) => c.attackRange);
  facts.push({ before: 'Longest base attack range: ', value: sniper.name, after: `, at ${sniper.attackRange} units.` });
  facts.push({
    before: 'Buying every item in the shop once costs ',
    value: `${fmt(data.items.reduce((n, i) => n + i.total, 0))} gold`,
    after: '.',
  });
  const launch = GROUPS.find((g) => g.id === 'year:2009');
  if (launch) facts.push({ before: '', value: String(launch.members.length), after: ' champions were already there in 2009, the year League launched.' });

  const year = PRO_YEARS[PRO_YEARS.length - 1];
  if (year) {
    facts.push({ before: 'There were ', value: fmt(PRO.years[year].kills), after: ` kills across all of Worlds ${year}.` });
    const [killer, k] = top(Object.entries(PRO.players), ([, p]) => p.kills);
    facts.push({ before: `Most kills at Worlds ${PRO.span}: `, value: killer, after: ` (${k.team}), with ${k.kills}.` });
    const [pickId, byYear] = top(Object.entries(PRO.champions), ([, y]) => y[year] ?? 0);
    const champ = champs.find((c) => c.id === pickId);
    if (champ) facts.push({ before: `Most picked champion at Worlds ${year}: `, value: champ.name, after: `, in ${byYear[year]} games.` });
  }
  return facts;
}

export function factOfTheDay(date: string, data: GameData): Fact {
  return pick(createRng(`fact:${date}`), allFacts(data));
}
