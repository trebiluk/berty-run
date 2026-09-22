import * as THREE from "three";
import type { CourseId } from "./types";
import { trackById } from "./tracks3d";

export type BendInput = { x: number; y: number };
export type BendEvent = { gem?: boolean; bump?: boolean; hurt?: boolean; win?: boolean; boost?: boolean; check?: boolean };

const NAVY = 0x0b1f3a;
const NAVY2 = 0x16304c;
const ORANGE = 0xe87722;
const PAPER = 0xf4efe6;
const INK = 0x071526;
const CRATE = 0xc45c26;
const R = 0.42;
const ACC = 18;
const TURN = 2.55;
const GRIP = 5.2;
const GRAV = 28;
const FRICTION = 1.15;
const REST = 0.12;
const START = { x: 0, y: R + 0.02, z: 0, yaw: 0 };

type Aabb = { min: THREE.Vector3; max: THREE.Vector3; kind: "floor" | "wall" | "crate" | "gate" };
type Gem = { pos: THREE.Vector3; mesh: THREE.Object3D; got: boolean; t: number };
type Check3 = { x: number; y: number; z: number; yaw: number; r: number };
type Saw3 = { mesh: THREE.Object3D; x: number; y: number; z: number; r: number };
type Boost3 = { min: THREE.Vector3; max: THREE.Vector3 };
type Ice3 = Boost3;

export class Bend3D {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer | null = null;
  scene: THREE.Scene | null = null;
  camera: THREE.PerspectiveCamera | null = null;
  berty: THREE.Group | null = null;
  ball: THREE.Mesh | null = null;
  gemMeshes: Gem[] = [];
  boxes: Aabb[] = [];
  gate = { x: 28, y: 0, z: -46, w: 2.4, d: 1.2 };
  pos = new THREE.Vector3(START.x, START.y, START.z);
  vel = new THREE.Vector3();
  yaw = START.yaw;
  roll = 0;
  grounded = true;
  alive = true;
  fall = 0;
  time = 0;
  trauma = 0;
  reduced = false;
  camPos = new THREE.Vector3(0, 4, 8);
  tmp = new THREE.Vector3();
  tmp2 = new THREE.Vector3();
  fwd = new THREE.Vector3();
  right = new THREE.Vector3();
  look = new THREE.Vector3();
  desired = new THREE.Vector3();
  idleOrbit = 0;
  title = true;
  gemTotal = 5;
  lastCheck: Check3 = { ...START, y: START.y, r: 1.6 };
  checks: Check3[] = [];
  saws: Saw3[] = [];
  boosts: Boost3[] = [];
  ices: Ice3[] = [];
  boostCool = 0;
  trackId: CourseId | null = null;
  trackRoot: THREE.Group | null = null;
  previewLook = { x: 8, z: -16 };
  punch = 0;
  private attached = false;

  constructor(canvas: HTMLCanvasElement, reduced: boolean) {
    this.canvas = canvas;
    this.reduced = reduced;
  }

  get gemsGot() {
    return this.gemMeshes.filter((g) => g.got).length;
  }

  get speed() {
    return Math.hypot(this.vel.x, this.vel.z);
  }

  ensure() {
    if (this.renderer) {
      this.canvas.style.opacity = "1";
      this.attached = true;
      this.resize();
      return;
    }
    const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
    renderer.setClearColor(INK, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(INK, 16, 62);
    scene.background = new THREE.Color(INK);
    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 120);
    camera.position.set(0, 3.4, 8);

    const hemi = new THREE.HemisphereLight(PAPER, NAVY, 1.15);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe1c2, 1.35);
    sun.position.set(10, 18, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 90;
    sun.shadow.camera.left = -36;
    sun.shadow.camera.right = 36;
    sun.shadow.camera.top = 36;
    sun.shadow.camera.bottom = -36;
    scene.add(sun);

    const voidMat = new THREE.MeshLambertMaterial({ color: 0x040910 });
    const voidPlane = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), voidMat);
    voidPlane.rotation.x = -Math.PI / 2;
    voidPlane.position.y = -8;
    scene.add(voidPlane);

    this.berty = this.makeBerty();
    scene.add(this.berty);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.attached = true;
    this.canvas.style.opacity = "1";
    this.resize();
  }

  load(id: CourseId) {
    this.ensure();
    if (this.trackId === id && this.trackRoot) {
      this.canvas.style.opacity = "1";
      this.attached = true;
      this.reset();
      return;
    }
    this.trackId = id;
    this.clearTrack();
    if (this.scene) this.buildTrack(this.scene, id);
    this.reset();
  }

  sleep() {
    this.attached = false;
    this.canvas.style.opacity = "0";
  }

  dispose() {
    this.sleep();
    this.clearTrack();
    this.renderer?.dispose();
    this.scene?.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.berty = null;
    this.ball = null;
    this.trackId = null;
  }

  private clearTrack() {
    if (this.trackRoot && this.scene) {
      this.scene.remove(this.trackRoot);
      this.trackRoot.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
    }
    this.trackRoot = null;
    this.gemMeshes = [];
    this.boxes = [];
    this.saws = [];
    this.checks = [];
    this.boosts = [];
    this.ices = [];
  }

  reset() {
    this.pos.set(START.x, START.y, START.z);
    this.vel.set(0, 0, 0);
    this.yaw = START.yaw;
    this.roll = 0;
    this.grounded = true;
    this.alive = true;
    this.fall = 0;
    this.trauma = 0;
    this.idleOrbit = 0;
    this.boostCool = 0;
    this.punch = 0;
    this.lastCheck = { x: START.x, y: START.y, z: START.z, yaw: START.yaw, r: 1.6 };
    for (const g of this.gemMeshes) {
      g.got = false;
      g.mesh.visible = true;
    }
    this.syncBerty();
    this.camPos.set(0, 3.6, 9);
  }

  setTitle(on: boolean) {
    this.title = on;
  }

  resize() {
    if (!this.renderer || !this.camera) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w < 2 || h < 2) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  step(dt: number, input: BendInput, playing: boolean): BendEvent {
    const ev: BendEvent = {};
    this.time += dt;
    this.trauma = Math.max(0, this.trauma - dt * 2.2);
    this.punch = Math.max(0, this.punch - dt * 2.8);
    if (!playing) {
      this.idleOrbit += dt * 0.35;
      return ev;
    }
    if (!this.alive) {
      this.fall += dt;
      this.pos.y -= 3.5 * dt;
      if (this.fall > 0.7) {
        this.pos.set(this.lastCheck.x, this.lastCheck.y, this.lastCheck.z);
        this.vel.set(0, 0, 0);
        this.yaw = this.lastCheck.yaw;
        this.alive = true;
        this.fall = 0;
      }
      this.syncBerty();
      return ev;
    }

    const steer = -input.x;
    this.yaw += steer * TURN * dt;
    this.fwd.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const throttle = -input.y;
    const slick = this.inIce();
    const acc = slick ? ACC * 0.55 : ACC;
    const grip = slick ? 1.35 : GRIP;
    const fric = slick ? 0.42 : FRICTION;
    if (this.grounded) {
      this.vel.x += this.fwd.x * throttle * acc * dt;
      this.vel.z += this.fwd.z * throttle * acc * dt;
      const along = this.vel.x * this.fwd.x + this.vel.z * this.fwd.z;
      const tx = this.vel.x - this.fwd.x * along;
      const tz = this.vel.z - this.fwd.z * along;
      this.vel.x -= tx * grip * dt;
      this.vel.z -= tz * grip * dt;
      const damp = Math.exp(-fric * dt);
      this.vel.x *= damp;
      this.vel.z *= damp;
    }
    this.vel.y -= GRAV * dt;
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (sp > 14) {
      this.vel.x *= 14 / sp;
      this.vel.z *= 14 / sp;
    }

    const sub = 3;
    const sdt = dt / sub;
    this.grounded = false;
    for (let i = 0; i < sub; i++) {
      this.pos.x += this.vel.x * sdt;
      this.pos.y += this.vel.y * sdt;
      this.pos.z += this.vel.z * sdt;
      const hit = this.collide();
      if (hit.bump) ev.bump = true;
    }

    this.roll += Math.hypot(this.vel.x, this.vel.z) * dt * (1 / R);
    this.boostCool = Math.max(0, this.boostCool - dt);

    for (const pad of this.boosts) {
      if (
        this.pos.x > pad.min.x &&
        this.pos.x < pad.max.x &&
        this.pos.z > pad.min.z &&
        this.pos.z < pad.max.z &&
        this.pos.y < 1.2
      ) {
        this.vel.x += this.fwd.x * 26 * dt;
        this.vel.z += this.fwd.z * 26 * dt;
        if (this.boostCool <= 0) {
          ev.boost = true;
          this.boostCool = 0.35;
        }
      }
    }

    for (const c of this.checks) {
      if (Math.hypot(this.pos.x - c.x, this.pos.z - c.z) < c.r && this.pos.y > -0.2) {
        if (Math.hypot(this.lastCheck.x - c.x, this.lastCheck.z - c.z) > 1) ev.check = true;
        this.lastCheck = { ...c, y: R + 0.02 };
      }
    }

    for (const s of this.saws) {
      s.mesh.rotation.y += dt * 10;
      if (Math.hypot(this.pos.x - s.x, this.pos.z - s.z) < s.r + R && Math.abs(this.pos.y - s.y) < 0.55) {
        this.alive = false;
        this.fall = 0;
        ev.hurt = true;
        this.trauma = Math.min(1, this.trauma + 0.55);
      }
    }

    for (const g of this.gemMeshes) {
      if (g.got) continue;
      if (this.pos.distanceTo(g.pos) < R + 0.45) {
        g.got = true;
        g.mesh.visible = false;
        ev.gem = true;
      }
    }

    if (this.pos.y < -6 && this.alive) {
      this.alive = false;
      this.fall = 0;
      ev.hurt = true;
      this.trauma = Math.min(1, this.trauma + 0.55);
    }

    const got = this.gemsGot;
    if (
      got >= this.gemTotal &&
      Math.abs(this.pos.x - this.gate.x) < 1.6 &&
      Math.abs(this.pos.z - this.gate.z) < 1.4 &&
      this.pos.y > -0.2
    ) {
      ev.win = true;
    }

    this.syncBerty();
    return ev;
  }

  render(playing: boolean) {
    if (!this.renderer || !this.scene || !this.camera || !this.attached) return;
    this.resize();
    const cam = this.camera;
    this.fwd.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    if (!playing) {
      const a = this.idleOrbit;
      this.desired.set(Math.sin(a) * 12, 5.6, Math.cos(a) * 12 + this.previewLook.z * 0.35);
      this.look.set(this.previewLook.x, 0.4, this.previewLook.z);
    } else {
      this.desired.copy(this.pos);
      this.desired.y += 2.8 - this.punch * 0.9;
      this.tmp.copy(this.fwd).multiplyScalar(-7.2 + this.punch * 2.4);
      this.desired.add(this.tmp);
      this.desired.y += 0.4;
      this.look.copy(this.pos);
      this.look.y += 0.55;
      this.tmp.copy(this.fwd).multiplyScalar(1.6);
      this.look.add(this.tmp);
    }
    const k = playing ? 5.2 : 2.4;
    const dt = 1 / 60;
    this.camPos.lerp(this.desired, 1 - Math.exp(-k * dt));
    const shake = this.trauma * this.trauma;
    if (!this.reduced && shake > 0.001) {
      cam.position.set(
        this.camPos.x + (Math.random() * 2 - 1) * 0.18 * shake,
        this.camPos.y + (Math.random() * 2 - 1) * 0.12 * shake,
        this.camPos.z + (Math.random() * 2 - 1) * 0.18 * shake,
      );
    } else {
      cam.position.copy(this.camPos);
    }
    cam.lookAt(this.look);

    for (const g of this.gemMeshes) {
      if (g.got) continue;
      g.mesh.position.y = g.pos.y + Math.sin(this.time * 3 + g.t) * 0.12;
      g.mesh.rotation.y += 0.03;
    }
    this.renderer.render(this.scene, cam);
  }

  private syncBerty() {
    if (!this.berty || !this.ball) return;
    this.berty.position.copy(this.pos);
    this.berty.rotation.y = this.yaw;
    this.ball.rotation.x = this.roll;
    this.berty.visible = this.alive || this.fall < 0.55;
    const s = this.alive ? 1 : Math.max(0.2, 1 - this.fall * 1.4);
    this.berty.scale.setScalar(s);
  }

  private collide(): { bump: boolean } {
    let bump = false;
    for (const b of this.boxes) {
      const cx = clamp(this.pos.x, b.min.x, b.max.x);
      const cy = clamp(this.pos.y, b.min.y, b.max.y);
      const cz = clamp(this.pos.z, b.min.z, b.max.z);
      let dx = this.pos.x - cx;
      let dy = this.pos.y - cy;
      let dz = this.pos.z - cz;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > R * R) continue;
      if (d2 < 1e-8) {
        const left = this.pos.x - b.min.x;
        const right = b.max.x - this.pos.x;
        const bottom = this.pos.y - b.min.y;
        const top = b.max.y - this.pos.y;
        const near = this.pos.z - b.min.z;
        const far = b.max.z - this.pos.z;
        const m = Math.min(left, right, bottom, top, near, far);
        dx = dy = dz = 0;
        if (m === top) dy = 1;
        else if (m === bottom) dy = -1;
        else if (m === left) dx = -1;
        else if (m === right) dx = 1;
        else if (m === near) dz = -1;
        else dz = 1;
        const pen = R;
        this.pos.x += dx * pen;
        this.pos.y += dy * pen;
        this.pos.z += dz * pen;
      } else {
        const d = Math.sqrt(d2);
        dx /= d;
        dy /= d;
        dz /= d;
        const pen = R - d;
        this.pos.x += dx * pen;
        this.pos.y += dy * pen;
        this.pos.z += dz * pen;
      }
      const vn = this.vel.x * dx + this.vel.y * dy + this.vel.z * dz;
      if (vn < 0) {
        this.vel.x -= (1 + REST) * vn * dx;
        this.vel.y -= (1 + REST) * vn * dy;
        this.vel.z -= (1 + REST) * vn * dz;
        if (Math.abs(vn) > 3.2 && dx * dx + dz * dz > 0.4) bump = true;
      }
      if (dy > 0.55 && this.vel.y <= 0.4) {
        this.grounded = true;
        this.vel.y = Math.max(this.vel.y, 0);
      }
    }
    if (bump) this.trauma = Math.min(1, this.trauma + 0.16);
    return { bump };
  }

  private inIce() {
    for (const pad of this.ices) {
      if (
        this.pos.x > pad.min.x &&
        this.pos.x < pad.max.x &&
        this.pos.z > pad.min.z &&
        this.pos.z < pad.max.z &&
        this.pos.y < 1.2
      ) {
        return true;
      }
    }
    return false;
  }

  private makeBerty() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(R, 24, 18),
      new THREE.MeshLambertMaterial({ color: NAVY }),
    );
    body.castShadow = true;
    this.ball = body;
    g.add(body);
    const visor = new THREE.Mesh(
      new THREE.TorusGeometry(R * 0.78, 0.07, 8, 24),
      new THREE.MeshLambertMaterial({ color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.18 }),
    );
    visor.rotation.x = Math.PI / 2;
    visor.position.z = -0.02;
    g.add(visor);
    const slit = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.07, 0.06),
      new THREE.MeshLambertMaterial({ color: PAPER, emissive: PAPER, emissiveIntensity: 0.35 }),
    );
    slit.position.set(0, 0.04, -R + 0.08);
    g.add(slit);
    const ant = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8),
      new THREE.MeshLambertMaterial({ color: ORANGE }),
    );
    ant.position.y = R + 0.05;
    g.add(ant);
    const nub = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 10, 8),
      new THREE.MeshLambertMaterial({ color: ORANGE }),
    );
    nub.position.y = R + 0.14;
    g.add(nub);
    return g;
  }

  private buildTrack(scene: THREE.Scene, id: CourseId) {
    const def = trackById(id);
    this.previewLook = def.look;
    const root = new THREE.Group();
    scene.add(root);
    this.trackRoot = root;

    const floorMat = new THREE.MeshLambertMaterial({ color: NAVY2 });
    const wallMat = new THREE.MeshLambertMaterial({ color: NAVY });
    const stripeMat = new THREE.MeshLambertMaterial({ color: ORANGE });
    const crateMat = new THREE.MeshLambertMaterial({ color: CRATE });
    const gemMat = new THREE.MeshLambertMaterial({
      color: ORANGE,
      emissive: ORANGE,
      emissiveIntensity: 0.45,
    });
    const iceMat = new THREE.MeshLambertMaterial({ color: 0x9db0c4, transparent: true, opacity: 0.55 });

    const addBox = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
      kind: Aabb["kind"],
      stripe = false,
    ) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = kind !== "floor";
      mesh.receiveShadow = true;
      root.add(mesh);
      if (stripe && kind === "floor") {
        const s = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.04, d * 0.98), stripeMat);
        s.position.set(x, y + h / 2 + 0.01, z);
        root.add(s);
      }
      this.boxes.push({
        min: new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2),
        max: new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2),
        kind,
      });
    };

    const W = 5.4;
    const H = 0.5;
    const railH = 0.48;
    const railT = 0.28;

    const segment = (x1: number, z1: number, x2: number, z2: number, narrow = false) => {
      const cx = (x1 + x2) / 2;
      const cz = (z1 + z2) / 2;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const alongX = Math.abs(dx) > Math.abs(dz);
      const ww = narrow ? 2.3 : W;
      const railLen = Math.max(1.2, len - ww * 0.9);
      if (alongX) {
        addBox(cx, -H / 2, cz, len + ww * 0.12, H, ww, floorMat, "floor", true);
        addBox(cx, railH / 2, cz + ww / 2, railLen, railH, railT, wallMat, "wall");
        addBox(cx, railH / 2, cz - ww / 2, railLen, railH, railT, wallMat, "wall");
        addBox(cx, 0.02, cz + ww / 2, railLen, 0.05, railT + 0.04, stripeMat, "wall");
        addBox(cx, 0.02, cz - ww / 2, railLen, 0.05, railT + 0.04, stripeMat, "wall");
      } else {
        addBox(cx, -H / 2, cz, ww, H, len + ww * 0.12, floorMat, "floor", true);
        addBox(cx + ww / 2, railH / 2, cz, railT, railH, railLen, wallMat, "wall");
        addBox(cx - ww / 2, railH / 2, cz, railT, railH, railLen, wallMat, "wall");
        addBox(cx + ww / 2, 0.02, cz, railT + 0.04, 0.05, railLen, stripeMat, "wall");
        addBox(cx - ww / 2, 0.02, cz, railT + 0.04, 0.05, railLen, stripeMat, "wall");
      }
    };

    for (const s of def.segs) segment(s.x1, s.z1, s.x2, s.z2, s.narrow);
    for (const c of def.corners) addBox(c.x, -H / 2, c.z, W + 0.4, H, W + 0.4, floorMat, "floor", true);

    if (def.crate) {
      addBox(def.crate.x, 0.28, def.crate.z, 1.5, 0.28, 1.1, wallMat, "crate");
      addBox(def.crate.x, 0.44, def.crate.z, 1.2, 0.12, 0.85, crateMat, "crate");
      addBox(def.crate.x, 0.12, def.crate.z + 0.62, 1.5, 0.06, 0.12, stripeMat, "crate");
      addBox(def.crate.x, 0.12, def.crate.z - 0.62, 1.5, 0.06, 0.12, stripeMat, "crate");
    }

    const lampMat = new THREE.MeshLambertMaterial({ color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.55 });
    const colMat = new THREE.MeshLambertMaterial({ color: NAVY });
    for (const p of def.lamps ?? []) {
      addBox(p.x, 1.6, p.z, 0.38, 3.2, 0.38, colMat, "wall");
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), lampMat);
      lamp.position.set(p.x, 3.35, p.z);
      root.add(lamp);
    }

    this.boosts = [];
    for (const b of def.boosts ?? []) {
      this.boosts.push({
        min: new THREE.Vector3(b.x - b.w / 2, 0, b.z - b.d / 2),
        max: new THREE.Vector3(b.x + b.w / 2, 1.2, b.z + b.d / 2),
      });
      addBox(b.x, 0.04, b.z, b.w, 0.08, b.d, stripeMat, "floor");
    }

    this.ices = [];
    for (const ice of def.ices ?? []) {
      this.ices.push({
        min: new THREE.Vector3(ice.x - ice.w / 2, 0, ice.z - ice.d / 2),
        max: new THREE.Vector3(ice.x + ice.w / 2, 1.2, ice.z + ice.d / 2),
      });
      addBox(ice.x, 0.05, ice.z, ice.w, 0.06, ice.d, iceMat, "floor");
    }

    this.checks = (def.checks ?? []).map((c) => ({ x: c.x, y: R + 0.02, z: c.z, yaw: c.yaw, r: 1.8 }));
    for (const c of this.checks) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.05, 8, 20),
        new THREE.MeshLambertMaterial({ color: PAPER, emissive: PAPER, emissiveIntensity: 0.2 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(c.x, 0.08, c.z);
      root.add(ring);
    }

    const hubMat = new THREE.MeshLambertMaterial({ color: NAVY2 });
    const bladeMat = new THREE.MeshLambertMaterial({ color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.08 });
    this.saws = [];
    for (const s of def.saws ?? []) {
      const fan = new THREE.Group();
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.16, 12), hubMat);
      fan.add(hub);
      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.05, 0.22), bladeMat);
        blade.position.x = 0.34;
        const g = new THREE.Group();
        g.rotation.y = (i * Math.PI) / 2;
        g.add(blade);
        fan.add(g);
      }
      fan.position.set(s.x, 0.55, s.z);
      root.add(fan);
      this.saws.push({ mesh: fan, x: s.x, y: 0.55, z: s.z, r: 0.85 });
    }

    this.gate = { x: def.gate.x, y: 0, z: def.gate.z, w: 2.4, d: 1.2 };
    const postMat = new THREE.MeshLambertMaterial({ color: NAVY });
    addBox(def.gate.x - 1.3, 1.1, def.gate.z, 0.28, 2.2, 0.28, postMat, "wall");
    addBox(def.gate.x + 1.3, 1.1, def.gate.z, 0.28, 2.2, 0.28, postMat, "wall");
    addBox(def.gate.x, 2.2, def.gate.z, 2.9, 0.28, 0.28, stripeMat, "wall");
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1.8),
      new THREE.MeshBasicMaterial({
        color: ORANGE,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
      }),
    );
    if (def.gate.face === "x") {
      glow.rotation.y = Math.PI / 2;
      glow.position.set(def.gate.x - 0.3, 1.1, def.gate.z);
    } else {
      glow.position.set(def.gate.x, 1.1, def.gate.z + 0.3);
    }
    root.add(glow);

    this.gemMeshes = [];
    this.gemTotal = def.gems.length;
    const geo = new THREE.OctahedronGeometry(0.32, 0);
    def.gems.forEach((p, i) => {
      const mesh = new THREE.Mesh(geo, gemMat);
      mesh.position.set(p.x, 0.7, p.z);
      mesh.castShadow = true;
      root.add(mesh);
      this.gemMeshes.push({ pos: new THREE.Vector3(p.x, 0.7, p.z), mesh, got: false, t: i });
    });
  }
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
