import { Bend3D } from "./bend3d";
import { COURSES, TILE, courseById, starsFor } from "./courses";
import { earnOnClear, lessonById, partById, type LessonId, type PartId } from "./curriculum";
import {
  isMuted,
  setMuted,
  sfxBoost,
  sfxBump,
  sfxCheck,
  sfxGate,
  sfxGem,
  sfxHurt,
  sfxWin,
  unlockAudio,
} from "./audio";
import { makePack, parsePack, type BertyPack } from "./techworks";
import type { Course, CourseId, HudSnap } from "./types";

const STEP = 1 / 60;
const GRAVITY = 920;
const FRICTION = 1.55;
const REST = 0.16;
const SPEED_CAP = 460;
const HEARTS = 3;
const SAVE_KEY = "bertys-run-v1";
const REDUCED =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; s: number };
type Pop = { x: number; y: number; life: number; max: number; label: string };
type Body = {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  r: number;
  angle: number;
  squash: number;
  alive: boolean;
  fall: number;
  spawnX: number;
  spawnY: number;
};
type Gem = { x: number; y: number; got: boolean; t: number };
type Crate = { x: number; y: number; r: number };
type Pit = { x: number; y: number; w: number; h: number };
type Wall = { x: number; y: number; w: number; h: number };
type Boost = { x: number; y: number; w: number; h: number };
type Check = { x: number; y: number; w: number; h: number };
type Ice = { x: number; y: number; w: number; h: number };
type Belt = { x: number; y: number; w: number; h: number; dx: number; dy: number };
type GhostPt = { x: number; y: number; a: number };
type Saw = { x: number; y: number; ox: number; oy: number; tx: number; ty: number; period: number; t: number; r: number };
type Save = {
  best: Record<string, number>;
  mute: boolean;
  ghostOn: boolean;
  ghosts: Record<string, GhostPt[]>;
  watts: number;
  parts: string[];
  passed: string[];
  booted: boolean;
  inducted: boolean;
};

type Sprites = {
  berty: HTMLImageElement[];
  bertyP2: HTMLImageElement[];
  gem: HTMLImageElement[];
  saw: HTMLImageElement[];
  gate: HTMLImageElement;
  crate: HTMLImageElement;
  floor: HTMLImageElement;
};

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(src));
    im.src = src;
  });
}

async function loadSprites(): Promise<Sprites> {
  const frame = (base: string, n: number) =>
    Promise.all(Array.from({ length: n }, (_, i) => loadImg(assetUrl(`sprites/${base}-${i + 1}.png`))));
  const [berty, bertyP2, gem, saw, gate, crate, floor] = await Promise.all([
    frame("berty", 4),
    frame("berty-p2", 4),
    frame("gem", 4),
    frame("saw", 4),
    loadImg(assetUrl("sprites/gate.png")),
    loadImg(assetUrl("sprites/crate.png")),
    loadImg(assetUrl("sprites/floor.png")),
  ]);
  return { berty, bertyP2, gem, saw, gate, crate, floor };
}

function assetUrl(path: string) {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}${path.replace(/^\//, "")}`;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function readSave(): Save {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return emptySave();
    const p = JSON.parse(raw) as Partial<Save>;
    return {
      best: p.best ?? {},
      mute: !!p.mute,
      ghostOn: p.ghostOn !== false,
      ghosts: p.ghosts ?? {},
      watts: p.watts ?? 0,
      parts: p.parts ?? [],
      passed: p.passed ?? [],
      booted: !!p.booted,
      inducted: !!p.inducted,
    };
  } catch {
    return emptySave();
  }
}

function emptySave(): Save {
  return { best: {}, mute: false, ghostOn: true, ghosts: {}, watts: 0, parts: [], passed: [], booted: false, inducted: false };
}

function writeSave(s: Save) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(s));
}

export class Engine {
  canvas: HTMLCanvasElement;
  canvas3d: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  onHud: (h: HudSnap) => void;
  sprites: Sprites | null = null;
  phase: HudSnap["phase"] = "boot";
  course: Course = COURSES[0];
  crew = false;
  mute = false;
  save: Save;
  keys = new Set<string>();
  injectKeys: string[] | null = null;
  injectSteer: number | null = null;
  pointers = new Map<number, { x: number; y: number; origin: "p1" | "p2" | "tilt" }>();
  tilt = { x: 0, y: 0 };
  p1!: Body;
  p2!: Body | null;
  walls: Wall[] = [];
  pits: Pit[] = [];
  gems: Gem[] = [];
  crates: Crate[] = [];
  saws: Saw[] = [];
  boosts: Boost[] = [];
  checks: Check[] = [];
  ice: Ice[] = [];
  belts: Belt[] = [];
  ghostLive: GhostPt[] = [];
  ghostPlay: GhostPt[] = [];
  ghostAcc = 0;
  exit = { x: 0, y: 0, w: 0, h: 0 };
  start1 = { x: 0, y: 0 };
  start2 = { x: 0, y: 0 };
  worldW = 0;
  worldH = 0;
  cam = { x: 0, y: 0, z: 1, trauma: 0 };
  acc = 0;
  last = 0;
  time = 0;
  hearts = HEARTS;
  particles: Particle[] = [];
  pops: Pop[] = [];
  hitstop = 0;
  zoomPunch = 0;
  lastEarn = 0;
  floorPat: CanvasPattern | null = null;
  raf = 0;
  gemPulse = 0;
  destroyed = false;
  reduced = REDUCED;
  bend: Bend3D | null = null;

  constructor(canvas: HTMLCanvasElement, canvas3d: HTMLCanvasElement, onHud: (h: HudSnap) => void) {
    this.canvas = canvas;
    this.canvas3d = canvas3d;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2D context");
    this.ctx = ctx;
    this.onHud = onHud;
    this.save = readSave();
    this.mute = this.save.mute;
    setMuted(this.mute);
    this.bind();
  }

  is3d() {
    return this.course.mode === "3d";
  }

  async boot() {
    this.sprites = await loadSprites();
    this.floorPat = this.ctx.createPattern(this.sprites.floor, "repeat");
    this.phase = "title";
    this.loadCourse(this.course.id, false, true);
    this.emit();
    this.last = performance.now();
    const loop = (now: number) => {
      if (this.destroyed) return;
      let dt = (now - this.last) / 1000;
      this.last = now;
      dt = Math.min(dt, 0.1);
      this.acc += dt;
      while (this.acc >= STEP) {
        this.step(STEP);
        this.acc -= STEP;
      }
      this.draw(this.acc / STEP);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    this.wireControlsTest();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.bend?.dispose();
    this.bend = null;
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onVis);
  }

  private bind() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onVis);
    const el = this.canvas;
    el.addEventListener("pointerdown", this.onPtrDown);
    el.addEventListener("pointermove", this.onPtrMove);
    el.addEventListener("pointerup", this.onPtrUp);
    el.addEventListener("pointercancel", this.onPtrUp);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    this.keys.add(e.code);
    if (e.code === "KeyP" || e.code === "Escape") this.togglePause();
    if (e.code === "KeyG") this.toggleGhost();
    if (e.code === "KeyR" && (this.phase === "play" || this.phase === "fail" || this.phase === "win")) {
      this.retry();
    }
    if ((e.code === "Space" || e.code === "Enter") && this.phase === "title") this.startPlay();
    if ((e.code === "Space" || e.code === "Enter") && (this.phase === "win" || this.phase === "fail")) this.retry();
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };
  private onBlur = () => {
    this.keys.clear();
    this.pointers.clear();
  };
  private onVis = () => {
    if (document.hidden) this.keys.clear();
    if (!document.hidden) unlockAudio();
  };

  private padRect(which: "p1" | "p2") {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const size = 112;
    const y = h - size - 18;
    if (which === "p1") return { x: 16, y, w: size, h: size };
    return { x: w - size - 16, y, w: size, h: size };
  }

  private onPtrDown = (e: PointerEvent) => {
    unlockAudio();
    this.canvas.setPointerCapture(e.pointerId);
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let origin: "p1" | "p2" | "tilt" = "tilt";
    const p1 = this.padRect("p1");
    const p2 = this.padRect("p2");
    if (x >= p1.x && x <= p1.x + p1.w && y >= p1.y && y <= p1.y + p1.h) origin = "p1";
    else if (x >= p2.x && x <= p2.x + p2.w && y >= p2.y && y <= p2.y + p2.h) origin = "p2";
    this.pointers.set(e.pointerId, { x, y, origin });
    if (this.phase === "title") this.startPlay();
  };
  private onPtrMove = (e: PointerEvent) => {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    const rect = this.canvas.getBoundingClientRect();
    p.x = e.clientX - rect.left;
    p.y = e.clientY - rect.top;
  };
  private onPtrUp = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId);
  };

  startPlay() {
    unlockAudio();
    if (this.phase === "title" || this.phase === "win" || this.phase === "fail" || this.phase === "pause") {
      if (this.phase !== "pause") this.resetRun();
      this.phase = "play";
      this.bend?.setTitle(false);
      this.emit();
    }
  }

  retry() {
    this.resetRun();
    this.phase = "play";
    this.bend?.setTitle(false);
    this.emit();
  }

  selectCourse(id: CourseId) {
    this.loadCourse(id, this.crew, true);
    this.phase = "title";
    this.bend?.setTitle(true);
    this.emit();
  }

  setCrew(on: boolean) {
    this.crew = on;
    this.loadCourse(this.course.id, on, true);
    this.emit();
  }

  togglePause() {
    if (this.phase === "play") this.phase = "pause";
    else if (this.phase === "pause") this.phase = "play";
    this.emit();
  }

  toggleGhost() {
    this.save.ghostOn = !this.save.ghostOn;
    writeSave(this.save);
    this.emit();
  }

  toggleMute() {
    this.mute = !this.mute;
    setMuted(this.mute);
    this.save.mute = this.mute;
    writeSave(this.save);
    this.emit();
  }

  private loadCourse(id: CourseId, crew: boolean, keepPhase = false) {
    this.course = courseById(id);
    this.crew = this.course.mode === "3d" ? false : crew;
    const rows = this.course.rows;
    const cols = rows[0].length;
    this.worldW = cols * TILE;
    this.worldH = rows.length * TILE;
    this.walls = [];
    this.pits = [];
    this.gems = [];
    this.crates = [];
    this.saws = [];
    this.boosts = [];
    this.checks = [];
    this.ice = [];
    this.belts = [];
    this.start1 = { x: TILE * 1.5, y: TILE * 1.5 };
    this.start2 = { x: TILE * 1.5, y: TILE * 2.5 };
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        const ch = rows[r][c];
        const x = c * TILE;
        const y = r * TILE;
        if (ch === "#") this.walls.push({ x, y, w: TILE, h: TILE });
        else if (ch === "X") this.pits.push({ x, y, w: TILE, h: TILE });
        else if (ch === "o") this.gems.push({ x: x + TILE / 2, y: y + TILE / 2, got: false, t: Math.random() * 4 });
        else if (ch === "C") this.crates.push({ x: x + TILE / 2, y: y + TILE / 2, r: TILE * 0.38 });
        else if (ch === "B") this.boosts.push({ x, y, w: TILE, h: TILE });
        else if (ch === "P") this.checks.push({ x, y, w: TILE, h: TILE });
        else if (ch === "I") this.ice.push({ x, y, w: TILE, h: TILE });
        else if (ch === ">") this.belts.push({ x, y, w: TILE, h: TILE, dx: 1, dy: 0 });
        else if (ch === "<") this.belts.push({ x, y, w: TILE, h: TILE, dx: -1, dy: 0 });
        else if (ch === "S") this.start1 = { x: x + TILE / 2, y: y + TILE / 2 };
        else if (ch === "T") this.start2 = { x: x + TILE / 2, y: y + TILE / 2 };
        else if (ch === "E") this.exit = { x: x - 8, y: y - 20, w: TILE + 16, h: TILE + 28 };
      }
    }
    for (const s of this.course.saws ?? []) {
      const ox = s.x * TILE;
      const oy = s.y * TILE;
      this.saws.push({
        x: ox,
        y: oy,
        ox,
        oy,
        tx: (s.x2 ?? s.x) * TILE,
        ty: (s.y2 ?? s.y) * TILE,
        period: s.period ?? 2.6,
        t: 0,
        r: TILE * 0.36,
      });
    }
    this.resetRun();
    this.sync3d();
    if (!keepPhase) this.phase = "title";
  }

  private sync3d() {
    if (this.is3d()) {
      if (!this.bend) this.bend = new Bend3D(this.canvas3d, this.reduced);
      this.bend.load(this.course.id);
      this.canvas.style.background = "transparent";
    } else {
      this.bend?.sleep();
    }
  }

  private resetRun() {
    this.time = 0;
    this.hearts = HEARTS;
    this.gemPulse = 0;
    this.particles = [];
    this.pops = [];
    this.hitstop = 0;
    this.zoomPunch = 0;
    this.cam.trauma = 0;
    this.tilt = { x: 0, y: 0 };
    this.p1 = this.makeBody(this.start1.x, this.start1.y);
    this.p2 = this.crew && !this.is3d() ? this.makeBody(this.start2.x, this.start2.y) : null;
    for (const g of this.gems) g.got = false;
    this.cam.x = this.p1.x;
    this.cam.y = this.p1.y;
    this.ghostLive = [];
    this.ghostAcc = 0;
    this.ghostPlay = this.save.ghosts[this.course.id] ?? [];
    this.bend?.reset();
  }

  private makeBody(x: number, y: number): Body {
    return { x, y, px: x, py: y, vx: 0, vy: 0, r: 16, angle: 0, squash: 1, alive: true, fall: 0, spawnX: x, spawnY: y };
  }

  private held() {
    const src = this.injectKeys;
    const has = (c: string) => (src ? src.includes(c) : this.keys.has(c));
    let x = 0;
    let y = 0;
    if (has("KeyA") || (!this.crew && has("ArrowLeft"))) x -= 1;
    if (has("KeyD") || (!this.crew && has("ArrowRight"))) x += 1;
    if (has("KeyW") || (!this.crew && has("ArrowUp"))) y -= 1;
    if (has("KeyS") || (!this.crew && has("ArrowDown"))) y += 1;
    if (this.injectSteer != null) x -= this.injectSteer;
    for (const p of this.pointers.values()) {
      const pad = p.origin === "p2" ? this.padRect("p2") : this.padRect("p1");
      const cx = pad.x + pad.w / 2;
      const cy = pad.y + pad.h / 2;
      const dx = (p.x - cx) / (pad.w * 0.42);
      const dy = (p.y - cy) / (pad.h * 0.42);
      if (p.origin === "p2" && this.crew) {
        /* applied in readP2 */
      } else {
        x += clamp(dx, -1, 1);
        y += clamp(dy, -1, 1);
      }
    }
    const m = Math.hypot(x, y);
    if (m > 1) {
      x /= m;
      y /= m;
    }
    return { x, y };
  }

  private readP2() {
    if (!this.crew) return { x: 0, y: 0 };
    const src = this.injectKeys;
    const has = (c: string) => (src ? src.includes(c) : this.keys.has(c));
    let x = 0;
    let y = 0;
    if (has("ArrowLeft")) x -= 1;
    if (has("ArrowRight")) x += 1;
    if (has("ArrowUp")) y -= 1;
    if (has("ArrowDown")) y += 1;
    for (const p of this.pointers.values()) {
      if (p.origin !== "p2") continue;
      const pad = this.padRect("p2");
      const dx = (p.x - (pad.x + pad.w / 2)) / (pad.w * 0.42);
      const dy = (p.y - (pad.y + pad.h / 2)) / (pad.h * 0.42);
      x += clamp(dx, -1, 1);
      y += clamp(dy, -1, 1);
    }
    const m = Math.hypot(x, y);
    if (m > 1) {
      x /= m;
      y /= m;
    }
    return { x, y };
  }

  private step(dt: number) {
    if (this.is3d()) {
      const playing = this.phase === "play";
      if (this.hitstop > 0) {
        this.hitstop -= dt;
        return;
      }
      if (playing) this.time += dt;
      const ev = this.bend?.step(dt, this.held(), playing);
      if (ev?.gem) {
        sfxGem();
        this.hitstop = 0.045;
        if (this.bend) this.bend.punch = 0.32;
      }
      if (ev?.bump) sfxBump();
      if (ev?.boost) sfxBoost();
      if (ev?.check) sfxCheck();
      if (ev?.hurt) {
        sfxHurt();
        this.hearts -= 1;
        this.hitstop = 0.07;
        if (this.hearts <= 0) {
          this.phase = "fail";
          this.emit();
        }
      }
      if (ev?.win && this.phase === "play") {
        this.phase = "win";
        sfxWin();
        sfxGate();
        this.awardClear();
        this.emit();
      }
      if (playing && Math.floor(this.time * 10) !== Math.floor((this.time - dt) * 10)) this.emit();
      return;
    }
    if (this.phase !== "play") return;
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      this.gemPulse += dt;
      this.zoomPunch = Math.max(0, this.zoomPunch - dt * 3.2);
      return;
    }
    this.time += dt;
    this.gemPulse += dt;
    const input = this.held();
    const k = 7;
    this.tilt.x += (input.x - this.tilt.x) * (1 - Math.exp(-k * dt));
    this.tilt.y += (input.y - this.tilt.y) * (1 - Math.exp(-k * dt));
    this.integrate(this.p1, this.tilt, dt);
    if (this.p2) this.integrate(this.p2, this.readP2(), dt);
    for (const s of this.saws) {
      s.t += dt;
      if (s.period > 0 && (s.tx !== s.ox || s.ty !== s.oy)) {
        const u = (Math.sin((s.t / s.period) * Math.PI * 2) + 1) / 2;
        s.x = s.ox + (s.tx - s.ox) * u;
        s.y = s.oy + (s.ty - s.oy) * u;
      }
    }
    this.pickups(this.p1);
    if (this.p2) this.pickups(this.p2);
    this.hazards(this.p1);
    if (this.p2) this.hazards(this.p2);
    this.checkWin();
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.pops) p.life -= dt;
    this.pops = this.pops.filter((p) => p.life > 0);
    this.cam.trauma = Math.max(0, this.cam.trauma - dt * 2.4);
    this.zoomPunch = Math.max(0, this.zoomPunch - dt * 3.2);
    this.followCam(dt);
    this.recordGhost(dt);
    if (Math.floor(this.time * 10) !== Math.floor((this.time - dt) * 10)) this.emit();
  }

  private integrate(b: Body, g: { x: number; y: number }, dt: number) {
    if (!b.alive) {
      b.fall += dt;
      b.squash = Math.max(0.2, 1 - b.fall * 2);
      if (b.fall > 0.55) this.respawn(b);
      return;
    }
    b.px = b.x;
    b.py = b.y;
    const slick = this.onPad(b, this.ice);
    const grav = slick ? GRAVITY * 0.45 : GRAVITY;
    const fric = slick ? 0.38 : FRICTION;
    b.vx += g.x * grav * dt;
    b.vy += g.y * grav * dt;
    const damp = Math.exp(-fric * dt);
    b.vx *= damp;
    b.vy *= damp;
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > SPEED_CAP) {
      b.vx *= SPEED_CAP / sp;
      b.vy *= SPEED_CAP / sp;
    }
    const sub = 3;
    const sdt = dt / sub;
    for (let i = 0; i < sub; i++) {
      b.x += b.vx * sdt;
      this.collide(b, true);
      b.y += b.vy * sdt;
      this.collide(b, false);
      this.boostBody(b, sdt);
      this.beltBody(b, sdt);
    }
    b.angle += (Math.hypot(b.vx, b.vy) / b.r) * dt;
    const speed = Math.hypot(b.vx, b.vy);
    b.squash += ((1 + Math.min(0.18, speed / 1400)) - b.squash) * (1 - Math.exp(-12 * dt));
    if (speed > 130 && this.particles.length < 90) {
      this.particles.push({
        x: b.x - (b.vx / speed) * 10,
        y: b.y - (b.vy / speed) * 10,
        vx: -b.vx * 0.08,
        vy: -b.vy * 0.08,
        life: 0.18,
        max: 0.18,
        c: "#9db0c4",
        s: 1.6 + Math.random() * 1.4,
      });
    }
  }

  private boostBody(b: Body, dt: number) {
    for (const pad of this.boosts) {
      if (b.x < pad.x || b.x > pad.x + pad.w || b.y < pad.y || b.y > pad.y + pad.h) continue;
      let dx = b.vx;
      let dy = b.vy;
      const sp = Math.hypot(dx, dy);
      if (sp < 30) {
        dx = this.tilt.x;
        dy = this.tilt.y;
      }
      const m = Math.hypot(dx, dy) || 1;
      b.vx += (dx / m) * 780 * dt;
      b.vy += (dy / m) * 780 * dt;
      if (Math.random() < 0.08) this.burst(b.x, b.y, "#e87722", 3);
    }
  }

  private beltBody(b: Body, dt: number) {
    for (const belt of this.belts) {
      if (b.x < belt.x || b.x > belt.x + belt.w || b.y < belt.y || b.y > belt.y + belt.h) continue;
      b.vx += belt.dx * 340 * dt;
      b.vy += belt.dy * 340 * dt;
    }
  }

  private onPad(b: Body, pads: { x: number; y: number; w: number; h: number }[]) {
    for (const p of pads) {
      if (b.x > p.x && b.x < p.x + p.w && b.y > p.y && b.y < p.y + p.h) return true;
    }
    return false;
  }

  private recordGhost(dt: number) {
    if (this.phase !== "play") return;
    this.ghostAcc += dt;
    if (this.ghostAcc < 0.1) return;
    this.ghostAcc = 0;
    if (this.ghostLive.length > 900) return;
    this.ghostLive.push({ x: this.p1.x, y: this.p1.y, a: this.p1.angle });
  }

  private collide(b: Body, axisX: boolean) {
    for (const w of this.walls) this.hitAabb(b, w, axisX);
    for (const c of this.crates) this.hitCircle(b, c.x, c.y, c.r, 0.28);
    for (const pit of this.pits) {
      if (b.x > pit.x + 8 && b.x < pit.x + pit.w - 8 && b.y > pit.y + 8 && b.y < pit.y + pit.h - 8) {
        this.kill(b);
      }
    }
  }

  private hitAabb(b: Body, w: Wall, axisX: boolean) {
    const nx = clamp(b.x, w.x, w.x + w.w);
    const ny = clamp(b.y, w.y, w.y + w.h);
    let dx = b.x - nx;
    let dy = b.y - ny;
    const d2 = dx * dx + dy * dy;
    if (d2 > b.r * b.r) return;
    let px: number;
    let py: number;
    let pen: number;
    if (d2 < 1e-6) {
      const left = b.x - w.x;
      const right = w.x + w.w - b.x;
      const top = b.y - w.y;
      const bot = w.y + w.h - b.y;
      const m = Math.min(left, right, top, bot);
      if (m === left) {
        px = -1;
        py = 0;
        pen = b.r + left;
      } else if (m === right) {
        px = 1;
        py = 0;
        pen = b.r + right;
      } else if (m === top) {
        px = 0;
        py = -1;
        pen = b.r + top;
      } else {
        px = 0;
        py = 1;
        pen = b.r + bot;
      }
    } else {
      const d = Math.sqrt(d2);
      px = dx / d;
      py = dy / d;
      pen = b.r - d;
    }
    if (axisX && Math.abs(px) < 0.3) return;
    if (!axisX && Math.abs(py) < 0.3) return;
    b.x += px * pen;
    b.y += py * pen;
    const vn = b.vx * px + b.vy * py;
    if (vn < 0) {
      b.vx -= (1 + REST) * vn * px;
      b.vy -= (1 + REST) * vn * py;
      if (Math.abs(vn) > 90) {
        sfxBump();
        this.shake(0.18);
        this.burst(b.x, b.y, "#9db0c4", 6);
        b.squash = 0.78;
      }
    }
  }

  private hitCircle(b: Body, x: number, y: number, r: number, rest: number) {
    const dx = b.x - x;
    const dy = b.y - y;
    const d = Math.hypot(dx, dy) || 0.001;
    const min = b.r + r;
    if (d >= min) return;
    const px = dx / d;
    const py = dy / d;
    const pen = min - d;
    b.x += px * pen;
    b.y += py * pen;
    const vn = b.vx * px + b.vy * py;
    if (vn < 0) {
      b.vx -= (1 + rest) * vn * px;
      b.vy -= (1 + rest) * vn * py;
    }
  }

  private pickups(b: Body) {
    if (!b.alive) return;
    for (const g of this.gems) {
      if (g.got) continue;
      if (Math.hypot(b.x - g.x, b.y - g.y) < b.r + 14) {
        g.got = true;
        sfxGem();
        this.burst(g.x, g.y, "#e87722", 14);
        this.pops.push({ x: g.x, y: g.y, life: 0.55, max: 0.55, label: "+1" });
        this.hitstop = 0.05;
        this.zoomPunch = 0.08;
        this.shake(0.12);
      }
    }
    for (const c of this.checks) {
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      if (Math.hypot(b.x - cx, b.y - cy) < b.r + 16) {
        if (Math.hypot(b.spawnX - cx, b.spawnY - cy) > 8) {
          sfxCheck();
          this.burst(cx, cy, "#f4efe6", 8);
        }
        b.spawnX = cx;
        b.spawnY = cy;
      }
    }
  }

  private hazards(b: Body) {
    if (!b.alive) return;
    for (const s of this.saws) {
      if (Math.hypot(b.x - s.x, b.y - s.y) < b.r + s.r - 4) this.kill(b);
    }
  }

  private kill(b: Body) {
    if (!b.alive) return;
    b.alive = false;
    b.fall = 0;
    sfxHurt();
    this.shake(0.55);
    this.hitstop = 0.07;
    this.burst(b.x, b.y, "#e87722", 16);
    this.hearts -= 1;
    if (this.hearts <= 0) {
      this.phase = "fail";
      this.emit();
    }
  }

  private respawn(b: Body) {
    b.x = b.spawnX;
    b.y = b.spawnY;
    b.vx = 0;
    b.vy = 0;
    b.alive = true;
    b.fall = 0;
    b.squash = 1;
  }

  private checkWin() {
    const got = this.gems.filter((g) => g.got).length;
    const need = this.gems.length;
    if (got < need) return;
    const inGate = (b: Body) =>
      b.alive &&
      b.x > this.exit.x &&
      b.x < this.exit.x + this.exit.w &&
      b.y > this.exit.y &&
      b.y < this.exit.y + this.exit.h;
    const p1ok = inGate(this.p1);
    const p2ok = this.p2 ? inGate(this.p2) : true;
    if (p1ok && p2ok) {
      this.phase = "win";
      sfxWin();
      sfxGate();
      this.burst(this.p1.x, this.p1.y, "#e87722", 28);
      this.burst(this.exit.x + this.exit.w / 2, this.exit.y + this.exit.h / 2, "#f4efe6", 18);
      this.awardClear();
      this.emit();
    }
  }

  private followCam(dt: number) {
    const bodies = [this.p1, this.p2].filter((b): b is Body => !!b);
    let tx = 0;
    let ty = 0;
    for (const b of bodies) {
      tx += b.x;
      ty += b.y;
    }
    tx /= bodies.length;
    ty /= bodies.length;
    tx += this.p1.vx * 0.16;
    ty += this.p1.vy * 0.16;
    const k = 5.5;
    this.cam.x += (tx - this.cam.x) * (1 - Math.exp(-k * dt));
    this.cam.y += (ty - this.cam.y) * (1 - Math.exp(-k * dt));
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    const z = this.camZoom(w, h);
    const visW = w / z;
    const visH = h / z;
    if (visW < this.worldW) this.cam.x = clamp(this.cam.x, visW / 2, this.worldW - visW / 2);
    else this.cam.x = this.worldW / 2;
    if (visH < this.worldH) this.cam.y = clamp(this.cam.y, visH / 2, this.worldH - visH / 2);
    else this.cam.y = this.worldH / 2;
  }

  private camZoom(w: number, h: number) {
    const zFit = Math.min(w / (this.worldW + 36), h / (this.worldH + 36));
    const zLocal = w / (12.2 * TILE);
    return Math.max(zFit, zLocal) * (1 + this.zoomPunch);
  }

  private shake(amt: number) {
    if (this.reduced) return;
    this.cam.trauma = Math.min(1, this.cam.trauma + amt);
  }

  private burst(x: number, y: number, c: string, n: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.35 + Math.random() * 0.3,
        max: 0.6,
        c,
        s: 2 + Math.random() * 3,
      });
    }
  }

  private size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (this.canvas.width !== Math.floor(w * dpr) || this.canvas.height !== Math.floor(h * dpr)) {
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }

  private draw(alpha: number) {
    const { w, h } = this.size();
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);
    if (this.is3d()) {
      this.bend?.render(this.phase === "play");
      this.drawPads(w, h);
      return;
    }
    const shake = this.cam.trauma * this.cam.trauma;
    const ox = this.reduced ? 0 : (Math.random() * 2 - 1) * 10 * shake;
    const oy = this.reduced ? 0 : (Math.random() * 2 - 1) * 10 * shake;
    const viewZ = this.camZoom(w, h);
    ctx.save();
    ctx.translate(w / 2 + ox, h / 2 + oy);
    ctx.scale(viewZ, viewZ);
    ctx.translate(-this.cam.x, -this.cam.y);

    ctx.fillStyle = "#071526";
    ctx.fillRect(-200, -200, this.worldW + 400, this.worldH + 400);
    if (this.floorPat) {
      ctx.save();
      ctx.fillStyle = this.floorPat;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(0, 0, this.worldW, this.worldH);
      ctx.restore();
    } else {
      ctx.fillStyle = "#16304c";
      ctx.fillRect(0, 0, this.worldW, this.worldH);
    }

    for (const slick of this.ice) {
      ctx.fillStyle = "rgba(157,176,196,0.28)";
      ctx.fillRect(slick.x + 2, slick.y + 2, slick.w - 4, slick.h - 4);
      ctx.strokeStyle = "rgba(244,239,230,0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(slick.x + 8, slick.y + 8, slick.w - 16, slick.h - 16);
    }

    for (const belt of this.belts) {
      ctx.fillStyle = "rgba(232,119,34,0.18)";
      ctx.fillRect(belt.x + 3, belt.y + 3, belt.w - 6, belt.h - 6);
      ctx.fillStyle = "#e87722";
      const cx = belt.x + belt.w / 2 + Math.sin(this.time * 6) * 6 * belt.dx;
      const cy = belt.y + belt.h / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 6);
      ctx.lineTo(cx + 10, cy);
      ctx.lineTo(cx - 10, cy + 6);
      ctx.closePath();
      ctx.fill();
    }

    for (const pad of this.boosts) {
      ctx.fillStyle = "rgba(232,119,34,0.22)";
      ctx.fillRect(pad.x + 4, pad.y + 4, pad.w - 8, pad.h - 8);
      ctx.strokeStyle = "#e87722";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const cx = pad.x + pad.w / 2;
      const cy = pad.y + pad.h / 2;
      ctx.moveTo(cx - 8, cy + 6);
      ctx.lineTo(cx, cy - 8);
      ctx.lineTo(cx + 8, cy + 6);
      ctx.stroke();
    }

    for (const c of this.checks) {
      ctx.strokeStyle = "rgba(244,239,230,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const pit of this.pits) {
      ctx.fillStyle = "#040910";
      ctx.fillRect(pit.x + 2, pit.y + 2, pit.w - 4, pit.h - 4);
      ctx.fillStyle = "#c45c26";
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          ctx.fillRect(pit.x + 12 + i * 10, pit.y + 12 + j * 10, 3, 3);
        }
      }
    }

    for (const wall of this.walls) {
      ctx.fillStyle = "#0b1f3a";
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = "#e87722";
      ctx.fillRect(wall.x, wall.y, wall.w, 4);
      ctx.fillStyle = "rgba(22,48,76,0.9)";
      ctx.fillRect(wall.x + 4, wall.y + 6, wall.w - 8, wall.h - 10);
      ctx.fillStyle = "#c45c26";
      for (let i = 6; i < wall.w - 4; i += 8) {
        ctx.fillRect(wall.x + i, wall.y + wall.h - 7, 4, 5);
      }
    }

    const spr = this.sprites;
    if (spr) {
      ctx.drawImage(spr.gate, this.exit.x, this.exit.y, this.exit.w, this.exit.h);
      for (const c of this.crates) {
        const s = c.r * 2.2;
        ctx.drawImage(spr.crate, c.x - s / 2, c.y - s / 2, s, s);
      }
      const gi = Math.floor(this.gemPulse * 6) % 4;
      for (const g of this.gems) {
        if (g.got) continue;
        const bob = Math.sin((this.time + g.t) * 4) * 3;
        ctx.drawImage(spr.gem[gi], g.x - 14, g.y - 14 + bob, 28, 28);
      }
      for (const s of this.saws) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(this.time * 8);
        ctx.fillStyle = "#16304c";
        ctx.beginPath();
        ctx.arc(0, 0, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e87722";
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.ellipse(s.r * 0.42, 0, s.r * 0.42, s.r * 0.16, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#0b1f3a";
        ctx.beginPath();
        ctx.arc(0, 0, s.r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      this.drawBody(this.p1, spr.berty, alpha);
      if (this.p2) this.drawBody(this.p2, spr.bertyP2, alpha);
      this.drawGhost(spr.berty);
      this.drawGemHint();
    }

    for (const p of this.particles) {
      ctx.globalAlpha = p.life / p.max;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (const p of this.pops) {
      const u = 1 - p.life / p.max;
      ctx.globalAlpha = 1 - u;
      ctx.fillStyle = "#e87722";
      ctx.font = "700 14px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.label, p.x, p.y - u * 28);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
    this.drawPads(w, h);
  }

  private drawBody(b: Body, frames: HTMLImageElement[], alpha: number) {
    const x = b.px + (b.x - b.px) * alpha;
    const y = b.py + (b.y - b.py) * alpha;
    const fi = Math.floor(this.time * 8) % 4;
    const s = b.r * 2.35;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(b.angle);
    ctx.scale(b.squash, 2 - b.squash);
    ctx.globalAlpha = b.alive ? 1 : Math.max(0, 1 - b.fall * 1.6);
    ctx.drawImage(frames[fi], -s / 2, -s / 2, s, s);
    ctx.restore();
  }

  private drawGhost(frames: HTMLImageElement[]) {
    if (!this.save.ghostOn || this.ghostPlay.length < 2) return;
    const i = Math.min(this.ghostPlay.length - 1, Math.floor(this.time / 0.1));
    const g = this.ghostPlay[i];
    const ctx = this.ctx;
    const s = 16 * 2.35;
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.a);
    ctx.globalAlpha = 0.32;
    ctx.drawImage(frames[Math.floor(this.time * 8) % 4], -s / 2, -s / 2, s, s);
    ctx.restore();
  }

  private drawGemHint() {
    const next = this.gems.find((g) => !g.got);
    if (!next || this.phase !== "play") return;
    const dx = next.x - this.p1.x;
    const dy = next.y - this.p1.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < 40) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.p1.x + (dx / d) * 26, this.p1.y + (dy / d) * 26);
    ctx.rotate(Math.atan2(dy, dx));
    ctx.fillStyle = "rgba(232,119,34,0.9)";
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, 5);
    ctx.lineTo(-5, -5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawPads(w: number, h: number) {
    if (this.phase !== "play" && this.phase !== "pause") return;
    const ctx = this.ctx;
    const draw = (rect: { x: number; y: number; w: number; h: number }, label: string, vec: { x: number; y: number }) => {
      ctx.fillStyle = "rgba(11,31,58,0.72)";
      ctx.strokeStyle = "rgba(232,119,34,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#e87722";
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2 + vec.x * 28, rect.y + rect.h / 2 + vec.y * 28, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#9db0c4";
      ctx.font = "600 11px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, rect.x + rect.w / 2, rect.y + 16);
    };
    draw(this.padRect("p1"), this.is3d() ? "STEER" : this.crew ? "P1" : "LEAN", this.is3d() ? this.held() : this.tilt);
    if (this.crew) draw(this.padRect("p2"), "P2", this.readP2());
    void w;
    void h;
  }

  private awardClear() {
    const t = this.time;
    const id = this.course.id;
    const gain = earnOnClear(this.save.best, id, t, this.course.par);
    this.lastEarn = gain.watts;
    this.save.watts += gain.watts;
    const prev = this.save.best[id];
    if (prev == null || t < prev) {
      this.save.best[id] = t;
      if (!this.is3d() && this.ghostLive.length > 4) this.save.ghosts[id] = this.ghostLive.slice();
    }
    writeSave(this.save);
  }

  passLesson(id: LessonId) {
    if (this.save.passed.includes(id)) return;
    const l = lessonById(id);
    if (!l) return;
    this.save.passed = [...this.save.passed, id];
    writeSave(this.save);
    this.emit();
  }

  installPart(id: PartId): string | null {
    const part = partById(id);
    if (!part) return "Unknown part.";
    if (this.save.parts.includes(id)) return "Already installed.";
    if (!this.save.passed.includes(part.lesson)) return "Pass the lesson check first.";
    if (this.save.watts < part.cost) return `Need ${part.cost} watts.`;
    this.save.watts -= part.cost;
    this.save.parts = [...this.save.parts, id];
    writeSave(this.save);
    this.emit();
    return null;
  }

  bootMachine() {
    this.save.booted = true;
    writeSave(this.save);
    this.emit();
  }

  finishInduction() {
    this.save.inducted = true;
    writeSave(this.save);
    this.emit();
  }

  exportPack(): BertyPack {
    return makePack({
      best: this.save.best,
      watts: this.save.watts,
      parts: this.save.parts,
      passed: this.save.passed,
      booted: this.save.booted,
      ghostOn: this.save.ghostOn,
    });
  }

  importPack(raw: unknown): string | null {
    const parsed = parsePack(raw);
    if ("error" in parsed) return parsed.error;
    const pack = parsed.pack;
    this.save = {
      ...this.save,
      best: pack.best,
      watts: pack.watts,
      parts: pack.parts,
      passed: pack.passed,
      booted: pack.booted,
      ghostOn: pack.ghostOn,
      ghosts: {},
    };
    writeSave(this.save);
    this.loadCourse(this.course.id, this.crew, true);
    this.phase = "title";
    this.bend?.setTitle(true);
    this.emit();
    return null;
  }

  applyLaunch(course?: CourseId) {
    if (!course) return;
    this.selectCourse(course);
  }

  stars() {
    if (this.phase !== "win") return 0;
    return starsFor(this.time, this.course.par);
  }

  emit() {
    const gems = this.is3d() ? (this.bend?.gemsGot ?? 0) : this.gems.filter((g) => g.got).length;
    const gemTotal = this.is3d() ? (this.bend?.gemTotal ?? 0) : this.gems.length;
    const snap: HudSnap = {
      phase: this.phase,
      courseId: this.course.id,
      courseName: this.course.name,
      time: this.time,
      gems,
      gemTotal,
      hearts: this.hearts,
      crew: this.crew,
      mute: this.mute || isMuted(),
      best: this.save.best[this.course.id] ?? null,
      stars: this.stars(),
      is3d: this.is3d(),
      par: this.course.par,
      bests: this.save.best,
      ghost: this.save.ghostOn,
      hasGhost: (this.save.ghosts[this.course.id]?.length ?? 0) > 4,
      stamps: Object.keys(this.save.best).length,
      watts: this.save.watts,
      parts: this.save.parts,
      passed: this.save.passed,
      earned: this.lastEarn,
      booted: this.save.booted,
      inducted: this.save.inducted,
    };
    this.onHud(snap);
    window.__bertyRun = { phase: snap.phase, gems: snap.gems, time: snap.time };
  }

  private wireControlsTest() {
    window.__controlsTest = {
      getYaw: () => (this.is3d() ? this.bend?.yaw ?? 0 : -this.tilt.x),
      getSpeed: () => (this.is3d() ? this.bend?.speed ?? 0 : Math.hypot(this.p1.vx, this.p1.vy)),
      setSteer: (v: number) => {
        this.injectSteer = v;
      },
      setKeys: (codes: string[]) => {
        this.injectKeys = codes;
      },
    };
  }
}

export { COURSES };
