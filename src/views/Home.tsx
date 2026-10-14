import { useEffect, useMemo, useState } from 'react';
import type { GameData } from '../data/types';
import { HOLES } from '../games/registry';
import { COURSE_MINUTES, COURSE_NAMES, COURSE_SIZES, dailyLayout, type CourseSize } from '../lib/course';
import { formatCountdown, msUntilNextCourse, todayKey } from '../lib/date';
import { factOfTheDay } from '../lib/facts';
import { averageScore, crestUrl, rankOf } from '../lib/scoring';
import { getDailyResults } from '../lib/storage';

interface Props {
  data: GameData;
  onPlay: (size: CourseSize) => void;
}

const DAY = 24 * 60 * 60 * 1000;
const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** The day's score (average of the games played), or null if nothing was played. */
function dayScore(date: string): number | null {
  const scores = Object.values(getDailyResults(date)).map((r) => r.score);
  return scores.length ? averageScore(scores) : null;
}

/** The last 7 days + how many days in a row you've played. */
function useWeek() {
  return useMemo(() => {
    const now = Date.now();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now - (6 - i) * DAY);
      return { date: todayKey(d), label: i === 6 ? 'Today' : WEEKDAY[d.getUTCDay()], score: dayScore(todayKey(d)) };
    });
    let streak = 0;
    const start = days[6].score === null ? 1 : 0; // today doesn't break the streak until it's over
    for (let i = start; i < 366 && dayScore(todayKey(new Date(now - i * DAY))) !== null; i++) streak++;
    return { days, streak };
  }, []);
}

export function Home({ data, onPlay }: Props) {
  const date = todayKey();
  const layout = dailyLayout(date, HOLES);
  const results = getDailyResults(date);
  const fact = useMemo(() => factOfTheDay(date, data), [date, data]);
  const week = useWeek();
  const [countdown, setCountdown] = useState(formatCountdown(msUntilNextCourse()));

  useEffect(() => {
    const id = window.setInterval(() => setCountdown(formatCountdown(msUntilNextCourse())), 30000);
    return () => window.clearInterval(id);
  }, []);

  const doneOf = (size: CourseSize) => layout.slice(0, size).filter((h) => results[h.id]).length;
  const next = COURSE_SIZES.find((size) => doneOf(size) < size); // the one to highlight
  const weekday = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const patch = data.version.split('.').slice(0, 2).join('.');

  return (
    <div className="home">
      <section className="home-hero">
        <p className="home-kicker">
          {weekday} · Patch {patch}
        </p>
        <h1 className="home-title">
          Nine mini-games.
          <br />
          <em>One rank.</em>
        </h1>
        <div className="course-picker">
          {COURSE_SIZES.map((size) => {
            const done = doneOf(size);
            const score = done ? averageScore(layout.slice(0, size).filter((h) => results[h.id]).map((h) => results[h.id].score)) : 0;
            return (
              <button key={size} className={`course-option${size === next ? ' go' : ''}`} onClick={() => onPlay(size)}>
                <span className="course-holes">{size}</span>
                <span className="course-name">{COURSE_NAMES[size]}</span>
                <span className="course-meta">~{COURSE_MINUTES[size]} min</span>
                <span className="course-progress">
                  {done === 0 ? (
                    'Play →'
                  ) : done === size ? (
                    <span className={`course-rank rank-${rankOf(score).id}`}>
                      <img src={crestUrl(rankOf(score))} alt="" />
                      {rankOf(score).name} · {score}
                    </span>
                  ) : (
                    `${done}/${size} played →`
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <p className="home-timer">
          New games in <strong>{countdown}</strong>
        </p>
      </section>

      <aside className="home-side">
        <section className="side-panel">
          <p className="panel-label">
            Your week{week.streak >= 2 ? ` · ${week.streak}-day streak` : ''}
          </p>
          <ol className="week">
            {week.days.map((d) => (
              <li key={d.date} title={d.score === null ? `${d.date}: not played` : `${d.date}: ${rankOf(d.score).name} · ${d.score}`}>
                {d.score === null ? <span className="week-empty" /> : <img src={crestUrl(rankOf(d.score))} alt={rankOf(d.score).name} />}
                <span>{d.label}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="side-panel alt">
          <p className="panel-label">Nerd fact of the day</p>
          <p className="fact">
            {fact.before}
            <strong>{fact.value}</strong>
            {fact.after}
          </p>
        </section>

        <section className="side-panel">
          <p className="panel-label">In today’s nine</p>
          <ol className="lineup">
            {layout.map((h, i) => (
              <li key={h.id} className={i < 3 ? 'first' : ''}>
                <span>{i + 1}</span>
                {h.name}
              </li>
            ))}
          </ol>
          <p className="lineup-note">Skirmish plays 1–3, Teamfight 1–6, Full Game all nine.</p>
        </section>
      </aside>
    </div>
  );
}
