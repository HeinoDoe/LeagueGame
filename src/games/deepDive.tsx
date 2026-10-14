// "Deep Dive" (Krillion-style): 5 different categories, one answer each —
// the rarer your answer, the more points. 3 categories ask for a champion
// (from the Rift Connections groups; rarity ≈ how few skins they have),
// 2 are free-text questions about pro play and the game (curated/deepDive.ts).

import { useMemo, useState, type FormEvent } from 'react';
import type { Champion } from '../data/types';
import { GROUPS, SKIN_COUNTS, pickKind, type ConnectionGroup } from '../data/connections';
import { DEEP_DIVE_QUESTIONS, type TextQuestion, type Tier } from '../data/curated/deepDive';
import { ChampionInput, normalize } from '../components/ChampionInput';
import { createRng, pick, sample, shuffle, type Rng } from '../lib/random';
import type { HoleProps } from './types';

const TIERS: Tier[] = ['common', 'uncommon', 'rare', 'deep'];
const POINTS: Record<Tier, number> = { common: 1, uncommon: 2, rare: 3, deep: 4 };
const LABEL: Record<Tier, string> = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', deep: 'Deep cut' };
const TRIES = 3; // wrong answers allowed per category before it counts as a miss

interface Hit {
  name: string;
  tier: Tier;
}

interface Category {
  id: string;
  ask: string;
  type: 'champion' | 'text';
  /** A champion id (champion categories) or whatever was typed (text categories). */
  check: (answer: string) => Hit | null;
  byTier: Record<Tier, string[]>; // every accepted answer, for the reveal
}

/**
 * Champion categories, most common answer first: hand-made groups are listed
 * that way already; for the rest, more skins ≈ more players think of them.
 */
function championCategory(group: ConnectionGroup, champions: Map<string, Champion>): Category {
  const members = group.members.filter((id) => champions.has(id));
  if (group.kind !== 'curated') {
    members.sort((a, b) => (SKIN_COUNTS[b] ?? 0) - (SKIN_COUNTS[a] ?? 0) || a.localeCompare(b));
  }
  const tierOf = new Map(members.map((id, i) => [id, TIERS[Math.floor((4 * i) / members.length)]]));
  const byTier = Object.fromEntries(TIERS.map((t) => [t, [] as string[]])) as Record<Tier, string[]>;
  for (const id of members) byTier[tierOf.get(id)!].push(champions.get(id)!.name);
  return {
    id: group.id,
    ask: group.ask!,
    type: 'champion',
    check: (id) => (tierOf.has(id) ? { name: champions.get(id)!.name, tier: tierOf.get(id)! } : null),
    byTier,
  };
}

/** Edit distance, to forgive one typo ("Fnactic"). */
function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[b.length];
}

function textCategory(q: TextQuestion): Category {
  const lookup = new Map<string, Hit>();
  const byTier = Object.fromEntries(TIERS.map((t) => [t, [] as string[]])) as Record<Tier, string[]>;
  for (const tier of TIERS) {
    for (const entry of q.answers[tier] ?? []) {
      const [name, ...aka] = entry.split('|');
      byTier[tier].push(name);
      for (const spelling of [name, ...aka]) lookup.set(normalize(spelling), { name, tier });
    }
  }
  return {
    id: q.id,
    ask: q.ask,
    type: 'text',
    check: (typed) => {
      const n = normalize(typed);
      if (lookup.has(n)) return lookup.get(n)!;
      for (const [key, hit] of lookup) if (key.length >= 6 && distance(key, n) <= 1) return hit;
      return null;
    },
    byTier,
  };
}

/** Today's 5 categories: 3 champion ones of different kinds + 2 free-text questions. */
function makeDive(rng: Rng, champions: Map<string, Champion>): Category[] {
  let pool = GROUPS.filter((g) => {
    const size = g.members.filter((id) => champions.has(id)).length;
    return g.ask && size >= 8 && size <= 45; // enough answers to spread over 4 tiers
  });
  const picked: Category[] = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const kind = pickKind(rng, pool);
    picked.push(championCategory(pick(rng, pool.filter((g) => g.kind === kind)), champions));
    pool = pool.filter((g) => g.kind !== kind);
  }
  picked.push(...sample(rng, DEEP_DIVE_QUESTIONS, 2).map(textCategory));
  return shuffle(rng, picked);
}

function TextAnswer({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState('');
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text);
    setText('');
  }
  return (
    <form className="champ-input dive-text" onSubmit={submit}>
      <input
        type="text"
        value={text}
        placeholder="Type your answer…"
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="btn primary" type="submit" disabled={!text.trim()}>
        Answer
      </button>
    </form>
  );
}

export function DeepDiveHole({ data, seed, onFinish }: HoleProps) {
  const champions = useMemo(() => new Map(data.champions.map((c) => [c.id, c])), [data]);
  const categories = useMemo(() => makeDive(createRng(seed), champions), [seed, champions]);
  const [results, setResults] = useState<(Hit | null)[]>([]);
  const [misses, setMisses] = useState<string[]>([]); // wrong tries in the current category
  const round = results.length;
  const current = categories[round] as Category | undefined;
  const points = results.reduce((sum, r) => sum + (r ? POINTS[r.tier] : 0), 0);

  function record(hit: Hit | null) {
    const next = [...results, hit];
    setResults(next);
    setMisses([]);
    if (next.length === categories.length) {
      const pts = next.reduce((sum, r) => sum + (r ? POINTS[r.tier] : 0), 0);
      // Up to 20 depth points (five deep cuts) → 0–100.
      onFinish({ score: Math.round((100 * pts) / (4 * categories.length)), detail: `${pts} depth points` });
    }
  }

  function answer(input: string, shown: string) {
    if (!current) return;
    const hit = current.check(input);
    if (hit) return record(hit);
    const tried = [...misses, shown];
    if (tried.length >= TRIES) record(null);
    else setMisses(tried);
  }

  return (
    <div className="hole-body">
      <ol className="dive-progress">
        {categories.map((c, i) => {
          const r = results[i];
          return (
            <li key={c.id} className={i === round ? 'now' : i < round ? (r ? r.tier : 'miss') : ''}>
              {i < round ? (r ? `+${POINTS[r.tier]}` : '0') : i + 1}
            </li>
          );
        })}
      </ol>

      {current && (
        <>
          <div className="clue-card">
            <span className="clue-kicker">
              Category {round + 1} of {categories.length} · one answer, the rarer the better
            </span>
            <p className="clue-title">{current.ask}</p>
          </div>
          {current.type === 'champion' ? (
            <ChampionInput key={current.id} data={data} onSubmit={(c) => answer(c.id, c.name)} placeholder="Type a champion…" />
          ) : (
            <TextAnswer key={current.id} onSubmit={(t) => answer(t, t)} />
          )}
          {misses.length > 0 && (
            <p className="muted small center">
              “{misses[misses.length - 1]}” isn’t on the list — {TRIES - misses.length}{' '}
              {TRIES - misses.length === 1 ? 'try' : 'tries'} left
            </p>
          )}
        </>
      )}

      {results.length > 0 && (
        <ul className="dive-answers">
          {results.map((r, i) => {
            const c = categories[i];
            const deepest = [...c.byTier.deep, ...c.byTier.rare].filter((n) => n !== r?.name).slice(0, 6);
            return (
              <li key={c.id} className={r ? r.tier : 'miss'}>
                <div>
                  <span className="dive-ask">{c.ask}</span>
                  <span className="dive-given">{r ? r.name : 'No answer'}</span>
                  {!current && deepest.length > 0 && <span className="dive-cuts">Deep cuts: {deepest.join(', ')}</span>}
                </div>
                <strong>{r ? `${LABEL[r.tier]} +${POINTS[r.tier]}` : 'Missed'}</strong>
              </li>
            );
          })}
        </ul>
      )}

      {!current && (
        <p className="center">
          <strong>{points}</strong> depth points out of {categories.length * 4}
        </p>
      )}
    </div>
  );
}
