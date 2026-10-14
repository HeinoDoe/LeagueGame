// "Splash Zoom": guess the champion from a zoomed-in piece of their splash art.
// Every miss zooms out a little and unlocks a hint.

import { regionOf } from '../data/connections';
import { createRng } from '../lib/random';
import { makeGuessChampionHole } from './guessChampion';

// How far zoomed in after 0, 1, 2 … misses (1 = the whole splash, shown at the end).
const ZOOM = [6, 4.4, 3.2, 2.3, 1.6, 1.2];

export const SplashZoomHole = makeGuessChampionHole({
  clue: (target, misses, finished) => {
    // Zoom in near the middle of the art, where the champion usually is.
    const rng = createRng(`splash:${target.id}`);
    const x = 35 + rng() * 30;
    const y = 25 + rng() * 30;
    return (
      <div className="splash-frame">
        <img
          src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${target.id}_0.jpg`}
          alt="A zoomed-in piece of a champion's splash art"
          style={{ transform: `scale(${finished ? 1 : ZOOM[misses]})`, transformOrigin: `${x}% ${y}%` }}
        />
      </div>
    );
  },
  hints: (target) => [
    { label: 'Class', value: target.tags.join(' · ') },
    { label: 'Region', value: regionOf(target.id) },
    { label: 'Attack type', value: target.attackRange >= 300 ? 'Ranged' : 'Melee' },
    { label: 'First letter', value: target.name[0] },
  ],
});
