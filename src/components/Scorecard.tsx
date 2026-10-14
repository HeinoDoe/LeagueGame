import type { HoleDef } from '../games/types';
import type { HoleResult } from '../lib/storage';
import { averageScore, crestUrl, rankOf } from '../lib/scoring';

interface Props {
  layout: HoleDef[];
  results: Record<string, HoleResult>;
  current: number;
}

/** Today's games in a row: points + rank crest for each one played, and the running rank. */
export function Scorecard({ layout, results, current }: Props) {
  const scores = layout.filter((h) => results[h.id]).map((h) => results[h.id].score);
  const avg = averageScore(scores);

  return (
    <div className="scorecard" aria-label="Scorecard">
      <table>
        <thead>
          <tr>
            <th>Game</th>
            {layout.map((h, i) => (
              <th key={h.id} className={i === current ? 'current' : ''} title={h.name}>
                {i + 1}
              </th>
            ))}
            <th>Rank</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Points</th>
            {layout.map((h) => {
              const r = results[h.id];
              return (
                <td key={h.id} title={r ? `${h.name}: ${rankOf(r.score).name}` : h.name}>
                  {r ? (
                    <span className={`score-cell rank-${rankOf(r.score).id}`}>
                      <img src={crestUrl(rankOf(r.score))} alt="" />
                      {r.score}
                    </span>
                  ) : (
                    '–'
                  )}
                </td>
              );
            })}
            <td className="total">
              {scores.length ? (
                <span className={`score-cell rank-${rankOf(avg).id}`}>
                  <img src={crestUrl(rankOf(avg))} alt="" />
                  {rankOf(avg).name} · {avg}
                </span>
              ) : (
                '–'
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
