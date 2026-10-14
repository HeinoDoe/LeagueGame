// "Redacted Lore": guess the champion from their bio, with their name blacked out.

import type { Champion } from '../data/types';
import { makeGuessChampionHole } from './guessChampion';

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function redact(text: string, c: Champion): string {
  const words = new Set([c.name, c.id, ...c.name.split(/[\s&]+/)].filter((w) => w.length >= 3));
  let out = text;
  for (const w of words) out = out.replace(new RegExp(escapeRegExp(w), 'gi'), '▇▇▇');
  return out;
}

export const RedactedLoreHole = makeGuessChampionHole({
  clue: (target) => (
    <div className="clue-card">
      <span className="clue-kicker">Whose story is this?</span>
      <p className="clue-lore">{redact(target.blurb, target)}</p>
    </div>
  ),
});
