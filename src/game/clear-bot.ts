import type { Engine } from "./engine";
import { COURSES, TILE } from "./courses";
import { floorBoxes, onFloor } from "./track-layout";
import { trackById, type TrackDef } from "./tracks3d";
import type { CourseId } from "./types";

export type BotRow = {
  level: string;
  magnet: "off" | "on";
  result: "clear" | "fail";
  bits: string;
  time: string;
  recovers: number;
  hearts: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const paths = new Map<string, { x: number; z: number }[]>();
const floors = new Map<string, ReturnType<typeof floorBoxes>>();
let cursor = 0;
let rewound = false;
let holdLane = 0;

export async function runClearBot(eng: Engine) {
  eng.tryFullUnlock("5656");
  eng.setGoal("gaming");
  if (!eng.mute) eng.toggleMute();
  eng.halt = true;
  const rows: BotRow[] = [];
  const only = typeof process !== "undefined" ? process.env.BOT_ONLY : "";
  const magOnly = typeof process !== "undefined" && process.env.BOT_MAGNET != null ? Number(process.env.BOT_MAGNET) : null;
  for (const magnet of [0, 3] as const) {
    if (magOnly != null && magnet !== magOnly) continue;
    for (const course of COURSES) {
      if (only && !only.split(",").includes(course.id)) continue;
      const row = await clearLevel(eng, course.id, magnet);
      rows.push(row);
      paint(rows);
      console.log(`${row.result.toUpperCase()}  ${row.level}  magnet ${row.magnet}  ${row.bits}  ${row.time}s  recovers ${row.recovers}  hearts ${row.hearts}`);
      await sleep(0);
    }
  }
  eng.halt = false;
  eng.injectAxis = null;
  const fails = rows.filter((r) => r.result !== "clear").length;
  console.log(fails ? `BOT FAIL ${fails}` : `BOT PASS ${rows.length}`);
  return rows;
}

function paint(rows: BotRow[]) {
  const pre = document.getElementById("bot-report") ?? document.createElement("pre");
  pre.id = "bot-report";
  const head = "level | magnet | result | bits | time | recovers | hearts";
  pre.textContent = [head, ...rows.map((r) => `${r.level} | ${r.magnet} | ${r.result} | ${r.bits} | ${r.time} | ${r.recovers} | ${r.hearts}`)].join("\n");
  if (!pre.parentElement) document.body.appendChild(pre);
}

async function clearLevel(eng: Engine, id: CourseId, magnet: number): Promise<BotRow> {
  let last: BotRow | null = null;
  for (const pace of [0.78, 0.5]) {
    for (const tight of [false, true]) {
      last = await attempt(eng, id, magnet, pace, tight);
      if (typeof process !== "undefined" && process.env.BOT_PACE) {
        console.log(`  pace ${pace}${tight ? " tight" : ""} ${last.result} ${last.bits} ${last.time}s rec ${last.recovers}`);
      }
      if (last.result === "clear") return last;
      if (typeof process !== "undefined" && process.env.BOT_TRY === "1") return last;
    }
  }
  return last!;
}

async function attempt(eng: Engine, id: CourseId, magnet: number, pace: number, tight = false): Promise<BotRow> {
  eng.halt = true;
  eng.gearLock = magnet;
  eng.injectAxis = null;
  cursor = 0;
  rewound = false;
  holdLane = 0;
  eng.selectCourse(id);
  if (eng.course.mode === "3d") {
    for (let i = 0; i < 80 && eng.bend?.trackId !== id; i++) await sleep(40);
  }
  eng.ackBrief(null);
  eng.skipIntro();
  const name = eng.course.name;
  const plan = { pts: [] as { x: number; y: number }[], i: 0, tick: 0, bias: 0 };
  const tube = { latch: 0 };
  const limit = 110;
  let steps = 0;
  let stuck = 0;
  let px = eng.course.mode === "3d" ? (eng.bend?.pos.x ?? 0) : eng.p1.x;
  let pz = eng.course.mode === "3d" ? (eng.bend?.pos.z ?? 0) : eng.p1.y;
  while (eng.phase === "play" && eng.time < limit && steps < limit * 60) {
    const input =
      eng.course.mode === "3d"
        ? aim3(eng, pace, stuck > 45, tight)
        : eng.course.id === "tube-run"
          ? aimTube(eng, tube)
          : aim2(eng, plan, pace, stuck > 36);
    eng.injectAxis = { x: input.x, y: input.y };
    if (input.jump) eng.requestJump();
    if (input.zap) eng.requestZap();
    eng.fast(4);
    steps += 4;
    const x = eng.course.mode === "3d" ? (eng.bend?.pos.x ?? 0) : eng.p1.x;
    const z = eng.course.mode === "3d" ? (eng.bend?.pos.z ?? 0) : eng.p1.y;
    if (Math.hypot(x - px, z - pz) < 0.12) stuck += 4;
    else {
      stuck = 0;
      px = x;
      pz = z;
    }
    if (steps % 240 === 0) {
      if (typeof process !== "undefined" && process.env.BOT_DEBUG) {
        const b = eng.bend;
        const sim = eng.tubeSim;
        console.log(
          "t",
          eng.time.toFixed(1),
          eng.phase,
          eng.course.mode === "3d" ? `pos ${b?.pos.x.toFixed(1)},${b?.pos.z.toFixed(1)} yaw ${b?.yaw.toFixed(2)} g ${b?.gemsGot} y ${b?.pos.y.toFixed(2)}` : sim ? `z ${sim.z.toFixed(1)} face ${sim.face} got ${sim.got} fall ${sim.falling.toFixed(2)}` : `p ${eng.p1.x.toFixed(0)},${eng.p1.y.toFixed(0)} g ${eng.gems.filter((g) => g.got).length}`,
        );
      }
      await sleep(0);
    }
  }
  eng.injectAxis = null;
  if (typeof process !== "undefined" && process.env.BOT_PACE && eng.bend && eng.course.mode === "3d") {
    const left = eng.bend.gemMeshes.filter((g) => !g.got).map((g) => `${g.home.x.toFixed(1)},${g.home.z.toFixed(1)}`);
    console.log(`  at ${eng.bend.pos.x.toFixed(1)},${eng.bend.pos.z.toFixed(1)} left ${left.join(" | ") || "none"} phase ${eng.phase}`);
  }
  const gems =
    eng.course.mode === "3d"
      ? (eng.bend?.gemsGot ?? 0)
      : eng.course.id === "tube-run"
        ? (eng.tubeSim?.got ?? 0)
        : eng.gems.filter((g) => g.got).length;
  const total =
    eng.course.mode === "3d"
      ? (eng.bend?.gemTotal ?? 0)
      : eng.course.id === "tube-run"
        ? (eng.tubeSim?.gemTotal ?? 0)
        : eng.gems.length;
  return {
    level: name,
    magnet: magnet >= 3 ? "on" : "off",
    result: eng.phase === "win" && gems >= total ? "clear" : "fail",
    bits: `${gems}/${total}`,
    time: eng.time.toFixed(1),
    recovers: eng.course.mode === "3d" ? (eng.bend?.recovers ?? 0) : 0,
    hearts: eng.hearts,
  };
}

function aim2(
  eng: Engine,
  plan: { pts: { x: number; y: number }[]; i: number; tick: number; bias: number },
  pace: number,
  stuck: boolean,
) {
  plan.tick += 1;
  if (!plan.pts.length || plan.tick % 8 === 0) {
    plan.pts = route2d(eng);
    plan.i = 0;
  }
  const body = eng.p1;
  while (plan.i < plan.pts.length && Math.hypot(body.x - plan.pts[plan.i].x, body.y - plan.pts[plan.i].y) < 20) plan.i += 1;
  const t = plan.pts[Math.min(plan.i, Math.max(0, plan.pts.length - 1))];
  if (!t) return { x: 0, y: 0, jump: false, zap: false };
  let dx = t.x - body.x;
  let dy = t.y - body.y;
  if (stuck) {
    plan.bias = plan.bias > 0 ? -1 : 1;
    dx += -dy * plan.bias;
    dy += dx * 0.2 * plan.bias;
  }
  let jump = false;
  const bitsIn = eng.gems.every((g) => g.got);
  for (const s of eng.saws) {
    const d = Math.hypot(body.x - s.x, body.y - s.y);
    if (!bitsIn && d < 90) {
      dx += ((body.x - s.x) / Math.max(1, d)) * 120;
      dy += ((body.y - s.y) / Math.max(1, d)) * 120;
    }
    if (d < 72) jump = true;
  }
  if (eng.course.id === "mind-the-pit" && Object.keys(eng.save.best).length >= 5) {
    for (const pad of eng.boosts) {
      const cx = pad.x + pad.w / 2;
      const cy = pad.y + pad.h / 2;
      if (Math.hypot(body.x - cx, body.y - cy) < 70) jump = true;
    }
  }
  let zap = false;
  for (const v of eng.viruses) {
    if (v.dead) continue;
    if (Math.hypot(body.x - v.x, body.y - v.y) < 120) zap = true;
  }
  const m = Math.hypot(dx, dy) || 1;
  const mag = Math.min(pace, m < 36 ? 0.32 : pace);
  return { x: (dx / m) * mag, y: (dy / m) * mag, jump: jump || stuck, zap };
}

function route2d(eng: Engine) {
  const rows = eng.course.rows;
  const h = rows.length;
  const w = rows[0].length;
  const allowPit = eng.gems.every((g) => g.got);
  const blocked = (c: number, r: number) => {
    if (c < 0 || r < 0 || c >= w || r >= h) return true;
    const ch = rows[r][c];
    if (ch === "#" || ch === "C") return true;
    if (ch === "X" && !allowPit) return true;
    return false;
  };
  const cell = (x: number, y: number) => ({ c: Math.floor(x / TILE), r: Math.floor(y / TILE) });
  const start = cell(eng.p1.x, eng.p1.y);
  const pending = eng.gems.filter((g) => !g.got).map((g) => cell(g.homeX, g.homeY));
  const exit = cell(eng.exit.x + eng.exit.w / 2, eng.exit.y + eng.exit.h / 2);
  let goal = exit;
  let best = Infinity;
  for (const g of pending) {
    const d = Math.hypot(g.c - start.c, g.r - start.r);
    if (d < best) {
      best = d;
      goal = g;
    }
  }
  const path = astar(blocked, w, h, start, goal);
  return path.map((p) => ({ x: (p.c + 0.5) * TILE, y: (p.r + 0.5) * TILE }));
}

function astar(
  blocked: (c: number, r: number) => boolean,
  w: number,
  h: number,
  start: { c: number; r: number },
  goal: { c: number; r: number },
) {
  const key = (c: number, r: number) => c + r * w;
  const open = [start];
  const g = new Map<number, number>([[key(start.c, start.r), 0]]);
  const prev = new Map<number, number>();
  const seen = new Set<number>();
  while (open.length) {
    open.sort((a, b) => (g.get(key(a.c, a.r)) ?? 0) + Math.hypot(a.c - goal.c, a.r - goal.r) - ((g.get(key(b.c, b.r)) ?? 0) + Math.hypot(b.c - goal.c, b.r - goal.r)));
    const cur = open.shift()!;
    const id = key(cur.c, cur.r);
    if (seen.has(id)) continue;
    seen.add(id);
    if (cur.c === goal.c && cur.r === goal.r) {
      const out = [cur];
      let walk = id;
      while (prev.has(walk)) {
        const p = prev.get(walk)!;
        out.push({ c: p % w, r: Math.floor(p / w) });
        walk = p;
      }
      return out.reverse();
    }
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const c = cur.c + dc;
      const r = cur.r + dr;
      if (blocked(c, r)) continue;
      const nid = key(c, r);
      const ng = (g.get(id) ?? 0) + 1;
      if (ng < (g.get(nid) ?? Infinity)) {
        g.set(nid, ng);
        prev.set(nid, id);
        open.push({ c, r });
      }
    }
  }
  return [start];
}

function laneOf(def: TrackDef) {
  const hit = paths.get(def.id);
  if (hit) return hit;
  const raw: { x: number; z: number }[] = [];
  for (const s of def.segs) {
    const dx = s.x2 - s.x1;
    const dz = s.z2 - s.z1;
    const len = Math.hypot(dx, dz) || 1;
    const n = Math.max(1, Math.ceil(len / 1.1));
    for (let i = raw.length ? 1 : 0; i <= n; i++) raw.push({ x: s.x1 + (dx * i) / n, z: s.z1 + (dz * i) / n });
  }
  const boxes = floorBoxes(def);
  const narrow = (x: number, z: number) =>
    def.segs.some((s) => s.narrow && Math.hypot((s.x1 + s.x2) / 2 - x, (s.z1 + s.z2) / 2 - z) < Math.hypot(s.x2 - s.x1, s.z2 - s.z1) / 2 + 1);
  const hazards = [
    ...(def.saws ?? []).map((s) => ({ x: s.x, z: s.z, r: 2.15 })),
    ...(def.bugs ?? []).filter((b) => b.kind !== "virus").map((b) => ({ x: b.x, z: b.z, r: 1.8 })),
    ...(def.crate ? [{ x: def.crate.x, z: def.crate.z, r: 1.9 }] : []),
    ...(def.lamps ?? []).map((l) => ({ x: l.x, z: l.z, r: 1.05 })),
    ...(def.boosts ?? [])
      .filter((b) => !narrow(b.x, b.z) && !(def.gems ?? []).some((g) => Math.hypot(g.x - b.x, g.z - b.z) < 1.2))
      .map((b) => ({ x: b.x, z: b.z, r: 2.2 })),
  ];
  const pts = raw.map((p, i) => {
    let hazard: { x: number; z: number; r: number } | null = null;
    let gap = 99;
    for (const h of hazards) {
      const d = Math.hypot(p.x - h.x, p.z - h.z);
      if (d < h.r && h.r - d < gap) {
        hazard = h;
        gap = h.r - d;
      }
    }
    if (!hazard) return p;
    const prev = raw[Math.max(0, i - 1)];
    const next = raw[Math.min(raw.length - 1, i + 1)];
    const tx = next.x - prev.x;
    const tz = next.z - prev.z;
    const m = Math.hypot(tx, tz) || 1;
    const shift = Math.min(2.2, gap + 0.4);
    const a = { x: p.x + (-tz / m) * shift, z: p.z + (tx / m) * shift };
    const b = { x: p.x - (-tz / m) * shift, z: p.z - (tx / m) * shift };
    if (onFloor(boxes, a.x, a.z, 0.4)) return a;
    if (onFloor(boxes, b.x, b.z, 0.4)) return b;
    return p;
  });
  pts.push({ x: def.gate.x, z: def.gate.z });
  paths.set(def.id, pts);
  return pts;
}

function wrap(a: number) {
  let d = a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function aim3(eng: Engine, pace: number, stuck: boolean, tight = false) {
  const b = eng.bend;
  if (!b || !b.trackId) return { x: 0, y: 0, jump: false, zap: false };
  const def = trackById(b.trackId);
  const pts = laneOf(def);
  let best = Math.min(cursor, pts.length - 1);
  let bestD = Math.hypot(pts[best].x - b.pos.x, pts[best].z - b.pos.z);
  for (let i = best; i < Math.min(pts.length, best + 8); i++) {
    const d = Math.hypot(pts[i].x - b.pos.x, pts[i].z - b.pos.z);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  if (bestD > 3.6) {
    bestD = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.hypot(pts[i].x - b.pos.x, pts[i].z - b.pos.z);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
  }
  const gems = b.gemMeshes.filter((g) => !g.got);
  if (stuck && !rewound) {
    rewound = true;
    best = Math.max(0, best - 8);
    holdLane = 80;
    for (const g of gems) {
      let bi = 0;
      let bd = Infinity;
      for (let i = 0; i < pts.length; i++) {
        const d = Math.hypot(pts[i].x - g.home.x, pts[i].z - g.home.z);
        if (d < bd) {
          bd = d;
          bi = i;
        }
      }
      if (bi + 2 < cursor) best = Math.min(best, bi);
    }
  } else if (!stuck) rewound = false;
  cursor = best;
  const lane = pts[best];
  const off = Math.hypot(lane.x - b.pos.x, lane.z - b.pos.z);
  const iced = b.ices.some((ice) => b.pos.x > ice.min.x && b.pos.x < ice.max.x && b.pos.z > ice.min.z && b.pos.z < ice.max.z);
  const look = iced ? 4 : tight ? 1 : 3;
  const grip = def.id === "shop-exit" ? 0.7 : 1.1;
  const ahead = off > grip && !iced ? lane : pts[Math.min(pts.length - 1, best + look)];
  let tx = ahead.x;
  let tz = ahead.z;
  if (holdLane > 0) holdLane -= 1;
  else if (!gems.length && off < 1.4) {
    tx = b.gate.x;
    tz = b.gate.z;
  } else if (off < 1.4) {
    let gd = 7;
    for (const g of gems) {
      const d = Math.hypot(g.home.x - b.pos.x, g.home.z - b.pos.z);
      const saw = b.saws.some((s) => Math.hypot(g.home.x - s.x, g.home.z - s.z) < 2.35 && Math.hypot(b.pos.x - s.x, b.pos.z - s.z) < 4);
      const bug = b.bugs.some((u) => !u.dead && Math.hypot(g.home.x - (u.kind === "worm" ? u.base : u.x), g.home.z - u.z) < 1.6);
      if (!saw && !bug && d < gd) {
        gd = d;
        tx = g.home.x;
        tz = g.home.z;
      }
    }
  }
  let jump = false;
  let zap = false;
  let slow = false;
  let creep = false;
  if (b.ease <= 0.2) {
    const far = pts[Math.min(pts.length - 1, best + 4)];
    const prev = pts[Math.max(0, best - 1)];
    const h1 = Math.atan2(-(lane.x - prev.x), -(lane.z - prev.z));
    const h2 = Math.atan2(-(far.x - lane.x), -(far.z - lane.z));
    if (Math.abs(wrap(h2 - h1)) > 0.45) slow = true;
  }
  for (const bug of b.bugs) {
    if (bug.dead) continue;
    const d = Math.hypot(b.pos.x - bug.x, b.pos.z - bug.z);
    if (bug.kind === "worm" && b.ease <= 0.4) {
      const ad = Math.hypot(b.pos.x - bug.base, b.pos.z - bug.z) || 1;
      if (d < 2.6) zap = true;
      if (ad < 6.2) {
        tx = bug.base + ((b.pos.x - bug.base) / ad) * 2.55;
        tz = bug.z + ((b.pos.z - bug.z) / ad) * 2.55;
        slow = true;
        creep = ad < 4.5;
      }
      continue;
    }
    if (d < 2.7) zap = true;
    const onSaw = b.saws.some((s) => Math.hypot(s.x - bug.x, s.z - bug.z) < 1.3);
    if (!onSaw && d < 5 && d > 2.15) {
      tx = bug.x + ((b.pos.x - bug.x) / d) * 2.2;
      tz = bug.z + ((b.pos.z - bug.z) / d) * 2.2;
      slow = true;
    }
    if (bug.kind !== "virus" && d < 2.3) jump = true;
  }
  for (const s of b.saws) {
    const d = Math.hypot(b.pos.x - s.x, b.pos.z - s.z);
    if (d < 3.2) slow = true;
    if (d < 2.4) jump = true;
  }
  if (def.id === "around-the-bend" && Math.abs(b.pos.x - 16) < 1.6 && b.pos.z < -26 && b.pos.z > -36) {
    tx = 16;
    tz = Math.min(b.pos.z - 2.4, -28);
    if (Math.abs(b.pos.x - 16) > 0.4) slow = true;
  }
  if (def.id === "shop-exit") {
    const fanGem = b.gemMeshes.find((g) => !g.got && Math.hypot(g.home.x - 18.3, g.home.z + 22) < 1.2);
    if (fanGem && b.pos.x > 10 && b.pos.z < -13 && b.pos.z > -26) {
      if (b.pos.x < 17.4) {
        tx = 18.5;
        tz = Math.min(-16, b.pos.z - 1.2);
      } else {
        tx = fanGem.home.x;
        tz = fanGem.home.z;
      }
      slow = true;
    } else if (b.pos.z < -41 && Math.abs(b.pos.x - 18) < 2.4) {
      tx = 18;
      tz = b.pos.z - 2.6;
    }
  }
  if (def.id === "signal-hop" && b.pos.x > -3.2 && b.pos.z > -13) {
    if (b.pos.z > -8.2) {
      tx = 0;
      tz = -8;
    } else if (b.pos.z < -11) {
      tx = b.pos.x;
      tz = -10.2;
      slow = true;
    } else {
      tx = -2.4;
      tz = -12;
      slow = true;
    }
  }
  if (def.id === "signal-hop" && b.pos.x <= -2.2 && b.pos.z < -9.4) {
    const virus = b.bugs.find((u) => !u.dead && u.kind === "virus");
    if (virus) {
      const vd = Math.hypot(b.pos.x - virus.x, b.pos.z - virus.z) || 1;
      if (vd < 2.65) zap = true;
      if (b.pos.z < -10.7) {
        tx = b.pos.x;
        tz = -10.15;
      } else {
        tx = -7.4;
        tz = -10.15;
      }
      slow = true;
    }
  }
  if (def.id === "blade-walk" && b.pos.z < -20) {
    const s = b.saws.find((saw) => saw.z < -20);
    const gem = b.gemMeshes.find((g) => !g.got && g.home.z < -22 && g.home.z > -26);
    if (s) {
      const sd = Math.hypot(b.pos.x - s.x, b.pos.z - s.z);
      if (gem && b.pos.z < -20.5 && Math.abs(b.pos.x - gem.home.x) < 2.2 && sd > 1.7) {
        tx = gem.home.x + 0.8;
        tz = gem.home.z + 0.7;
        slow = true;
      } else if (sd < 4.5 && b.pos.x > s.x - 2.2) {
        tx = b.pos.z < s.z + 1.5 ? s.x : s.x - 2.6;
        tz = s.z + 2.15;
        slow = true;
      }
    }
  }
  if (def.id === "shop-exit" && b.pos.z < -37 && b.pos.z > -48 && b.pos.x < 16) {
    tx = Math.min(18, b.pos.x + 2.5);
    tz = -44.3;
    slow = true;
  }
  const desired = Math.atan2(-(tx - b.pos.x), -(tz - b.pos.z));
  let diff = desired - b.yaw;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const sp = Math.hypot(b.vel.x, b.vel.z);
  const prevH = pts[Math.max(0, best - 1)];
  const farH = pts[Math.min(pts.length - 1, best + 4)];
  const bend = Math.abs(wrap(Math.atan2(-(farH.x - lane.x), -(farH.z - lane.z)) - Math.atan2(-(lane.x - prevH.x), -(lane.z - prevH.z))));
  const coast = b.ease <= 0.25 && sp > 5.5 && bend > 0.35;
  const throttle = coast ? 0 : iced ? Math.max(pace, 0.8) : creep ? 0.28 : slow ? Math.min(pace, 0.42) : pace;
  const y = Math.abs(diff) > 0.85 ? 0 : -throttle;
  return { x: Math.max(-1, Math.min(1, -diff / 0.28)), y, jump, zap };
}

function aimTube(eng: Engine, tube: { latch: number }) {
  const sim = eng.tubeSim;
  if (!sim) return { x: 0, y: 0, jump: false, zap: false };
  const floor = (c: string) => c === "#" || c === "K" || c === "s" || c === "f" || c === "c" || c === "o" || c === "E" || c === "w";
  const here = sim.look(0, 0);
  const ahead = sim.look(1, 0);
  const right = sim.look(1, 1);
  const left = sim.look(1, -1);
  const rightHere = sim.look(0, 1);
  const leftHere = sim.look(0, -1);
  let x = 0;
  let jump = false;
  const needBits = sim.got < sim.gemTotal;
  if (here === "w") jump = sim.face === 0;
  else if (needBits && (rightHere === "o" || right === "o")) x = 1;
  else if (needBits && (leftHere === "o" || left === "o")) x = -1;
  else if (!needBits && (rightHere === "E" || right === "E")) x = 1;
  else if (!needBits && (leftHere === "E" || left === "E")) x = -1;
  else if (!floor(ahead)) {
    if (floor(right)) x = 1;
    else if (floor(left)) x = -1;
  }
  if (x !== 0) {
    if (tube.latch) {
      x = 0;
      tube.latch = 0;
    } else tube.latch = 1;
  } else tube.latch = 0;
  return { x, y: 0, jump, zap: false };
}
