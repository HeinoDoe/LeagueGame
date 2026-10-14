// Engine: estimate a number with a slider, scored by % error (Magnitudle-style).
// Used by "Range Finder" (attack range) and "Price Check" (item cost).

import { useMemo, useState, type FC } from 'react';
import type { GameData } from '../data/types';
import { createRng, sample } from '../lib/random';
import { capStrokes, strokesFromAvgError } from '../lib/scoring';
import type { HoleProps } from './types';

export interface EstimateEntity {
  key: string;
  label: string;
  img: string;
  value: number;
}

interface Config {
  pool: (data: GameData) => EstimateEntity[];
  question: (e: EstimateEntity) => string;
  min: number;
  max: number;
  step: number;
  unit: string;
  rounds?: number;
}

export function makeEstimateHole({ pool, question, min, max, step, unit, rounds = 3 }: Config): FC<HoleProps> {
  return function EstimateHole({ data, seed, par, onFinish }: HoleProps) {
    const targets = useMemo(() => sample(createRng(seed), pool(data), rounds), [data, seed]);
    const mid = Math.round((min + max) / 2 / step) * step;
    const [round, setRound] = useState(0);
    const [guess, setGuess] = useState(mid);
    const [errors, setErrors] = useState<number[]>([]);
    const [done, setDone] = useState(false);
    const revealed = errors.length > round;
    const target = targets[round];

    function lockIn() {
      const err = Math.abs(guess - target.value) / target.value;
      setErrors([...errors, err]);
    }

    function nextRound() {
      if (round + 1 < targets.length) {
        setRound(round + 1);
        setGuess(mid);
      } else {
        const avg = errors.reduce((a, b) => a + b, 0) / errors.length;
        setDone(true);
        onFinish({
          strokes: capStrokes(strokesFromAvgError(avg), par),
          detail: `Average error ${(avg * 100).toFixed(1)}%`,
        });
      }
    }

    if (!target) return <p className="muted">Not enough data for this hole.</p>;

    return (
      <div className="hole-body">
        <p className="muted small center">
          Round {round + 1} of {targets.length}
        </p>
        <div className="estimate-card">
          <img src={target.img} alt="" />
          <strong>{target.label}</strong>
          <span className="clue-kicker">{question(target)}</span>
        </div>

        <div className="slider-block">
          <output className="big-number">
            {guess.toLocaleString()} <small>{unit}</small>
          </output>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={guess}
            disabled={revealed}
            onChange={(e) => setGuess(Number(e.target.value))}
          />
          <div className="slider-scale">
            <span>{min.toLocaleString()}</span>
            <span>{max.toLocaleString()}</span>
          </div>
        </div>

        {!revealed ? (
          <button className="btn primary" onClick={lockIn}>
            Lock it in
          </button>
        ) : (
          <div className="estimate-reveal">
            <p>
              Actual: <strong>{target.value.toLocaleString()} {unit}</strong> · you were off by{' '}
              <strong>{(errors[round] * 100).toFixed(1)}%</strong>
            </p>
            {!done && (
              <button className="btn primary" onClick={nextRound}>
                {round + 1 < targets.length ? 'Next round →' : 'Finish hole'}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };
}
