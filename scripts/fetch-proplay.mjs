// Collects pro-play stats from every Worlds game since FIRST_YEAR, using the
// official LoL Esports API (the one lolesports.com runs on), and saves them to
// src/data/generated/proplay.json — the data behind "Pro Play" and some
// "Big Numbers" questions.
//
//   npm run fetch-proplay
//
// Run it after each Worlds. Only finished tournaments are counted.

import { mkdir, writeFile } from 'node:fs/promises';

const API = 'https://esports-api.lolesports.com/persisted/gw';
const FEED = 'https://feed.lolesports.com/livestats/v1/window';
const API_KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z'; // the public key lolesports.com itself uses
const WORLDS_LEAGUE = '98767975604431411';
const FIRST_YEAR = 2021; // the live-stats feed only has games from Worlds 2023 on; earlier years are skipped
const OUT = new URL('../src/data/generated/', import.meta.url);

async function api(path) {
  const res = await fetch(`${API}/${path}`, { headers: { 'x-api-key': API_KEY } });
  if (!res.ok) throw new Error(`${res.status} for ${path}`);
  return (await res.json()).data;
}

async function feed(gameId, startingTime) {
  const res = await fetch(`${FEED}/${gameId}${startingTime ? `?startingTime=${startingTime}` : ''}`);
  if (res.status !== 200) return null; // not played (e.g. game 5 of a 3–0)
  return res.json();
}

/** The game's last frame: ask for a moment long after it started (times must be whole 10 s). */
async function finalFrame(gameId, firstFrame) {
  const t = new Date(firstFrame).getTime() + 2 * 60 * 60 * 1000;
  const stamp = new Date(Math.floor(t / 10000) * 10000).toISOString().replace('.000', '');
  const frames = (await feed(gameId, stamp))?.frames ?? [];
  const last = frames[frames.length - 1];
  return last?.gameState === 'finished' ? last : null;
}

/** "BILIBILI GAMING" → "Bilibili Gaming", "WeiboGaming" → "Weibo Gaming". */
function teamName(name) {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b[A-Z]{4,}\b/g, (w) => w[0] + w.slice(1).toLowerCase());
}

async function inBatches(list, size, fn) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(...(await Promise.all(list.slice(i, i + size).map(fn))));
  return out;
}

try {
  const { leagues } = await api(`getTournamentsForLeague?hl=en-US&leagueId=${WORLDS_LEAGUE}`);
  const tournaments = leagues[0].tournaments
    .map((t) => ({ ...t, year: Number(t.slug.match(/\d{4}/)?.[0]) }))
    .filter((t) => t.year >= FIRST_YEAR && new Date(t.endDate) < new Date())
    .sort((a, b) => a.year - b.year);

  const champions = {}; // id → { year: picks }
  const players = {}; // name → { team, games, kills, deaths, assists }
  const teams = {}; // name → { code, image, games, wins }
  const years = {}; // year → { games, kills, gold, final: { teams, kills, gold } }

  for (const t of tournaments) {
    const { schedule } = await api(`getCompletedEvents?hl=en-US&tournamentId=${t.id}`);
    const events = schedule.events.filter((e) => e.match);
    const games = events.flatMap((e) => (e.games ?? []).map((g) => ({ id: g.id, event: e })));
    const results = await inBatches(games, 6, async ({ id, event }) => {
      const first = await feed(id);
      if (!first?.frames?.length) return null;
      const last = await finalFrame(id, first.frames[0].rfc460Timestamp);
      return last && { meta: first.gameMetadata, last, event };
    });

    const played = results.filter(Boolean);
    if (!played.length || played.length < games.length / 2) {
      console.log(`  Worlds ${t.year}: no stats in the feed, skipped`);
      continue;
    }
    const y = (years[t.year] = { games: 0, kills: 0, gold: 0 });
    const final = events.at(-1); // the last match of the tournament is the final
    for (const r of played) {
      y.games++;
      const isFinal = r.event === final;
      for (const side of ['blue', 'red']) {
        const team = r.last[`${side}Team`];
        y.kills += team.totalKills;
        y.gold += team.totalGold;
        if (isFinal) {
          y.final ??= { teams: final.match.teams.map((x) => teamName(x.name)), kills: 0, gold: 0 };
          y.final.kills += team.totalKills;
          y.final.gold += team.totalGold;
        }
        for (const p of r.meta[`${side}TeamMetadata`].participantMetadata) {
          const stats = team.participants.find((x) => x.participantId === p.participantId);
          const [code, ...rest] = p.summonerName.split(' ');
          const name = rest.join(' ') || code;
          const pl = (players[name] ??= { team: code, games: 0, kills: 0, deaths: 0, assists: 0 });
          pl.team = code; // most recent team
          pl.games++;
          pl.kills += stats?.kills ?? 0;
          pl.deaths += stats?.deaths ?? 0;
          pl.assists += stats?.assists ?? 0;
          (champions[p.championId] ??= {})[t.year] = (champions[p.championId][t.year] ?? 0) + 1;
        }
      }
    }
    for (const e of events) {
      for (const team of e.match.teams) {
        const tm = (teams[teamName(team.name)] ??= { code: team.code, image: team.image.replace(/^http:/, 'https:'), games: 0, wins: 0 });
        tm.wins += team.result?.gameWins ?? 0;
        tm.games += e.match.teams.reduce((n, x) => n + (x.result?.gameWins ?? 0), 0);
      }
    }
    console.log(`  Worlds ${t.year}: ${y.games} games, ${y.kills} kills`);
  }

  const counted = Object.keys(years).map(Number);
  const span = `${Math.min(...counted)}–${Math.max(...counted)}`;
  await mkdir(OUT, { recursive: true });
  const json = JSON.stringify({ span, years, champions, players, teams }, null, 1).replace(/\n\s+(?=[\d"\]}][^:\n]*[,\n\]}])/g, ' ');
  await writeFile(new URL('proplay.json', OUT), json + '\n');
  console.log(`✔ Saved Worlds ${span}: ${Object.keys(players).length} players, ${Object.keys(teams).length} teams → src/data/generated/proplay.json`);
} catch (err) {
  console.error('✖ Could not fetch pro-play stats:', err.message);
  process.exit(1);
}
