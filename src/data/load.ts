// Loads champion + item data from Riot's public "Data Dragon" files.
//
// 1. "Pinned" data: if you ran `npm run fetch-data`, the files live in
//    public/data/ and ship with your site. Puzzles stay stable until you re-pin.
// 2. "Live" data: otherwise the browser downloads the latest patch directly.

import type { Champion, GameData, Item } from './types';

const DDRAGON = 'https://ddragon.leagueoflegends.com';

interface RawChampion {
  id: string;
  name: string;
  title: string;
  blurb: string;
  tags: string[];
  stats: Record<string, number> & { hp: number; movespeed: number; attackrange: number };
  image: { full: string };
}

interface RawItem {
  name: string;
  gold?: { total: number; purchasable: boolean };
  from?: string[];
  maps?: Record<string, boolean>;
  requiredChampion?: string;
  requiredAlly?: string;
  inStore?: boolean;
  hideFromAll?: boolean;
  image: { full: string };
}

interface RawBundle {
  version: string;
  champions: { data: Record<string, RawChampion> };
  items: { data: Record<string, RawItem> };
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return (await res.json()) as T; // throws if the server returned HTML instead
}

async function loadPinned(): Promise<RawBundle | null> {
  try {
    const base = `${import.meta.env.BASE_URL}data`;
    const { version } = await getJson<{ version: string }>(`${base}/version.json`);
    const [champions, items] = await Promise.all([
      getJson<RawBundle['champions']>(`${base}/champion.json`),
      getJson<RawBundle['items']>(`${base}/item.json`),
    ]);
    return { version, champions, items };
  } catch {
    return null;
  }
}

async function loadLive(): Promise<RawBundle> {
  const versions = await getJson<string[]>(`${DDRAGON}/api/versions.json`);
  const version = versions[0];
  const [champions, items] = await Promise.all([
    getJson<RawBundle['champions']>(`${DDRAGON}/cdn/${version}/data/en_US/champion.json`),
    getJson<RawBundle['items']>(`${DDRAGON}/cdn/${version}/data/en_US/item.json`),
  ]);
  return { version, champions, items };
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function toChampions(raw: RawBundle['champions']): Champion[] {
  return Object.values(raw.data)
    .map((c) => ({
      id: c.id,
      name: c.name,
      title: c.title,
      blurb: stripHtml(c.blurb),
      tags: c.tags,
      hp: c.stats.hp,
      stats: c.stats,
      moveSpeed: c.stats.movespeed,
      attackRange: c.stats.attackrange,
      image: c.image.full,
    }))
    .sort((a, b) => a.id.localeCompare(b.id)); // stable order => stable daily puzzles
}

/** Keep only normal Summoner's Rift shop items (no Arena/Ornn/champion-only items). */
function toItems(raw: RawBundle['items']): Item[] {
  const seen = new Set<string>();
  const items: Item[] = [];
  for (const [id, it] of Object.entries(raw.data).sort(([a], [b]) => a.localeCompare(b))) {
    if (!/^\d{4}$/.test(id)) continue;
    if (!it.maps?.['11'] || !it.gold?.purchasable || it.gold.total <= 0) continue;
    if (it.requiredChampion || it.requiredAlly || it.inStore === false || it.hideFromAll) continue;
    if (seen.has(it.name)) continue;
    seen.add(it.name);
    items.push({ id, name: it.name, total: it.gold.total, from: it.from ?? [], image: it.image.full });
  }
  return items;
}

export async function loadGameData(): Promise<GameData> {
  const pinned = await loadPinned();
  const bundle = pinned ?? (await loadLive());
  const items = toItems(bundle.items);
  const v = bundle.version;
  return {
    version: v,
    source: pinned ? 'pinned' : 'live',
    champions: toChampions(bundle.champions),
    items,
    itemsById: new Map(items.map((i) => [i.id, i])),
    championImg: (c) => `${DDRAGON}/cdn/${v}/img/champion/${c.image}`,
    itemImg: (i) => `${DDRAGON}/cdn/${v}/img/item/${i.image}`,
  };
}
