// "Deep Dive" (Krillion-style): give 3 answers to a prompt; rarer answers score more.

import { useMemo, useState } from 'react';
import type { Champion } from '../data/types';
import { DEEP_DIVE_PROMPTS, TIER_LABEL, TIER_POINTS, type Tier } from '../data/curated/deepDive';
import { ChampionInput, normalize } from '../components/ChampionInput';
import { createRng, pick } from '../lib/random';
import { capStrokes } from '../lib/scoring';
import type { HoleProps } from './types';

const ANSWERS = 3;
const TIERS: Tier[] = ['deep', 'rare', 'uncommon', 'common'];

/** Max 12 points (three deep cuts). Par 5 ≈ 6–8 points. */
function strokesFromPoints(points: number): number {
  if (points >= 11) return 3;
  if (points >= 9) return 4;
  if (points >= 6) return 5;
  if (points >= 3) return 6;
  return 8;
}

export function DeepDiveHole({ data, seed, par, onFinish }: HoleProps) {
  const prompt = useMemo(() => pick(createRng(seed), DEEP_DIVE_PROMPTS), [seed]);
  const tierOf = useMemo(() => {
    const map = new Map<string, Tier>();
    for (const t of TIERS) for (const name of prompt.answers[t]) map.set(normalize(name), t);
    return map;
  }, [prompt]);

  const [answers, setAnswers] = useState<{ champ: Champion; tier: Tier | null }[]>([]);
  const excluded = useMemo(() => new Set(answers.map((a) => a.champ.id)), [answers]);
  const done = answers.length >= ANSWERS;
  const points = answers.reduce((sum, a) => sum + (a.tier ? TIER_POINTS[a.tier] : 0), 0);

  function submit(c: Champion) {
    if (done) return;
    const next = [...answers, { champ: c, tier: tierOf.get(normalize(c.name)) ?? null }];
    setAnswers(next);
    if (next.length === ANSWERS) {
      const pts = next.reduce((sum, a) => sum + (a.tier ? TIER_POINTS[a.tier] : 0), 0);
      onFinish({ strokes: capStrokes(strokesFromPoints(pts), par), detail: `${pts} depth points` });
    }
  }

  return (
    <div className="hole-body">
      <div className="clue-card">
        <span className="clue-kicker">Answer {ANSWERS} times. Rare answers sink you deeper.</span>
        <p className="clue-title">{prompt.prompt}</p>
      </div>

      {!done && (
        <ChampionInput data={data} exclude={excluded} onSubmit={submit} placeholder={`Answer ${answers.length + 1} of ${ANSWERS}…`} />
      )}

      <ul className="dive-answers">
        {answers.map(({ champ, tier }) => (
          <li key={champ.id} className={tier ?? 'miss'}>
            <img src={data.championImg(champ)} alt="" />
            <span>{champ.name}</span>
            <strong>{tier ? `${TIER_LABEL[tier]} +${TIER_POINTS[tier]}` : 'Not on the list'}</strong>
          </li>
        ))}
      </ul>

      {done && (
        <div className="dive-reveal">
          <p className="center">
            <strong>{points}</strong> depth points — here's everything that counted:
          </p>
          {TIERS.map((t) => (
            <div key={t} className={`dive-tier ${t}`}>
              <span>
                {TIER_LABEL[t]} · +{TIER_POINTS[t]}
              </span>
              <p>{prompt.answers[t].join(', ')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
