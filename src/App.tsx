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
          LoL Nerdles
        </button>
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
          <Home
            onPlay={(size) => setView({ name: 'course', size })}
            onRange={() => setView({ name: 'range' })}
            onStats={() => setView({ name: 'stats' })}
          />
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
