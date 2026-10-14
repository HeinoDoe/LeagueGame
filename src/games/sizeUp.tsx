// "Size Up": resize a champion's 3D model next to another one (Magnitudle-style).
// Two rounds are champion vs champion, the last one is against something
// from the Rift (a turret, Baron, a minion …). Heights come from the real
// in-game models — see src/data/models.ts.

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { MODELS, type ModelInfo } from '../data/models';
import { createRng, shuffle, type Rng } from '../lib/random';
import { averageScore, scoreFromError } from '../lib/scoring';
import type { HoleProps } from './types';

const ModelStage = lazy(() => import('../components/ModelStage').then((m) => ({ default: m.ModelStage })));
const preload = (info: ModelInfo) => import('../lib/models3d').then((m) => m.preloadModel(info));

const ROUNDS = 3;
const MIN_RATIO = 1 / 6;
const MAX_RATIO = 6;
const NO_ARTICLE = new Set(['baron', 'gromp']);

interface Pair {
  ref: ModelInfo;
  target: ModelInfo;
  ratio: number; // true target height ÷ reference height
}

/** "the Nexus", but "Baron Nashor" and "Teemo". */
function called(m: ModelInfo): string {
  return m.kind === 'landmark' && !NO_ARTICLE.has(m.key) ? `the ${m.name}` : m.name;
}

function pickPairs(rng: Rng): Pair[] {
  const champions = shuffle(rng, MODELS.filter((m) => m.kind === 'champion'));
  const landmarks = shuffle(rng, MODELS.filter((m) => m.kind === 'landmark'));
  const used = new Set<string>();
  const out: Pair[] = [];
  const fits = (a: ModelInfo, b: ModelInfo, maxRatio: number) => {
    const r = b.height / a.height;
    return !used.has(a.key) && !used.has(b.key) && r <= maxRatio && r >= 1 / maxRatio && Math.abs(Math.log(r)) > 0.1;
  };
  const add = (ref: ModelInfo, target: ModelInfo) => {
    out.push({ ref, target, ratio: target.height / ref.height });
    used.add(ref.key).add(target.key);
  };

  for (let i = 0; i < champions.length && out.length < ROUNDS - 1; i++) {
    const partner = champions.slice(i + 1).find((c) => fits(champions[i], c, 2.5));
    if (partner) add(champions[i], partner);
  }
  for (const landmark of landmarks) {
    const champ = champions.find((c) => fits(c, landmark, 5));
    if (champ) {
      if (rng() < 0.5) add(champ, landmark);
      else add(landmark, champ);
      break;
    }
  }
  return out;
}

/** 100 when spot on; 10% off ≈ 82, 25% ≈ 61, twice the size ≈ 14. */
const roundScore = (error: number) => scoreFromError(error, 2);

export function SizeUpHole({ seed, onFinish }: HoleProps) {
  const pairs = useMemo(() => pickPairs(createRng(seed)), [seed]);
  const [round, setRound] = useState(0);
  const [logRatio, setLogRatio] = useState(0); // slider works in log space: feels even both ways
  const [errors, setErrors] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const pair = pairs[round];
  const guess = Math.exp(logRatio);
  const revealed = errors.length > round;

  // Download the next round's models while this one is being played.
  useEffect(() => {
    const next = pairs[round + 1];
    if (next) [next.ref, next.target].forEach(preload);
  }, [pairs, round]);

  if (!pair) return <p className="muted">Run npm run fetch-models to download the models for this hole.</p>;

  function lockIn() {
    // How many times too big or too small: guessing 2× or ½× the truth are both 100% off.
    setErrors([...errors, Math.max(guess / pair.ratio, pair.ratio / guess) - 1]);
  }

  function next() {
    if (round + 1 < pairs.length) {
      setRound(round + 1);
      setLogRatio(0);
    } else {
      const avg = errors.reduce((a, b) => a + b, 0) / errors.length;
      setDone(true);
      onFinish({ score: averageScore(errors.map(roundScore)), detail: `Average error ${(avg * 100).toFixed(1)}%` });
    }
  }

  return (
    <div className="hole-body">
      <p className="muted small center">
        Round {round + 1} of {pairs.length}
      </p>
      <p className="clue-kicker center">
        If {called(pair.ref)} is this tall, how tall is {called(pair.target)}?
      </p>
      <Suspense fallback={<div className="model-stage model-stage-msg">Summoning models…</div>}>
        <ModelStage
          left={pair.ref}
          right={pair.target}
          ratio={revealed ? pair.ratio : guess}
          guess={revealed ? guess : undefined}
          spin={revealed}
        />
      </Suspense>
      <div className="slider-block">
        <output className="big-number">
          {(revealed ? pair.ratio : guess).toFixed(2)}× <small>{pair.ref.name}</small>
        </output>
        <input
          type="range"
          min={Math.log(MIN_RATIO)}
          max={Math.log(MAX_RATIO)}
          step={0.005}
          value={logRatio}
          disabled={revealed}
          onChange={(e) => setLogRatio(Number(e.target.value))}
        />
      </div>
      {!revealed ? (
        <button className="btn primary" onClick={lockIn}>
          Lock it in
        </button>
      ) : (
        <div className="estimate-reveal">
          <p>
            You said <strong>{guess.toFixed(2)}×</strong> · off by <strong>{(errors[round] * 100).toFixed(0)}%</strong> ·{' '}
            <strong>{roundScore(errors[round])} points</strong>
          </p>
          <p className="muted small">
            In-game: {pair.ref.name} {Math.round(pair.ref.height)} · {pair.target.name} {Math.round(pair.target.height)}{' '}
            units tall. Drag to spin them.
          </p>
          {!done && (
            <button className="btn primary" onClick={next}>
              {round + 1 < pairs.length ? 'Next round →' : 'Finish'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
