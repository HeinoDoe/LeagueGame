// Everything is saved in the browser (localStorage) for now.
// When you add accounts + leaderboards later (e.g. Supabase), this is the
// file you'd swap out — the rest of the app only calls these functions.

const PREFIX = 'riftlinks:';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked (private mode) — the game still works, it just won't remember */
  }
}

export interface HoleResult {
  holeId: string;
  par: number;
  strokes: number;
  detail: string;
}

export interface PlayLog extends HoleResult {
  /** Unique id (timestamp) — used to attach a fun rating afterwards. */
  at: number;
  mode: 'daily' | 'range';
  date: string;
  /** Your 1–5 "how fun was this?" rating. */
  fun?: number;
}

// ---- Daily course results -------------------------------------------------

export function getDailyResults(date: string): Record<string, HoleResult> {
  return read(`daily:${date}`, {} as Record<string, HoleResult>);
}

export function saveDailyResult(date: string, result: HoleResult): void {
  const all = getDailyResults(date);
  all[result.holeId] = result;
  write(`daily:${date}`, all);
}

// ---- Play log (daily + free play), used by the Stats page -----------

export function getPlays(): PlayLog[] {
  return read('plays', [] as PlayLog[]);
}

export function logPlay(entry: Omit<PlayLog, 'at'>): number {
  const plays = getPlays();
  const at = Date.now();
  plays.push({ ...entry, at });
  write('plays', plays);
  return at;
}

export function ratePlay(at: number, fun: number): void {
  const plays = getPlays();
  const play = plays.find((p) => p.at === at);
  if (play) {
    play.fun = fun;
    write('plays', plays);
  }
}

export function clearAllData(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
