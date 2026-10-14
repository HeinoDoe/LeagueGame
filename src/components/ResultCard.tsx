import { useState, type ReactNode } from 'react';
import { ratePlay } from '../lib/storage';
import { scoreLabel, scoreTone } from '../lib/scoring';

interface Props {
  par: number;
  strokes: number;
  detail: string;
  playAt: number;
  actions: ReactNode;
}

/** Shown after a hole: the golf score, plus a "how fun was it?" rating for you. */
export function ResultCard({ par, strokes, detail, playAt, actions }: Props) {
  const [fun, setFun] = useState<number | null>(null);

  return (
    <div className={`result-card ${scoreTone(strokes, par)}`}>
      <div className="result-score">
        <span className="result-label">{scoreLabel(strokes, par)}</span>
        <span className="muted">
          {strokes} stroke{strokes === 1 ? '' : 's'} on a par {par} · {detail}
        </span>
      </div>

      <div className="fun-rating">
        <span>How fun was this hole?</span>
        <div className="stars" role="radiogroup" aria-label="Fun rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={fun === n}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              className={fun !== null && n <= fun ? 'on' : ''}
              onClick={() => {
                setFun(n);
                ratePlay(playAt, n);
              }}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="button-row">{actions}</div>
    </div>
  );
}
