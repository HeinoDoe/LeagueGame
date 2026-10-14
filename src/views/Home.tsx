import { useEffect, useState } from 'react';
import { HOLES } from '../games/registry';
import { COURSE_NAMES, COURSE_SIZES, dailyLayout, type CourseSize } from '../lib/course';
import { formatCountdown, msUntilNextCourse, todayKey } from '../lib/date';
import { getDailyResults } from '../lib/storage';

interface Props {
  onPlay: (size: CourseSize) => void;
  onRange: () => void;
  onStats: () => void;
}

export function Home({ onPlay, onRange, onStats }: Props) {
  const date = todayKey();
  const layout = dailyLayout(date, HOLES);
  const results = getDailyResults(date);
  const [countdown, setCountdown] = useState(formatCountdown(msUntilNextCourse()));

  useEffect(() => {
    const id = window.setInterval(() => setCountdown(formatCountdown(msUntilNextCourse())), 30000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <h1>
          Rift <em>Links</em>
        </h1>
        <p className="lede">New League mini-games every day.</p>
      </section>

      <section className="course-picker">
        {COURSE_SIZES.map((size) => {
          const holes = layout.slice(0, size);
          const done = holes.filter((h) => results[h.id]).length;
          return (
            <button key={size} className="course-option" onClick={() => onPlay(size)}>
              <span className="course-holes">{size}</span>
              <span className="course-name">{COURSE_NAMES[size]}</span>
              <span className="course-progress">
                {done === 0 ? 'Play →' : done === size ? 'Finished ✓' : `${done}/${size} played →`}
              </span>
            </button>
          );
        })}
      </section>

      <p className="muted small center">New games in {countdown}</p>

      <section className="home-links">
        <button className="link-card" onClick={onRange}>
          <strong>Free Play Mode</strong>
          <span className="muted">Play any game as often as you like.</span>
        </button>
        <button className="link-card" onClick={onStats}>
          <strong>Leaderboard</strong>
          <span className="muted">Your scores and ratings per game.</span>
        </button>
      </section>
    </div>
  );
}
