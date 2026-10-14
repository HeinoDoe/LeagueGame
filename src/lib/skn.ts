// Reader for League of Legends ".skn" meshes — the 3D models Riot ships with
// the game, mirrored by Community Dragon. Used by the Size Up hole (in the
// browser) and by scripts/fetch-models.mjs (to measure every model's height),
// so the heights we score against always match the models players see.
//
// The raw models come without a skeleton, so they stand in their "bind pose".
// Weapons are moved into the hand by animations in-game, so in the raw pose
// they stand next to the body (Garen's sword, Nasus' staff) and would make the
// model look taller than it is. shapeOf() finds those props and leaves them out.
//
// No imports on purpose: Node runs this file directly (type stripping), so
// keep it to plain, erasable TypeScript.

export interface Submesh {
  name: string;
  startIndex: number;
  indexCount: number;
}

export interface SknMesh {
  submeshes: Submesh[];
  indices: Uint16Array;
  positions: Float32Array; // x, y, z per vertex
  normals: Float32Array; // x, y, z per vertex
  uvs: Float32Array; // u, v per vertex
  bones: Uint8Array; // 4 bone ids per vertex
  weights: Float32Array; // 4 bone weights per vertex
}

export function parseSkn(buffer: ArrayBuffer): SknMesh {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x00112233) throw new Error('Not an .skn file');
  const major = view.getUint16(4, true);
  let off = 8;
  let indexCount: number;
  let vertexCount: number;
  let vertexSize = 52; // position 12 + bone ids 4 + weights 16 + normal 12 + uv 8
  const submeshes: Submesh[] = [];

  if (major === 0) {
    indexCount = view.getUint32(off, true);
    vertexCount = view.getUint32(off + 4, true);
    off += 8;
    submeshes.push({ name: 'Base', startIndex: 0, indexCount });
  } else {
    const count = view.getUint32(off, true);
    off += 4;
    const decoder = new TextDecoder();
    for (let i = 0; i < count; i++) {
      const name = decoder.decode(new Uint8Array(buffer, off, 64)).split('\0')[0];
      submeshes.push({ name, startIndex: view.getUint32(off + 72, true), indexCount: view.getUint32(off + 76, true) });
      off += 80;
    }
    if (major === 4) off += 4; // flags
    indexCount = view.getUint32(off, true);
    vertexCount = view.getUint32(off + 4, true);
    off += 8;
    if (major === 4) {
      vertexSize = view.getUint32(off, true); // 52, or 56 / 72 with vertex colors / tangents
      off += 8 + 40; // vertex size + type, bounding box + sphere
    }
  }

  const indices = new Uint16Array(buffer.slice(off, off + indexCount * 2));
  off += indexCount * 2;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const bones = new Uint8Array(vertexCount * 4);
  const weights = new Float32Array(vertexCount * 4);
  for (let i = 0; i < vertexCount; i++) {
    const v = off + i * vertexSize;
    for (let k = 0; k < 3; k++) {
      positions[i * 3 + k] = view.getFloat32(v + k * 4, true);
      normals[i * 3 + k] = view.getFloat32(v + 32 + k * 4, true);
    }
    for (let k = 0; k < 4; k++) {
      bones[i * 4 + k] = view.getUint8(v + 12 + k);
      weights[i * 4 + k] = view.getFloat32(v + 16 + k * 4, true);
    }
    uvs[i * 2] = view.getFloat32(v + 44, true);
    uvs[i * 2 + 1] = view.getFloat32(v + 48, true);
  }
  return { submeshes, indices, positions, normals, uvs, bones, weights };
}

export interface ModelShape {
  /** Triangles to draw per visible submesh, floating pieces removed. */
  parts: { name: string; indices: Uint16Array }[];
  /** Bounds of what's drawn above the ground (y ≥ 0), in the mesh's own units. */
  min: [number, number, number];
  max: [number, number, number];
}

interface Box {
  min: number[];
  max: number[];
}

function overlaps(a: Box, b: Box, margin: number): boolean {
  for (let k = 0; k < 3; k++) {
    if (a.min[k] > b.max[k] + margin || b.min[k] > a.max[k] + margin) return false;
  }
  return true;
}

function grow(into: Box, from: Box) {
  for (let k = 0; k < 3; k++) {
    into.min[k] = Math.min(into.min[k], from.min[k]);
    into.max[k] = Math.max(into.max[k], from.max[k]);
  }
}

/**
 * Works out what to draw: hides the submeshes the game hides by default, then
 * drops props (weapons, orbs, barrels) and anything else that floats free of
 * the body. Bounds only count geometry above the ground, because the game
 * buries parts of some structures (the Nexus).
 */
export function shapeOf(mesh: SknMesh, hidden: readonly string[]): ModelShape {
  const hide = new Set(hidden.map((h) => h.toLowerCase()));
  const visible = mesh.submeshes.filter((s) => !hide.has(s.name.toLowerCase()));
  const P = mesh.positions;

  // Weld vertices that share a position (meshes split them along texture seams),
  // then join welded vertices that share a triangle into connected pieces.
  const weldId = new Int32Array(P.length / 3).fill(-1);
  const keys = new Map<string, number>();
  const parent: number[] = [];
  const weld = (v: number) => {
    if (weldId[v] < 0) {
      const key = `${Math.round(P[v * 3] * 100)},${Math.round(P[v * 3 + 1] * 100)},${Math.round(P[v * 3 + 2] * 100)}`;
      let id = keys.get(key);
      if (id === undefined) {
        id = parent.length;
        keys.set(key, id);
        parent.push(id);
      }
      weldId[v] = id;
    }
    return weldId[v];
  };
  const find = (x: number): number => {
    while (parent[x] !== x) x = parent[x] = parent[parent[x]];
    return x;
  };
  for (const s of visible) {
    for (let t = s.startIndex; t < s.startIndex + s.indexCount; t += 3) {
      const a = find(weld(mesh.indices[t]));
      parent[find(weld(mesh.indices[t + 1]))] = a;
      parent[find(weld(mesh.indices[t + 2]))] = a;
    }
  }

  // Skin bends: where the body bends, a vertex blends two bones. A prop instead
  // hangs 100% on a bone of its own, which never bends any skin.
  const W = mesh.weights;
  const bending = new Set<number>();
  for (const s of visible) {
    for (let t = s.startIndex; t < s.startIndex + s.indexCount; t++) {
      const v = mesh.indices[t];
      for (let k = 0; k < 4; k++) if (W[v * 4 + k] > 0.01 && W[v * 4 + k] < 0.99) bending.add(mesh.bones[v * 4 + k]);
    }
  }
  const onPropBone = (v: number) => {
    for (let k = 0; k < 4; k++) if (W[v * 4 + k] >= 0.99) return !bending.has(mesh.bones[v * 4 + k]);
    return false;
  };

  // Bounding box + triangle count per piece.
  const pieces = new Map<number, Box & { tris: number; prop: boolean }>();
  let totalTris = 0;
  for (const s of visible) {
    for (let t = s.startIndex; t < s.startIndex + s.indexCount; t += 3) {
      const root = find(weldId[mesh.indices[t]]);
      let piece = pieces.get(root);
      if (!piece) {
        piece = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity], tris: 0, prop: true };
        pieces.set(root, piece);
      }
      piece.tris++;
      totalTris++;
      for (let c = 0; c < 3; c++) {
        const v = mesh.indices[t + c];
        if (piece.prop && !onPropBone(v)) piece.prop = false;
        for (let k = 0; k < 3; k++) {
          piece.min[k] = Math.min(piece.min[k], P[v * 3 + k]);
          piece.max[k] = Math.max(piece.max[k], P[v * 3 + k]);
        }
      }
    }
  }

  // Start from the biggest piece of body and keep adding every piece that
  // touches it. Props and whatever never touches the body are left out.
  const all = [...pieces.entries()].filter(([, p]) => !p.prop).sort((a, b) => b[1].tris - a[1].tris);
  const kept = new Set<number>();
  if (all.length) {
    const body: Box = { min: [...all[0][1].min], max: [...all[0][1].max] };
    kept.add(all[0][0]);
    const margin = 0.02 * Math.max(...body.max.map((m, k) => m - body.min[k]));
    let changed = true;
    while (changed) {
      changed = false;
      for (const [root, piece] of all) {
        if (!kept.has(root) && overlaps(body, piece, margin)) {
          kept.add(root);
          grow(body, piece);
          changed = true;
        }
      }
    }
  }
  // Safety net: if that would remove a big chunk (or everything, as with turrets,
  // which are all rigid parts), the guess is wrong — keep everything.
  const keptTris = all.reduce((n, [root, p]) => n + (kept.has(root) ? p.tris : 0), 0);
  if (keptTris < totalTris * 0.65) for (const root of pieces.keys()) kept.add(root);

  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  const parts = visible.map((s) => {
    const out: number[] = [];
    for (let t = s.startIndex; t < s.startIndex + s.indexCount; t += 3) {
      if (!kept.has(find(weldId[mesh.indices[t]]))) continue;
      for (let c = 0; c < 3; c++) {
        const v = mesh.indices[t + c];
        out.push(v);
        if (P[v * 3 + 1] < 0) continue; // below ground
        for (let k = 0; k < 3; k++) {
          min[k] = Math.min(min[k], P[v * 3 + k]);
          max[k] = Math.max(max[k], P[v * 3 + k]);
        }
      }
    }
    return { name: s.name, indices: Uint16Array.from(out) };
  });
  return { parts, min, max };
}
