// The daily course resets at 00:00 UTC for everyone (same as most daily games),
// so players in different time zones get the same puzzles on the same "day".

export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10); // e.g. "2026-10-14"
}

export function msUntilNextCourse(now = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
}

export function formatCountdown(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
