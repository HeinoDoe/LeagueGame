import { useState } from 'react';
import { HOLES } from '../games/registry';
import { clearAllData, getPlays } from '../lib/storage';
import { formatToPar } from '../lib/scoring';

interface Props {
  onExit: () => void;
}

/** Your personal "which holes are actually fun?" dashboard. */
export function Stats({ onExit }: Props) {
  const [plays, setPlays] = useState(getPlays);

  const rows = HOLES.map((h) => {
    const mine = plays.filter((p) => p.holeId === h.id);
    const rated = mine.filter((p) => p.fun);
    return {
      hole: h,
      plays: mine.length,
      avgToPar: mine.length ? mine.reduce((s, p) => s + (p.strokes - p.par), 0) / mine.length : null,
      avgFun: rated.length ? rated.reduce((s, p) => s + (p.fun ?? 0), 0) / rated.length : null,
      ratings: rated.length,
    };
  }).sort((a, b) => (b.avgFun ?? -1) - (a.avgFun ?? -1));

  function exportJson() {
    const blob = new Blob([JSON.stringify(plays, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rift-links-plays.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="stats">
      <div className="course-top">
        <button className="btn ghost" onClick={onExit}>
          ← Home
        </button>
        <span className="eyebrow">Leaderboard</span>
      </div>
      <h2>Which holes are worth keeping?</h2>
      <p className="muted">
        Sorted by your average fun rating. Average to par tells you if a hole is too easy (very negative) or too
        hard (very positive) — tweak its scoring in the code.
      </p>

      <div className="table-wrap">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Hole</th>
              <th>Plays</th>
              <th>Avg to par</th>
              <th>Fun</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.hole.id}>
                <td>
                  <strong>{r.hole.name}</strong>
                  <span className="muted small"> · par {r.hole.par}</span>
                </td>
                <td>{r.plays}</td>
                <td>{r.avgToPar === null ? '–' : formatToPar(Math.round(r.avgToPar * 10) / 10)}</td>
                <td>
                  {r.avgFun === null ? (
                    <span className="muted">not rated</span>
                  ) : (
                    <span className="fun-bar">
                      <span style={{ width: `${(r.avgFun / 5) * 100}%` }} />
                      <em>
                        {r.avgFun.toFixed(1)} ({r.ratings})
                      </em>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="button-row">
        <button className="btn" onClick={exportJson} disabled={!plays.length}>
          Export plays (JSON)
        </button>
        <button
          className="btn danger"
          onClick={() => {
            if (window.confirm('Delete all scores, ratings and daily progress in this browser?')) {
              clearAllData();
              setPlays([]);
            }
          }}
        >
          Reset everything
        </button>
      </div>
    </div>
  );
}
