import { COURSES, courseById, starsFor } from "./courses";
import { earnOnClear, lessonById, partById, type LessonId, type PartId } from "./curriculum";
import {
  isMuted,
  setMuted,
  sfxBoost,
  sfxCheck,
  sfxGate,
  sfxGem,
  sfxHurt,
  sfxJump,
  sfxWin,
  unlockAudio,
} from "./audio";
import { makePack, parsePack, type BertyPack } from "./techworks";
import type { Course, CourseId, HudSnap, Seg } from "./types";

// Lifted from ftaip/waiting-game Pixel Runner (MIT): auto-scroll, one JUMP,
// tap-vs-hold (200ms boost window), obstacle timing, fat Space retry.
// See docs/NOTICE-waiting-game.md. Tick + draw share this class.

const STEP = 1 / 60;
const GRAVITY = 2400;
const JUMP = -780;
const HOLD_GRAVITY = 1600;
const HOLD_BOOST_WINDOW = 0.2;
const MAX_FALL_SPEED = 1400;
const RUN = 430;
const RUN_MIN = RUN;
const RUN_MAX = RUN;
const RUN_RAMP = 0;
const HEARTS = 3;
const VIEW_W = 1280;
const VIEW_H = 760;
const GROUND = 598;
const PW = 34;
const PH = 52;
const COYOTE = 0.14;
const BUFFER = 0.16;
const SAVE_KEY = "bertys-run-v1";

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; s: number };
type Pop = { x: number; y: number; life: number; max: number; label: string };
type Plat = { x: number; y: number; w: number; h: number };
type Crate = { x: number; y: number; w: number; h: number };
type Saw = { x: number; y: number; r: number; t: number };
type Gem = { x: number; y: number; got: boolean; t: number };
type Check = { x: number; y: number; w: number; h: number };
type Boost = { x: number; y: number; w: number; h: number; used: boolean };
type GhostPt = { x: number; y: number; a: number };
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

function assetUrl(path: string) {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}${path.replace(/^\//, "")}`;
}

async function loadSprites(): Promise<Sprites> {
  const frame = (base: string, n: number) =>
    Promise.all(Array.from({ length: n }, (_, i) => loadImg(assetUrl(`sprites/${base}-${i + 1}.png`))));
  const [berty, gem, saw, gate, crate, floor] = await Promise.all([
    frame("berty", 4),
    frame("gem", 4),
    frame("saw", 4),
    loadImg(assetUrl("sprites/gate.png")),
    loadImg(assetUrl("sprites/crate.png")),
    loadImg(assetUrl("sprites/floor.png")),
  ]);
  return { berty, gem, saw, gate, crate, floor };
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function aabb(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function emptySave(): Save {
  return { best: {}, mute: false, ghostOn: true, ghosts: {}, watts: 0, parts: [], passed: [], booted: false, inducted: false };
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

function writeSave(s: Save) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(s));
}

function compile(segs: Seg[]) {
  const plats: Plat[] = [];
  const crates: Crate[] = [];
  const saws: Saw[] = [];
  const gems: Gem[] = [];
  const checks: Check[] = [];
  const boosts: Boost[] = [];
  let x = 0;
  let run = 0;
  let exit = { x: 0, y: GROUND - 148, w: 110, h: 148 };

  const flushGround = () => {
    if (run > 0) {
      plats.push({ x: x - run, y: GROUND, w: run, h: VIEW_H - GROUND + 80 });
      run = 0;
    }
  };

  const addGems = (n: number, form: "line" | "arc" | "high", at: number) => {
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const gx = at + 36 + i * 42;
      let gy = GROUND - 44;
      if (form === "arc") gy = GROUND - 92 - Math.sin(t * Math.PI) * 86;
      if (form === "high") gy = GROUND - 152;
      gems.push({ x: gx, y: gy, got: false, t: i * 0.2 });
    }
  };

  for (const s of segs) {
    if (s.k === "g") {
      run += s.w;
      x += s.w;
    } else if (s.k === "gap") {
      flushGround();
      x += s.w;
    } else if (s.k === "crate") {
      const w = 56;
      const h = 56;
      crates.push({ x: x + 8, y: GROUND - h, w, h });
      run += w + 16;
      x += w + 16;
    } else if (s.k === "overhang") {
      const w = 96;
      const h = 78;
      crates.push({ x: x + 10, y: GROUND - h, w, h });
      run += w + 20;
      x += w + 20;
    } else if (s.k === "window") {
      flushGround();
      const w = s.w ?? 158;
      saws.push({ x: x + w / 2, y: GROUND - 108, r: 24, t: 0 });
      x += w;
    } else if (s.k === "saw") {
      const h = s.h ?? 58;
      saws.push({ x: x + 28, y: GROUND - h, r: 26, t: 0 });
      run += 56;
      x += 56;
    } else if (s.k === "gems") {
      addGems(s.n, s.form ?? "line", x);
    } else if (s.k === "check") {
      checks.push({ x: x + 4, y: GROUND - 88, w: 36, h: 88 });
      run += 48;
      x += 48;
    } else if (s.k === "boost") {
      boosts.push({ x: x + 4, y: GROUND - 18, w: 64, h: 18, used: false });
      run += 72;
      x += 72;
    } else if (s.k === "gate") {
      flushGround();
      run += 520;
      x += 520;
      flushGround();
      exit = { x: x - 280, y: GROUND - 160, w: 120, h: 160 };
    }
  }
  flushGround();
  if (!plats.length) plats.push({ x: 0, y: GROUND, w: 2000, h: 200 });
  return { plats, crates, saws, gems, checks, boosts, exit, worldW: x + 80 };
}

type Player = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  onGround: boolean;
  coyote: number;
  buffer: number;
  holding: boolean;
  alive: boolean;
  spawnX: number;
  spawnY: number;
  squash: number;
  frame: number;
  anim: number;
  jumpHold: number;
  spin: number;
};

export class Engine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  onHud: (h: HudSnap) => void;
  sprites: Sprites | null = null;
  floorPat: CanvasPattern | null = null;
  phase: HudSnap["phase"] = "boot";
  course: Course = COURSES[0];
  crew = false;
  mute = false;
  save: Save;
  keys = new Set<string>();
  injectKeys: string[] | null = null;
  injectSteer: number | null = null;
  jumpHeld = false;
  jumpQueued = false;
  plats: Plat[] = [];
  crates: Crate[] = [];
  saws: Saw[] = [];
  gems: Gem[] = [];
  checks: Check[] = [];
  boosts: Boost[] = [];
  exit = { x: 0, y: 0, w: 0, h: 0 };
  worldW = 0;
  p1!: Player;
  cam = { x: 0, y: 0, trauma: 0 };
  acc = 0;
  last = 0;
  time = 0;
  hearts = HEARTS;
  particles: Particle[] = [];
  pops: Pop[] = [];
  ghostLive: GhostPt[] = [];
  ghostPlay: GhostPt[] = [];
  ghostAcc = 0;
  hitstop = 0;
  lastEarn = 0;
  raf = 0;
  destroyed = false;
  speed = RUN_MIN;
  deadT = 0;
  hudAcc = 0;
  closeArmed = new Set<string>();
  reduced = false;

  constructor(canvas: HTMLCanvasElement, onHud: (h: HudSnap) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2D context");
    this.ctx = ctx;
    this.onHud = onHud;
    this.save = readSave();
    this.mute = this.save.mute;
    setMuted(this.mute);
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.bind();
  }

  is3d() {
    return false;
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
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    this.wireControlsTest();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
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
    el.addEventListener("pointerup", this.onPtrUp);
    el.addEventListener("pointercancel", this.onPtrUp);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => {
      this.reduced = mq.matches;
    };
    mq.addEventListener?.("change", onMq);
    this.reduced = mq.matches;
  }

  private jumpDown() {
    this.jumpHeld = true;
    this.jumpQueued = true;
    this.p1.buffer = BUFFER;
  }

  private jumpUp() {
    this.jumpHeld = false;
  }

  holdJump(on: boolean) {
    if (on) this.jumpDown();
    else this.jumpUp();
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    this.keys.add(e.code);
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") this.jumpDown();
    if (e.code === "KeyP" || e.code === "Escape") this.togglePause();
    if (e.code === "KeyG") this.toggleGhost();
    if (e.code === "KeyR" && (this.phase === "play" || this.phase === "fail" || this.phase === "win")) this.retry();
    if ((e.code === "Space" || e.code === "Enter") && this.phase === "title") this.startPlay();
    if ((e.code === "Space" || e.code === "Enter") && (this.phase === "win" || this.phase === "fail")) this.retry();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") this.jumpUp();
  };

  private onBlur = () => {
    this.keys.clear();
    this.jumpHeld = false;
  };

  private onVis = () => {
    if (document.hidden) this.keys.clear();
    if (!document.hidden) unlockAudio();
  };

  private onPtrDown = (e: PointerEvent) => {
    unlockAudio();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    if (this.phase === "title") {
      this.startPlay();
      return;
    }
    if (this.phase === "win" || this.phase === "fail") {
      this.retry();
      return;
    }
    if (this.phase === "pause") {
      this.togglePause();
      return;
    }
    if (this.phase === "play") this.jumpDown();
  };

  private onPtrUp = () => {
    this.jumpUp();
  };

  startPlay() {
    unlockAudio();
    if (this.phase === "title" || this.phase === "win" || this.phase === "fail" || this.phase === "pause") {
      if (this.phase !== "pause") this.resetRun();
      this.phase = "play";
      this.emit();
    }
  }

  retry() {
    this.resetRun();
    this.phase = "play";
    this.emit();
  }

  selectCourse(id: CourseId) {
    this.loadCourse(id, this.crew, true);
    this.phase = "title";
    this.emit();
  }

  setCrew(_on: boolean) {
    this.crew = false;
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

  private loadCourse(id: CourseId, _crew: boolean, keepHud: boolean) {
    this.course = courseById(id);
    const built = compile(this.course.segs);
    this.plats = built.plats;
    this.crates = built.crates;
    this.saws = built.saws;
    this.gems = built.gems;
    this.checks = built.checks;
    this.boosts = built.boosts;
    this.exit = built.exit;
    this.worldW = built.worldW;
    this.ghostPlay = this.save.ghosts[id] ?? [];
    this.resetRun();
    if (!keepHud) this.phase = "title";
  }

  private resetRun() {
    this.time = 0;
    this.hearts = HEARTS;
    this.speed = RUN_MIN;
    this.particles = [];
    this.pops = [];
    this.ghostLive = [];
    this.ghostAcc = 0;
    this.hitstop = 0;
    this.lastEarn = 0;
    this.deadT = 0;
    this.hudAcc = 0;
    this.closeArmed = new Set();
    this.jumpHeld = false;
    this.jumpQueued = false;
    this.cam.x = 0;
    this.cam.trauma = 0;
    for (const g of this.gems) g.got = false;
    for (const b of this.boosts) b.used = false;
    const startX = 180;
    this.p1 = {
      x: startX,
      y: GROUND - PH,
      vx: RUN_MIN,
      vy: 0,
      w: PW,
      h: PH,
      onGround: true,
      coyote: 0,
      buffer: 0,
      holding: false,
      alive: true,
      spawnX: startX,
      spawnY: GROUND - PH,
      squash: 1,
      frame: 0,
      anim: 0,
      jumpHold: 0,
      spin: 0,
    };
  }

  private wantJump() {
    const codes = this.injectKeys ?? [...this.keys];
    return this.jumpQueued || this.jumpHeld || codes.includes("Space") || codes.includes("ArrowUp") || codes.includes("KeyW");
  }

  private step(dt: number) {
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      return;
    }
    if (this.phase === "play") this.time += dt;
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0).slice(-80);
    for (const p of this.pops) p.life -= dt;
    this.pops = this.pops.filter((p) => p.life > 0);
    this.cam.trauma = Math.max(0, this.cam.trauma - dt * 2.2);
    for (const s of this.saws) s.t += dt;

    if (this.phase !== "play") return;
    this.hudAcc += dt;
    if (this.hudAcc >= 0.08) {
      this.hudAcc = 0;
      this.emit();
    }

    const p = this.p1;
    if (!p.alive) {
      this.deadT += dt;
      p.vy += GRAVITY * dt;
      p.y += p.vy * dt;
      p.x += p.vx * dt * 0.4;
      if (this.deadT > 0.7 && this.hearts > 0) this.respawn();
      return;
    }

    this.speed = Math.min(RUN_MAX, this.speed + RUN_RAMP * dt);
    p.vx = this.speed;
    if (this.injectSteer != null) p.vx = clamp(this.speed + this.injectSteer * 40, 80, RUN_MAX + 80);

    p.buffer = Math.max(0, p.buffer - dt);
    p.coyote = p.onGround ? COYOTE : Math.max(0, p.coyote - dt);
    p.holding = this.wantJump();

    if ((this.jumpQueued || p.buffer > 0) && p.coyote > 0) {
      p.vy = JUMP;
      p.onGround = false;
      p.coyote = 0;
      p.buffer = 0;
      p.jumpHold = 0;
      this.jumpQueued = false;
      p.squash = 0.82;
      p.spin += Math.PI / 2;
      sfxJump();
    }
    this.jumpQueued = false;

    if (p.onGround) {
      p.jumpHold = 0;
      const q = Math.PI / 2;
      p.spin = this.reduced ? 0 : Math.round(p.spin / q) * q;
    } else {
      p.jumpHold += dt;
      if (!this.reduced) p.spin += Math.PI * 1.15 * dt;
    }
    const boosting = !p.onGround && p.vy < 0 && p.holding && p.jumpHold < HOLD_BOOST_WINDOW;
    const g = boosting ? HOLD_GRAVITY : GRAVITY;
    p.vy += g * dt;
    if (!p.holding && p.vy < -80) p.vy = Math.max(p.vy, p.vy * 0.55);
    p.vy = clamp(p.vy, JUMP * 1.15, MAX_FALL_SPEED);

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.onGround = false;

    this.collideWorld(p);

    if (p.y > VIEW_H + 80) this.kill();

    this.pickups(p);
    this.nearMiss(p);
    this.hazards(p);
    this.checkWin(p);

    p.anim += dt * (p.onGround ? 10 : 4);
    p.frame = Math.floor(p.anim) % 4;
    p.squash += (1 - p.squash) * Math.min(1, dt * 12);

    this.cam.x += (p.x - 280 - this.cam.x) * Math.min(1, dt * 8);
    this.cam.x = clamp(this.cam.x, 0, Math.max(0, this.worldW - VIEW_W));

    this.ghostAcc += dt;
    if (this.ghostAcc > 0.05) {
      this.ghostAcc = 0;
      this.ghostLive.push({ x: p.x, y: p.y, a: 1 });
      if (this.ghostLive.length > 800) this.ghostLive.shift();
    }
  }

  private collideWorld(p: Player) {
    const solids: Plat[] = [...this.plats, ...this.crates];
    for (const s of solids) {
      if (!aabb(p.x, p.y, p.w, p.h, s.x, s.y, s.w, s.h)) continue;
      const prevBottom = p.y + p.h - p.vy * STEP;
      const fromAbove = p.vy >= 0 && prevBottom <= s.y + 10;
      if (fromAbove) {
        p.y = s.y - p.h;
        p.vy = 0;
        p.onGround = true;
        p.coyote = COYOTE;
      } else {
        this.kill();
        return;
      }
    }
  }

  private pickups(p: Player) {
    for (const g of this.gems) {
      if (g.got) continue;
      if (aabb(p.x, p.y, p.w, p.h, g.x - 20, g.y - 20, 40, 40)) {
        g.got = true;
        sfxGem();
        this.burst(g.x, g.y, "#e87722", 12);
        this.pops.push({ x: g.x, y: g.y, life: 0.5, max: 0.5, label: "+1" });
        this.hitstop = 0.03;
      }
    }
    for (const c of this.checks) {
      if (aabb(p.x, p.y, p.w, p.h, c.x, c.y, c.w, c.h)) {
        if (Math.abs(p.spawnX - (c.x + 8)) > 24) {
          sfxCheck();
          this.burst(c.x + c.w / 2, c.y + 20, "#f4efe6", 8);
        }
        p.spawnX = c.x + 8;
        p.spawnY = GROUND - PH;
      }
    }
    for (const b of this.boosts) {
      if (b.used) continue;
      if (aabb(p.x, p.y, p.w, p.h, b.x, b.y, b.w, b.h)) {
        b.used = true;
        this.speed = Math.min(RUN_MAX + 40, this.speed + 70);
        sfxBoost();
        this.burst(b.x + b.w / 2, b.y, "#22D3EE", 10);
      }
    }
  }

  private nearMiss(p: Player) {
    const cx = p.x + p.w / 2;
    for (let i = 0; i < this.crates.length; i++) {
      const cr = this.crates[i];
      const id = `c${i}`;
      if (this.closeArmed.has(id)) continue;
      if (Math.abs(cx - (cr.x + cr.w / 2)) > 12) continue;
      const gap = cr.y - (p.y + p.h);
      if (gap > 0 && gap <= 14) {
        this.closeArmed.add(id);
        this.pops.push({ x: cr.x + cr.w / 2, y: cr.y - 8, life: 0.4, max: 0.4, label: "close" });
      }
    }
    for (let i = 0; i < this.saws.length; i++) {
      const s = this.saws[i];
      const id = `s${i}`;
      if (this.closeArmed.has(id)) continue;
      if (Math.abs(cx - s.x) > 14) continue;
      const gap = s.y - s.r - (p.y + p.h);
      if (gap > 0 && gap <= 14) {
        this.closeArmed.add(id);
        this.pops.push({ x: s.x, y: s.y - s.r - 8, life: 0.4, max: 0.4, label: "close" });
      }
    }
  }

  private hazards(p: Player) {
    for (const s of this.saws) {
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      if (Math.hypot(cx - s.x, cy - s.y) < p.w * 0.42 + s.r - 6) this.kill();
    }
  }

  private kill() {
    const p = this.p1;
    if (!p.alive) return;
    p.alive = false;
    p.vy = -280;
    this.deadT = 0;
    this.hearts -= 1;
    sfxHurt();
    this.shake(0.5);
    this.burst(p.x + p.w / 2, p.y + p.h / 2, "#e87722", 16);
    if (this.hearts <= 0) {
      this.phase = "fail";
      this.emit();
    }
  }

  private respawn() {
    const p = this.p1;
    p.x = p.spawnX;
    p.y = p.spawnY;
    p.vx = this.speed;
    p.vy = 0;
    p.alive = true;
    p.onGround = true;
    p.coyote = COYOTE;
    p.squash = 0.85;
    this.deadT = 0;
    this.cam.x = Math.max(0, p.x - 280);
  }

  private checkWin(p: Player) {
    const got = this.gems.filter((g) => g.got).length;
    const atGate = aabb(p.x, p.y, p.w, p.h, this.exit.x, this.exit.y, this.exit.w, this.exit.h);
    if (!atGate) return;
    if (got < 3) {
      if (!this.pops.some((q) => q.label === "Need 3 bits")) {
        this.pops.push({ x: p.x, y: p.y - 40, life: 1.1, max: 1.1, label: "Need 3 bits" });
      }
      return;
    }
    this.phase = "win";
    sfxWin();
    sfxGate();
    this.burst(p.x, p.y, "#e87722", 24);
    this.awardClear();
    this.emit();
  }

  private awardClear() {
    const t = this.time;
    const id = this.course.id;
    const prev = this.save.best[id];
    const result = earnOnClear(this.save.best, id, t, this.course.par);
    this.lastEarn = result.watts;
    this.save.watts += result.watts;
    if (prev == null || t < prev) {
      this.save.best[id] = t;
      if (this.ghostLive.length > 4) this.save.ghosts[id] = this.ghostLive.slice();
    }
    writeSave(this.save);
  }

  private burst(x: number, y: number, c: string, n: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        life: 0.35 + Math.random() * 0.35,
        max: 0.7,
        c,
        s: 2 + Math.random() * 3,
      });
    }
  }

  private shake(n: number) {
    if (this.reduced) return;
    this.cam.trauma = Math.min(1, this.cam.trauma + n);
  }

  private draw() {
    const c = this.canvas;
    const ctx = this.ctx;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = c.clientWidth || VIEW_W;
    const cssH = c.clientHeight || VIEW_H;
    const bw = Math.max(1, Math.floor(cssW * dpr));
    const bh = Math.max(1, Math.floor(cssH * dpr));
    if (c.width !== bw || c.height !== bh) {
      c.width = bw;
      c.height = bh;
    }
    const scale = Math.min(cssW / VIEW_W, cssH / VIEW_H);
    const ox = (cssW - VIEW_W * scale) / 2;
    const oy = (cssH - VIEW_H * scale) / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = "#050814";
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VIEW_W * scale, VIEW_H * scale);
    ctx.clip();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    const jx = this.reduced ? 0 : (Math.random() - 0.5) * this.cam.trauma * 12;
    const jy = this.reduced ? 0 : (Math.random() - 0.5) * this.cam.trauma * 10;
    ctx.translate(-this.cam.x + jx, jy);

    this.drawBackdrop();
    this.drawPlats();
    this.drawProps();
    this.drawGhost();
    this.drawPlayer();
    this.drawFx();

    ctx.restore();
  }

  private drawBackdrop() {
    const ctx = this.ctx;
    const x0 = this.cam.x;
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, "#071526");
    g.addColorStop(0.55, "#0b1f3a");
    g.addColorStop(1, "#050814");
    ctx.fillStyle = g;
    ctx.fillRect(x0 - 40, -20, VIEW_W + 80, VIEW_H + 40);

    ctx.strokeStyle = "rgba(42,77,112,0.35)";
    ctx.lineWidth = 1;
    const grid = 64;
    const gx0 = Math.floor((x0 - 40) / grid) * grid;
    for (let x = gx0; x < x0 + VIEW_W + 80; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, VIEW_H);
      ctx.stroke();
    }
    for (let y = 48; y < VIEW_H; y += grid) {
      ctx.beginPath();
      ctx.moveTo(x0 - 40, y);
      ctx.lineTo(x0 + VIEW_W + 40, y);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(20,184,166,0.08)";
    ctx.fillRect(x0 - 40, GROUND - 4, VIEW_W + 80, 6);
  }

  private drawPlats() {
    const ctx = this.ctx;
    for (const p of this.plats) {
      if (p.x + p.w < this.cam.x - 40 || p.x > this.cam.x + VIEW_W + 40) continue;
      if (this.floorPat) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = this.floorPat;
        ctx.fillRect(0, 0, p.w, p.h);
        ctx.restore();
      } else {
        ctx.fillStyle = "#16304c";
        ctx.fillRect(p.x, p.y, p.w, p.h);
      }
      ctx.fillStyle = "#14B8A6";
      ctx.fillRect(p.x, p.y, p.w, 4);
      ctx.fillStyle = "rgba(34,211,238,0.55)";
      ctx.fillRect(p.x, p.y, p.w, 2);
    }
  }

  private drawProps() {
    const ctx = this.ctx;
    const sp = this.sprites;
    for (const b of this.boosts) {
      ctx.fillStyle = b.used ? "rgba(34,211,238,0.2)" : "rgba(34,211,238,0.55)";
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    for (const c of this.checks) {
      ctx.strokeStyle = "#f4efe6";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + 18, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(244,239,230,0.15)";
      ctx.fillRect(c.x + c.w / 2 - 2, c.y + 30, 4, c.h - 30);
    }
    for (const cr of this.crates) {
      if (sp) ctx.drawImage(sp.crate, cr.x - 4, cr.y - 8, cr.w + 8, cr.h + 8);
      else {
        ctx.fillStyle = "#c45c26";
        ctx.fillRect(cr.x, cr.y, cr.w, cr.h);
      }
    }
    for (const s of this.saws) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.t * 8);
      if (sp) {
        const im = sp.saw[Math.floor(s.t * 10) % sp.saw.length];
        ctx.drawImage(im, -32, -32, 64, 64);
      } else {
        ctx.fillStyle = "#9db0c4";
        ctx.beginPath();
        ctx.arc(0, 0, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    for (const g of this.gems) {
      if (g.got) continue;
      g.t += 0.016;
      const bob = Math.sin(g.t * 4 + g.x * 0.01) * 5;
      if (sp) {
        const im = sp.gem[Math.floor((g.t * 6) % sp.gem.length)];
        ctx.drawImage(im, g.x - 18, g.y - 18 + bob, 36, 36);
      } else {
        ctx.fillStyle = "#FBBF24";
        ctx.beginPath();
        ctx.moveTo(g.x, g.y - 12 + bob);
        ctx.lineTo(g.x + 10, g.y + bob);
        ctx.lineTo(g.x, g.y + 12 + bob);
        ctx.lineTo(g.x - 10, g.y + bob);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (sp) ctx.drawImage(sp.gate, this.exit.x - 10, this.exit.y - 10, this.exit.w + 20, this.exit.h + 20);
    else {
      ctx.fillStyle = "#1A5C3A";
      ctx.fillRect(this.exit.x, this.exit.y, this.exit.w, this.exit.h);
    }
  }

  private drawGhost() {
    if (!this.save.ghostOn || this.ghostPlay.length < 4) return;
    const ctx = this.ctx;
    ctx.globalAlpha = 0.28;
    const t = this.time;
    const i = clamp(Math.floor(t / 0.05), 0, this.ghostPlay.length - 1);
    const g = this.ghostPlay[i];
    const sp = this.sprites;
    if (sp) ctx.drawImage(sp.berty[i % 4], g.x - 20, g.y - 40, 92, 92);
    else {
      ctx.fillStyle = "#9db0c4";
      ctx.fillRect(g.x, g.y, PW, PH);
    }
    ctx.globalAlpha = 1;
  }

  private drawPlayer() {
    const p = this.p1;
    const sp = this.sprites;
    const ctx = this.ctx;
    const cx = p.x + p.w / 2;
    const feet = p.y + p.h;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(cx, feet - 4, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(cx, feet);
    ctx.scale(1, p.squash);
    ctx.rotate(this.reduced ? 0 : p.spin);
    const sw = 92;
    const sh = 92;
    if (sp) {
      const im = p.onGround ? sp.berty[p.frame] : sp.berty[1];
      ctx.globalAlpha = p.alive ? 1 : 0.55;
      ctx.drawImage(im, -sw / 2, -sh + 6, sw, sh);
    } else {
      ctx.fillStyle = p.alive ? "#22D3EE" : "#e87722";
      ctx.fillRect(-p.w / 2, -p.h, p.w, p.h);
    }
    ctx.restore();
  }

  private drawFx() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      ctx.globalAlpha = p.life / p.max;
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, p.s, p.s);
    }
    ctx.globalAlpha = 1;
    ctx.font = "bold 14px Outfit, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    for (const p of this.pops) {
      const k = 1 - p.life / p.max;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = "#e87722";
      ctx.fillText(p.label, p.x, p.y - k * 28);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
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
    const snap: HudSnap = {
      phase: this.phase,
      courseId: this.course.id,
      courseName: this.course.name,
      time: this.time,
      gems: this.gems.filter((g) => g.got).length,
      gemTotal: this.gems.length,
      hearts: this.hearts,
      crew: false,
      mute: this.mute || isMuted(),
      best: this.save.best[this.course.id] ?? null,
      stars: this.stars(),
      is3d: false,
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
    window.__bertyRun = {
      phase: snap.phase,
      gems: snap.gems,
      gemTotal: snap.gemTotal,
      time: snap.time,
      hearts: snap.hearts,
      x: this.p1?.x ?? 0,
      worldW: this.worldW,
    };
  }

  private wireControlsTest() {
    window.__controlsTest = {
      getYaw: () => 0,
      getSpeed: () => this.p1?.vx ?? 0,
      setSteer: (v: number) => {
        this.injectSteer = v;
      },
      setKeys: (codes: string[]) => {
        this.injectKeys = codes;
        if (codes.includes("Space") || codes.includes("ArrowUp")) this.jumpDown();
      },
    };
  }
}

export { COURSES };
