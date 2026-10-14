// Worlds stats from the official LoL Esports API, collected by
// `npm run fetch-proplay` (see scripts/fetch-proplay.mjs). Re-run after each Worlds.

import raw from './generated/proplay.json';

export interface WorldsYear {
  games: number;
  kills: number;
  gold: number;
  final: { teams: string[]; kills: number; gold: number };
}

export interface ProPlayer {
  team: string; // team code, e.g. "T1"
  games: number;
  kills: number;
  deaths: number;
  assists: number;
}

export interface ProTeam {
  code: string;
  image: string;
  games: number;
  wins: number;
}

export interface ProData {
  span: string; // e.g. "2023–2025"
  years: Record<string, WorldsYear>;
  champions: Record<string, Record<string, number>>; // champion id → year → games picked
  players: Record<string, ProPlayer>;
  teams: Record<string, ProTeam>;
}

export const PRO = raw as unknown as ProData;
export const PRO_YEARS = Object.keys(PRO.years).sort();
