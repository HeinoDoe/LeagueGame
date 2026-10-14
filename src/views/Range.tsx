import { useState } from 'react';
import type { GameData } from '../data/types';
import type { HoleDef } from '../games/types';
import { HOLES } from '../games/registry';
import { HoleShell } from '../components/HoleShell';
import { ResultCard } from '../components/ResultCard';
import { todayKey } from '../lib/date';
import { getPlays, logPlay } from '../lib/storage';

interface Props {
  data: GameData;
  onExit: () => void;
}

/** Free Play Mode: play any hole on a random seed, as often as you like. */
export function Range({ data, onExit }: Props) {
  const [hole, setHole] = useState<HoleDef | null>(null);
  const [seed, setSeed] = useState('');
  const [last, setLast] = useState<{ strokes: number; detail: string; at: number } | null>(null);

  function start(h: HoleDef) {
    setHole(h);
    setSeed(`range:${h.id}:${Date.now()}`);
    setLast(null);
    window.scrollTo({ top: 0 });
  }

  if (hole) {
    return (
      <div className="course">
        <div className="course-top">
          <button className="btn ghost" onClick={() => setHole(null)}>
            ← All holes
          </button>
          <span className="eyebrow">Free Play Mode</span>
        </div>
        <HoleShell hole={hole}>
          <hole.Component
            key={seed}
            data={data}
            seed={seed}
            par={hole.par}
            onFinish={(r) => {
              const at = logPlay({ holeId: hole.id, par: hole.par, ...r, mode: 'range', date: todayKey() });
              setLast({ ...r, at });
            }}
          />
          {last && (
            <ResultCard
              par={hole.par}
              strokes={last.strokes}
              detail={last.detail}
              playAt={last.at}
              actions={
                <>
                  <button className="btn primary" onClick={() => start(hole)}>
                    Play again
                  </button>
                  <button className="btn" onClick={() => setHole(null)}>
                    Pick another hole
                  </button>
                </>
              }
            />
          )}
        </HoleShell>
      </div>
    );
  }

  const plays = getPlays();

  return (
    <div className="range">
      <div className="course-top">
        <button className="btn ghost" onClick={onExit}>
          ← Home
        </button>
        <span className="eyebrow">Free Play Mode</span>
      </div>
      <h2>Pick a game</h2>
      <p className="muted">Unlimited plays, random puzzles. Rate each one — the Leaderboard ranks your favourites.</p>
      <div className="hole-grid">
        {HOLES.map((h) => {
          const mine = plays.filter((p) => p.holeId === h.id);
          const rated = mine.filter((p) => p.fun);
          const avgFun = rated.length ? rated.reduce((s, p) => s + (p.fun ?? 0), 0) / rated.length : null;
          return (
            <button key={h.id} className="hole-card" onClick={() => start(h)}>
              <span className="eyebrow">
                Par {h.par} · {h.kind}
              </span>
              <strong>{h.name}</strong>
              <span className="muted">{h.tagline}</span>
              <span className="small muted">
                {mine.length} play{mine.length === 1 ? '' : 's'}
                {avgFun !== null ? ` · ★ ${avgFun.toFixed(1)}` : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
