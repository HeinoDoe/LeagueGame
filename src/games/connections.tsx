// "Rift Connections": 16 champions hide 4 groups of 4 (like NYT Connections).
// Groups come from src/data/connections.ts.

import { useMemo, useState } from 'react';
import { makePuzzle } from '../data/connections';
import { createRng, shuffle } from '../lib/random';
import type { HoleProps } from './types';

const MAX_MISTAKES = 4;

export function ConnectionsHole({ data, seed, onFinish }: HoleProps) {
  const champions = useMemo(() => new Map(data.champions.map((c) => [c.id, c])), [data]);
  const puzzle = useMemo(() => makePuzzle(createRng(seed), new Set(champions.keys())), [seed, champions]);
  const [order, setOrder] = useState(() => shuffle(createRng(`${seed}:tiles`), puzzle?.flatMap((g) => g.picks) ?? []));
  const [selected, setSelected] = useState<string[]>([]);
  const [found, setFound] = useState<number[]>([]); // puzzle group indexes, in the order they were found
  const [mistakes, setMistakes] = useState(0);
  const [tried, setTried] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  if (!puzzle) return <p className="muted">Couldn’t build a puzzle — run npm run fetch-connections.</p>;

  const groupOf = (id: string) => puzzle.findIndex((g) => g.picks.includes(id));
  const bands = status === 'lost' ? [...found, ...[0, 1, 2, 3].filter((i) => !found.includes(i))] : found;
  const tiles = order.filter((id) => !bands.includes(groupOf(id)));

  function toggle(id: string) {
    if (status !== 'playing') return;
    setMessage('');
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 4 ? [...s, id] : s));
  }

  function submit() {
    const key = [...selected].sort().join();
    if (tried.includes(key)) return setMessage('You already tried those four.');
    setTried([...tried, key]);

    const counts = [0, 1, 2, 3].map((i) => selected.filter((id) => groupOf(id) === i).length);
    const best = Math.max(...counts);
    if (best === 4) {
      const next = [...found, counts.indexOf(4)];
      setFound(next);
      setSelected([]);
      if (next.length === 4) {
        setStatus('won');
        // Solved: 100, minus 20 per mistake.
        onFinish({
          score: 100 - 20 * mistakes,
          detail: mistakes ? `Solved with ${mistakes} mistake${mistakes === 1 ? '' : 's'}` : 'Solved without a mistake',
        });
      }
      return;
    }
    const m = mistakes + 1;
    setMistakes(m);
    setMessage(best === 3 ? 'One away…' : 'Not a group.');
    if (m >= MAX_MISTAKES) {
      setStatus('lost');
      setSelected([]);
      setMessage('');
      // Out of mistakes: 10 per group found, so failing never beats solving (min. 40).
      onFinish({ score: 10 * found.length, detail: `Found ${found.length} of 4 groups` });
    }
  }

  return (
    <div className="hole-body">
      <p className="clue-kicker center">Find four groups of four champions.</p>

      {bands.map((i) => {
        const { group, picks } = puzzle[i];
        return (
          <div key={group.id} className={`conn-band level-${group.level}${found.includes(i) ? '' : ' missed'}`}>
            <strong>{group.label}</strong>
            <span>{picks.map((id) => champions.get(id)?.name).join(', ')}</span>
          </div>
        );
      })}

      {tiles.length > 0 && (
        <div className="conn-grid">
          {tiles.map((id) => {
            const c = champions.get(id)!;
            return (
              <button
                key={id}
                className={`conn-tile${selected.includes(id) ? ' selected' : ''}`}
                onClick={() => toggle(id)}
                disabled={status !== 'playing'}
              >
                <img src={data.championImg(c)} alt="" />
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {status === 'playing' && (
        <>
          <p className="muted small center conn-status">
            {message || (
              <>
                Mistakes left:{' '}
                {Array.from({ length: MAX_MISTAKES }, (_, i) => (i < MAX_MISTAKES - mistakes ? '●' : '○')).join(' ')}
              </>
            )}
          </p>
          <div className="button-row">
            <button className="btn" onClick={() => setOrder(shuffle(createRng(String(Math.random())), order))}>
              Shuffle
            </button>
            <button className="btn" onClick={() => setSelected([])} disabled={!selected.length}>
              Deselect
            </button>
            <button className="btn primary" onClick={submit} disabled={selected.length !== 4}>
              Submit
            </button>
          </div>
        </>
      )}
    </div>
  );
}
