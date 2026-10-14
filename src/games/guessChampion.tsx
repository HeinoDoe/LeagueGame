// Engine: guess the champion from a clue, with extra hints after each miss.
// Used by "Redacted Lore" (clue = lore blurb) and "Silhouette" (clue = 3D shadow).

import { useMemo, useState, type FC, type ReactNode } from 'react';
import type { Champion, GameData } from '../data/types';
import { createRng, pick } from '../lib/random';
import { capStrokes, MAX_OVER_PAR } from '../lib/scoring';
import { ChampionInput } from '../components/ChampionInput';
import type { HoleProps } from './types';

const MAX_GUESSES = 6;

export interface Hint {
  label: string;
  value: ReactNode;
}

interface Options {
  /** The clue. `misses` = wrong guesses so far; `finished` once the hole is over. */
  clue: (target: Champion, misses: number, finished: boolean) => ReactNode;
  /** Champions that can be the answer (default: all of them). */
  pool?: (data: GameData) => Champion[];
  /** Hints, unlocked one per miss (default: class, attack type, first letter, blurred portrait). */
  hints?: (target: Champion, data: GameData) => Hint[];
}

const defaultHints = (target: Champion, data: GameData): Hint[] => [
  { label: 'Class', value: target.tags.join(' · ') },
  { label: 'Attack type', value: target.attackRange >= 300 ? 'Ranged' : 'Melee' },
  { label: 'First letter', value: target.name[0] },
  {
    label: 'Portrait',
    value: <img className="blurred-portrait" src={data.championImg(target)} alt="Blurred champion portrait" />,
  },
];

export function makeGuessChampionHole({ clue, pool, hints = defaultHints }: Options): FC<HoleProps> {
  return function GuessChampionHole({ data, seed, par, onFinish }: HoleProps) {
    const target = useMemo(() => pick(createRng(seed), pool ? pool(data) : data.champions), [data, seed]);
    const [guesses, setGuesses] = useState<Champion[]>([]);
    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');

    const wrong = guesses.filter((g) => g.id !== target.id).length;
    const excluded = useMemo(() => new Set(guesses.map((g) => g.id)), [guesses]);

    function guess(c: Champion) {
      if (status !== 'playing') return;
      const next = [...guesses, c];
      setGuesses(next);
      if (c.id === target.id) {
        setStatus('won');
        // 1st guess = 2 strokes (eagle on a par 4), 2nd = 3 (birdie), 3rd = par …
        onFinish({
          strokes: capStrokes(next.length + 1, par),
          detail: `Solved in ${next.length} guess${next.length === 1 ? '' : 'es'}`,
        });
      } else if (next.length >= MAX_GUESSES) {
        setStatus('lost');
        onFinish({ strokes: par + MAX_OVER_PAR, detail: `Missed — it was ${target.name}` });
      }
    }

    return (
      <div className="hole-body">
        {clue(target, wrong, status !== 'playing')}

        {wrong > 0 && status === 'playing' && (
          <div className="hints">
            {hints(target, data)
              .slice(0, wrong)
              .map((h) => (
                <div className="hint" key={h.label}>
                  <span>{h.label}</span>
                  <strong>{h.value}</strong>
                </div>
              ))}
          </div>
        )}

        {status === 'playing' ? (
          <>
            <ChampionInput data={data} exclude={excluded} onSubmit={guess} />
            <p className="muted small">
              Guess {guesses.length + 1} of {MAX_GUESSES} · every miss unlocks a hint
            </p>
          </>
        ) : (
          <div className={`reveal ${status}`}>
            <img src={data.championImg(target)} alt="" />
            <div>
              <strong>{target.name}</strong>
              <span className="muted">{target.title}</span>
            </div>
          </div>
        )}

        {guesses.length > 0 && (
          <ul className="guess-list">
            {guesses.map((g) => (
              <li key={g.id} className={g.id === target.id ? 'right' : 'wrong'}>
                <img src={data.championImg(g)} alt="" />
                {g.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };
}
