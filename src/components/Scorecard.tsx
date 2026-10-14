import type { HoleDef } from '../games/types';
import type { HoleResult } from '../lib/storage';
import { formatToPar, scoreTone } from '../lib/scoring';

interface Props {
  layout: HoleDef[];
  results: Record<string, HoleResult>;
  current: number;
}

export function Scorecard({ layout, results, current }: Props) {
  const played = layout.filter((h) => results[h.id]);
  const strokes = played.reduce((s, h) => s + results[h.id].strokes, 0);
  const par = played.reduce((s, h) => s + h.par, 0);

  return (
    <div className="scorecard" aria-label="Scorecard">
      <table>
        <thead>
          <tr>
            <th>Hole</th>
            {layout.map((h, i) => (
              <th key={h.id} className={i === current ? 'current' : ''} title={h.name}>
                {i + 1}
              </th>
            ))}
            <th>Tot</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Par</th>
            {layout.map((h) => (
              <td key={h.id}>{h.par}</td>
            ))}
            <td>{layout.reduce((s, h) => s + h.par, 0)}</td>
          </tr>
          <tr>
            <th>You</th>
            {layout.map((h) => {
              const r = results[h.id];
              return (
                <td key={h.id}>
                  {r ? <span className={`score-chip ${scoreTone(r.strokes, h.par)}`}>{r.strokes}</span> : '–'}
                </td>
              );
            })}
            <td className="total">{played.length ? `${strokes} (${formatToPar(strokes - par)})` : '–'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
