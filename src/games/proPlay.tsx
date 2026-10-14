// "Pro Play": higher or lower on real Worlds stats (players, champions or
// teams — one theme a day). Data: src/data/proplay.ts.

import { PRO, PRO_YEARS } from '../data/proplay';
import { pick } from '../lib/random';
import { makeHigherLowerHole, type HLEntity, type HLMeasure } from './higherLower';

const span = PRO.span;
const latest = PRO_YEARS[PRO_YEARS.length - 1];
const previous = PRO_YEARS[PRO_YEARS.length - 2];
const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;

function players(): { entities: HLEntity[]; measures: HLMeasure[] } {
  return {
    entities: Object.entries(PRO.players)
      .filter(([, p]) => p.games >= 8) // regulars, not one-game substitutes
      .map(([name, p]) => ({
        key: name,
        label: name,
        sub: p.team,
        values: {
          games: p.games,
          kills: p.kills,
          assists: p.assists,
          kda: Math.round(((p.kills + p.assists) / Math.max(p.deaths, 1)) * 100) / 100,
        },
      })),
    measures: [
      { id: 'games', question: `More or fewer games played at Worlds ${span}?`, format: (v) => plural(v, 'game') },
      { id: 'kills', question: `More or fewer kills at Worlds ${span}?`, format: (v) => plural(v, 'kill') },
      { id: 'assists', question: `More or fewer assists at Worlds ${span}?`, format: (v) => plural(v, 'assist') },
      { id: 'kda', question: `Higher or lower KDA at Worlds ${span}?`, format: (v) => `${v.toFixed(2)} KDA` },
    ],
  };
}

function champions(champImg: (id: string) => string | null): { entities: HLEntity[]; measures: HLMeasure[] } {
  const measures: HLMeasure[] = [
    { id: 'all', question: `Picked in more or fewer games at Worlds ${span}?`, format: (v) => plural(v, 'game') },
    { id: latest, question: `Picked in more or fewer games at Worlds ${latest}?`, format: (v) => plural(v, 'game') },
  ];
  if (previous) {
    measures.push({ id: previous, question: `Picked in more or fewer games at Worlds ${previous}?`, format: (v) => plural(v, 'game') });
  }
  return {
    entities: Object.entries(PRO.champions).flatMap(([id, byYear]) => {
      const img = champImg(id);
      if (!img) return [];
      const values: Record<string, number> = { all: Object.values(byYear).reduce((a, b) => a + b, 0) };
      for (const y of PRO_YEARS) values[y] = byYear[y] ?? 0;
      return [{ key: id, label: id, img, values }];
    }),
    measures,
  };
}

function teams(): { entities: HLEntity[]; measures: HLMeasure[] } {
  return {
    entities: Object.entries(PRO.teams)
      .filter(([, t]) => t.games >= 5)
      .map(([name, t]) => ({
        key: name,
        label: name,
        img: t.image,
        values: { wins: t.wins, games: t.games, winrate: Math.round((t.wins / t.games) * 1000) / 10 },
      })),
    measures: [
      { id: 'wins', question: `More or fewer game wins at Worlds ${span}?`, format: (v) => plural(v, 'win') },
      { id: 'games', question: `More or fewer games played at Worlds ${span}?`, format: (v) => plural(v, 'game') },
      { id: 'winrate', question: `Higher or lower game win rate at Worlds ${span}?`, format: (v) => `${v}%` },
    ],
  };
}

export const ProPlayHole = makeHigherLowerHole({
  setup: (data, rng) => {
    const byId = new Map(data.champions.map((c) => [c.id, c]));
    const theme = pick(rng, ['players', 'players', 'champions', 'teams'] as const);
    if (theme === 'teams') return teams();
    if (theme === 'players') return players();
    const result = champions((id) => {
      const c = byId.get(id);
      return c ? data.championImg(c) : null;
    });
    // Show champion names, not ids ("Wukong", not "MonkeyKing").
    for (const e of result.entities) e.label = byId.get(e.key)?.name ?? e.key;
    return result;
  },
});
