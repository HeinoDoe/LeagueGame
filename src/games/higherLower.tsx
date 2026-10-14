// Engine: a chain of Higher/Lower calls. Used by "Gold Rush" (item cost)
// and "Health Bar" (champion base HP).

import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import type { GameData } from '../data/types';
import { createRng, shuffle } from '../lib/random';
import { capStrokes } from '../lib/scoring';
import type { HoleProps } from './types';

export interface HLEntity {
  key: string;
  label: string;
  img: string;
  value: number;
}

interface Config {
  pool: (data: GameData) => HLEntity[];
  format: (value: number) => string;
  question: string;
  rounds?: number;
}

export function makeHigherLowerHole({ pool, format, question, rounds = 5 }: Config): FC<HoleProps> {
  return function HigherLowerHole({ data, seed, par, onFinish }: HoleProps) {
    // Build a chain where neighbours never tie, so every call has a right answer.
    const chain = useMemo(() => {
      const shuffled = shuffle(createRng(seed), pool(data));
      const out: HLEntity[] = [];
      for (const e of shuffled) {
        if (out.length === 0 || e.value !== out[out.length - 1].value) out.push(e);
        if (out.length === rounds + 1) break;
      }
      return out;
    }, [data, seed]);

    const [round, setRound] = useState(0);
    const [answers, setAnswers] = useState<boolean[]>([]);
    const [reveal, setReveal] = useState<null | boolean>(null);
    const timer = useRef<number | undefined>(undefined);
    useEffect(() => () => window.clearTimeout(timer.current), []);

    const total = chain.length - 1;
    const current = chain[round];
    const next = chain[round + 1];
    const finished = answers.length === total;

    function answer(higher: boolean) {
      if (reveal !== null || finished) return;
      const correct = higher ? next.value > current.value : next.value < current.value;
      const nextAnswers = [...answers, correct];
      setAnswers(nextAnswers);
      setReveal(correct);
      timer.current = window.setTimeout(() => {
        if (nextAnswers.length === total) {
          const wrong = nextAnswers.filter((a) => !a).length;
          // Perfect = 2 strokes (eagle on par 4), each miss adds a stroke.
          onFinish({ strokes: capStrokes(2 + wrong, par), detail: `${total - wrong}/${total} correct` });
        } else {
          setRound((r) => r + 1);
          setReveal(null);
        }
      }, 1100);
    }

    if (!current || !next) return <p className="muted">Not enough data for this hole.</p>;

    return (
      <div className="hole-body">
        <p className="clue-kicker center">{question}</p>
        <div className="hl-row">
          <div className="hl-card">
            <img src={current.img} alt="" />
            <strong>{current.label}</strong>
            <span className="hl-value">{format(current.value)}</span>
          </div>
          <span className="hl-vs">vs</span>
          <div className={`hl-card ${reveal === null ? '' : reveal ? 'right' : 'wrong'}`}>
            <img src={next.img} alt="" />
            <strong>{next.label}</strong>
            <span className="hl-value">{reveal === null ? '?' : format(next.value)}</span>
          </div>
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
