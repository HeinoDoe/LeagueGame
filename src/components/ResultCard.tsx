import { useState, type ReactNode } from 'react';
import { ratePlay } from '../lib/storage';
import { rankOf } from '../lib/scoring';
import { RankBadge } from './RankBadge';

interface Props {
  score: number;
  detail: string;
  playAt: number;
  actions: ReactNode;
}

/** Shown after a game: the points and rank, plus a "how fun was it?" rating for you. */
export function ResultCard({ score, detail, playAt, actions }: Props) {
  const [fun, setFun] = useState<number | null>(null);

  return (
    <div className={`result-card rank-${rankOf(score).id}`}>
      <div className="result-score">
        <RankBadge score={score} size="large" showName={false} />
        <span className="result-label">{rankOf(score).name}</span>
        <span className="result-points">
          <strong>{score}</strong> / 100 points
        </span>
        <span className="muted small">{detail}</span>
      </div>

      <div className="fun-rating">
        <span>How fun was this game?</span>
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
