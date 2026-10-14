// "Stat Check": higher or lower on champion base stats — a different stat every round.

import { makeHigherLowerHole, type HLMeasure } from './higherLower';

const num = (v: number) => String(Math.round(v * 10) / 10);

const STATS: HLMeasure[] = [
  { id: 'hp', question: 'More or less base health?', format: (v) => `${num(v)} HP` },
  { id: 'hp18', question: 'More or less health at level 18?', format: (v) => `${num(v)} HP` },
  { id: 'armor', question: 'More or less base armor?', format: (v) => `${num(v)} armor` },
  { id: 'spellblock', question: 'More or less base magic resist?', format: (v) => `${num(v)} MR` },
  { id: 'attackdamage', question: 'More or less base attack damage?', format: (v) => `${num(v)} AD` },
  { id: 'attackspeed', question: 'Higher or lower base attack speed?', format: (v) => v.toFixed(3) },
  { id: 'movespeed', question: 'Faster or slower base move speed?', format: (v) => `${num(v)} MS` },
  { id: 'attackrange', question: 'Longer or shorter attack range?', format: (v) => `${num(v)} range` },
  { id: 'hpregen', question: 'More or less base health regen?', format: (v) => `${num(v)} / 5 s` },
];

export const StatCheckHole = makeHigherLowerHole({
  setup: (data) => ({
    entities: data.champions.map((c) => ({
      key: c.id,
      label: c.name,
      img: data.championImg(c),
      // Growth per level isn't linear in League, but at level 18 it adds up to exactly 17 × the growth stat.
      values: { ...c.stats, hp18: c.stats.hp + 17 * (c.stats.hpperlevel ?? 0) },
    })),
    measures: STATS,
  }),
});
