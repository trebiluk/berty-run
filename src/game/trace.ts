// First Trace — fixed PCB lane.
// Jump timing adapted from ftaip/waiting-game `runner` (MIT): auto-scroll,
// one JUMP, hold-gravity window, obstacle timing. No skins, no endless
// cactus field. See docs/NOTICE-waiting-game.md.
//
// Assist (default): a tap inside the glow cue clears that beat. A tap near
// the middle of the cue also takes the gem. A tap on the edge of the glow
// still clears, and can miss the gem — that is the "not working" teach.

export const SPEED = 240;
export const GRAVITY = 1400;
export const HOLD_GRAVITY = 900;
export const HOLD_WINDOW = 0.2;
export const JUMP_V = -720;
export const MAX_FALL = 980;
export const GROUND = 400;
export const PW = 34;
export const PH = 44;
export const VIEW_W = 960;
export const VIEW_H = 540;
export const START_X = 200;
export const COYOTE = 0.12;
export const STEP = 1 / 60;

export const CHIP = "BR 1.4.0";
export const SAVE_KEY = "berty-run-l1-best";

export type Phase = "title" | "play" | "pause" | "fail" | "short" | "win";
export type BeatKind = "gap" | "spike" | "overhang" | "window";

export type Beat = {
  id: string;
  kind: BeatKind;
  x: number;
  w: number;
  h: number;
  /** Bottom of the lintel. Window only. */
  barBottom: number;
  cueFrom: number;
  cueTo: number;
  gemFrom: number;
  gemTo: number;
  gemX: number;
  gemY: number;
  gemR: number;
  hasGem: boolean;
};

export type Player = {
  x: number;
  y: number;
  vy: number;
  onGround: boolean;
  coyote: number;
  holdT: number;
  assistId: string | null;
  assistT: number;
  gemId: string | null;
};

export type Run = {
  phase: Phase;
  p: Player;
  time: number;
  gems: boolean[];
  hint: string;
  hintT: number;
  mash: number[];
  best: number | null;
  mute: boolean;
  hot: boolean;
};

export type TickInput = { jumpEdge: boolean; jumpHeld: boolean };

type Raw = {
  id: string;
  kind: BeatKind;
  x: number;
  w: number;
  h: number;
  barBottom: number;
  hasGem: boolean;
};

const RAWS: Raw[] = [
  { id: "gap", kind: "gap", x: 1680, w: 92, h: 0, barBottom: 0, hasGem: false },
  { id: "via", kind: "spike", x: 3520, w: 30, h: 54, barBottom: 0, hasGem: true },
  { id: "chip", kind: "overhang", x: 5480, w: 108, h: 76, barBottom: 0, hasGem: true },
  { id: "slot", kind: "window", x: 7240, w: 78, h: 34, barBottom: GROUND - 310, hasGem: true },
];

export const EXIT = { x: START_X + SPEED * 34, y: GROUND - 168, w: 92, h: 168 };
export const WORLD_W = EXIT.x + 520;

function raws(): Raw[] {
  return RAWS.map((b) => ({ ...b }));
}

export function fmtTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.max(0, t % 60);
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}

function overlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function groundYAt(cx: number, beats: Raw[]): number | null {
  for (const b of beats) {
    if (b.kind === "gap" && cx >= b.x && cx < b.x + b.w) return null;
    if ((b.kind === "overhang" || b.kind === "window") && cx >= b.x && cx < b.x + b.w) {
      return GROUND - b.h;
    }
  }
  return GROUND;
}

function spawn(x = START_X): Player {
  return {
    x,
    y: GROUND - PH,
    vy: 0,
    onGround: true,
    coyote: COYOTE,
    holdT: 0,
    assistId: null,
    assistT: 0,
    gemId: null,
  };
}

/** Natural physics. Rescue is applied by the caller, not here. */
export function integrate(
  p: Player,
  dt: number,
  jumpEdge: boolean,
  jumpHeld: boolean,
  beats: Raw[],
): "ok" | "dead" {
  if (jumpEdge && (p.onGround || p.coyote > 0)) {
    p.vy = JUMP_V;
    p.onGround = false;
    p.coyote = 0;
    p.holdT = 0;
  }

  p.x += SPEED * dt;

  if (!p.onGround) {
    const boosting = jumpHeld && p.vy < 0 && p.holdT < HOLD_WINDOW;
    const g = boosting ? HOLD_GRAVITY : GRAVITY;
    p.vy = Math.min(MAX_FALL, p.vy + g * dt);
    p.holdT += dt;
    p.y += p.vy * dt;
    p.coyote = Math.max(0, p.coyote - dt);
  }

  const cx = p.x + PW / 2;
  const floor = groundYAt(cx, beats);

  if (p.onGround) {
    if (floor == null || floor > p.y + PH + 2) {
      p.onGround = false;
      p.coyote = COYOTE;
    } else {
      p.y = floor - PH;
      p.vy = 0;
    }
  }

  if (!p.onGround && floor != null && p.vy >= 0 && p.y + PH >= floor && p.y + PH <= floor + 28) {
    p.y = floor - PH;
    p.vy = 0;
    p.onGround = true;
    p.coyote = COYOTE;
    p.holdT = 0;
  }

  if (floor == null && p.y + PH > GROUND + 2) return "dead";
  if (p.y > VIEW_H + 20) return "dead";
  if (hits(p, beats)) return "dead";
  return "ok";
}

function hits(p: Player, beats: Raw[]) {
  const ix = p.x + 3;
  const iy = p.y + 6;
  const iw = PW - 6;
  const ih = PH - 8;
  for (const b of beats) {
    if (b.kind === "spike") {
      if (overlap(ix, iy, iw, ih, b.x, GROUND - b.h, b.w, b.h)) return true;
    } else if (b.kind === "overhang" || b.kind === "window") {
      const top = GROUND - b.h;
      if (overlap(ix, iy, iw, ih, b.x, top + 4, b.w, b.h - 4)) return true;
      if (b.kind === "window") {
        if (overlap(p.x, p.y, PW, PH, b.x - 4, b.barBottom - 18, b.w + 8, 18)) return true;
      }
    }
  }
  return false;
}

function probeJump(jumpX: number, only: Raw | null): { alive: boolean; samples: { x: number; y: number }[] } {
  const beats = only ? [only] : raws();
  const p = spawn(jumpX);
  const samples: { x: number; y: number }[] = [];
  let alive = true;
  const limit = only ? only.x + only.w + 280 : WORLD_W;
  for (let i = 0; i < 220; i++) {
    const edge = i === 0;
    const fate = integrate(p, STEP, edge, false, beats);
    samples.push({ x: p.x + PW / 2, y: p.y + PH / 2 });
    if (fate === "dead") {
      alive = false;
      break;
    }
    if (p.x > limit && p.onGround) break;
  }
  return { alive, samples };
}

function reaches(samples: { x: number; y: number }[], gx: number, gy: number, r: number) {
  let best = Infinity;
  for (const s of samples) {
    const d = Math.hypot(s.x - gx, s.y - gy);
    if (d < best) best = d;
  }
  return best <= r;
}

function apexOf(jumpX: number, beat: Raw) {
  const { samples } = probeJump(jumpX, beat);
  let best = samples[0] ?? { x: jumpX, y: GROUND - 80 };
  for (const s of samples) if (s.y < best.y) best = s;
  return best;
}

function buildBeats(): Beat[] {
  return raws().map((raw) => {
    const clears: number[] = [];
    const start = raw.x - 420;
    const end = raw.x + 40;
    for (let x = start; x <= end; x += 4) {
      if (probeJump(x, raw).alive) clears.push(x);
    }
    if (clears.length < 4) {
      throw new Error(`First Trace beat ${raw.id} has no clear jump`);
    }
    const cuePad = 28;
    const base = {
      id: raw.id,
      kind: raw.kind,
      x: raw.x,
      w: raw.w,
      h: raw.h,
      barBottom: raw.barBottom,
      cueFrom: clears[0] - cuePad,
      cueTo: clears[clears.length - 1] + 12,
      hasGem: raw.hasGem,
    };
    if (!raw.hasGem) {
      return { ...base, gemFrom: 0, gemTo: 0, gemX: 0, gemY: 0, gemR: 0 };
    }
    const mid = clears[Math.floor(clears.length / 2)];
    const apex = apexOf(mid, raw);
    const gemX = apex.x;
    const gemY = apex.y;
    let gemR = 22;
    let gemXs: number[] = [];
    for (let attempt = 0; attempt < 8; attempt++) {
      gemXs = clears.filter((x) => reaches(probeJump(x, raw).samples, gemX, gemY, gemR));
      const cover = gemXs.length / clears.length;
      if (gemXs.length >= 3 && cover >= 0.22 && cover <= 0.7) break;
      if (cover > 0.7) gemR = Math.max(8, gemR - 3);
      else gemR += 4;
    }
    if (gemXs.length < 3) gemXs = clears.slice(Math.floor(clears.length * 0.35), Math.floor(clears.length * 0.65));
    return {
      ...base,
      gemFrom: gemXs[0],
      gemTo: gemXs[gemXs.length - 1],
      gemX,
      gemY,
      gemR,
    };
  });
}

export const BEATS: Beat[] = buildBeats();

export type FloorSpan = { x: number; w: number; y: number };

export function floorSpans(): FloorSpan[] {
  const cuts: { x: number; y: number | null }[] = [{ x: 0, y: GROUND }];
  for (const b of BEATS) {
    if (b.kind === "gap") {
      cuts.push({ x: b.x, y: null });
      cuts.push({ x: b.x + b.w, y: GROUND });
    } else if (b.kind === "overhang" || b.kind === "window") {
      cuts.push({ x: b.x, y: GROUND - b.h });
      cuts.push({ x: b.x + b.w, y: GROUND });
    }
  }
  cuts.push({ x: WORLD_W, y: GROUND });
  const spans: FloorSpan[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const y = cuts[i].y;
    const w = cuts[i + 1].x - cuts[i].x;
    if (y == null || w <= 0) continue;
    spans.push({ x: cuts[i].x, w, y });
  }
  return spans;
}

function asRaw(beats: Beat[]): Raw[] {
  return beats.map((b) => ({
    id: b.id,
    kind: b.kind,
    x: b.x,
    w: b.w,
    h: b.h,
    barBottom: b.barBottom,
    hasGem: b.hasGem,
  }));
}

const RAW_BEATS = asRaw(BEATS);

function rescue(p: Player, beat: Beat) {
  if (beat.kind === "gap") {
    p.y = Math.min(p.y, GROUND - PH - 88);
    p.vy = Math.min(p.vy, -20);
    p.onGround = false;
    return;
  }
  if (beat.kind === "window") {
    const sill = GROUND - beat.h;
    if (p.y + PH > sill - 10) {
      p.y = sill - PH - 70;
      p.vy = Math.min(p.vy, -40);
      p.onGround = false;
    }
    return;
  }
  const top = GROUND - beat.h;
  if (p.y + PH > top - 8) {
    p.y = top - PH - 16;
    p.vy = Math.min(p.vy, -20);
    p.onGround = false;
  }
}

export function freshRun(best: number | null, mute = false): Run {
  return {
    phase: "title",
    p: spawn(),
    time: 0,
    gems: [false, false, false],
    hint: "",
    hintT: 0,
    mash: [],
    best,
    mute,
    hot: false,
  };
}

export function begin(run: Run): Run {
  return {
    ...run,
    phase: "play",
    p: spawn(),
    time: 0,
    gems: [false, false, false],
    hint: "",
    hintT: 0,
    mash: [],
    hot: false,
  };
}

function beatById(id: string | null) {
  if (!id) return null;
  return BEATS.find((b) => b.id === id) ?? null;
}

export function stepRun(run: Run, dt: number, input: TickInput): Run {
  if (run.phase === "title" || run.phase === "pause") return run;
  if (run.phase !== "play") return run;

  const next: Run = {
    ...run,
    p: { ...run.p },
    gems: run.gems.slice(),
    mash: run.mash.slice(),
    time: run.time + dt,
    hintT: Math.max(0, run.hintT - dt),
  };
  if (next.hintT === 0) next.hint = "";
  const p = next.p;
  p.assistT = Math.max(0, p.assistT - dt);

  if (input.jumpEdge) {
    next.mash = [...next.mash.filter((t) => next.time - t < 1.4), next.time];
    if (next.mash.length >= 5) {
      next.hint = "Tap JUMP on the glow.";
      next.hintT = 2.4;
    }
    const cue = BEATS.find((b) => p.x >= b.cueFrom && p.x <= b.cueTo);
    if (cue && (p.onGround || p.coyote > 0)) {
      p.assistId = cue.id;
      p.assistT = 1.15;
      if (p.x >= cue.gemFrom && p.x <= cue.gemTo) p.gemId = cue.id;
      else p.gemId = null;
    }
  }

  let fate = integrate(p, dt, input.jumpEdge, input.jumpHeld, RAW_BEATS);
  const assist = p.assistT > 0 ? beatById(p.assistId) : null;
  if (fate === "dead" && assist && p.x < assist.x + assist.w + PW + 8) {
    rescue(p, assist);
    fate = "ok";
  }

  const gemsOnPath = BEATS.filter((b) => b.hasGem);
  for (let i = 0; i < gemsOnPath.length; i++) {
    if (next.gems[i]) continue;
    const b = gemsOnPath[i];
    const body = Math.hypot(p.x + PW / 2 - b.gemX, p.y + PH / 2 - b.gemY) <= b.gemR + 8;
    const locked = p.gemId === b.id && p.x + PW / 2 >= b.gemX - 6;
    if (body || locked) next.gems[i] = true;
  }

  const upcoming = BEATS.find((b) => p.x < b.x + b.w && p.x > b.cueFrom - 300);
  next.hot = !!upcoming && p.x >= upcoming.cueFrom && p.x <= upcoming.cueTo;

  if (fate === "dead") {
    next.phase = "fail";
    next.hot = false;
    return next;
  }

  const atExit = overlap(p.x, p.y, PW, PH, EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  if (atExit) {
    const got = next.gems.filter(Boolean).length;
    next.hot = false;
    if (got >= 3) {
      next.phase = "win";
      if (next.best == null || next.time < next.best) next.best = next.time;
    } else {
      next.phase = "short";
    }
  }
  return next;
}

export function glowFor(run: Run) {
  if (run.phase !== "play") return null;
  const b = BEATS.find((beat) => run.p.x > beat.cueFrom - 280 && run.p.x < beat.x + beat.w + 20);
  if (!b) return null;
  const span = Math.max(1, b.cueTo - (b.cueFrom - 280));
  const k = Math.min(1, Math.max(0, (run.p.x - (b.cueFrom - 280)) / span));
  return { beat: b, hot: run.p.x >= b.cueFrom && run.p.x <= b.cueTo, k };
}

export function gemCount(run: Run) {
  return run.gems.filter(Boolean).length;
}

export function readBest(): number | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function writeBest(n: number) {
  try {
    localStorage.setItem(SAVE_KEY, String(n));
  } catch {
    /* private mode */
  }
}
