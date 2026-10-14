// Loads League models (from Community Dragon) as three.js meshes, with a small
// cache. Shared by the 3D games (Size Up, Silhouette). Pulls in three.js, so
// only import it from lazily loaded components.

import * as THREE from 'three';
import { modelUrl, type ModelInfo } from '../data/models';
import { parseSkn, shapeOf } from './skn';

export interface Loaded {
  geometry: THREE.BufferGeometry;
  materials: THREE.Material[];
  textures: THREE.Texture[];
  center: [number, number]; // x, z of the model's middle
  radius: number; // half of its footprint
  height: number; // mesh height before scaling
}

const MAX_CACHED = 8;
const cache = new Map<string, Promise<Loaded>>();
const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // hides what the game buries underground
const textureLoader = new THREE.TextureLoader();

async function loadTexture(path: string): Promise<THREE.Texture | null> {
  try {
    const tex = await textureLoader.loadAsync(modelUrl(path));
    tex.flipY = false; // League UVs start at the top left
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  } catch {
    return null; // draw it untextured rather than not at all
  }
}

async function build(info: ModelInfo): Promise<Loaded> {
  const res = await fetch(modelUrl(info.mesh));
  if (!res.ok) throw new Error(`${res.status} while loading ${info.name}`);
  const mesh = parseSkn(await res.arrayBuffer());
  const shape = shapeOf(mesh, info.hide);

  const textureFor = (part: string) => info.overrides[part.toLowerCase()] ?? info.texture;
  const paths = [...new Set(shape.parts.map((p) => textureFor(p.name)).filter((p): p is string => !!p))];
  const textures = new Map(await Promise.all(paths.map(async (p) => [p, await loadTexture(p)] as const)));

  // League models are left-handed: mirror x, and flip the triangle winding to match.
  // Turning a model around (to face the camera) flips x back and z instead.
  const [sx, sz] = info.turnAround ? [1, -1] : [-1, 1];
  const positions = mesh.positions.slice();
  const normals = mesh.normals.slice();
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] *= sx;
    normals[i] *= sx;
    positions[i + 2] *= sz;
    normals[i + 2] *= sz;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(mesh.uvs, 2));
  const index: number[] = [];
  const materials: THREE.Material[] = [];
  for (const part of shape.parts) {
    if (!part.indices.length) continue;
    geometry.addGroup(index.length, part.indices.length, materials.length);
    for (let t = 0; t < part.indices.length; t += 3) index.push(part.indices[t], part.indices[t + 2], part.indices[t + 1]);
    const path = textureFor(part.name);
    const map = (path && textures.get(path)) || null;
    materials.push(
      new THREE.MeshLambertMaterial({
        map,
        color: map ? 0xffffff : 0x8fa39a,
        side: THREE.DoubleSide,
        alphaTest: 0.3,
        clippingPlanes: [ground],
      }),
    );
  }
  geometry.setIndex(index);

  return {
    geometry,
    materials,
    textures: [...textures.values()].filter((t): t is THREE.Texture => t !== null),
    center: [(sx * (shape.min[0] + shape.max[0])) / 2, (sz * (shape.min[2] + shape.max[2])) / 2],
    radius: Math.max(shape.max[0] - shape.min[0], shape.max[2] - shape.min[2]) / 2,
    height: shape.max[1],
  };
}

function dispose(m: Loaded) {
  m.geometry.dispose();
  m.materials.forEach((mat) => mat.dispose());
  m.textures.forEach((tex) => tex.dispose());
}

export function loadModel(info: ModelInfo): Promise<Loaded> {
  let p = cache.get(info.key);
  if (p) {
    cache.delete(info.key); // re-insert so the cache drops the least recently used model first
  } else {
    p = build(info);
    p.catch(() => cache.delete(info.key));
  }
  cache.set(info.key, p);
  while (cache.size > MAX_CACHED) {
    const [oldest, old] = cache.entries().next().value!;
    cache.delete(oldest);
    old.then(dispose, () => {});
  }
  return p;
}

/** Start downloading a model before it's needed (e.g. the next round's). */
export function preloadModel(info: ModelInfo) {
  loadModel(info).catch(() => {});
}
