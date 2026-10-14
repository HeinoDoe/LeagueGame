// The 3D models behind "Size Up", measured by `npm run fetch-models`
// (see scripts/fetch-models.mjs). Re-run that script once per patch.

import catalog from './generated/models.json';

export interface ModelInfo {
  key: string; // champion id ("MonkeyKing") or landmark key ("turret")
  kind: 'champion' | 'landmark';
  name: string;
  mesh: string; // path under the Community Dragon base URL
  texture: string | null;
  overrides: Record<string, string | null>; // submesh name → its own texture
  hide: string[]; // submeshes the game hides by default (lowercase)
  scale: number; // the game's size multiplier for this skin
  height: number; // in-game height in game units, measured from the model
  turnAround?: boolean; // the raw model faces away from the camera
}

export const MODEL_PATCH = catalog.patch;
export const MODELS = catalog.models as ModelInfo[];

export function modelUrl(path: string): string {
  return catalog.base + path;
}
