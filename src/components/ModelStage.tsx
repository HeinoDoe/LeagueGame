// A small 3D stage that shows two League models side by side, true to scale.
// Used by Size Up. It pulls in three.js, so import it lazily.

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ModelInfo } from '../data/models';
import { loadModel, type Loaded } from '../lib/models3d';

interface View {
  ratio: number;
  guess?: number;
  spin: boolean;
}

const TILT = 0.2; // camera looks down a little (radians)
const FACE_IN = 0.35; // models turn slightly towards each other

/** The three.js side: owns the renderer and animates towards the latest View. */
class Stage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 100000);
  private slots: { pivot: THREE.Group; model: Loaded; height: number }[] = [];
  private shadows = [0, 1].map(() => this.blob(0x000000, 0.35));
  private floor = this.blob(0x2a4c3f, 1);
  private guessBar = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: 0xf0e6d2, transparent: true, opacity: 0.85, depthTest: false }),
  );
  private view: View = { ratio: 1, spin: false };
  private shown = { ratio: 1, frame: 0 };
  private yaw = 0;
  private drag: number | null = null;
  private dirty = true;
  private raf = 0;
  private last = 0;
  private resize: ResizeObserver;

  constructor(
    private host: HTMLElement,
    private labels: (HTMLElement | null)[],
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.localClippingEnabled = true;
    host.prepend(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(0.4, 1, 0.8);
    this.scene.add(sun);
    this.floor.renderOrder = -2;
    this.shadows.forEach((s) => (s.renderOrder = -1));
    this.guessBar.renderOrder = 10;
    this.guessBar.visible = false;
    this.scene.add(this.guessBar);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', (e) => {
      this.drag = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (this.drag === null) return;
      this.yaw += (e.clientX - this.drag) * 0.01;
      this.drag = e.clientX;
      this.dirty = true;
    });
    const release = () => (this.drag = null);
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);

    this.resize = new ResizeObserver(() => {
      this.renderer.setSize(host.clientWidth, host.clientHeight, false);
      this.dirty = true;
    });
    this.resize.observe(host);
    this.raf = requestAnimationFrame(this.tick);
  }

  private blob(color: number, opacity: number) {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(1, 48),
      new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: false }),
    );
    m.rotation.x = -Math.PI / 2;
    this.scene.add(m);
    return m;
  }

  setModels(left: Loaded, right: Loaded, leftHeight: number) {
    this.slots.forEach((s) => this.scene.remove(s.pivot));
    this.slots = [left, right].map((model, i) => {
      const mesh = new THREE.Mesh(model.geometry, model.materials);
      mesh.position.set(-model.center[0], 0, -model.center[1]);
      const pivot = new THREE.Group();
      pivot.add(mesh);
      this.scene.add(pivot);
      return { pivot, model, height: i === 0 ? leftHeight : 0 };
    });
    this.shown.ratio = this.view.ratio;
    this.shown.frame = 0;
    this.yaw = 0;
    this.dirty = true;
  }

  setView(view: View) {
    this.view = view;
    this.dirty = true;
  }

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min((now - (this.last || now)) / 1000, 0.1);
    this.last = now;
    if (this.slots.length < 2) return;

    const { ratio, guess, spin } = this.view;
    const ease = (from: number, to: number, speed: number) => from + (to - from) * (1 - Math.exp(-dt * speed));
    const before = this.shown.ratio;
    this.shown.ratio = ease(before, ratio, spin ? 3.5 : 20);
    if (spin && this.drag === null) this.yaw += dt * 0.6;
    const moving = Math.abs(this.shown.ratio - ratio) > 1e-4 || spin || this.dirty;
    if (!moving) return;
    this.dirty = false;

    // Scale both models: the left one at its real height, the right one at `ratio` × that.
    const [L, R] = this.slots;
    const hL = L.height;
    const hR = this.shown.ratio * hL;
    const sL = hL / L.model.height;
    const sR = hR / R.model.height;
    const rL = L.model.radius * sL;
    const rR = R.model.radius * sR;
    const gap = 0.1 * Math.max(hL, hR);
    const xL = -(gap / 2 + rL) - (rR - rL);
    const xR = gap / 2 + rR - (rR - rL);
    L.pivot.position.x = xL;
    R.pivot.position.x = xR;
    L.pivot.scale.setScalar(sL);
    R.pivot.scale.setScalar(sR);
    L.pivot.rotation.y = FACE_IN + this.yaw;
    R.pivot.rotation.y = -FACE_IN + this.yaw;
    [
      [xL, rL],
      [xR, rR],
    ].forEach(([x, r], i) => {
      this.shadows[i].position.set(x, 0.5, 0);
      this.shadows[i].scale.setScalar(r * 0.9);
    });

    // Fit everything (and the guess line) in the frame, easing the zoom.
    const width = 2 * rL + gap + 2 * rR;
    const tallest = Math.max(hL, hR, guess ? guess * hL : 0);
    const aspect = this.host.clientWidth / Math.max(this.host.clientHeight, 1);
    const target = Math.max(tallest * 1.25, (width * 1.15) / aspect);
    this.shown.frame = this.shown.frame ? ease(this.shown.frame, target, 8) : target;
    if (Math.abs(this.shown.frame - target) > target * 1e-3) this.dirty = true;
    const h = this.shown.frame;
    const cy = h * 0.42;
    Object.assign(this.camera, { left: (-h * aspect) / 2, right: (h * aspect) / 2, top: h / 2, bottom: -h / 2 });
    this.camera.position.set(0, cy + 20000 * Math.sin(TILT), 20000 * Math.cos(TILT));
    this.camera.lookAt(0, cy, 0);
    this.camera.updateProjectionMatrix();
    this.floor.scale.setScalar(Math.max(width, h) * 0.9);

    this.guessBar.visible = guess !== undefined;
    if (guess !== undefined) {
      this.guessBar.position.set(xR, guess * hL, 0);
      this.guessBar.scale.set(Math.max(rR * 2.4, h * 0.12), h * 0.006, 1);
    }

    // Keep the HTML name tags under each model.
    const w = this.host.clientWidth;
    [xL, xR].forEach((x, i) => {
      const el = this.labels[i];
      if (el) el.style.left = `${((new THREE.Vector3(x, 0, 0).project(this.camera).x + 1) / 2) * w}px`;
    });
    const tag = this.labels[2];
    if (tag) {
      tag.hidden = guess === undefined;
      if (guess !== undefined) {
        const p = new THREE.Vector3(xR, guess * hL, 0).project(this.camera);
        tag.style.left = `${((p.x + 1) / 2) * w}px`;
        tag.style.top = `${((1 - p.y) / 2) * this.host.clientHeight}px`;
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resize.disconnect();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}

interface Props {
  left: ModelInfo;
  right: ModelInfo;
  /** Height of the right model as a multiple of the left one's. */
  ratio: number;
  /** After the reveal: the player's guess, drawn as a line. */
  guess?: number;
  /** Slowly turn the models (after the reveal). */
  spin?: boolean;
}

export function ModelStage({ left, right, ratio, guess, spin = false }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const leftTag = useRef<HTMLSpanElement>(null);
  const rightTag = useRef<HTMLSpanElement>(null);
  const guessTag = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    try {
      stageRef.current = new Stage(hostRef.current!, [leftTag.current, rightTag.current, guessTag.current]);
    } catch {
      setStatus('error'); // no WebGL
    }
    return () => {
      stageRef.current?.dispose();
      stageRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus((s) => (s === 'error' && !stageRef.current ? s : 'loading'));
    Promise.all([loadModel(left), loadModel(right)]).then(
      ([l, r]) => {
        if (cancelled || !stageRef.current) return;
        stageRef.current.setModels(l, r, left.height);
        setStatus('ready');
      },
      () => !cancelled && setStatus('error'),
    );
    return () => {
      cancelled = true;
    };
  }, [left, right]);

  useEffect(() => {
    stageRef.current?.setView({ ratio, guess, spin });
  }, [ratio, guess, spin]);

  return (
    <div className="model-stage" ref={hostRef}>
      <span className="model-tag" ref={leftTag}>
        {left.name}
      </span>
      <span className="model-tag" ref={rightTag}>
        {right.name}
      </span>
      <span className="model-tag guess-tag" ref={guessTag} hidden>
        your guess
      </span>
      {status !== 'ready' && (
        <div className="model-stage-msg">
          {status === 'loading' ? 'Summoning models…' : 'Couldn’t load the 3D models — you can still play.'}
        </div>
      )}
    </div>
  );
}
