import type { Bend3D } from "./bend3d";
import { COURSES, TILE, courseById, dyeFor, isUnlocked, nextBoard, starsFor } from "./courses";
import { pcbLook } from "./pcb";
import { asGoal, botGift, courseForPart, earnOnClear, heartCount, lessonById, partById, playStep, type LessonId, type PartId, type PcGoal } from "./curriculum";
import {
  isMuted,
  setMuted,
  sfxBoost,
  sfxBump,
  sfxCheck,
  sfxCount,
  sfxGate,
  sfxGem,
  sfxGo,
  sfxHurt,
  sfxWin,
  unlockAudio,
} from "./audio";
import { makePack, parsePack, markHowto, postScore, CHIP, type BertyPack } from "./techworks";
import { drivePatch, readAccess, writeAccess } from "./access";
import { recordClear, signedWho, stashRun } from "./who";
import { TubeSim } from "@/arcade/tube";
import type { Course, CourseId, HudSnap } from "./types";

const STEP = 1 / 60;
const GRAVITY = 740;
const FRICTION = 1.7;
const REST = 0.16;
const SPEED_CAP = 380;
const HEARTS = 3;
const OB_SHEAR = 0.16;
const OB_DEPTH = 0.9;
const WALL_H = 8;
const SAVE_KEY = "bertys-run-v1";
const FULL_KEY = "bertys-run-full";
const FULL_PIN = "5656";
const REDUCED =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function paintScale() {
  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 8 : 8;
  const mem = typeof navigator !== "undefined" ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8 : 8;
  const low = REDUCED || cores <= 4 || mem <= 4;
  return Math.min(low ? 1 : 1.35, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
}

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
  pitHold: number;
  hop: number;
  spawnX: number;
  spawnY: number;
};
type Gem = { x: number; y: number; homeX: number; homeY: number; got: boolean; t: number };
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
  welcome: string;
  alias: string;
  code: string;
  profiles: Record<string, Profile>;
  goal: "" | PcGoal;
};

type Profile = {
  best: Record<string, number>;
  ghosts: Record<string, GhostPt[]>;
  watts: number;
  parts: string[];
  passed: string[];
  booted: boolean;
  goal: "" | PcGoal;
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

function screenAngle() {
  const angle = window.screen?.orientation?.angle;
  if (typeof angle === "number") return angle;
  const legacy = (window as unknown as { orientation?: number }).orientation;
  if (legacy === -90) return 270;
  if (typeof legacy === "number") return ((legacy % 360) + 360) % 360;
  return 0;
}

function profileOf(p: Partial<Save> | Partial<Profile> | undefined): Profile {
  return {
    best: p?.best ?? {},
    ghosts: (p as Partial<Save> | undefined)?.ghosts ?? {},
    watts: p?.watts ?? 0,
    parts: p?.parts ?? [],
    passed: p?.passed ?? [],
    booted: !!p?.booted,
    goal: asGoal(p?.goal),
  };
}

function readSave(): Save {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return emptySave();
    const p = JSON.parse(raw) as Partial<Save> & { profiles?: Record<string, Partial<Profile>> };
    const who = signedWho();
    const alias = who?.alias ?? "";
    const code = who?.code ?? "";
    const profiles: Record<string, Profile> = {};
    if (p.profiles && typeof p.profiles === "object") {
      for (const [k, v] of Object.entries(p.profiles)) profiles[k] = profileOf(v);
    }
    const device = profileOf(p);
    const key = code || "";
    if (code && !profiles[key]) profiles[key] = device;
    const active = code ? profiles[key] : device;
    return {
      ...active,
      mute: !!p.mute,
      ghostOn: p.ghostOn !== false,
      inducted: !!p.inducted,
      welcome: typeof p.welcome === "string" ? p.welcome : "",
      alias,
      code,
      profiles,
    };
  } catch {
    return emptySave();
  }
}

function emptySave(): Save {
  const guest = profileOf(undefined);
  return {
    ...guest,
    mute: false,
    ghostOn: true,
    inducted: false,
    welcome: "",
    alias: "",
    code: "",
    profiles: { "": guest },
  };
}

function readFull() {
  try {
    return localStorage.getItem(FULL_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSave(s: Save) {
  const key = s.code || "";
  const profiles = { ...s.profiles, [key]: profileOf(s) };
  s.profiles = profiles;
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...s, profiles }));
  if (s.code) stashRun({ alias: s.alias, code: s.code, watts: s.watts, parts: s.parts, best: s.best });
}

export class Engine {
  canvas: HTMLCanvasElement;
  canvas3d: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  onHud: (h: HudSnap) => void;
  sprites: Sprites | null = null;
  phase: HudSnap["phase"] = "boot";
  course: Course = COURSES.find((c) => c.id === "roll-out") ?? COURSES[0];
  crew = false;
  mute = false;
  save: Save;
  fullUnlock = false;
  private briefPass = false;
  private needGoal = false;
  private needBrief = false;
  keys = new Set<string>();
  injectKeys: string[] | null = null;
  injectAxis: { x: number; y: number } | null = null;
  gearLock: number | null = null;
  halt = false;
  injectSteer: number | null = null;
  pointers = new Map<number, { x: number; y: number; origin: "p1" | "p2" | "tilt" }>();
  followOn = false;
  fingerId: number | null = null;
  finger: { x: number; y: number } | null = null;
  deviceTilt = false;
  mouseOn = false;
  mouseAt: { x: number; y: number } | null = null;
  private mouseDown = false;
  handsOn = false;
  private handL: { id: number; ox: number; oy: number; x: number; y: number } | null = null;
  private handR: { id: number; ox: number; oy: number; x: number; y: number } | null = null;
  private tiltBase: { x: number; y: number } | null = null;
  private tiltRead: { x: number; y: number } | null = null;
  private tiltSeen = false;
  private tiltWait = 0;
  private tiltListening = false;
  private tiltFailNote = false;
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
  intro = 0;
  introMark = 0;
  go = 0;
  zoomPunch = 0;
  lastEarn = 0;
  lastBot = "";
  lastBotLine = "";
  floorPat: CanvasPattern | null = null;
  private boardImg: HTMLCanvasElement | null = null;
  private boardFor = "";
  private boardPad = 0;
  raf = 0;
  gemPulse = 0;
  private streak = 0;
  private lastGem = -10;
  private portOpenSaid = false;
  tip = "";
  private zapLock = false;
  private tipUntil = 0;
  private wantJump = false;
  private jumpWas = false;
  private saidHop = false;
  private saidPit = false;
  private saidFan = false;
  private saidIce = false;
  private saidPocket = false;
  private saidHurt = false;
  private saidRoad = false;
  private wantZap = false;
  viruses: { x: number; y: number; dead: boolean }[] = [];
  destroyed = false;
  reduced = REDUCED;
  bend: Bend3D | null = null;
  tubeSim: TubeSim | null = null;
  private bendPromise: Promise<Bend3D> | null = null;

  constructor(canvas: HTMLCanvasElement, canvas3d: HTMLCanvasElement, onHud: (h: HudSnap) => void) {
    this.canvas = canvas;
    this.canvas3d = canvas3d;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2D context");
    this.ctx = ctx;
    this.onHud = onHud;
    this.save = readSave();
    this.fullUnlock = readFull();
    this.mute = this.save.mute;
    this.followOn = readAccess().follow;
    this.deviceTilt = readAccess().tilt;
    this.mouseOn = readAccess().mouse;
    this.handsOn = readAccess().hands;
    if (this.deviceTilt) this.bindTilt();
    setMuted(this.mute);
    this.bind();
  }

  is3d() {
    return this.course.mode === "3d";
  }

  isTube() {
    return this.course.id === "tube-run";
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
      if (document.hidden || this.halt) {
        this.last = now;
        this.raf = requestAnimationFrame(loop);
        return;
      }
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
    this.unbindTilt();
  }

  private bind() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onVis);
    const el = this.canvas;
    el.addEventListener("pointerdown", this.onPtrDown, { passive: false });
    el.addEventListener("pointermove", this.onPtrMove, { passive: false });
    el.addEventListener("pointerup", this.onPtrUp);
    el.addEventListener("pointercancel", this.onPtrUp);
    el.addEventListener("pointerleave", this.onPtrLeave);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    const game = ["KeyW", "KeyA", "KeyS", "KeyD", "Space", "KeyE", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (game.includes(e.code) && (this.phase === "play" || this.phase === "pause" || e.code === "Space")) e.preventDefault();
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
    this.mouseAt = null;
    this.handL = null;
    this.handR = null;
  };
  private onVis = () => {
    if (document.hidden) this.keys.clear();
    if (!document.hidden) unlockAudio();
  };

  private padRect(which: "p1" | "p2") {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const size = h < 720 ? 108 : 112;
    const y = h - size - (h < 720 ? 28 : 14);
    if (which === "p1") return { x: 12, y, w: size, h: size };
    return { x: w - size - 12, y, w: size, h: size };
  }

  private onPtrDown = (e: PointerEvent) => {
    if (this.phase !== "play" && this.phase !== "pause") return;
    if (e.pointerType === "touch") e.preventDefault();
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
    if (this.followOn && origin !== "p2") {
      this.fingerId = e.pointerId;
      this.finger = { x, y };
    }
    if (e.pointerType === "mouse" || e.pointerType === "pen") this.mouseDown = true;
    if (this.handsOn && !this.crew) {
      const slot = { id: e.pointerId, ox: x, oy: y, x, y };
      if (x < this.canvas.clientWidth / 2) {
        if (!this.handL) this.handL = slot;
      } else if (!this.handR) this.handR = slot;
    }
    this.pointers.set(e.pointerId, { x, y, origin });
  };
  private onPtrMove = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.mouseAt = { x, y };
    if (e.pointerType === "touch") e.preventDefault();
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    p.x = x;
    p.y = y;
    if (this.fingerId === e.pointerId) this.finger = { x: p.x, y: p.y };
    if (this.handL?.id === e.pointerId) {
      this.handL.x = x;
      this.handL.y = y;
    }
    if (this.handR?.id === e.pointerId) {
      this.handR.x = x;
      this.handR.y = y;
    }
  };
  private onPtrLeave = () => {
    this.mouseAt = null;
  };
  private onPtrUp = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId);
    if (this.fingerId === e.pointerId) {
      this.finger = null;
      this.fingerId = null;
    }
    if (e.pointerType === "touch") this.mouseAt = null;
    if (e.pointerType === "mouse" || e.pointerType === "pen") this.mouseDown = false;
    if (this.handL?.id === e.pointerId) this.handL = null;
    if (this.handR?.id === e.pointerId) this.handR = null;
  };

  setFollow(on: boolean) {
    const changed = this.followOn !== on;
    this.followOn = on;
    if (!on) {
      this.finger = null;
      this.fingerId = null;
    }
    if (changed && on) this.note("Hold a finger where Berty should roll.");
    this.emit();
  }

  setTilt(on: boolean) {
    if (this.deviceTilt === on) return;
    this.deviceTilt = on;
    this.tiltBase = null;
    this.tiltRead = null;
    this.tiltSeen = false;
    this.tiltWait = 0;
    if (on) this.bindTilt();
    else this.unbindTilt();
    if (on && !this.tiltFailNote) {
      this.note(this.is3d() ? "This angle is straight. Tilt the top down to roll." : "Tilt the phone. The board leans with it.");
    }
    this.tiltFailNote = false;
    this.emit();
  }

  setMouse(on: boolean) {
    if (this.mouseOn === on) return;
    this.mouseOn = on;
    if (on) this.note(this.is3d() ? "WASD and the mouse together. Center is straight. Up rolls forward." : "Hold the mouse on the board. Berty rolls to it.");
    this.emit();
  }

  setHands(on: boolean) {
    if (this.handsOn === on) return;
    this.handsOn = on;
    if (!on) {
      this.handL = null;
      this.handR = null;
    }
    if (on) this.note(this.is3d() ? "Left finger is speed. Right finger steers." : "Either thumb leans. Both together is a choice.");
    this.emit();
  }

  tiltBlocked() {
    this.note("Tap Allow on the tilt question, or use Steer.");
  }

  private bindTilt() {
    if (this.tiltListening) return;
    this.tiltListening = true;
    window.addEventListener("deviceorientation", this.onOrient);
    window.addEventListener("deviceorientationabsolute", this.onOrient as EventListener);
  }

  private unbindTilt() {
    if (!this.tiltListening) return;
    this.tiltListening = false;
    window.removeEventListener("deviceorientation", this.onOrient);
    window.removeEventListener("deviceorientationabsolute", this.onOrient as EventListener);
  }

  private onOrient = (e: DeviceOrientationEvent) => {
    if (!this.deviceTilt || e.beta == null || e.gamma == null) return;
    const angle = screenAngle();
    let gx = e.gamma;
    let gy = e.beta;
    if (angle === 90) {
      gx = e.beta;
      gy = -e.gamma;
    } else if (angle === 270) {
      gx = -e.beta;
      gy = e.gamma;
    } else if (angle === 180) {
      gx = -e.gamma;
      gy = -e.beta;
    }
    if (!this.tiltBase) this.tiltBase = { x: gx, y: gy };
    const soften = (v: number) => (Math.abs(v) < 0.14 ? 0 : v);
    const sx = soften(clamp((gx - this.tiltBase.x) / 20, -1, 1));
    const sy = soften(clamp((gy - this.tiltBase.y) / 22, -1, 1));
    this.tiltRead = { x: sx, y: -sy };
    this.tiltSeen = true;
  };

  private watchTilt(dt: number) {
    if (!this.deviceTilt || this.tiltSeen) return;
    this.tiltWait += dt;
    if (this.tiltWait < 5) return;
    this.tiltFailNote = true;
    this.deviceTilt = false;
    this.unbindTilt();
    this.note("This phone is not sending tilt. Use Lean, or allow motion sensors.");
    const cur = readAccess();
    if (cur.tilt || cur.drive === "tilt") writeAccess({ ...cur, ...drivePatch("lean") });
    this.emit();
  }

  startPlay() {
    const step = playStep({
      alias: this.save.alias,
      unlocked: this.boardsOpen(this.course),
      goal: this.save.goal,
      cleared: this.save.best[this.course.id] != null,
      briefPass: this.briefPass,
      firstFree: Object.keys(this.save.best).length === 0,
      arcade: this.course.arcade,
    });
    if (step === "locked") {
      this.needGoal = false;
      this.needBrief = false;
      this.phase = "title";
      this.emit();
      return;
    }
    if (step === "goal") {
      this.needGoal = true;
      this.needBrief = false;
      this.phase = "title";
      this.emit();
      return;
    }
    if (step === "brief") {
      this.needGoal = false;
      this.needBrief = true;
      this.phase = "title";
      this.emit();
      return;
    }
    this.needGoal = false;
    this.needBrief = false;
    this.briefPass = false;
    unlockAudio();
    if (this.is3d() && !this.bend) {
      void this.ensureBend().then(() => {
        if (!this.destroyed && this.is3d()) this.startPlay();
      });
      return;
    }
    if (this.phase !== "pause") this.resetRun();
    this.phase = "play";
    this.armIntro();
    this.bend?.setTitle(false);
    this.emit();
  }

  requestJump() {
    this.wantJump = true;
  }

  requestZap() {
    this.wantZap = true;
  }

  retry() {
    this.needBrief = false;
    this.needGoal = false;
    if (this.is3d() && !this.bend) {
      void this.ensureBend().then(() => {
        if (!this.destroyed && this.is3d()) this.retry();
      });
      return;
    }
    this.resetRun();
    this.phase = "play";
    this.armIntro();
    this.bend?.setTitle(false);
    this.emit();
  }

  selectCourse(id: CourseId) {
    if (!this.boardsOpen(courseById(id))) return;
    this.loadCourse(id, this.crew, true);
    this.phase = "title";
    this.briefPass = false;
    this.needBrief = false;
    this.bend?.setTitle(true);
    this.emit();
  }

  parkOnNext() {
    const n = nextBoard(this.course.id, this.save.best, this.fullUnlock);
    if (this.save.best[this.course.id] != null && n) this.selectCourse(n.id);
    else {
      this.phase = "title";
      this.needBrief = false;
      this.emit();
    }
  }

  tryFullUnlock(pin: string) {
    if (pin.trim() !== FULL_PIN) return false;
    this.setFullUnlock(true);
    return true;
  }

  setFullUnlock(on: boolean) {
    this.fullUnlock = on;
    try {
      localStorage.setItem(FULL_KEY, on ? "1" : "0");
    } catch {
      /* private mode */
    }
    this.emit();
  }

  private boardsOpen(c: Course) {
    return this.fullUnlock || isUnlocked(c, this.save.best);
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

  resumeIfPaused() {
    if (this.phase !== "pause") return;
    this.phase = "play";
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
    this.tubeSim = id === "tube-run" ? new TubeSim() : null;
    this.saidPit = false;
    this.saidFan = false;
    this.saidIce = false;
    this.saidPocket = false;
    this.saidHurt = false;
    this.saidRoad = false;
    this.crew = this.course.mode === "3d" ? false : crew;
    const rows = this.course.rows;
    const cols = rows[0].length;
    this.worldW = cols * TILE;
    this.worldH = rows.length * TILE;
    this.boardFor = "";
    this.walls = [];
    this.pits = [];
    this.gems = [];
    this.viruses = [];
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
        else if (ch === "o") {
          const gx = x + TILE / 2;
          const gy = y + TILE / 2;
          this.gems.push({ x: gx, y: gy, homeX: gx, homeY: gy, got: false, t: Math.random() * 4 });
        }
        else if (ch === "V") this.viruses.push({ x: x + TILE / 2, y: y + TILE / 2, dead: false });
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
      this.canvas.style.background = "transparent";
      void this.ensureBend().then((bend) => {
        if (this.destroyed) return;
        if (!this.is3d()) {
          bend.sleep();
          return;
        }
        bend.load(this.course.id);
        if (this.phase === "title") bend.setTitle(true);
        this.emit();
      });
    } else {
      this.bend?.sleep();
    }
  }

  private ensureBend() {
    if (this.bend) return Promise.resolve(this.bend);
    this.bendPromise ??= import("./bend3d").then(({ Bend3D }) => {
      const bend = new Bend3D(this.canvas3d, this.reduced);
      this.bend = bend;
      return bend;
    });
    return this.bendPromise;
  }

  private resetRun() {
    this.time = 0;
    this.hearts = heartCount(Object.keys(this.save.best).length);
    this.bend?.setGear(this.gearLock ?? Object.keys(this.save.best).length);
    this.gemPulse = 0;
    this.streak = 0;
    this.lastGem = -10;
    this.portOpenSaid = false;
    this.particles = [];
    this.pops = [];
    this.hitstop = 0;
    this.intro = 0;
    this.go = 0;
    this.zoomPunch = 0;
    this.cam.trauma = 0;
    this.tilt = { x: 0, y: 0 };
    this.p1 = this.makeBody(this.start1.x, this.start1.y);
    this.p2 = this.crew && !this.is3d() ? this.makeBody(this.start2.x, this.start2.y) : null;
    for (const g of this.gems) {
      g.got = false;
      g.x = g.homeX;
      g.y = g.homeY;
    }
    for (const v of this.viruses) v.dead = false;
    this.cam.x = this.p1.x;
    this.cam.y = this.p1.y;
    this.ghostLive = [];
    this.ghostAcc = 0;
    this.ghostPlay = this.save.ghosts[this.course.id] ?? [];
    this.bend?.reset();
    this.tubeSim?.reset();
  }

  private makeBody(x: number, y: number): Body {
    return { x, y, px: x, py: y, vx: 0, vy: 0, r: 16, angle: 0, squash: 1, alive: true, fall: 0, pitHold: 0, hop: 0, spawnX: x, spawnY: y };
  }

  private held() {
    const src = this.injectKeys;
    const has = (c: string) => (src ? src.includes(c) : this.keys.has(c));
    const jump = has("Space") || this.wantJump;
    const zap = has("KeyE") || has("KeyJ") || this.wantZap;
    this.wantJump = false;
    this.wantZap = false;
    if (this.injectAxis) {
      return { x: clamp(this.injectAxis.x, -1, 1), y: clamp(this.injectAxis.y, -1, 1), jump, zap, direct: false };
    }
    let x = 0;
    let y = 0;
    if (has("KeyA") || (!this.crew && has("ArrowLeft"))) x -= 1;
    if (has("KeyD") || (!this.crew && has("ArrowRight"))) x += 1;
    if (has("KeyW") || (!this.crew && has("ArrowUp"))) y -= 1;
    if (has("KeyS") || (!this.crew && has("ArrowDown"))) y += 1;
    if (this.injectSteer != null) x -= this.injectSteer;
    for (const p of this.pointers.values()) {
      if ((this.followOn || this.handsOn) && p.origin !== "p2") continue;
      const pad = p.origin === "p2" ? this.padRect("p2") : this.padRect("p1");
      const cx = pad.x + pad.w / 2;
      const cy = pad.y + pad.h / 2;
      const dx = (p.x - cx) / (pad.w * 0.9);
      const dy = (p.y - cy) / (pad.h * 0.9);
      if (p.origin === "p2" && this.crew) {
        /* applied in readP2 */
      } else {
        x += clamp(dx, -1, 1);
        y += clamp(dy, -1, 1);
      }
    }
    let direct = false;
    if (this.followOn && this.finger) {
      const aim = this.aimFinger();
      if (aim) {
        x = aim.x;
        y = aim.y;
        direct = !!aim.direct;
      }
    } else if (this.handsOn && this.is3d()) {
      const L = this.handVec(this.handL);
      const R = this.handVec(this.handR);
      x = clamp(x + L.x * 0.55 + R.x, -1, 1);
      y = clamp(y + L.y + R.y * 0.45, -1, 1);
      y = Math.min(0, y);
      direct = true;
    } else if (this.handsOn) {
      const L = this.handVec(this.handL);
      const R = this.handVec(this.handR);
      x += L.x + R.x;
      y += L.y + R.y;
    } else if (this.mouseOn && this.is3d()) {
      const aim = this.mouseAim();
      if (aim) {
        x = clamp(x + aim.x, -1, 1);
        y = clamp(y + aim.y, -1, 1);
      }
      y = Math.min(0, y);
      direct = true;
    } else if (this.mouseOn && !this.is3d() && this.mouseAt && this.mouseDown) {
      const aim = this.aimScreen(this.mouseAt.x, this.mouseAt.y);
      x = aim.x;
      y = aim.y;
    } else if (this.deviceTilt && this.tiltRead) {
      x = this.tiltRead.x;
      y = this.is3d() ? Math.min(0, this.tiltRead.y) : this.tiltRead.y;
      direct = this.is3d();
    }
    if (!direct) {
      const m = Math.hypot(x, y);
      if (m > 1) {
        x /= m;
        y /= m;
      }
    }
    return { x, y, jump, zap, direct };
  }

  private aimFinger(): { x: number; y: number; direct?: boolean } | null {
    if (!this.finger) return null;
    if (this.is3d() && this.bend) {
      const w = this.canvas.clientWidth || 1;
      const h = this.canvas.clientHeight || 1;
      return { ...this.bend.followAim(this.finger.x, this.finger.y, w, h), direct: true };
    }
    return this.aimScreen(this.finger.x, this.finger.y);
  }

  private aimScreen(sx: number, sy: number) {
    const world = this.screenToWorld(sx, sy);
    const dx = world.x - this.p1.x;
    const dy = world.y - this.p1.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 18) return { x: 0, y: 0 };
    const mag = clamp((dist - 18) / 90, 0.35, 1);
    return { x: (dx / dist) * mag, y: (dy / dist) * mag };
  }

  private drawUpright(x: number, y: number, zoom: number, draw: () => void) {
    const ctx = this.ctx;
    ctx.save();
    const m = ctx.getTransform();
    const p = new DOMPoint(x, y).matrixTransform(m);
    const dpr = paintScale();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(p.x / dpr, p.y / dpr);
    ctx.scale(zoom, zoom);
    draw();
    ctx.restore();
  }

  private screenToWorld(sx: number, sy: number) {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    const z = this.camZoom(w, h) || 1;
    const px = (sx - w / 2) / z;
    const py = (sy - h / 2) / z;
    const dy = py / OB_DEPTH;
    const dx = px - dy * OB_SHEAR;
    return { x: dx + this.cam.x, y: dy + this.cam.y };
  }

  private mouseAim(): { x: number; y: number } | null {
    if (!this.mouseAt) return null;
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    const nx = (this.mouseAt.x - w / 2) / (w * 0.34);
    const ny = (this.mouseAt.y - h / 2) / (h * 0.34);
    const curve = (v: number) => {
      const a = Math.min(1, Math.abs(v));
      if (a < 0.22) return 0;
      const u = (a - 0.22) / 0.78;
      return Math.sign(v) * u * u;
    };
    return { x: curve(nx), y: curve(ny) };
  }

  private handVec(hand: { ox: number; oy: number; x: number; y: number } | null) {
    if (!hand) return { x: 0, y: 0 };
    const soften = (v: number) => (Math.abs(v) < 0.14 ? 0 : v);
    return {
      x: soften(clamp((hand.x - hand.ox) / 84, -1, 1)),
      y: soften(clamp((hand.y - hand.oy) / 84, -1, 1)),
    };
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
    this.watchTilt(dt);
    if (this.phase === "pause") return;
    if (this.is3d()) {
      if (!this.bend) return;
      const stamps = this.gearLock ?? Object.keys(this.save.best).length;
      if (this.bend.gear !== stamps) this.bend.setGear(stamps);
      const playing = this.phase === "play";
      if (playing && this.tickIntro(dt)) return;
      if (this.hitstop > 0) {
        this.hitstop -= dt;
        return;
      }
      if (playing) this.time += dt;
      if (playing && !this.saidRoad) {
        this.saidRoad = true;
        this.note("Stay on my road. Jump a lock. I roll with you.");
      }
      const ev = this.bend?.step(dt, this.held(), playing);
      if (ev?.gem) {
        sfxGem();
        this.hitstop = 0.045;
        if (this.bend) this.bend.punch = 0.32;
        if (this.bend && this.bend.gemsGot >= this.bend.gemTotal && !this.portOpenSaid) {
          this.portOpenSaid = true;
          this.note("All bits in my pocket. Roll me into the port.");
        }
      }
      if (ev?.bump) sfxBump();
      if (ev?.boost) sfxBoost();
      if (ev?.check) sfxCheck();
      if (ev?.zap) sfxGem();
      if (ev?.tip) this.note(ev.tip);
      if (ev?.hurt) {
        sfxHurt();
        this.hearts -= 1;
        this.hitstop = 0.07;
        if (!this.saidHurt) {
          this.saidHurt = true;
          this.note(this.hearts > 0 ? "Still with you. Take a slower line." : "That was my last heart.");
        }
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
    if (this.isTube()) {
      if (this.phase !== "play") return;
      if (this.tickIntro(dt)) return;
      if (this.hitstop > 0) {
        this.hitstop -= dt;
        return;
      }
      this.time += dt;
      const ev = this.tubeSim?.step(dt, this.held(), this.reduced);
      if (ev?.turn) sfxBump();
      if (ev?.gem) {
        sfxGem();
        this.hitstop = 0.04;
      }
      if (ev?.boost) sfxBoost();
      if (ev?.tip) this.note(ev.tip);
      if (ev?.hurt) {
        sfxHurt();
        this.hearts -= 1;
        this.hitstop = 0.06;
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
      if (Math.floor(this.time * 10) !== Math.floor((this.time - dt) * 10)) this.emit();
      return;
    }
    if (this.phase !== "play") {
      if (this.phase === "title" || this.phase === "boot") {
        this.time += dt;
        this.cam.x = this.worldW / 2;
        this.cam.y = this.worldH / 2;
      }
      return;
    }
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      this.gemPulse += dt;
      this.zoomPunch = Math.max(0, this.zoomPunch - dt * 3.2);
      return;
    }
    if (this.tickIntro(dt)) return;
    this.time += dt;
    this.gemPulse += dt;
    const input = this.held();
    if (input.jump && !this.jumpWas && this.p1.alive && this.p1.hop <= 0) this.startHop(this.p1);
    this.jumpWas = input.jump;
    if (input.zap && !this.zapLock) {
      this.zapLock = true;
      let hit = false;
      for (const v of this.viruses) {
        if (v.dead) continue;
        if (Math.hypot(this.p1.x - v.x, this.p1.y - v.y) < TILE * 2.4) {
          v.dead = true;
          hit = true;
          this.burst(v.x, v.y, "#ff4fd8", 10);
        }
      }
      if (hit) this.note("Virus deleted. Antivirus removes that copy.");
      else if (this.viruses.some((v) => !v.dead)) this.note("Move closer, then tap Zap. It does not fire by itself.");
    }
    if (!input.zap) this.zapLock = false;
    const k = 4.2;
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
    this.pickups(this.p1, dt);
    if (this.p2) this.pickups(this.p2, dt);
    this.hazards(this.p1);
    if (this.p2) this.hazards(this.p2);
    this.coach(this.p1);
    this.socketHold(this.p1, dt);
    if (this.p2) this.socketHold(this.p2, dt);
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
    const air = b.hop > 0;
    if (air) {
      b.hop = Math.max(0, b.hop - dt);
      if (b.hop === 0) {
        b.squash = 0.7;
        this.burst(b.x, b.y, "#d6ff4a", 6);
      }
    }
    const slick = !air && this.onPad(b, this.ice);
    const grav = slick ? GRAVITY * 0.45 : GRAVITY;
    const fric = air ? FRICTION * 0.22 : slick ? 0.38 : FRICTION;
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
      if (b.hop <= 0) {
        this.boostBody(b, sdt);
        this.beltBody(b, sdt);
      }
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
      const kick = Object.keys(this.save.best).length >= 5 ? 1100 : 780;
      const m = Math.hypot(dx, dy) || 1;
      b.vx += (dx / m) * kick * dt;
      b.vy += (dy / m) * kick * dt;
      if (Math.random() < 0.08) this.burst(b.x, b.y, "#c8f542", 3);
    }
  }

  private beltBody(b: Body, dt: number) {
    for (const belt of this.belts) {
      if (b.x < belt.x || b.x > belt.x + belt.w || b.y < belt.y || b.y > belt.y + belt.h) continue;
      b.vx += belt.dx * 340 * dt;
      b.vy += belt.dy * 340 * dt;
    }
  }

  private startHop(b: Body) {
    b.hop = 0.48;
    b.squash = 1.28;
    sfxBoost();
    this.pops.push({ x: b.x, y: b.y, life: 0.45, max: 0.45, label: "Hop" });
    if (!this.saidHop) {
      this.saidHop = true;
      this.note("Hop. Jump a pit or a fan. Walls still stop you.");
    }
  }

  private coach(b: Body) {
    if (!b.alive) return;
    if (!this.saidPit) {
      for (const pit of this.pits) {
        const cx = pit.x + pit.w / 2;
        const cy = pit.y + pit.h / 2;
        if (Math.hypot(b.x - cx, b.y - cy) < 92) {
          this.saidPit = true;
          this.note("That hole is an open socket. Hop it, or go around.");
          return;
        }
      }
    }
    if (!this.saidFan) {
      for (const saw of this.saws) {
        if (Math.hypot(b.x - saw.x, b.y - saw.y) < 84) {
          this.saidFan = true;
          this.note("Those blades are a cooling fan. Wait, or hop.");
          return;
        }
      }
    }
    if (!this.saidIce && this.onPad(b, this.ice)) {
      this.saidIce = true;
      this.note("Slick lane. Thermal paste slides. Steer before it.");
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
  }

  /** 200ms before a socket counts. Same window as waiting-game runner HOLD_BOOST_WINDOW. MIT. Not a runner clone. */
  private socketHold(b: Body, dt: number) {
    if (!b.alive || b.hop > 0) {
      if (b.hop > 0) b.pitHold = 0;
      return;
    }
    let inPit = false;
    for (const pit of this.pits) {
      if (b.x > pit.x + 8 && b.x < pit.x + pit.w - 8 && b.y > pit.y + 8 && b.y < pit.y + pit.h - 8) {
        inPit = true;
        break;
      }
    }
    if (!inPit) {
      b.pitHold = 0;
      return;
    }
    b.pitHold += dt;
    if (b.pitHold >= 0.2) this.kill(b);
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

  private pickups(b: Body, dt: number) {
    if (!b.alive) return;
    const pull = (this.gearLock ?? Object.keys(this.save.best).length) >= 3;
    for (const g of this.gems) {
      if (g.got) continue;
      if (pull) {
        const dx = b.x - g.x;
        const dy = b.y - g.y;
        const d = Math.hypot(dx, dy);
        if (d > 10 && d < TILE * 2.4) {
          g.x += (dx / d) * 140 * dt;
          g.y += (dy / d) * 140 * dt;
        }
      }
      if (Math.hypot(b.x - g.x, b.y - g.y) < b.r + 14) {
        g.got = true;
        sfxGem();
        this.streak = this.time - this.lastGem < 2.6 ? this.streak + 1 : 1;
        this.lastGem = this.time;
        this.burst(g.x, g.y, this.streak > 1 ? "#ffc857" : "#c8f542", 14);
        this.pops.push({ x: g.x, y: g.y, life: 0.55, max: 0.55, label: this.streak > 1 ? `+${this.streak}` : "+1" });
        if (this.streak > 1 && !this.saidPocket) {
          this.saidPocket = true;
          this.note("Two bits close together. I like a streak.");
        }
        this.hitstop = 0.05;
        this.zoomPunch = 0.08;
        this.shake(0.12);
        if (!this.portOpenSaid && this.gems.every((gem) => gem.got)) {
          this.portOpenSaid = true;
          this.note("All bits in my pocket. Roll me into the port.");
        }
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
    if (!b.alive || b.hop > 0) return;
    for (const v of this.viruses) {
      if (v.dead) continue;
      if (Math.hypot(b.x - v.x, b.y - v.y) < b.r + 14) this.kill(b);
    }
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
    this.burst(b.x, b.y, "#c8f542", 16);
    this.hearts -= 1;
    if (!this.saidHurt) {
      this.saidHurt = true;
      this.note(this.hearts > 0 ? "Still with you. Take a slower line." : "That was my last heart.");
    }
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
    b.pitHold = 0;
    b.hop = 0;
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
      this.burst(this.p1.x, this.p1.y, "#c8f542", 28);
      this.burst(this.exit.x + this.exit.w / 2, this.exit.y + this.exit.h / 2, "#f4efe6", 18);
      this.awardClear();
      this.emit();
    }
  }

  private followCam(dt: number) {
    if (this.phase === "title" || this.phase === "boot") {
      this.cam.x = this.worldW / 2;
      this.cam.y = this.worldH / 2;
      return;
    }
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
    const visH = this.is3d() ? h / z : h / (z * OB_DEPTH);
    if (visW < this.worldW) this.cam.x = clamp(this.cam.x, visW / 2, this.worldW - visW / 2);
    else this.cam.x = this.worldW / 2;
    if (visH < this.worldH) this.cam.y = clamp(this.cam.y, visH / 2, this.worldH - visH / 2);
    else this.cam.y = this.worldH / 2;
  }

  private drawBoard(ctx: CanvasRenderingContext2D) {
    const key = `${this.course.id}:${this.worldW}x${this.worldH}`;
    if (!this.boardImg || this.boardFor !== key) {
      const pad = Math.ceil(WALL_H / OB_DEPTH + 28);
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.ceil(this.worldW + pad * 2));
      c.height = Math.max(1, Math.ceil(this.worldH + pad * 2));
      const g = c.getContext("2d");
      if (!g) return;
      g.translate(pad, pad);
      this.paintBoard(g);
      this.boardImg = c;
      this.boardFor = key;
      this.boardPad = pad;
    }
    ctx.drawImage(this.boardImg, -this.boardPad, -this.boardPad);
  }

  private paintBoard(ctx: CanvasRenderingContext2D) {
    const dye = dyeFor(this.course.id);
    const look = pcbLook(this.course.id);
    const lip = 16;
    const ux = (lip / OB_DEPTH) * OB_SHEAR;
    const uy = -lip / OB_DEPTH;
    ctx.fillStyle = "#070b12";
    ctx.beginPath();
    ctx.moveTo(0, this.worldH);
    ctx.lineTo(this.worldW, this.worldH);
    ctx.lineTo(this.worldW - ux, this.worldH - uy);
    ctx.lineTo(-ux, this.worldH - uy);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.worldW, 0);
    ctx.lineTo(this.worldW, this.worldH);
    ctx.lineTo(this.worldW - ux, this.worldH - uy);
    ctx.lineTo(this.worldW - ux, -uy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = look.mask;
    ctx.fillRect(0, 0, this.worldW, this.worldH);
    if (this.floorPat) {
      ctx.save();
      ctx.fillStyle = this.floorPat;
      ctx.globalAlpha = 0.18;
      ctx.fillRect(0, 0, this.worldW, this.worldH);
      ctx.restore();
    }
    this.drawLane(ctx);
    this.drawTraces(ctx, look.copper);
    for (const slick of this.ice) {
      ctx.fillStyle = "rgba(157,176,196,0.28)";
      ctx.fillRect(slick.x + 2, slick.y + 2, slick.w - 4, slick.h - 4);
      ctx.strokeStyle = "rgba(244,239,230,0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(slick.x + 8, slick.y + 8, slick.w - 16, slick.h - 16);
    }
    for (const pad of this.boosts) {
      ctx.fillStyle = dye.accent;
      ctx.globalAlpha = 0.28;
      ctx.fillRect(pad.x + 4, pad.y + 4, pad.w - 8, pad.h - 8);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = dye.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const cx = pad.x + pad.w / 2;
      const cy = pad.y + pad.h / 2;
      ctx.moveTo(cx - 8, cy + 6);
      ctx.lineTo(cx, cy - 8);
      ctx.lineTo(cx + 8, cy + 6);
      ctx.stroke();
    }
    for (const ring of this.checks) {
      ctx.strokeStyle = "rgba(244,239,230,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ring.x + ring.w / 2, ring.y + ring.h / 2, 14, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const pit of this.pits) {
      ctx.fillStyle = "#040910";
      ctx.fillRect(pit.x + 2, pit.y + 2, pit.w - 4, pit.h - 4);
      ctx.fillStyle = "#3ee0ff";
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) ctx.fillRect(pit.x + 12 + i * 10, pit.y + 12 + j * 10, 3, 3);
      }
    }
    const lx = (WALL_H / OB_DEPTH) * OB_SHEAR;
    const ly = -WALL_H / OB_DEPTH;
    const walls = this.walls.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    for (const wall of walls) {
      const x = wall.x;
      const y = wall.y;
      const ww = wall.w;
      const hh = wall.h;
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(x + 4, y + 5, ww, hh);
      ctx.fillStyle = look.chip;
      ctx.beginPath();
      ctx.moveTo(x + ww, y);
      ctx.lineTo(x + ww, y + hh);
      ctx.lineTo(x + ww + lx, y + hh + ly);
      ctx.lineTo(x + ww + lx, y + ly);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#0c0e10";
      ctx.beginPath();
      ctx.moveTo(x, y + hh);
      ctx.lineTo(x + ww, y + hh);
      ctx.lineTo(x + ww + lx, y + hh + ly);
      ctx.lineTo(x + lx, y + hh + ly);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = look.chip;
      ctx.globalAlpha = 1;
      ctx.fillRect(x + lx, y + ly, ww, hh);
      ctx.fillStyle = look.copper;
      ctx.fillRect(x + lx + 3, y + ly + Math.min(4, hh * 0.35), Math.max(0, ww - 6), 3);
    }
  }

  private drawLane(ctx: CanvasRenderingContext2D) {
    const rows = this.course.rows;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === "#") continue;
        ctx.fillStyle = "rgba(210, 245, 170, 0.22)";
        ctx.fillRect(c * TILE + 2, r * TILE + 2, TILE - 4, TILE - 4);
      }
    }
    ctx.fillStyle = "rgba(122, 240, 255, 0.45)";
    ctx.fillRect(this.exit.x + 6, this.exit.y + 10, this.exit.w - 12, this.exit.h - 16);
  }

  private drawTraces(ctx: CanvasRenderingContext2D, copper: string) {
    const rows = this.course.rows;
    const open = (r: number, c: number) => {
      const row = rows[r];
      if (!row || c < 0 || c >= row.length) return false;
      return row[c] !== "#";
    };
    ctx.fillStyle = copper;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === "#") continue;
        const x = c * TILE;
        const y = r * TILE;
        const mid = TILE * 0.42;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(x + mid, y + mid, TILE * 0.16, TILE * 0.16);
        ctx.globalAlpha = 0.55;
        if (open(r, c + 1)) ctx.fillRect(x + mid, y + mid, TILE, TILE * 0.1);
        if (open(r + 1, c)) ctx.fillRect(x + mid, y + mid, TILE * 0.1, TILE);
      }
    }
    ctx.globalAlpha = 1;
  }

  private camZoom(w: number, h: number) {
    const boardW = this.worldW + this.worldH * OB_SHEAR;
    const boardH = this.worldH * OB_DEPTH + WALL_H;
    const zFit = Math.min(w / (boardW + 36), h / (boardH + 36));
    if (this.phase === "title" || this.phase === "boot") return Math.max(0.2, zFit);
    const zFill = h / Math.max(1, boardH * 0.92);
    const zLocal = w / (12.2 * TILE);
    const zWant = h > w ? Math.min(zLocal, w / (9 * TILE)) : Math.max(zLocal, zFill);
    return Math.max(zFit, zWant) * (1 + this.zoomPunch);
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
    if (this.particles.length > 48) this.particles.splice(0, this.particles.length - 48);
  }

  private size() {
    const dpr = paintScale();
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
    if (this.isTube()) {
      this.tubeSim?.draw(ctx, w, h, this.reduced);
      this.drawPads(w, h);
      return;
    }
    if (this.is3d()) {
      this.bend?.render(this.phase === "play" || this.phase === "pause");
      this.drawPads(w, h);
      return;
    }
    const shake = this.cam.trauma * this.cam.trauma;
    const ox = this.reduced ? 0 : (Math.random() * 2 - 1) * 10 * shake;
    const oy = this.reduced ? 0 : (Math.random() * 2 - 1) * 10 * shake;
    const viewZ = this.camZoom(w, h);
    const dye = dyeFor(this.course.id);
    ctx.fillStyle = dye.ink;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2 + ox, h / 2 + oy);
    ctx.scale(viewZ, viewZ);
    ctx.transform(1, 0, OB_SHEAR, OB_DEPTH, 0, 0);
    ctx.translate(-this.cam.x, -this.cam.y);
    this.drawBoard(ctx);

    for (const belt of this.belts) {
      ctx.fillStyle = dye.accent;
      ctx.globalAlpha = 0.22;
      ctx.fillRect(belt.x + 3, belt.y + 3, belt.w - 6, belt.h - 6);
      ctx.globalAlpha = 1;
      const cx = belt.x + belt.w / 2 + Math.sin(this.time * 6) * 6 * belt.dx;
      const cy = belt.y + belt.h / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 6);
      ctx.lineTo(cx + 10, cy);
      ctx.lineTo(cx - 10, cy + 6);
      ctx.closePath();
      ctx.fill();
    }

    for (const v of this.viruses) {
      if (v.dead) continue;
      this.drawUpright(v.x, v.y, viewZ, () => {
        ctx.fillStyle = "#ff4fd8";
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(10, 6);
        ctx.lineTo(-10, 6);
        ctx.closePath();
        ctx.fill();
      });
    }

    const spr = this.sprites;
    if (spr) {
      this.drawUpright(this.exit.x + this.exit.w / 2, this.exit.y + this.exit.h * 0.8, viewZ, () => {
        ctx.drawImage(spr.gate, -this.exit.w / 2, -this.exit.h, this.exit.w, this.exit.h);
      });
      for (const c of this.crates) {
        const s = c.r * 2.2;
        this.drawUpright(c.x, c.y, viewZ, () => {
          ctx.drawImage(spr.crate, -s / 2, -s * 0.9, s, s);
        });
      }
      for (const g of this.gems) {
        if (g.got) continue;
        const bob = Math.sin((this.time + g.t) * 4) * 3;
        this.drawUpright(g.x, g.y, viewZ, () => {
          ctx.fillStyle = "#ffe56a";
          ctx.beginPath();
          ctx.moveTo(0, -16 + bob);
          ctx.lineTo(12, bob);
          ctx.lineTo(0, 16 + bob);
          ctx.lineTo(-12, bob);
          ctx.closePath();
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#f6efe2";
          ctx.stroke();
        });
      }
      for (const s of this.saws) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(this.time * 8);
        ctx.fillStyle = "#c4622d";
        ctx.beginPath();
        ctx.arc(0, 0, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#f6efe2";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = dye.accent;
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.ellipse(s.r * 0.42, 0, s.r * 0.42, s.r * 0.16, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#070908";
        ctx.beginPath();
        ctx.arc(0, 0, s.r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      const trail = document.documentElement.dataset.skin;
      if (trail) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = trail === "rainbow" ? `hsl(${(performance.now() / 8) % 360} 100% 60%)` : trail;
        ctx.beginPath();
        ctx.arc(this.p1.x - Math.cos(this.p1.angle) * 14, this.p1.y - Math.sin(this.p1.angle) * 14, 7, 0, Math.PI * 2);
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
      this.drawUpright(p.x, p.y - u * 18, viewZ, () => {
        ctx.globalAlpha = 1 - u;
        ctx.fillStyle = "#c8f542";
        ctx.font = "700 14px Outfit, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(p.label, 0, 0);
        ctx.globalAlpha = 1;
      });
    }

    ctx.restore();
    this.drawPads(w, h);
  }

  private drawBody(b: Body, frames: HTMLImageElement[], alpha: number) {
    const idle = this.phase === "title" ? Math.sin(this.time * 1.4) * 22 : 0;
    const x = b.px + (b.x - b.px) * alpha + idle;
    const y = b.py + (b.y - b.py) * alpha;
    const fi = Math.floor(this.time * 8) % 4;
    const ctx = this.ctx;
    ctx.save();
    const stamps = Object.keys(this.save.best).length;
    if (stamps >= 7 && b.alive) {
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > 8) {
        ctx.fillStyle = "#3ee0ff";
        for (let i = 1; i <= 3; i++) {
          ctx.globalAlpha = 0.22 / i;
          ctx.beginPath();
          ctx.arc(x - (b.vx / sp) * 9 * i, y - (b.vy / sp) * 9 * i, Math.max(3, b.r * 0.28), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
    if (stamps >= 1 && b.alive) {
      ctx.strokeStyle = "#c8f542";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, b.r + 10, this.time * 2.2, this.time * 2.2 + 1.5);
      ctx.stroke();
    }
    if (stamps >= 10 && b.alive) {
      ctx.strokeStyle = "#f5c542";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, b.r + 16, -this.time * 1.6, -this.time * 1.6 + Math.PI);
      ctx.stroke();
    }
    ctx.translate(x, y);
    const hopU = b.hop > 0 ? Math.sin((1 - b.hop / 0.48) * Math.PI) : 0;
    ctx.fillStyle = "rgba(5,6,5,0.38)";
    ctx.beginPath();
    ctx.ellipse(0, b.r * 0.78, b.r * 0.72, b.r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const zoom = this.camZoom(this.canvas.clientWidth || 1, this.canvas.clientHeight || 1);
    this.drawUpright(x, y, zoom, () => {
      const lift = hopU * 28;
      ctx.translate(0, -lift);
      ctx.rotate(b.angle);
      ctx.translate(0, stamps >= 1 ? Math.sin(this.time * 6) * 1.4 : 0);
      ctx.scale(b.squash * (1 + hopU * 0.16), (2 - b.squash) * (1 + hopU * 0.16));
      ctx.globalAlpha = b.alive ? 1 : Math.max(0, 1 - b.fall * 1.6);
      const size = b.r * 2.9;
      ctx.drawImage(frames[fi], -size / 2, -size * 0.72, size, size);
    });
  }

  private drawGhost(frames: HTMLImageElement[]) {
    if (!this.save.ghostOn || this.ghostPlay.length < 2) return;
    const i = Math.min(this.ghostPlay.length - 1, Math.floor(this.time / 0.1));
    const g = this.ghostPlay[i];
    const ctx = this.ctx;
    const s = 16 * 2.35;
    const zoom = this.camZoom(this.canvas.clientWidth || 1, this.canvas.clientHeight || 1);
    this.drawUpright(g.x, g.y, zoom, () => {
      ctx.rotate(g.a);
      ctx.globalAlpha = 0.32;
      ctx.drawImage(frames[Math.floor(this.time * 8) % 4], -s / 2, -s * 0.72, s, s);
    });
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
    ctx.fillStyle = "rgba(200,245,66,0.95)";
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, 5);
    ctx.lineTo(-5, -5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawPads(w: number, h: number) {
    if (this.phase !== "play") return;
    const ctx = this.ctx;
    const draw = (rect: { x: number; y: number; w: number; h: number }, _label: string, vec: { x: number; y: number }) => {
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      const r = Math.min(rect.w, rect.h) * 0.42;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.strokeStyle = "rgba(232,255,228,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#d6ff4a";
      ctx.beginPath();
      ctx.arc(cx + vec.x * r * 0.45, cy + vec.y * r * 0.45, 14, 0, Math.PI * 2);
      ctx.fill();
    };
    const stick = (ox: number, oy: number, vec: { x: number; y: number }, label: string, ghost: boolean) => {
      ctx.save();
      ctx.globalAlpha = ghost ? 0.45 : 1;
      ctx.fillStyle = "rgba(11,18,32,0.72)";
      ctx.strokeStyle = "rgba(122,240,255,0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox, oy, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#d6ff4a";
      ctx.beginPath();
      ctx.arc(ox + vec.x * 26, oy + vec.y * 26, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    if (this.handsOn && !this.crew) {
      const left = this.padRect("p1");
      const right = this.padRect("p2");
      const lv = this.handVec(this.handL);
      const rv = this.handVec(this.handR);
      stick(this.handL ? this.handL.ox : left.x + left.w / 2, this.handL ? this.handL.oy : left.y + left.h / 2, lv, "", !this.handL);
      stick(this.handR ? this.handR.ox : right.x + right.w / 2, this.handR ? this.handR.oy : right.y + right.h / 2, rv, "", !this.handR);
    } else if (this.mouseOn && this.is3d()) {
      const aim = this.mouseAim() ?? { x: 0, y: 0 };
      draw(this.padRect("p1"), "MOUSE", { x: aim.x, y: Math.min(0, aim.y) });
      ctx.strokeStyle = "rgba(214,255,74,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 16, h / 2);
      ctx.lineTo(w / 2 + 16, h / 2);
      ctx.moveTo(w / 2, h / 2 - 16);
      ctx.lineTo(w / 2, h / 2 + 16);
      ctx.stroke();
      ctx.fillStyle = "#f6efe2";
      ctx.font = "700 13px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("WASD + mouse", w / 2, h / 2 + 32);
    } else if (this.mouseOn && !this.is3d()) {
      if (this.mouseDown && this.mouseAt) {
        ctx.strokeStyle = "#d6ff4a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.mouseAt.x, this.mouseAt.y, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#f6efe2";
        ctx.beginPath();
        ctx.arc(this.mouseAt.x, this.mouseAt.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.deviceTilt) {
      draw(this.padRect("p1"), "TILT", this.tiltRead ?? { x: 0, y: 0 });
    } else if (!this.followOn) {
      draw(this.padRect("p1"), this.is3d() ? "STEER" : this.crew ? "P1" : "LEAN", this.is3d() ? this.held() : this.tilt);
    }
    if (this.crew) draw(this.padRect("p2"), "P2", this.readP2());
    if (this.followOn && this.finger) {
      ctx.strokeStyle = "#d6ff4a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.finger.x, this.finger.y, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#f6efe2";
      ctx.beginPath();
      ctx.arc(this.finger.x, this.finger.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    void w;
    void h;
  }

  flushSave() {
    writeSave(this.save);
  }

  /** Browser Back during a run returns to the boards. It does not wipe stars. */
  guardBack() {
    if (this.phase === "title" || this.phase === "boot") return false;
    this.phase = "title";
    writeSave(this.save);
    this.emit();
    return true;
  }

  private awardClear() {
    const t = this.time;
    const id = this.course.id;
    const counted = () => COURSES.filter((c) => !c.arcade && this.save.best[c.id] != null).length;
    const before = counted();
    if (this.course.arcade) {
      this.lastEarn = 8;
      this.save.watts += 8;
    } else {
      const gain = earnOnClear(this.save.best, id, t, this.course.par);
      this.lastEarn = gain.watts;
      this.save.watts += gain.watts;
    }
    const prev = this.save.best[id];
    if (prev == null || t < prev) {
      this.save.best[id] = t;
      if (!this.is3d() && this.ghostLive.length > 4) this.save.ghosts[id] = this.ghostLive.slice();
    }
    const gift = botGift(before, counted());
    this.lastBot = gift?.name ?? "";
    this.lastBotLine = gift?.line ?? "";
    this.bend?.setGear(Object.keys(this.save.best).length);
    const who = signedWho();
    if (who) {
      postScore({
        code: who.code,
        alias: who.alias,
        courseId: id,
        time: t,
        stars: 0,
        par: this.course.par,
        at: new Date().toISOString(),
      });
      const stars = starsFor(t, this.course.par);
      recordClear({
        version: CHIP,
        level: id,
        score: stars,
        max: 3,
        stars,
        xp: this.lastEarn,
        ms: Math.round(t * 1000),
      });
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
    const board = courseForPart(id);
    if (board && this.save.best[board.id] == null) return `Clear ${board.name} before this part.`;
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

  setGoal(id: PcGoal) {
    this.save.goal = id;
    const key = this.save.code || "";
    this.save.profiles = { ...this.save.profiles, [key]: profileOf(this.save) };
    this.needGoal = false;
    writeSave(this.save);
    this.emit();
  }

  cancelBrief() {
    this.needBrief = false;
    this.briefPass = false;
    this.emit();
  }

  ackBrief(lessonId: LessonId | null) {
    if (lessonId) this.passLesson(lessonId);
    this.briefPass = true;
    this.needBrief = false;
    this.startPlay();
  }

  pullSession() {
    const who = signedWho();
    const alias = who?.alias ?? "";
    const code = who?.code ?? "";
    if (alias === this.save.alias && code === this.save.code) {
      this.emit();
      return;
    }
    const profiles = { ...(this.save.profiles ?? {}) };
    profiles[this.save.code || ""] = profileOf(this.save);
    if (code && !profiles[code]) profiles[code] = profileOf(this.save);
    const next = code ? profiles[code] : (profiles[""] ?? profileOf(this.save));
    this.save = {
      ...this.save,
      ...next,
      mute: this.save.mute,
      ghostOn: this.save.ghostOn,
      inducted: this.save.inducted,
      welcome: this.save.welcome,
      alias,
      code,
      profiles,
    };
    writeSave(this.save);
    this.bend?.setGear(Object.keys(this.save.best).length);
    this.emit();
  }

  setAlias(_raw: string) {
    this.pullSession();
  }

  finishInduction() {
    this.save.inducted = true;
    this.save.welcome = "5";
    markHowto();
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
      alias: this.save.alias,
      goal: this.save.goal,
    });
  }

  importPack(raw: unknown): string | null {
    const parsed = parsePack(raw);
    if ("error" in parsed) return parsed.error;
    const pack = parsed.pack;
    const who = signedWho();
    this.save = {
      ...this.save,
      best: pack.best,
      watts: pack.watts,
      parts: pack.parts,
      passed: pack.passed,
      booted: pack.booted,
      ghostOn: pack.ghostOn,
      alias: who?.alias ?? "",
      code: who?.code ?? "",
      goal: asGoal(pack.goal) || this.save.goal,
      ghosts: {},
    };
    writeSave(this.save);
    if (who) {
      for (const row of pack.successes) {
        postScore({ code: who.code, alias: who.alias, courseId: row.id, time: row.time, stars: row.stars, par: 0, at: pack.saved });
      }
    }
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

  fast(n: number) {
    for (let i = 0; i < n; i++) this.step(STEP);
  }

  skipIntro() {
    this.intro = 0;
    this.go = 0;
  }

  stars() {
    if (this.phase !== "win") return 0;
    return starsFor(this.time, this.course.par);
  }

  private armIntro() {
    this.intro = 3;
    this.go = 0;
    this.introMark = 3;
    sfxCount();
  }

  private tickIntro(dt: number) {
    if (this.go > 0) this.go = Math.max(0, this.go - dt);
    if (this.intro <= 0) return false;
    this.intro -= dt;
    const mark = this.intro <= 0 ? 0 : Math.ceil(this.intro);
    if (mark !== this.introMark) {
      this.introMark = mark;
      if (mark === 0) {
        this.go = 0.5;
        sfxGo();
      } else sfxCount();
      this.emit();
    }
    return this.intro > 0;
  }

  private note(text: string) {
    if (!text) return;
    this.tip = text;
    this.tipUntil = performance.now() + 2800;
    this.emit();
  }

  emit() {
    if (this.destroyed) return;
    const gems = this.is3d() ? (this.bend?.gemsGot ?? 0) : this.isTube() ? (this.tubeSim?.got ?? 0) : this.gems.filter((g) => g.got).length;
    const gemTotal = this.is3d() ? (this.bend?.gemTotal ?? 0) : this.isTube() ? (this.tubeSim?.gemTotal ?? 0) : this.gems.length;
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
      fullUnlock: this.fullUnlock,
      alias: this.save.alias,
      code: this.save.code,
      botGift: this.lastBot,
      botLine: this.lastBotLine,
      tip: performance.now() < this.tipUntil ? this.tip : "",
      follow: this.followOn,
      tilt: this.deviceTilt,
      mouse: this.mouseOn,
      hands: this.handsOn,
      goal: this.save.goal,
      needGoal: this.needGoal,
      needBrief: this.needBrief,
      intro: this.intro > 0 ? Math.ceil(this.intro) : 0,
      go: this.go > 0,
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
