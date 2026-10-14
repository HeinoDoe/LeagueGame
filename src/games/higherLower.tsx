// Engine: a chain of Higher/Lower calls. The thing being compared can change
// every round (Stat Check: HP, then armor, then move speed …).
// Used by "Stat Check" (champion stats) and "Pro Play" (Worlds stats).

import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import type { GameData } from '../data/types';
import { createRng, shuffle, type Rng } from '../lib/random';
import { capStrokes } from '../lib/scoring';
import type { HoleProps } from './types';

export interface HLEntity {
  key: string;
  label: string;
  img?: string; // no picture → initials
  sub?: string; // small line under the name (a team, a region …)
  values: Record<string, number>;
}

export interface HLMeasure {
  id: string; // key into HLEntity.values
  question: string;
  format: (value: number) => string;
}

interface Config {
  /** What to compare today. Use `rng` for any choice so every player gets the same game. */
  setup: (data: GameData, rng: Rng) => { entities: HLEntity[]; measures: HLMeasure[] };
  rounds?: number;
}

function Card({ e, value, tone = '' }: { e: HLEntity; value: string; tone?: string }) {
  return (
    <div className={`hl-card ${tone}`}>
      {e.img ? (
        <img src={e.img} alt="" />
      ) : (
        <span className="hl-avatar">{e.label.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()}</span>
      )}
      <strong>{e.label}</strong>
      {e.sub && <span className="muted small">{e.sub}</span>}
      <span className="hl-value">{value}</span>
    </div>
  );
}

export function makeHigherLowerHole({ setup, rounds = 5 }: Config): FC<HoleProps> {
  return function HigherLowerHole({ data, seed, par, onFinish }: HoleProps) {
    // A chain where neighbours never tie on that round's measure, so every call has a right answer.
    const { chain, measureAt } = useMemo(() => {
      const rng = createRng(seed);
      const { entities, measures } = setup(data, rng);
      const order = shuffle(rng, measures);
      const measureAt = (round: number) => order[round % order.length];
      const has = (e: HLEntity, m: HLMeasure) => Number.isFinite(e.values[m.id]);
      const pool = shuffle(rng, entities);
      const first = pool.find((e) => has(e, measureAt(0)));
      const chain: HLEntity[] = first ? [first] : [];
      for (let r = 0; first && r < rounds; r++) {
        const m = measureAt(r);
        const prev = chain[r];
        const next = pool.find(
          (e) =>
            !chain.includes(e) &&
            has(e, m) &&
            e.values[m.id] !== prev.values[m.id] &&
            (r + 1 === rounds || has(e, measureAt(r + 1))),
        );
        if (!next) break;
        chain.push(next);
      }
      return { chain, measureAt };
    }, [data, seed]);

    const [round, setRound] = useState(0);
    const [answers, setAnswers] = useState<boolean[]>([]);
    const [reveal, setReveal] = useState<null | boolean>(null);
    const timer = useRef<number | undefined>(undefined);
    useEffect(() => () => window.clearTimeout(timer.current), []);

    const total = chain.length - 1;
    const current = chain[round];
    const next = chain[round + 1];
    const measure = measureAt(round);
    const finished = answers.length === total;

    function answer(higher: boolean) {
      if (reveal !== null || finished) return;
      const a = current.values[measure.id];
      const b = next.values[measure.id];
      const correct = higher ? b > a : b < a;
      const nextAnswers = [...answers, correct];
      setAnswers(nextAnswers);
      setReveal(correct);
      timer.current = window.setTimeout(() => {
        if (nextAnswers.length === total) {
          const wrong = nextAnswers.filter((x) => !x).length;
          // Perfect = 2 strokes (eagle on par 4), each miss adds a stroke.
          onFinish({ strokes: capStrokes(2 + wrong, par), detail: `${total - wrong}/${total} correct` });
        } else {
          setRound((r) => r + 1);
          setReveal(null);
        }
      }, 1300);
    }

    if (!current || !next) return <p className="muted">Not enough data for this hole.</p>;

    return (
      <div className="hole-body">
        <p className="clue-kicker center hl-question">{measure.question}</p>
        <div className="hl-row">
          <Card e={current} value={measure.format(current.values[measure.id])} />
          <span className="hl-vs">vs</span>
          <Card
            e={next}
            value={reveal === null ? '?' : measure.format(next.values[measure.id])}
            tone={reveal === null ? '' : reveal ? 'right' : 'wrong'}
          />
        </div>
        <div className="button-row">
          <button className="btn" disabled={reveal !== null || finished} onClick={() => answer(true)}>
            ▲ Higher
          </button>
          <button className="btn" disabled={reveal !== null || finished} onClick={() => answer(false)}>
            ▼ Lower
          </button>
        </div>
        <div className="dots">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={answers[i] === undefined ? '' : answers[i] ? 'right' : 'wrong'} />
          ))}
        </div>
      </div>
    );
  };
}
