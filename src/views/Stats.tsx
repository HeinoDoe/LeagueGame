import { useState } from 'react';
import { HOLES } from '../games/registry';
import { clearAllData, getPlays } from '../lib/storage';
import { averageScore } from '../lib/scoring';
import { RankBadge } from '../components/RankBadge';

interface Props {
  onExit: () => void;
}

/** Your personal "which games are actually fun?" dashboard. */
export function Stats({ onExit }: Props) {
  const [plays, setPlays] = useState(getPlays);

  const rows = HOLES.map((h) => {
    const mine = plays.filter((p) => p.holeId === h.id);
    const rated = mine.filter((p) => p.fun);
    return {
      hole: h,
      plays: mine.length,
      // Plays from before the 0–100 score have no score; they still count for fun.
      avgScore: mine.some((p) => typeof p.score === 'number')
        ? averageScore(mine.filter((p) => typeof p.score === 'number').map((p) => p.score))
        : null,
      avgFun: rated.length ? rated.reduce((s, p) => s + (p.fun ?? 0), 0) / rated.length : null,
      ratings: rated.length,
    };
  }).sort((a, b) => (b.avgFun ?? -1) - (a.avgFun ?? -1));

  function exportJson() {
    const blob = new Blob([JSON.stringify(plays, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lol-nerdles-plays.json';
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
      <h2>Which games are worth keeping?</h2>
      <p className="muted">
        Sorted by your average fun rating. The average score shows if a game is too easy (always Challenger) or too
        hard (always Iron) — tweak its scoring in the code.
      </p>

      <div className="table-wrap">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Game</th>
              <th>Plays</th>
              <th>Avg score</th>
              <th>Fun</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.hole.id}>
                <td>
                  <strong>{r.hole.name}</strong>
                </td>
                <td>{r.plays}</td>
                <td>
                  {r.avgScore === null ? (
                    '–'
                  ) : (
                    <span className="best-rank">
                      <RankBadge score={r.avgScore} /> {r.avgScore}
                    </span>
                  )}
                </td>
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
