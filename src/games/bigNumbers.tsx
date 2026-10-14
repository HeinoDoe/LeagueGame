// "Big Numbers": estimate a huge number on a slider that goes from 1 to a
// billion. Every answer is worked out from live game data or real Worlds stats,
// so it's always exact. Good guesses need a bit of maths — and the questions
// never say how many champions are involved, so that's part of the guess.

import { useMemo, useState } from 'react';
import type { Champion, GameData } from '../data/types';
import { GROUPS, SKIN_COUNTS } from '../data/connections';
import { PRO, PRO_YEARS } from '../data/proplay';
import { createRng, pick, shuffle, type Rng } from '../lib/random';
import { averageScore, scoreFromError } from '../lib/scoring';
import type { HoleProps } from './types';

interface Question {
  ask: string;
  value: number;
  note?: string;
}

const MAX_LOG = 9; // the slider ends at 10^9
const START_LOG = 3; // and starts at 1,000

const STATS: [id: string, label: string][] = [
  ['hp', 'base health'],
  ['hp18', 'health at level 18'],
  ['attackdamage', 'base attack damage'],
  ['armor', 'base armor'],
  ['movespeed', 'base move speed'],
  ['attackrange', 'attack range'],
];

const statOf = (c: Champion, id: string) =>
  id === 'hp18' ? c.stats.hp + 17 * (c.stats.hpperlevel ?? 0) : (c.stats[id] ?? 0);
const total = (list: number[]) => Math.round(list.reduce((a, b) => a + b, 0));

/** Revealed after the guess: how many champions, and the average. */
const breakdown = (value: number, count: number) =>
  `That's ${count} champions, ${Math.round(value / count).toLocaleString()} each on average.`;

/** "from Ionia" → "are from Ionia", "with a Pool Party skin" → "have a Pool Party skin" … */
function asVerb(phrase: string): string {
  return phrase
    .replace(/^from /, 'are from ')
    .replace(/^with /, 'have ')
    .replace(/^released /, 'were released ')
    .replace(/^that uses /, 'use ')
    .replace(/^who appears /, 'appear ')
    .replace(/^who rides /, 'ride ')
    .replace(/^whose sibling is/, 'have a sibling who is')
    .replace(/^whose name is/, 'have a name that is');
}

/** A group of champions: count them, or add up one of their stats. */
function groupQuestion(rng: Rng, byId: Map<string, Champion>): Question {
  const groups = GROUPS.filter(
    (g) => g.ask?.startsWith('Name a champion ') && g.members.filter((id) => byId.has(id)).length >= 5,
  );
  const g = pick(rng, groups);
  const members = g.members.filter((id) => byId.has(id)).map((id) => byId.get(id)!);
  const phrase = g.ask!.replace('Name a champion ', '');
  if (rng() < 0.3) return { ask: `How many champions ${asVerb(phrase)}?`, value: members.length };
  const [stat, label] = pick(rng, STATS);
  const value = total(members.map((c) => statOf(c, stat)));
  return { ask: `Add up the ${label} of every champion ${phrase}`, value, note: breakdown(value, members.length) };
}

/** Whole-game totals. */
function gameQuestion(rng: Rng, data: GameData): Question {
  const all = data.champions;
  const n = all.length;
  const sum = (ask: string, values: number[]) => {
    const value = total(values);
    return { ask, value, note: breakdown(value, n) };
  };
  return pick(rng, [
    { ask: 'How many champions are in League of Legends right now?', value: n },
    sum('Add up the base health of every champion', all.map((c) => c.stats.hp)),
    sum('Add up the health of every champion at level 18', all.map((c) => statOf(c, 'hp18'))),
    sum('Add up the base move speed of every champion', all.map((c) => c.stats.movespeed)),
    sum('Add up the attack range of every champion', all.map((c) => c.stats.attackrange)),
    {
      ask: 'How many skins do all champions have together (not counting their default look)?',
      value: total(all.map((c) => SKIN_COUNTS[c.id] ?? 0)),
    },
    {
      ask: 'How much gold to buy every item in the Summoner’s Rift shop once?',
      value: total(data.items.map((i) => i.total)),
      note: `That's ${data.items.length} items.`,
    },
  ]);
}

/** Real Worlds numbers. */
function proQuestion(rng: Rng): Question {
  const y = pick(rng, PRO_YEARS);
  const w = PRO.years[y];
  const regulars = Object.entries(PRO.players)
    .sort((a, b) => b[1].games - a[1].games)
    .slice(0, 15);
  const [name, p] = pick(rng, regulars);
  const final = `${w.final.teams.join(' vs ')}`;
  return pick(rng, [
    { ask: `How many games were played at Worlds ${y}?`, value: w.games },
    { ask: `How many kills happened across all of Worlds ${y}?`, value: w.kills },
    { ask: `How much gold did all teams earn across Worlds ${y} combined?`, value: w.gold },
    { ask: `How many kills were there in the Worlds ${y} final (${final}), all games together?`, value: w.final.kills },
    { ask: `How much gold did both teams earn in the Worlds ${y} final (${final}), all games together?`, value: w.final.gold },
    {
      ask: `How many kills did ${name} (${p.team}) get at Worlds ${PRO.span}?`,
      value: p.kills,
      note: `In ${p.games} games.`,
    },
  ]);
}

/** Slider position → a tidy number (3 significant digits). */
function tidy(log: number): number {
  const n = 10 ** log;
  return n < 100 ? Math.round(n) : Number(n.toPrecision(3));
}

/** "12k", "3.5m", "2,000,000" → a number. */
function parse(text: string): number | null {
  const m = text.trim().toLowerCase().replace(/[,\s_']/g, '').match(/^(\d+(?:\.\d+)?)([kmb])?$/);
  if (!m) return null;
  const n = Number(m[1]) * ({ k: 1e3, m: 1e6, b: 1e9 }[m[2] as 'k' | 'm' | 'b'] ?? 1);
  return n >= 1 ? n : null;
}

/** Points for one round, from the distance in powers of ten: 10% off ≈ 88, 2× off ≈ 40, 10× off ≈ 5. */
const roundScore = (logError: number) => scoreFromError(logError, 3);

function describeMiss(guess: number, actual: number): string {
  const ratio = Math.max(guess / actual, actual / guess);
  if (ratio < 1.005) return 'spot on!';
  if (ratio < 2) return `off by ${Math.round((ratio - 1) * 100)}%`;
  return `${ratio < 10 ? ratio.toFixed(1) : Math.round(ratio).toLocaleString()}× too ${guess > actual ? 'high' : 'low'}`;
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 });

export function BigNumbersHole({ data, seed, onFinish }: HoleProps) {
  const questions = useMemo(() => {
    const rng = createRng(seed);
    const byId = new Map(data.champions.map((c) => [c.id, c]));
    return shuffle(rng, [groupQuestion(rng, byId), gameQuestion(rng, data), proQuestion(rng)]);
  }, [data, seed]);
  const [round, setRound] = useState(0);
  const [log, setLog] = useState(START_LOG);
  const [text, setText] = useState<string | null>(null); // what's typed, while typing
  const [errors, setErrors] = useState<number[]>([]); // |log10(guess / actual)| per round
  const [done, setDone] = useState(false);
  const q = questions[round];
  const guess = tidy(log);
  const revealed = errors.length > round;

  function lockIn() {
    setErrors([...errors, Math.abs(Math.log10(guess / q.value))]);
    setText(null);
  }

  function next() {
    if (round + 1 < questions.length) {
      setRound(round + 1);
      setLog(START_LOG);
    } else {
      const avg = errors.reduce((a, b) => a + b, 0) / errors.length;
      setDone(true);
      const ratio = 10 ** avg; // how many times off, on average
      onFinish({
        score: averageScore(errors.map(roundScore)),
        detail: ratio < 2 ? `Off by ${Math.round((ratio - 1) * 100)}% on average` : `Off by ${ratio.toFixed(1)}× on average`,
      });
    }
  }

  return (
    <div className="hole-body">
      <p className="muted small center">
        Round {round + 1} of {questions.length}
      </p>
      <div className="clue-card">
        <p className="clue-title bn-question">{q.ask}</p>
      </div>

      <div className="slider-block">
        <input
          className="bn-input"
          inputMode="decimal"
          aria-label="Your guess"
          value={text ?? guess.toLocaleString()}
          disabled={revealed}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            setText(e.target.value);
            const n = parse(e.target.value);
            if (n) setLog(Math.min(Math.log10(n), MAX_LOG));
          }}
          onBlur={() => setText(null)}
          onKeyDown={(e) => e.key === 'Enter' && !revealed && lockIn()}
        />
        <span className="muted small center">{compact.format(guess)} · drag, or type a number like 12k or 3.5m</span>
        <input
          type="range"
          min={0}
          max={MAX_LOG}
          step={0.001}
          value={log}
          disabled={revealed}
          onChange={(e) => {
            setLog(Number(e.target.value));
            setText(null);
          }}
        />
        <div className="slider-scale">
          <span>1</span>
          <span>1K</span>
          <span>1M</span>
          <span>1B</span>
        </div>
      </div>

      {!revealed ? (
        <button className="btn primary" onClick={lockIn}>
          Lock it in
        </button>
      ) : (
        <div className="estimate-reveal">
          <p>
            Actual: <strong>{q.value.toLocaleString()}</strong> · you were {describeMiss(guess, q.value)} ·{' '}
            <strong>{roundScore(errors[round])} points</strong>
          </p>
          {q.note && <p className="muted small">{q.note}</p>}
          {!done && (
            <button className="btn primary" onClick={next}>
              {round + 1 < questions.length ? 'Next round →' : 'Finish'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
