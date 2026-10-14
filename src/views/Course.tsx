import { useMemo, useState } from 'react';
import type { GameData } from '../data/types';
import type { HoleDef } from '../games/types';
import { HOLES } from '../games/registry';
import { HoleShell } from '../components/HoleShell';
import { ResultCard } from '../components/ResultCard';
import { Scorecard } from '../components/Scorecard';
import { COURSE_NAMES, COURSE_SIZES, dailyLayout, dailySeed, type CourseSize } from '../lib/course';
import { todayKey } from '../lib/date';
import { averageScore, rankOf, shareSquare } from '../lib/scoring';
import { RankBadge } from '../components/RankBadge';
import { getDailyResults, logPlay, saveDailyResult, type HoleResult } from '../lib/storage';

interface Props {
  data: GameData;
  size: CourseSize;
  onChangeSize: (size: CourseSize) => void;
  onExit: () => void;
}

function firstUnplayed(layout: HoleDef[], results: Record<string, HoleResult>, from = 0): number {
  for (let i = from; i < layout.length; i++) if (!results[layout[i].id]) return i;
  for (let i = 0; i < from; i++) if (!results[layout[i].id]) return i;
  return -1;
}

export function Course({ data, size, onChangeSize, onExit }: Props) {
  const date = useMemo(() => todayKey(), []);
  const layout = useMemo(() => dailyLayout(date, HOLES).slice(0, size), [date, size]);
  const [results, setResults] = useState(() => getDailyResults(date));
  const [current, setCurrent] = useState(() => firstUnplayed(layout, results));
  const [justPlayed, setJustPlayed] = useState<{ holeId: string; at: number } | null>(null);
  const [copied, setCopied] = useState(false);

  // When the course size changes (e.g. extend 3 → 6), jump to the next open hole.
  const [lastSize, setLastSize] = useState(size);
  if (lastSize !== size) {
    setLastSize(size);
    setCurrent(firstUnplayed(layout, results));
    setJustPlayed(null);
  }

  function finish(hole: HoleDef, r: { score: number; detail: string }) {
    const result: HoleResult = { holeId: hole.id, ...r };
    saveDailyResult(date, result);
    const at = logPlay({ ...result, mode: 'daily', date });
    setResults((prev) => ({ ...prev, [hole.id]: result }));
    setJustPlayed({ holeId: hole.id, at });
  }

  function next() {
    setJustPlayed(null);
    setCurrent(firstUnplayed(layout, { ...results }, current + 1));
  }

  const hole = current >= 0 ? layout[current] : null;
  const showHole = hole && (!results[hole.id] || justPlayed?.holeId === hole.id);
  const allDone = layout.every((h) => results[h.id]);

  // The day's score = the average of the games played, shown as a rank.
  const dayScore = averageScore(layout.filter((h) => results[h.id]).map((h) => results[h.id].score));
  const dayRank = rankOf(dayScore);

  function share() {
    const line = layout.map((h) => shareSquare(results[h.id].score)).join('');
    const text = [
      `LoL Nerdles · ${date} · ${COURSE_NAMES[size]}`,
      `${dayRank.emoji} ${dayRank.name} · ${dayScore}`,
      line,
    ].join(String.fromCharCode(10));
    navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  }

  return (
    <div className="course">
      <div className="course-top">
        <button className="btn ghost" onClick={onExit}>
          ← Home
        </button>
        <span className="eyebrow">
          {COURSE_NAMES[size]} · {date}
        </span>
      </div>

      <Scorecard layout={layout} results={results} current={showHole ? current : -1} />

      {showHole && hole && (
        <HoleShell hole={hole} number={current + 1}>
          <hole.Component
            key={dailySeed(date, hole.id)}
            data={data}
            seed={dailySeed(date, hole.id)}
            onFinish={(r) => finish(hole, r)}
          />
          {justPlayed?.holeId === hole.id && results[hole.id] && (
            <ResultCard
              score={results[hole.id].score}
              detail={results[hole.id].detail}
              playAt={justPlayed.at}
              actions={
                <button className="btn primary" onClick={next}>
                  {allDone ? 'See today’s rank →' : `Game ${firstUnplayed(layout, results, current + 1) + 1} →`}
                </button>
              }
            />
          )}
        </HoleShell>
      )}

      {allDone && !showHole && (
        <section className={`summary rank-${dayRank.id}`}>
          <span className="eyebrow">Today’s rank</span>
          <RankBadge score={dayScore} size="large" showName={false} />
          <h2>{dayRank.name}</h2>
          <p className="result-points">
            <strong>{dayScore}</strong> / 100 points on average over {layout.length} games
          </p>
          <p className="emoji-line">{layout.map((h) => shareSquare(results[h.id].score)).join(' ')}</p>
          <div className="button-row">
            <button className="btn primary" onClick={share}>
              {copied ? 'Copied!' : 'Copy my result'}
            </button>
            {COURSE_SIZES.filter((s) => s > size).map((s) => (
              <button key={s} className="btn" onClick={() => onChangeSize(s)}>
                Extend to {s} games
              </button>
            ))}
          </div>
          <p className="muted small">Real leaderboards come later — for now your scores are saved in this browser.</p>
        </section>
      )}
    </div>
  );
}
