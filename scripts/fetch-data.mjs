// Downloads the latest champion + item data from Riot's Data Dragon into
// public/data/ so it ships with your site ("pinned" data).
//
//   npm run fetch-data
//
// Why pin? Daily puzzles are picked from the champion/item lists. If a new
// patch adds a champion mid-day, live data could change today's puzzle.
// Pinned data only changes when YOU re-run this script (e.g. once per patch).

import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'https://ddragon.leagueoflegends.com';
const OUT = new URL('../public/data/', import.meta.url);

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

try {
  const [version] = await getJson(`${BASE}/api/versions.json`);
  const [champions, items] = await Promise.all([
    getJson(`${BASE}/cdn/${version}/data/en_US/champion.json`),
    getJson(`${BASE}/cdn/${version}/data/en_US/item.json`),
  ]);

  await mkdir(OUT, { recursive: true });
  await writeFile(new URL('version.json', OUT), JSON.stringify({ version, fetchedAt: new Date().toISOString() }, null, 2));
  await writeFile(new URL('champion.json', OUT), JSON.stringify(champions));
  await writeFile(new URL('item.json', OUT), JSON.stringify(items));

  console.log(
    `✔ Pinned Data Dragon ${version}: ${Object.keys(champions.data).length} champions, ${Object.keys(items.data).length} items → public/data/`,
  );
} catch (err) {
  console.error('✖ Could not download Data Dragon:', err.message);
  process.exit(1);
}
