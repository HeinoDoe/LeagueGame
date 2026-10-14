import { crestUrl, rankOf } from '../lib/scoring';

interface Props {
  score: number;
  /** "small" for lists and tables; "large" for result cards. */
  size?: 'small' | 'large';
  showName?: boolean;
}

/** A score shown as its League rank: crest (+ name). */
export function RankBadge({ score, size = 'small', showName = true }: Props) {
  const rank = rankOf(score);
  return (
    <span className={`rank-badge ${size} rank-${rank.id}`} title={`${rank.name} · ${score} points`}>
      <img src={crestUrl(rank)} alt="" />
      {showName && <span className="rank-name">{rank.name}</span>}
    </span>
  );
}
