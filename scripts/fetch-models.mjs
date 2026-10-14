// Finds every champion's 3D model on Community Dragon (a fan mirror of the
// game files), measures how tall it stands in-game, and saves the list to
// src/data/generated/models.json — the data behind the "Size Up" hole.
//
//   npm run fetch-models
//
// Run it once per patch (new champions, visual updates). Downloads ~200 MB of
// models, so it takes a minute or two. Needs Node 23.6+ (it runs src/lib/skn.ts
// directly).

import { mkdir, writeFile } from 'node:fs/promises';
import { parseSkn, shapeOf } from '../src/lib/skn.ts';

const DDRAGON = 'https://ddragon.leagueoflegends.com';
const CDRAGON = 'https://raw.communitydragon.org';
const OUT = new URL('../src/data/generated/', import.meta.url);

// Things on the Rift to compare champions with. `char` is the folder name on
// Community Dragon, `skin` the variant Summoner's Rift uses.
const LANDMARKS = [
  { key: 'turret', name: 'Turret', char: 'turret', skin: 32, hide: ['rubble', 'broken1', 'broken2', 'broken3'] },
  { key: 'inhibitor', name: 'Inhibitor', char: 'inhibitor', skin: 2 },
  { key: 'nexus', name: 'Nexus', char: 'nexus', skin: 2 },
  { key: 'baron', name: 'Baron Nashor', char: 'sru_baron' },
  { key: 'elder-dragon', name: 'Elder Dragon', char: 'sru_dragon_elder' },
  { key: 'infernal-drake', name: 'Infernal Drake', char: 'sru_dragon_fire' },
  { key: 'rift-herald', name: 'Rift Herald', char: 'sru_riftherald' },
  { key: 'melee-minion', name: 'Melee Minion', char: 'sru_orderminionmelee' },
  { key: 'cannon-minion', name: 'Cannon Minion', char: 'sru_orderminionsiege' },
  { key: 'super-minion', name: 'Super Minion', char: 'sru_orderminionsuper' },
  { key: 'scuttle-crab', name: 'Rift Scuttler', char: 'sru_crab' },
  { key: 'gromp', name: 'Gromp', char: 'sru_gromp' },
  { key: 'blue-sentinel', name: 'Blue Sentinel', char: 'sru_blue' },
  { key: 'red-brambleback', name: 'Red Brambleback', char: 'sru_red' },
  { key: 'stealth-ward', name: 'Stealth Ward', char: 'sightward' },
  { key: 'control-ward', name: 'Control Ward', char: 'jammerdevice' },
];

// Champions whose raw model is misleading, found by looking at all of them side
// by side. `skip` leaves them out of Size Up; `turnAround` for models that face
// away from the camera. Champion keys are Data Dragon ids.
const FIXES = {
  AurelionSol: { skip: 'lies flat in the raw pose' },
  Skarner: { skip: 'lies flat in the raw pose' },
  Nocturne: { skip: 'lies flat in the raw pose' },
  Velkoz: { skip: 'tentacles hang below the ground' },
  Nami: { skip: 'tail hangs below the ground' },
  Jinx: { skip: 'braids stand straight up in the raw pose' },
  Kayn: { skip: 'his scythe stands next to him' },
  Chogath: { skip: 'grows all game long' },
  Lux: { turnAround: true },
};

async function get(url, as) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return as === 'json' ? res.json() : res.arrayBuffer();
}

/** "ASSETS/Characters/X/foo.tex" → "assets/characters/x/foo.png" (Community Dragon serves textures as PNG). */
function assetPath(path) {
  return path.toLowerCase().replace(/\.(tex|dds)$/, '.png');
}

/** A skin either names its texture directly or points at a material that does. */
function textureOf(bin, props) {
  if (props.texture) return assetPath(props.texture);
  const samplers = props.material ? bin[props.material]?.samplerValues : undefined;
  if (!samplers) return null;
  const withPath = samplers.filter((s) => s.texturePath ?? s.texture);
  const sampler = withPath.find((s) => /diffuse|main|color/i.test(s.textureName ?? '')) ?? withPath[0];
  return sampler ? assetPath(sampler.texturePath ?? sampler.texture) : null;
}

async function measure(base, char, skin = 0, extraHide = []) {
  const bin = await get(`${base}/game/data/characters/${char}/skins/skin${skin}.bin.json`, 'json');
  const props = Object.values(bin).find((v) => v?.skinMeshProperties)?.skinMeshProperties;
  if (!props?.simpleSkin) throw new Error('no mesh in skin data');

  const hide = [
    ...new Set(
      [...(props.initialSubmeshToHide ?? '').split(/[\s,]+/), ...extraHide].map((s) => s.toLowerCase()).filter(Boolean),
    ),
  ];
  const overrides = {};
  for (const o of props.materialOverride ?? []) {
    if (o.submesh) overrides[o.submesh.toLowerCase()] = textureOf(bin, o);
  }
  const mesh = assetPath(props.simpleSkin);
  const scale = props.skinScale ?? 1;
  const shape = shapeOf(parseSkn(await get(`${base}/game/${mesh}`)), hide);
  return {
    mesh,
    texture: textureOf(bin, props),
    overrides,
    hide,
    scale,
    height: Math.round(shape.max[1] * scale * 10) / 10,
  };
}

/** Run `fn` over `list`, a few at a time. */
async function inBatches(list, size, fn) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(...(await Promise.all(list.slice(i, i + size).map(fn))));
  return out;
}

try {
  const { version } = await get(`${CDRAGON}/latest/content-metadata.json`, 'json');
  const patch = version.split('.').slice(0, 2).join('.');
  const base = `${CDRAGON}/${patch}`; // pinned, so heights only change when you re-run this
  const [ddVersion] = await get(`${DDRAGON}/api/versions.json`, 'json');
  const champions = Object.values((await get(`${DDRAGON}/cdn/${ddVersion}/data/en_US/champion.json`, 'json')).data);

  const jobs = [
    ...champions.map((c) => ({ key: c.id, kind: 'champion', name: c.name, char: c.id.toLowerCase() })),
    ...LANDMARKS.map((l) => ({ ...l, kind: 'landmark' })),
  ];
  const failed = [];
  const results = await inBatches(jobs, 8, async (job) => {
    const fix = FIXES[job.key] ?? {};
    if (fix.skip) {
      failed.push(`${job.name}: ${fix.skip}`);
      return null;
    }
    try {
      const m = await measure(base, job.char, job.skin, job.hide);
      if (!m.texture) throw new Error('texture lives in a linked file this script can’t read');
      return { key: job.key, kind: job.kind, name: job.name, ...m, ...(fix.turnAround && { turnAround: true }) };
    } catch (err) {
      failed.push(`${job.name}: ${err.message}`);
      return null;
    }
  });
  const models = results.filter(Boolean);

  await mkdir(OUT, { recursive: true });
  const json = `{\n  "patch": "${patch}",\n  "base": "${base}/game/",\n  "models": [\n${models
    .map((m) => `    ${JSON.stringify(m)}`)
    .join(',\n')}\n  ]\n}\n`;
  await writeFile(new URL('models.json', OUT), json);

  console.log(`✔ Measured ${models.length} models from Community Dragon ${patch} → src/data/generated/models.json`);
  if (failed.length) console.log(`  Skipped ${failed.length}:\n  - ${failed.join('\n  - ')}`);
} catch (err) {
  console.error('✖ Could not fetch models:', err.message);
  process.exit(1);
}
