// Builds the champion groups behind "Rift Connections" (and the champion
// categories of "Deep Dive") from official data, and saves them to
// src/data/generated/connections.json together with every champion's skin
// count (Deep Dive's stand-in for how popular a champion is).
//
//   npm run fetch-connections
//
// Run it once per patch (new champions, new skin lines). Sources:
//   - Riot's Universe site: each champion's region + release date
//   - Data Dragon: names, titles, resource type
//   - Community Dragon: skin lines, and the race tags in each champion's skin data
// Hand-made groups live in src/data/curated/connections.ts instead.

import { mkdir, writeFile } from 'node:fs/promises';

const DDRAGON = 'https://ddragon.leagueoflegends.com';
const CDRAGON = 'https://raw.communitydragon.org';
const UNIVERSE = 'https://universe-meeps.leagueoflegends.com/v1/en_us/search/index.json';
const OUT = new URL('../src/data/generated/', import.meta.url);

// Difficulty, like the colours in NYT Connections: 0 = easiest … 3 = trickiest.
const LEVEL = { region: 0, race: 1, resource: 1, skinline: 2, year: 2, name: 3, title: 3 };

const REGION_NAMES = {
  'bandle-city': 'Bandle City',
  bilgewater: 'Bilgewater',
  demacia: 'Demacia',
  freljord: 'the Freljord',
  ionia: 'Ionia',
  ixtal: 'Ixtal',
  'mount-targon': 'Targon',
  noxus: 'Noxus',
  piltover: 'Piltover',
  'shadow-isles': 'the Shadow Isles',
  shurima: 'Shurima',
  void: 'the Void',
  zaun: 'Zaun',
};
const RACES = {
  yordle: ['Yordles', 'Name a Yordle'],
  vastaya: ['Vastaya', 'Name a Vastayan champion'],
  darkin: ['Darkin', 'Name a Darkin'],
  celestial: ['Celestials', 'Name a Celestial'],
};
const RESOURCES = ['Energy', 'Fury', 'Rage', 'Heat'];
const TITLE_STOPWORDS = new Set(['the', 'of', 'a', 'an', 'and', 'from', 'to', 'in', 'who']);
// "Void" in a title would just repeat the "From the Void" group, so skip region names.
const REGION_WORDS = new Set(['void', 'demacia', 'noxus', 'ionia', 'freljord', 'shurima', 'zaun', 'piltover', 'targon', 'bilgewater', 'ixtal']);

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');

try {
  const [ddVersion] = await getJson(`${DDRAGON}/api/versions.json`);
  const champions = Object.values((await getJson(`${DDRAGON}/cdn/${ddVersion}/data/en_US/champion.json`)).data);
  const byName = new Map(champions.map((c) => [normalize(c.name), c.id]));
  const byKey = new Map(champions.map((c) => [Number(c.key), c.id]));

  const { version } = await getJson(`${CDRAGON}/latest/content-metadata.json`);
  const cd = `${CDRAGON}/${version.split('.').slice(0, 2).join('.')}`;
  const plugin = `${cd}/plugins/rcp-be-lol-game-data/global/default/v1`;
  const [universe, skins, skinlines] = await Promise.all([
    getJson(UNIVERSE),
    getJson(`${plugin}/skins.json`),
    getJson(`${plugin}/skinlines.json`),
  ]);

  // label = the Connections band, ask = the Deep Dive question
  const groups = new Map(); // id → { kind, level, label, ask, members: Set }
  const add = (kind, key, label, ask, champId) => {
    const id = `${kind}:${key}`;
    if (!groups.has(id)) groups.set(id, { id, kind, level: LEVEL[kind], label, ask, members: new Set() });
    groups.get(id).members.add(champId);
  };

  // Region + release year (Universe)
  for (const u of universe.champions ?? []) {
    const id = byName.get(normalize(u.name));
    if (!id) continue;
    const region = u['associated-faction-slug'];
    const place = REGION_NAMES[region];
    if (place) add('region', region, `From ${place}`, `Name a champion from ${place}`, id);
    const year = (u['release-date'] ?? '').slice(0, 4);
    if (year) add('year', year, `Released in ${year}`, `Name a champion released in ${year}`, id);
  }

  // Names, titles, resource (Data Dragon)
  const titleWords = new Map();
  for (const c of champions) {
    if (c.name.includes("'"))
      add('name', 'apostrophe', 'Have an apostrophe in their name', 'Name a champion with an apostrophe in their name', c.id);
    if (/[\s.&]/.test(c.name.trim()))
      add('name', 'two-words', 'Names made of two or more words', 'Name a champion whose name is two or more words', c.id);
    if (/([a-z])\1/i.test(c.name))
      add('name', 'double-letter', 'A double letter in their name', 'Name a champion with a double letter in their name', c.id);
    if (RESOURCES.includes(c.partype)) {
      const label = c.partype === 'Energy' ? 'Use Energy instead of mana' : `Use ${c.partype}`;
      add('resource', normalize(c.partype), label, `Name a champion that uses ${c.partype}`, c.id);
    }
    for (const w of new Set(c.title.toLowerCase().match(/[a-z]+/g) ?? [])) {
      if (!TITLE_STOPWORDS.has(w) && !REGION_WORDS.has(w) && w.length > 3) titleWords.set(w, [...(titleWords.get(w) ?? []), c.id]);
    }
  }
  for (const [word, ids] of titleWords) {
    const quoted = `“${word[0].toUpperCase()}${word.slice(1)}”`;
    for (const id of ids) add('title', word, `${quoted} in their title`, `Name a champion with ${quoted} in their title`, id);
  }

  // Skin lines + skin counts (Community Dragon)
  const lineNames = new Map(skinlines.map((l) => [l.id, l.name]));
  const skinCount = {};
  for (const skin of Object.values(skins)) {
    const id = byKey.get(Math.floor(skin.id / 1000));
    if (id && !skin.isBase) skinCount[id] = (skinCount[id] ?? 0) + 1;
    for (const { id: lineId } of skin.skinLines ?? []) {
      const name = lineNames.get(lineId);
      const a = /^[aeiou]/i.test(name ?? '') ? 'an' : 'a';
      if (id && name) add('skinline', normalize(name), `Have ${a} ${name} skin`, `Name a champion with ${a} ${name} skin`, id);
    }
  }

  // Races (tags in each champion's skin data, e.g. "faction:bandlecity,race:yordle")
  await Promise.all(
    champions.map(async (c) => {
      try {
        const bin = await getJson(`${cd}/game/data/characters/${c.id.toLowerCase()}/skins/skin0.bin.json`);
        const tags = Object.values(bin).find((v) => v?.metaDataTags)?.metaDataTags ?? '';
        for (const [, race] of tags.matchAll(/race:(\w+)/g)) if (RACES[race]) add('race', race, ...RACES[race], c.id);
      } catch {
        // no skin data → no race group, that's fine
      }
    }),
  );

  // A group needs at least 4 champions; huge groups make bad puzzles.
  const out = [...groups.values()]
    .filter((g) => g.members.size >= 4 && g.members.size <= 45)
    .map((g) => ({ ...g, members: [...g.members].sort() }))
    .sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));

  await mkdir(OUT, { recursive: true });
  const json = `{\n  "skins": ${JSON.stringify(skinCount)},\n  "groups": [\n${out.map((g) => `    ${JSON.stringify(g)}`).join(',\n')}\n  ]\n}\n`;
  await writeFile(new URL('connections.json', OUT), json);

  const count = (kind) => out.filter((g) => g.kind === kind).length;
  console.log(`✔ Saved ${out.length} groups → src/data/generated/connections.json`);
  console.log(`  ${Object.keys(LEVEL).map((k) => `${k}: ${count(k)}`).join(' · ')}`);
} catch (err) {
  console.error('✖ Could not build the groups:', err.message);
  process.exit(1);
}
