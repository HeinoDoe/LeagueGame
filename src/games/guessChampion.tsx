// Engine: guess the champion from a clue, with extra hints after each miss.
// Used by "Title Shot" (clue = champion title) and "Redacted Lore" (clue = lore blurb).

import { useMemo, useState, type FC, type ReactNode } from 'react';
import type { Champion } from '../data/types';
import { createRng, pick } from '../lib/random';
import { capStrokes, MAX_OVER_PAR } from '../lib/scoring';
import { ChampionInput } from '../components/ChampionInput';
import type { HoleProps } from './types';

const MAX_GUESSES = 6;

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function redact(text: string, c: Champion): string {
  const words = new Set([c.name, c.id, ...c.name.split(/[\s&]+/)].filter((w) => w.length >= 3));
  let out = text;
  for (const w of words) out = out.replace(new RegExp(escapeRegExp(w), 'gi'), '▇▇▇');
  return out;
}

export function makeGuessChampionHole(mode: 'title' | 'lore'): FC<HoleProps> {
  return function GuessChampionHole({ data, seed, par, onFinish }: HoleProps) {
    const target = useMemo(() => pick(createRng(seed), data.champions), [data, seed]);
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

    const hints: { label: string; value: ReactNode }[] = [
      { label: 'Class', value: target.tags.join(' · ') },
      { label: 'Attack type', value: target.attackRange >= 300 ? 'Ranged' : 'Melee' },
      { label: 'First letter', value: target.name[0] },
      {
        label: 'Portrait',
        value: <img className="blurred-portrait" src={data.championImg(target)} alt="Blurred champion portrait" />,
      },
    ];

    return (
      <div className="hole-body">
        <div className="clue-card">
          {mode === 'title' ? (
            <>
              <span className="clue-kicker">Which champion is…</span>
              <p className="clue-title">“{target.title}”</p>
            </>
          ) : (
            <>
              <span className="clue-kicker">Whose story is this?</span>
              <p className="clue-lore">{redact(target.blurb, target)}</p>
            </>
          )}
        </div>

        {wrong > 0 && status === 'playing' && (
          <div className="hints">
            {hints.slice(0, wrong).map((h) => (
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
