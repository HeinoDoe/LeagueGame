// "Silhouette": guess the champion from the black shadow of their turning 3D
// model. Every miss turns the lights up a little and unlocks a hint.

import { lazy, Suspense } from 'react';
import { GROUPS } from '../data/connections';
import { MODELS } from '../data/models';
import { makeGuessChampionHole } from './guessChampion';

const SilhouetteStage = lazy(() =>
  import('../components/SilhouetteStage').then((m) => ({ default: m.SilhouetteStage })),
);

// How bright the model is after 0, 1, 2 … misses (1 = full colour, shown at the
// end). The scene's lights add up to ~2.5×, so 0.1 already reads as dim colour.
const LIGHT = [0, 0, 0.04, 0.08, 0.15, 0.28];

const modelsByKey = new Map(MODELS.filter((m) => m.kind === 'champion').map((m) => [m.key, m]));

function regionOf(id: string): string {
  const label = GROUPS.find((g) => g.kind === 'region' && g.members.includes(id))?.label;
  return label ? label.replace(/^From (the )?/, '') : 'None';
}

export const SilhouetteHole = makeGuessChampionHole({
  pool: (data) => data.champions.filter((c) => modelsByKey.has(c.id)),
  clue: (target, misses, finished) => (
    <Suspense fallback={<div className="silhouette-stage" />}>
      <SilhouetteStage model={modelsByKey.get(target.id)!} light={finished ? 1 : LIGHT[misses]} />
    </Suspense>
  ),
  hints: (target) => [
    { label: 'Class', value: target.tags.join(' · ') },
    { label: 'Region', value: regionOf(target.id) },
    { label: 'Attack type', value: target.attackRange >= 300 ? 'Ranged' : 'Melee' },
    { label: 'First letter', value: target.name[0] },
  ],
});
