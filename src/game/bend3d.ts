import * as THREE from "three";
import type { CourseId } from "./types";
import { trackById } from "./tracks3d";
import { easeOf, clearPose, onFloor } from "./track-layout";
import { pcbLook } from "./pcb";

export type BendInput = { x: number; y: number; jump?: boolean; zap?: boolean; direct?: boolean };
export type BendEvent = { gem?: boolean; bump?: boolean; hurt?: boolean; win?: boolean; boost?: boolean; check?: boolean; zap?: boolean; tip?: string };

const NAVY = 0x101820;
const NAVY2 = 0x1c2c44;
const ORANGE = 0xd6ff4a;
const PAPER = 0xf6efe2;
const INK = 0x0b1220;
const CRATE = 0xe07a2f;
const R = 0.42;
const ACC = 12;
const TURN = 1.15;
const GRIP = 5.2;
const GRAV = 28;
const FRICTION = 1.15;
const REST = 0.12;
const START = { x: 0, y: R + 0.02, z: 0, yaw: 0 };

type Aabb = { min: THREE.Vector3; max: THREE.Vector3; kind: "floor" | "wall" | "crate" | "gate" };
type Gem = { pos: THREE.Vector3; home: THREE.Vector3; mesh: THREE.Object3D; got: boolean; t: number; pop: number };
type Check3 = { x: number; y: number; z: number; yaw: number; r: number };
type Saw3 = { mesh: THREE.Object3D; x: number; y: number; z: number; r: number };
type Boost3 = { min: THREE.Vector3; max: THREE.Vector3 };
type Ice3 = Boost3;
type Bug3 = { kind: "virus" | "worm" | "lock"; x: number; z: number; base: number; mesh: THREE.Object3D; dead: boolean; phase: number; r: number };

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
  low = false;
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
  bugs: Bug3[] = [];
  ease = 1;
  jumpWas = false;
  zapCool = 0;
  saidJump = false;
  saidDefrag = false;
  lastSafe = new THREE.Vector3(START.x, START.y, START.z);
  safeYaw = 0;
  safeHold = 0;
  grace = 0;
  recoverTimes: number[] = [];
  recovers = 0;
  boostCool = 0;
  trackId: CourseId | null = null;
  trackRoot: THREE.Group | null = null;
  previewLook = { x: 8, z: -16 };
  punch = 0;
  steerSm = 0;
  gear = 0;
  private attached = false;
  private shade: THREE.Mesh | null = null;
  private unitBox = new THREE.BoxGeometry(1, 1, 1);
  private gemGeo = new THREE.OctahedronGeometry(0.3, 0);
  private socketGeo = new THREE.TorusGeometry(0.22, 0.035, 6, 14);
  private mats: ReturnType<Bend3D["makeMats"]> | null = null;
  private ray: THREE.Raycaster | null = null;
  private ndc = new THREE.Vector2();

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
    const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 8 : 8;
    const mem = typeof navigator !== "undefined" ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8 : 8;
    const low = this.reduced || cores <= 4 || mem <= 4;
    this.low = low;
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !low,
      alpha: false,
      powerPreference: low ? "low-power" : "high-performance",
    });
    renderer.setClearColor(INK, 1);
    renderer.shadowMap.enabled = !low;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x101214, 28, 90);
    scene.background = new THREE.Color(0x101214);
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 140);
    camera.position.set(0, 3.4, 8);

    const hemi = new THREE.HemisphereLight(0xb8fff8, 0x10140c, 0.85);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe7a0, 1.25);
    sun.position.set(12, 16, 6);
    sun.castShadow = !low;
    sun.shadow.mapSize.set(512, 512);
    sun.shadow.bias = -0.0006;
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 70;
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -28;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8fb4d8, 0.45);
    fill.position.set(-8, 6, -10);
    scene.add(fill);

    const mats = this.materials();
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(78, 40),
      new THREE.MeshPhongMaterial({ map: boardTex(), color: 0xffffff, shininess: 12, specular: 0x3a3a3a }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.55;
    ground.receiveShadow = true;
    scene.add(ground);

    const voidPlane = new THREE.Mesh(new THREE.CircleGeometry(80, 24), mats.void);
    voidPlane.rotation.x = -Math.PI / 2;
    voidPlane.position.y = -6;
    scene.add(voidPlane);

    this.berty = this.makeBerty();
    scene.add(this.berty);
    this.shade = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }),
    );
    this.shade.rotation.x = -Math.PI / 2;
    this.shade.position.y = 0.03;
    scene.add(this.shade);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.attached = true;
    this.canvas.style.opacity = "1";
    this.resize();
  }

  setGear(n: number) {
    this.gear = n;
    const g = this.berty;
    if (!g) return;
    const show = (name: string, on: boolean) => {
      const obj = g.getObjectByName(name);
      if (obj) obj.visible = on;
    };
    show("glow", n >= 1);
    show("heart", n >= 2);
    show("pull", n >= 3);
    show("boost", n >= 5);
    show("trail", n >= 7);
    show("crown", n >= 10);
  }

  load(id: CourseId, headless = false) {
    if (headless) this.ensureSim();
    else this.ensure();
    this.ease = easeOf(id);
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
        if (mesh.userData.own && mesh.geometry) mesh.geometry.dispose();
      });
    }
    this.trackRoot = null;
    this.gemMeshes = [];
    this.boxes = [];
    this.saws = [];
    this.checks = [];
    this.boosts = [];
    this.ices = [];
    this.bugs = [];
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
    this.steerSm = 0;
    this.jumpWas = false;
    this.zapCool = 0;
    this.saidJump = false;
    this.saidDefrag = false;
    this.lastSafe.set(START.x, START.y, START.z);
    this.safeYaw = 0;
    this.safeHold = 0;
    this.grace = 0;
    this.recoverTimes = [];
    this.recovers = 0;
    for (const b of this.bugs) {
      b.dead = false;
      b.mesh.visible = true;
      b.x = b.base;
      b.mesh.position.x = b.x;
    }
    this.lastCheck = { x: START.x, y: START.y, z: START.z, yaw: START.yaw, r: 1.6 };
    for (const g of this.gemMeshes) {
      g.got = false;
      g.pop = 0;
      g.pos.copy(g.home);
      g.mesh.visible = true;
      g.mesh.position.copy(g.home);
      g.mesh.scale.setScalar(1);
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
    const dpr = Math.min(this.low ? 1 : 1.25, window.devicePixelRatio || 1);
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

    this.grace = Math.max(0, this.grace - dt);
    const steer = this.easeAxis(input.direct ? clamp(-input.x, -1, 1) : -input.x);
    const follow = this.ease > 0.45 ? 3.1 : 4.2;
    this.steerSm += (steer - this.steerSm) * (1 - Math.exp(-follow * dt));
    const turn = TURN * (0.62 + (1 - this.ease) * 0.7);
    this.yaw += this.steerSm * turn * dt;
    this.fwd.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const throttle = this.easeAxis(input.direct ? clamp(-input.y, 0, 1) : -input.y);
    const slick = this.inIce();
    const acc = (slick ? ACC * 0.55 : ACC) * (0.84 + (1 - this.ease) * 0.22);
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
    if (sp > 10.5) {
      this.vel.x *= 10.5 / sp;
      this.vel.z *= 10.5 / sp;
    }

    const jumpNow = !!input.jump && !this.jumpWas;
    this.jumpWas = !!input.jump;
    if (jumpNow && this.grounded) {
      this.vel.y = 8.4;
      this.grounded = false;
      if (!this.saidJump) {
        this.saidJump = true;
        ev.tip = "Jump. Hop a lock, or a low fan.";
      }
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
        this.vel.x += this.fwd.x * (this.gear >= 5 ? 36 : 26) * dt;
        this.vel.z += this.fwd.z * (this.gear >= 5 ? 36 : 26) * dt;
        if (this.boostCool <= 0) {
          ev.boost = true;
          this.boostCool = 0.35;
          if (!this.saidDefrag) {
            this.saidDefrag = true;
            ev.tip = "Defrag. Files get packed. You get a push.";
          }
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
      if (Math.hypot(this.pos.x - s.x, this.pos.z - s.z) < s.r * (this.ease > 0.55 ? 0.72 : 1) + R && Math.abs(this.pos.y - s.y) < 0.55) {
        this.alive = false;
        this.fall = 0;
        ev.hurt = true;
        this.trauma = Math.min(1, this.trauma + 0.55);
      }
    }

    for (const g of this.gemMeshes) {
      if (g.got) {
        if (g.pop > 0) {
          g.pop -= dt;
          g.mesh.scale.setScalar(1 + (0.22 - Math.max(0, g.pop)) * 7);
          if (g.pop <= 0) g.mesh.visible = false;
        }
        continue;
      }
      if (this.gear >= 3) {
        const dx = this.pos.x - g.pos.x;
        const dz = this.pos.z - g.pos.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.2 && d < 2.2) {
          g.pos.x += (dx / d) * 1.6 * dt;
          g.pos.z += (dz / d) * 1.6 * dt;
          g.mesh.position.copy(g.pos);
        }
      }
      if (this.pos.distanceTo(g.pos) < R + 0.45) {
        g.got = true;
        g.pop = 0.22;
        this.punch = Math.max(this.punch, 0.45);
        ev.gem = true;
      }
    }

    this.zapCool = Math.max(0, this.zapCool - dt);
    if (input.zap && this.zapCool <= 0) {
      this.zapCool = 0.4;
      let zapped = false;
      for (const b of this.bugs) {
        if (b.dead) continue;
        if (Math.hypot(this.pos.x - b.x, this.pos.z - b.z) < 2.7) {
          b.dead = true;
          b.mesh.visible = false;
          ev.zap = true;
          ev.tip = bugLine(b.kind);
          this.punch = Math.max(this.punch, 0.4);
          zapped = true;
        }
      }
      if (!zapped && this.bugs.some((b) => !b.dead)) ev.tip = "Move closer, then tap Zap. It does not fire by itself.";
    }

    for (const b of this.bugs) {
      if (b.dead) continue;
      if (b.kind === "worm") {
        b.phase += dt;
        b.x = b.base + Math.sin(b.phase) * 1.4;
        b.mesh.position.x = b.x;
      }
      const d = Math.hypot(this.pos.x - b.x, this.pos.z - b.z);
      const tall = b.kind === "lock" ? 0.72 : 0.95;
      if (d < b.r + R && this.pos.y < tall) {
        const nx = (this.pos.x - b.x) / Math.max(0.2, d);
        const nz = (this.pos.z - b.z) / Math.max(0.2, d);
        this.vel.x = nx * 5;
        this.vel.z = nz * 5;
        if (this.ease > 0.4) {
          ev.tip = `${bugLine(b.kind)} Or steer around it.`;
        } else {
          this.alive = false;
          this.fall = 0;
          ev.hurt = true;
          this.trauma = Math.min(1, this.trauma + 0.45);
        }
      }
    }

    if (this.grounded && this.pos.y > -0.15 && this.grace <= 0) {
      const speed = Math.hypot(this.vel.x, this.vel.z);
      const boxes = this.boxes.filter((b) => b.kind === "floor").map((b) => ({
        minX: b.min.x, maxX: b.max.x, minY: b.min.y, maxY: b.max.y, minZ: b.min.z, maxZ: b.max.z, kind: "floor" as const,
      }));
      const clear = speed < 6 && onFloor(boxes, this.pos.x, this.pos.z, 0.9) && !this.hazardNear(this.pos.x, this.pos.z, 2.5);
      this.safeHold = clear ? this.safeHold + dt : 0;
      if (this.safeHold >= 1) {
        this.lastSafe.set(this.pos.x, R + 0.02, this.pos.z);
        this.safeYaw = this.yaw;
      }
    } else if (!this.grounded) this.safeHold = 0;

    if (this.pos.y < -1.15 && this.alive && this.ease > 0.4 && this.grace <= 0) {
      this.recovers += 1;
      const now = this.time;
      this.recoverTimes = this.recoverTimes.filter((t) => now - t < 5);
      this.recoverTimes.push(now);
      const def = trackById(this.trackId ?? "practice-3d");
      const tooMany = this.recoverTimes.length > 2;
      const spot = tooMany
        ? { x: this.lastCheck.x, y: R + 0.02, z: this.lastCheck.z, yaw: this.lastCheck.yaw }
        : clearPose(def, this.pos.x, this.pos.z);
      this.pos.set(spot.x, R + 0.02, spot.z);
      this.yaw = spot.yaw;
      this.vel.set(0, 0, 0);
      this.grounded = true;
      this.grace = 1.5;
      this.safeHold = 0;
      this.trauma = Math.min(1, this.trauma + 0.2);
      if (tooMany) {
        this.recoverTimes = [];
        ev.hurt = true;
        ev.tip = "Back at the ring. One heart.";
      } else ev.tip = "Back on the board. Steer a little less.";
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
      if (this.camera && this.camera.aspect < 1) {
        this.desired.y += 2.2;
        this.tmp.copy(this.fwd).multiplyScalar(-2.8);
        this.desired.add(this.tmp);
      }
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
    this.spinGear();
    this.renderer.render(this.scene, cam);
  }

  private spinGear() {
    const g = this.berty;
    if (!g) return;
    const t = this.time;
    const spin = (name: string, z: number, pulse = 0) => {
      const obj = g.getObjectByName(name);
      if (!obj?.visible) return;
      obj.rotation.z = z;
      if (pulse) {
        const s = 1 + Math.sin(t * 3) * pulse;
        obj.scale.set(s, s, s);
      }
    };
    spin("glow", t * 2);
    spin("pull", -t, 0.06);
    spin("trail", t * 2.4);
    const crown = g.getObjectByName("crown");
    if (crown?.visible) crown.rotation.y = t * 1.4;
    const heart = g.getObjectByName("heart");
    if (heart?.visible) heart.position.y = R * 0.2 + Math.sin(t * 5) * 0.05;
  }

  bertyScreen(w: number, h: number) {
    if (!this.camera || !this.berty) return { x: w / 2, y: h * 0.55 };
    const v = this.berty.position.clone();
    v.project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h };
  }

  followAim(sx: number, sy: number, w: number, h: number): { x: number; y: number } {

    const cam = this.camera;
    if (!cam || w < 2 || h < 2) {
      return { x: clamp((sx / Math.max(1, w) - 0.5) * 2, -1, 1), y: clamp((sy / Math.max(1, h) - 0.42) * 2, -1, 1) };
    }
    this.ndc.set((sx / w) * 2 - 1, -(sy / h) * 2 + 1);
    if (!this.ray) this.ray = new THREE.Raycaster();
    this.ray.setFromCamera(this.ndc, cam);
    const origin = this.ray.ray.origin;
    const dir = this.ray.ray.direction;
    let hitx = this.pos.x;
    let hitz = this.pos.z;
    if (Math.abs(dir.y) > 1e-4) {
      const t = (0.15 - origin.y) / dir.y;
      if (t > 0) {
        hitx = origin.x + dir.x * t;
        hitz = origin.z + dir.z * t;
      }
    }
    const dx = hitx - this.pos.x;
    const dz = hitz - this.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.55) return { x: 0, y: 0 };
    let diff = Math.atan2(-dx, -dz) - this.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const steer = clamp(diff / 0.85, -1, 1);
    const throttle = clamp((dist - 0.55) / 3.2, 0, 1);
    return { x: -steer, y: -throttle };
  }

  private easeAxis(v: number) {
    const a = Math.abs(v);
    if (a < 0.12) return 0;
    return Math.sign(v) * ((a - 0.12) / 0.88) ** 1.65;
  }

  private syncBerty() {
    if (!this.berty || !this.ball) return;
    this.berty.position.copy(this.pos);
    this.berty.rotation.y = this.yaw;
    this.ball.rotation.x = this.roll;
    this.berty.visible = this.alive || this.fall < 0.55;
    const s = this.alive ? 1 : Math.max(0.2, 1 - this.fall * 1.4);
    this.berty.scale.setScalar(s);
    if (this.shade) {
      this.shade.position.set(this.pos.x, 0.035, this.pos.z);
      this.shade.visible = this.berty.visible;
      this.shade.scale.setScalar(s);
    }
  }

  private ensureSim() {
    if (this.scene) return;
    const scene = new THREE.Scene();
    this.scene = scene;
    this.berty = this.makeBerty();
    scene.add(this.berty);
    this.attached = true;
  }

  private hazardNear(x: number, z: number, dist: number) {
    const hit = (px: number, pz: number) => Math.hypot(x - px, z - pz) < dist;
    return this.saws.some((s) => hit(s.x, s.z)) || this.bugs.some((b) => hit(b.x, b.z)) || this.boosts.some((b) => hit((b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2)) || this.ices.some((b) => hit((b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2));
  }

  private funnel(
    addBox: (x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material, kind: Aabb["kind"]) => void,
    mat: THREE.Material,
    x: number,
    z: number,
    axis: "x" | "z",
    sign: number,
    wide: number,
  ) {
    const narrow = 1.15;
    const half = wide / 2;
    for (let i = 0; i < 4; i++) {
      const t = (i + 0.5) / 4;
      const inset = half - (half - narrow) * t;
      const along = sign * (0.55 + i * 0.7);
      if (axis === "z") {
        addBox(x + inset, 0.24, z + along, 0.28, 0.48, 0.7, mat, "wall");
        addBox(x - inset, 0.24, z + along, 0.28, 0.48, 0.7, mat, "wall");
      } else {
        addBox(x + along, 0.24, z + inset, 0.7, 0.48, 0.28, mat, "wall");
        addBox(x + along, 0.24, z - inset, 0.7, 0.48, 0.28, mat, "wall");
      }
    }
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

  private applyDye(id: CourseId) {
    const look = pcbLook(id);
    const mats = this.materials();
    const paint = (mat: THREE.Material, hex: number, glow = false) => {
      const m = mat as THREE.MeshPhongMaterial;
      m.color.setHex(hex);
      m.emissive.setHex(glow ? hex : 0x000000);
      if (glow) m.emissiveIntensity = 0.22;
    };
    paint(mats.floor, look.maskN);
    paint(mats.wall, look.chipN);
    paint(mats.stripe, look.copperN, true);
    paint(mats.gem, 0xf2f2f2, true);
    paint(mats.lamp, 0xfff1c4, true);
    if (this.scene) {
      const fog = this.scene.fog as THREE.Fog | null;
      fog?.color.setHex(look.inkN);
      if (this.scene.background instanceof THREE.Color) this.scene.background.setHex(look.inkN);
    }
  }

  private makeMats() {
    const phong = (color: number, extra: THREE.MeshPhongMaterialParameters = {}) =>
      new THREE.MeshPhongMaterial({ color, shininess: 46, specular: 0x9adfff, ...extra });
    return {
      floor: phong(0x0e4a22, { shininess: 18, specular: 0x8a7340 }),
      wall: phong(0x161616, { shininess: 22, specular: 0x444444 }),
      stripe: phong(0xd7a441, { emissive: 0xd7a441, emissiveIntensity: 0.2, shininess: 70, specular: 0xffe7a8 }),
      crate: phong(CRATE, { emissive: 0xe07a2f, emissiveIntensity: 0.28, shininess: 40 }),
      gem: phong(0xf5c542, { emissive: 0xf5c542, emissiveIntensity: 0.7, shininess: 90, specular: 0xfff6c8 }),
      ice: phong(0x9aefff, { transparent: true, opacity: 0.45, shininess: 100, specular: 0xffffff }),
      lamp: phong(0x3ee0ff, { emissive: 0x3ee0ff, emissiveIntensity: 0.9, shininess: 60 }),
      paper: phong(PAPER, { emissive: 0xc8f542, emissiveIntensity: 0.15, shininess: 36 }),
      hub: phong(NAVY2),
      body: phong(0x243e78, { emissive: 0x12244a, emissiveIntensity: 0.4, shininess: 54, specular: 0xc8e4ff }),
      void: new THREE.MeshLambertMaterial({ color: 0x050605 }),
      glow: new THREE.MeshBasicMaterial({
        color: ORANGE,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    };
  }

  private materials() {
    if (!this.mats) this.mats = this.makeMats();
    return this.mats;
  }

  private makeBerty() {
    const mats = this.materials();
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 20), mats.body);
    body.castShadow = true;
    this.ball = body;
    g.add(body);
    const band = new THREE.Mesh(new THREE.TorusGeometry(R * 0.72, 0.09, 8, 28), mats.crate);
    band.rotation.x = Math.PI / 2;
    g.add(band);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(R * 0.7, R * 0.22, 0.05), mats.paper);
    visor.position.set(0, 0.02, -R * 0.72);
    g.add(visor);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), mats.paper);
    eye.position.set(0, 0.06, -R + 0.02);
    g.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), mats.stripe);
    pupil.position.set(0, 0.06, -R - 0.02);
    g.add(pupil);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.22, 8), mats.stripe);
    ant.position.y = R + 0.06;
    g.add(ant);
    const nub = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), mats.lamp);
    nub.position.y = R + 0.18;
    g.add(nub);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(R + 0.16, 0.035, 8, 24), mats.lamp);
    glow.rotation.x = Math.PI / 2;
    glow.name = "glow";
    glow.visible = false;
    g.add(glow);
    const heart = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mats.lamp);
    heart.position.set(0.16, R * 0.2, -R * 0.4);
    heart.name = "heart";
    heart.visible = false;
    g.add(heart);
    const pull = new THREE.Mesh(new THREE.TorusGeometry(R + 0.28, 0.02, 6, 20), mats.stripe);
    pull.rotation.x = Math.PI / 2;
    pull.name = "pull";
    pull.visible = false;
    g.add(pull);
    const trail = new THREE.Mesh(new THREE.TorusGeometry(R + 0.4, 0.015, 6, 18), mats.lamp);
    trail.rotation.x = Math.PI / 2;
    trail.name = "trail";
    trail.visible = false;
    g.add(trail);
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.028, 6, 14), mats.crate);
    crown.position.y = R + 0.28;
    crown.name = "crown";
    crown.visible = false;
    g.add(crown);
    for (const side of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.22), mats.stripe);
      fin.position.set(side * (R + 0.02), 0, 0.12);
      fin.name = "boost";
      fin.visible = false;
      g.add(fin);
    }
    for (const side of [-1, 1]) {
      const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mats.stripe);
      bolt.position.set(side * (R - 0.02), -0.02, 0);
      g.add(bolt);
    }
    return g;
  }

  private plantChips(
    root: THREE.Group,
    def: { segs: { x1: number; z1: number; x2: number; z2: number }[] },
    id: CourseId,
  ) {
    const look = pcbLook(id);
    const body = new THREE.MeshPhongMaterial({ color: look.chipN, shininess: 16, specular: 0x222222 });
    const pin = new THREE.MeshPhongMaterial({ color: look.copperN, emissive: look.copperN, emissiveIntensity: 0.18 });
    const span = 5.4;
    for (const s of def.segs) {
      const dx = s.x2 - s.x1;
      const dz = s.z2 - s.z1;
      const len = Math.hypot(dx, dz) || 1;
      const alongX = Math.abs(dx) > Math.abs(dz);
      const steps = Math.max(1, Math.floor(len / 2.4));
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const x = s.x1 + dx * t;
        const z = s.z1 + dz * t;
        for (const side of [-1, 1]) {
          const ox = alongX ? 0 : side * (span / 2 + 0.2);
          const oz = alongX ? side * (span / 2 + 0.2) : 0;
          const chip = new THREE.Mesh(new THREE.BoxGeometry(alongX ? 0.95 : 0.32, 0.62, alongX ? 0.32 : 0.95), body);
          chip.position.set(x + ox, 0.78, z + oz);
          chip.castShadow = true;
          root.add(chip);
          const finger = new THREE.Mesh(new THREE.BoxGeometry(alongX ? 0.72 : 0.08, 0.07, alongX ? 0.08 : 0.72), pin);
          finger.position.set(x + ox, 0.48, z + oz);
          root.add(finger);
        }
      }
    }
  }

  private plantSign(root: THREE.Group, id: CourseId) {
    if (typeof document === "undefined") return;
    const look = pcbLook(id);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 0.9),
      new THREE.MeshBasicMaterial({ map: signTex(look.name, look.line), transparent: true, depthWrite: false }),
    );
    mesh.position.set(3.1, 1.45, -1.4);
    mesh.rotation.y = Math.PI;
    root.add(mesh);
  }

  private buildTrack(scene: THREE.Scene, id: CourseId) {
    this.applyDye(id);
    const def = trackById(id);
    this.previewLook = def.look;
    const root = new THREE.Group();
    scene.add(root);
    this.trackRoot = root;

    const mats = this.materials();
    const floorMat = mats.floor;
    const wallMat = mats.wall;
    const stripeMat = mats.stripe;
    const crateMat = mats.crate;
    const gemMat = mats.gem;
    const iceMat = mats.ice;

    const deck = (x: number, y: number, z: number, w: number, h: number, d: number) => {
      const mesh = new THREE.Mesh(this.unitBox, floorMat);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      mesh.receiveShadow = true;
      root.add(mesh);
      const alongX = w >= d;
      const bus = new THREE.Mesh(this.unitBox, stripeMat);
      bus.scale.set(alongX ? w * 0.86 : 0.22, 0.03, alongX ? 0.22 : d * 0.86);
      bus.position.set(x, y + h / 2 + 0.02, z);
      bus.receiveShadow = true;
      root.add(bus);
      this.boxes.push({
        min: new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2),
        max: new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2),
        kind: "floor",
      });
    };

    const addBox = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
      kind: Aabb["kind"],
    ) => {
      const mesh = new THREE.Mesh(this.unitBox, mat);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      mesh.castShadow = kind !== "floor";
      mesh.receiveShadow = true;
      root.add(mesh);
      this.boxes.push({
        min: new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2),
        max: new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2),
        kind,
      });
    };

    const cap = (x: number, z: number, w: number, d: number) => {
      const mesh = new THREE.Mesh(this.unitBox, stripeMat);
      mesh.scale.set(w, 0.06, d);
      mesh.position.set(x, railH + 0.03, z);
      root.add(mesh);
    };

    const W = 5.2 + this.ease * 1.8;
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
      const railLen = Math.max(1.2, len - (narrow ? W + 1.1 : ww * 0.9));
      if (alongX) {
        deck(cx, -H / 2, cz, len + ww * 0.12, H, ww);
        addBox(cx, railH / 2, cz + ww / 2, railLen, railH, railT, wallMat, "wall");
        addBox(cx, railH / 2, cz - ww / 2, railLen, railH, railT, wallMat, "wall");
        cap(cx, cz + ww / 2, railLen, railT);
        cap(cx, cz - ww / 2, railLen, railT);
      } else {
        deck(cx, -H / 2, cz, ww, H, len + ww * 0.12);
        addBox(cx + ww / 2, railH / 2, cz, railT, railH, railLen, wallMat, "wall");
        addBox(cx - ww / 2, railH / 2, cz, railT, railH, railLen, wallMat, "wall");
        cap(cx + ww / 2, cz, railT, railLen);
        cap(cx - ww / 2, cz, railT, railLen);
      }
    };

    for (const s of def.segs) segment(s.x1, s.z1, s.x2, s.z2, s.narrow);
    for (const c of def.corners) deck(c.x, -H / 2, c.z, W + 0.4, H, W + 0.4);
    if (id === "around-the-bend") this.funnel(addBox, wallMat, 16, -30, "z", -1, W);
    if (id === "dark-bay") this.funnel(addBox, wallMat, 22, -34, "x", -1, W);
    this.plantChips(root, def, id);
    this.plantSign(root, id);

    if (def.crate) {
      addBox(def.crate.x, 0.28, def.crate.z, 1.5, 0.28, 1.1, wallMat, "crate");
      addBox(def.crate.x, 0.44, def.crate.z, 1.2, 0.12, 0.85, crateMat, "crate");
      addBox(def.crate.x, 0.12, def.crate.z + 0.62, 1.5, 0.06, 0.12, stripeMat, "crate");
      addBox(def.crate.x, 0.12, def.crate.z - 0.62, 1.5, 0.06, 0.12, stripeMat, "crate");
    }

    for (const p of def.lamps ?? []) {
      addBox(p.x, 1.6, p.z, 0.38, 3.2, 0.38, mats.wall, "wall");
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mats.lamp);
      lamp.userData.own = true;
      lamp.position.set(p.x, 3.28, p.z);
      root.add(lamp);
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.16, 0.22, 8), mats.wall);
      shade.userData.own = true;
      shade.position.set(p.x, 3.08, p.z);
      root.add(shade);
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
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.045, 8, 24), mats.paper);
      ring.userData.own = true;
      ring.rotation.x = Math.PI / 2;
      ring.position.set(c.x, 0.08, c.z);
      root.add(ring);
    }

    this.saws = [];
    for (const s of def.saws ?? []) {
      const fan = new THREE.Group();
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.16, 12), mats.hub);
      hub.userData.own = true;
      fan.add(hub);
      for (let i = 0; i < 3; i++) {
        const blade = new THREE.Mesh(this.unitBox, mats.stripe);
        blade.scale.set(0.72, 0.05, 0.18);
        blade.position.x = 0.36;
        const g = new THREE.Group();
        g.rotation.y = (i * Math.PI * 2) / 3;
        g.add(blade);
        fan.add(g);
      }
      fan.position.set(s.x, 0.55, s.z);
      root.add(fan);
      this.saws.push({ mesh: fan, x: s.x, y: 0.55, z: s.z, r: 0.85 });
    }

    this.gate = { x: def.gate.x, y: 0, z: def.gate.z, w: 2.4, d: 1.2 };
    addBox(def.gate.x - 1.3, 1.1, def.gate.z, 0.28, 2.2, 0.28, mats.wall, "wall");
    addBox(def.gate.x + 1.3, 1.1, def.gate.z, 0.28, 2.2, 0.28, mats.wall, "wall");
    addBox(def.gate.x, 2.25, def.gate.z, 2.9, 0.22, 0.28, mats.stripe, "wall");
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.55), mats.glow);
    glow.userData.own = true;
    if (def.gate.face === "x") {
      glow.rotation.y = Math.PI / 2;
      glow.position.set(def.gate.x - 0.3, 1.1, def.gate.z);
    } else {
      glow.position.set(def.gate.x, 1.1, def.gate.z + 0.3);
    }
    root.add(glow);

    this.bugs = [];
    const bugGeo = {
      virus: new THREE.IcosahedronGeometry(0.38, 0),
      worm: new THREE.BoxGeometry(0.7, 0.22, 0.28),
      lock: new THREE.BoxGeometry(0.7, 0.55, 0.7),
    };
    const bugMat = {
      virus: new THREE.MeshBasicMaterial({ color: 0xff4fd8 }),
      worm: new THREE.MeshBasicMaterial({ color: 0xc8f542 }),
      lock: new THREE.MeshBasicMaterial({ color: 0xf5c542 }),
    };
    for (const bug of def.bugs ?? []) {
      const mesh = new THREE.Mesh(bugGeo[bug.kind], bugMat[bug.kind]);
      mesh.position.set(bug.x, bug.kind === "lock" ? 0.32 : 0.55, bug.z);
      mesh.userData.own = true;
      root.add(mesh);
      this.bugs.push({
        kind: bug.kind,
        x: bug.x,
        z: bug.z,
        base: bug.x,
        mesh,
        dead: false,
        phase: bug.x,
        r: bug.kind === "lock" ? 0.48 : 0.42,
      });
    }

    this.gemMeshes = [];
    this.gemTotal = def.gems.length;
    def.gems.forEach((p, i) => {
      const mesh = new THREE.Mesh(this.gemGeo, gemMat);
      mesh.position.set(p.x, 0.72, p.z);
      mesh.castShadow = true;
      root.add(mesh);
      const socket = new THREE.Mesh(this.socketGeo, mats.paper);
      socket.rotation.x = Math.PI / 2;
      socket.position.set(p.x, 0.08, p.z);
      root.add(socket);
      this.gemMeshes.push({ pos: new THREE.Vector3(p.x, 0.72, p.z), home: new THREE.Vector3(p.x, 0.72, p.z), mesh, got: false, t: i, pop: 0 });
    });
  }
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function bugLine(kind: "virus" | "worm" | "lock") {
  if (kind === "worm") return "Worm. It crawls to the next machine. Zap stops it.";
  if (kind === "lock") return "Ransomware. It locks the path. Jump it, or zap it.";
  return "Virus. It copies itself. Zap deletes that copy.";
}

function boardTex() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const g = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.repeat.set(8, 8);
  if (!g) return tex;
  g.fillStyle = "#0c3f1c";
  g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = "#c6a15a";
  g.lineWidth = 3;
  g.lineJoin = "miter";
  for (let i = 0; i < 28; i++) {
    const x = (i * 73) % 980;
    const y = (i * 41) % 980;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 120, y);
    g.lineTo(x + 120, y + 48);
    g.lineTo(x + 190, y + 48);
    g.stroke();
    g.fillStyle = "#e6c36a";
    g.beginPath();
    g.arc(x + 190, y + 48, 5, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#141414";
  for (let i = 0; i < 8; i++) {
    const x = 40 + (i % 4) * 250;
    const y = 80 + Math.floor(i / 4) * 480;
    g.fillRect(x, y, 110, 72);
    g.fillStyle = "#f2f2f2";
    g.fillRect(x + 8, y + 8, 22, 5);
    g.fillStyle = "#141414";
    g.strokeStyle = "#d7a441";
    g.lineWidth = 2;
    for (let p = 0; p < 8; p++) g.strokeRect(x - 6, y + 8 + p * 8, 6, 3);
  }
  return tex;
}

function signTex(title: string, line: string) {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 160;
  const g = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (!g) return tex;
  g.clearRect(0, 0, 640, 160);
  g.fillStyle = "rgba(8,10,12,0.72)";
  g.fillRect(0, 0, 640, 160);
  g.fillStyle = "#f4efe6";
  g.font = "700 52px sans-serif";
  g.fillText(title, 24, 68);
  g.fillStyle = "#e7c56a";
  g.font = "500 26px sans-serif";
  g.fillText(line, 24, 118);
  return tex;
}

