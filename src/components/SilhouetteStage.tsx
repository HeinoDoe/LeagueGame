// One League model, turning slowly, that starts as a black silhouette and
// lights up step by step. Used by Silhouette. Pulls in three.js, so import it lazily.

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ModelInfo } from '../data/models';
import { loadModel } from '../lib/models3d';

interface Props {
  model: ModelInfo;
  /** 0 = pure black silhouette … 1 = fully lit, in colour. */
  light: number;
}

const TILT = 0.15; // camera looks down a little (radians)

export function SilhouetteStage({ model, light }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef(light);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    lightRef.current = light;
  }, [light]);

  useEffect(() => {
    const host = hostRef.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setStatus('error'); // no WebGL
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    host.prepend(renderer.domElement);
    const resize = new ResizeObserver(() => renderer.setSize(host.clientWidth, host.clientHeight, false));
    resize.observe(host);

    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(0.4, 1, 0.8);
    scene.add(sun);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 100000);
    const pivot = new THREE.Group();
    scene.add(pivot);

    let materials: THREE.MeshLambertMaterial[] = [];
    let size = { height: 1, radius: 1 };
    let shown = lightRef.current;
    let cancelled = false;
    let raf = 0;
    let last = 0;

    setStatus('loading');
    loadModel(model).then(
      (m) => {
        if (cancelled) return;
        // Our own copies, so dimming them can't dim the same model somewhere else.
        materials = m.materials.map((mat) => mat.clone() as THREE.MeshLambertMaterial);
        const mesh = new THREE.Mesh(m.geometry, materials);
        mesh.position.set(-m.center[0], 0, -m.center[1]);
        pivot.add(mesh);
        size = { height: m.height, radius: m.radius };
        setStatus('ready');
      },
      () => !cancelled && setStatus('error'),
    );

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - (last || now)) / 1000, 0.1);
      last = now;
      pivot.rotation.y += dt * 0.5;
      shown += (lightRef.current - shown) * (1 - Math.exp(-dt * 3));
      materials.forEach((mat) => mat.color.setScalar(shown)); // black × texture = silhouette

      const aspect = host.clientWidth / Math.max(host.clientHeight, 1);
      const view = Math.max(size.height * 1.2, (size.radius * 2.3) / aspect);
      const cy = size.height / 2;
      Object.assign(camera, { left: (-view * aspect) / 2, right: (view * aspect) / 2, top: view / 2, bottom: -view / 2 });
      camera.position.set(0, cy + 20000 * Math.sin(TILT), 20000 * Math.cos(TILT));
      camera.lookAt(0, cy, 0);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      resize.disconnect();
      materials.forEach((mat) => mat.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [model]);

  return (
    <div className="silhouette-stage" ref={hostRef}>
      {status !== 'ready' && (
        <div className="model-stage-msg">
          {status === 'loading' ? 'Summoning a shadow…' : 'Couldn’t load the 3D model — use the hints!'}
        </div>
      )}
    </div>
  );
}
