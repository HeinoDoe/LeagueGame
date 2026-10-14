// "Recipe Book": you see the components, pick the finished item.

import { useMemo, useState } from 'react';
import type { Item } from '../data/types';
import { createRng, sample, shuffle } from '../lib/random';
import { capStrokes } from '../lib/scoring';
import type { HoleProps } from './types';

const ROUNDS = 3;
const recipeKey = (i: Item) => [...i.from].sort().join(',');

export function RecipeHole({ data, seed, par, onFinish }: HoleProps) {
  const rounds = useMemo(() => {
    const rng = createRng(seed);
    const pool = data.items.filter(
      (i) => i.total >= 1500 && i.from.length >= 2 && i.from.every((id) => data.itemsById.has(id)),
    );
    return sample(rng, pool, ROUNDS).map((target) => {
      const decoys = sample(
        rng,
        pool.filter((i) => i.id !== target.id && recipeKey(i) !== recipeKey(target)),
        3,
      );
      return { target, options: shuffle(rng, [target, ...decoys]) };
    });
  }, [data, seed]);

  const [round, setRound] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const current = rounds[round];
  const picked = picks[round];

  function choose(item: Item) {
    if (picked) return;
    setPicks([...picks, item.id]);
  }

  function next() {
    if (round + 1 < rounds.length) {
      setRound(round + 1);
    } else {
      const wrong = rounds.filter((r, i) => picks[i] !== r.target.id).length;
      setDone(true);
      onFinish({ strokes: capStrokes(2 + wrong, par), detail: `${rounds.length - wrong}/${rounds.length} recipes right` });
    }
  }

  if (!current) return <p className="muted">Not enough items for this hole.</p>;

  return (
    <div className="hole-body">
      <p className="muted small center">
        Recipe {round + 1} of {rounds.length}
      </p>
      <div className="components">
        {current.target.from.map((id, i) => {
          const c = data.itemsById.get(id)!;
          return (
            <div className="component" key={`${id}-${i}`}>
              <img src={data.itemImg(c)} alt="" />
              <span>{c.name}</span>
            </div>
          );
        })}
      </div>
      <p className="clue-kicker center">…build into which item?</p>
      <div className="options">
        {current.options.map((o) => {
          const state = !picked ? '' : o.id === current.target.id ? 'right' : o.id === picked ? 'wrong' : 'dim';
          return (
            <button key={o.id} className={`option ${state}`} onClick={() => choose(o)} disabled={!!picked}>
              <img src={data.itemImg(o)} alt="" />
              {o.name}
            </button>
          );
        })}
      </div>
      {picked && !done && (
        <button className="btn primary" onClick={next}>
          {round + 1 < rounds.length ? 'Next recipe →' : 'Finish hole'}
        </button>
      )}
    </div>
  );
}
