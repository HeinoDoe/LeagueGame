import { useCallback, useEffect, useState } from 'react';
import type { GameData } from './data/types';
import { loadGameData } from './data/load';
import type { CourseSize } from './lib/course';
import { Home } from './views/Home';
import { Course } from './views/Course';
import { Range } from './views/Range';
import { Stats } from './views/Stats';

type View = { name: 'home' } | { name: 'course'; size: CourseSize } | { name: 'range' } | { name: 'stats' };

export default function App() {
  const [data, setData] = useState<GameData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ name: 'home' });

  const load = useCallback(() => {
    setError(null);
    loadGameData().then(setData, (e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(load, [load]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const home = () => setView({ name: 'home' });

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={home}>
          <span className="brand-mark" aria-hidden />
          LoL Nerdles
        </button>
        <nav className="topnav">
          <button
            className={`btn${view.name === 'range' ? ' current' : ''}`}
            onClick={() => setView({ name: 'range' })}
          >
            Free Play
          </button>
          <button
            className={`btn primary${view.name === 'stats' ? ' current' : ''}`}
            onClick={() => setView({ name: 'stats' })}
          >
            Leaderboard
          </button>
        </nav>
      </header>

      <main>
        {error && (
          <div className="panel">
            <h2>Couldn't load champion data</h2>
            <p className="muted">{error}</p>
            <p className="muted small">
              Check your internet connection, or run <code>npm run fetch-data</code> to save the data locally.
            </p>
            <button className="btn primary" onClick={load}>
              Try again
            </button>
          </div>
        )}
        {!data && !error && <div className="loading">Loading…</div>}
        {data && view.name === 'home' && (
          <Home data={data} onPlay={(size) => setView({ name: 'course', size })} />
        )}
        {data && view.name === 'course' && (
          <Course data={data} size={view.size} onChangeSize={(size) => setView({ name: 'course', size })} onExit={home} />
        )}
        {data && view.name === 'range' && <Range data={data} onExit={home} />}
        {data && view.name === 'stats' && <Stats onExit={home} />}
      </main>

      <footer className="legal">
        LoL Nerdles was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot
        Games does not endorse or sponsor this project.
      </footer>
    </div>
  );
}
