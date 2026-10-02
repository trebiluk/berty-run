import { Bend3D } from "./bend3d";
import { COURSES, TILE } from "./courses";
import { easeOf, clearPose, floorBoxes, lanePose, onFloor, ringClear, roadWidth } from "./track-layout";
import { TRACKS, type TrackDef } from "./tracks3d";

export type SelfLine = { ok: boolean; name: string; detail: string };

const DT = 1 / 60;

export function runRespawnSelftest(): { ok: boolean; lines: SelfLine[] } {
  const lines: SelfLine[] = [];
  const fail = (name: string, detail: string) => lines.push({ ok: false, name, detail });
  const pass = (name: string, detail: string) => lines.push({ ok: true, name, detail });
  const canvas = { style: {} } as HTMLCanvasElement;

  for (const def of TRACKS) {
    const hazards = ringClear(def);
    if (hazards.length) fail(`${def.id} rings`, hazards.join("; "));
    else pass(`${def.id} rings`, "3 m clear");

    const boxes = floorBoxes(def);
    const spots = spotsFor(def, boxes);
    const bot = new Bend3D(canvas, true);
    bot.load(def.id, true);
    bot.setTitle(false);
    let loops = 0;
    for (const spot of spots) {
      const idle = dwell(bot, def, spot.x, spot.z, false);
      const drive = dwell(bot, def, spot.x, spot.z, true);
      if (!idle.ok) {
        fail(`${def.id} ${spot.name} idle`, idle.detail);
        loops += idle.recovers;
      } else pass(`${def.id} ${spot.name} idle`, "grounded");
      if (!drive.ok) {
        fail(`${def.id} ${spot.name} drive`, drive.detail);
        loops += drive.recovers;
      } else pass(`${def.id} ${spot.name} drive`, "grounded");
    }
    const edge = rollOff(bot, def, boxes);
    const soft = easeOf(def.id) > 0.4;
    if (edge.recovers > 1 || (soft && edge.hurts > 0) || edge.hurts > 1) {
      fail(`${def.id} edge`, `recovers=${edge.recovers} hurts=${edge.hurts}`);
      loops += Math.max(0, edge.recovers - 1);
    } else pass(`${def.id} edge`, `recovers=${edge.recovers}`);
    if (loops > 0) fail(`${def.id} loops`, String(loops));
    else pass(`${def.id} loops`, "0");
    bot.dispose();
  }

  for (const course of COURSES) {
    if (course.mode === "3d" || course.id === "tube-run") continue;
    const rows = course.rows;
    const hazards: { x: number; y: number }[] = [];
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === "X" || ch === "V") hazards.push({ x: x + 0.5, y: y + 0.5 });
      });
    });
    for (const saw of course.saws ?? []) hazards.push({ x: saw.x, y: saw.y });
    let rings = 0;
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch !== "P") return;
        rings += 1;
        const cx = x + 0.5;
        const cy = y + 0.5;
        const hit = hazards.find((h) => Math.hypot(h.x - cx, h.y - cy) * TILE < 40);
        if (hit) fail(`${course.id} 2d ring`, `${Math.round(Math.hypot(hit.x - cx, hit.y - cy) * TILE)}px`);
      });
    });
    if (!lines.some((l) => !l.ok && l.name.startsWith(`${course.id} 2d`))) {
      pass(`${course.id} 2d ring`, rings ? "clear" : "none");
    }
  }

  return { ok: lines.every((l) => l.ok), lines };
}

function spotsFor(def: TrackDef, boxes: ReturnType<typeof floorBoxes>) {
  const spots = [
    { name: "start", x: 0, z: 0 },
    ...(def.checks ?? []).map((c, i) => ({ name: `ring ${i}`, x: c.x, z: c.z })),
  ];
  const seen = new Set(spots.map((s) => `${s.x.toFixed(1)},${s.z.toFixed(1)}`));
  for (const s of def.segs) {
    const mx = (s.x1 + s.x2) / 2;
    const mz = (s.z1 + s.z2) / 2;
    const dx = s.x2 - s.x1;
    const dz = s.z2 - s.z1;
    const len = Math.hypot(dx, dz) || 1;
    const side = (s.narrow ? 2.3 : roadWidth(def.id)) / 2 + 0.55;
    const ox = (-dz / len) * side;
    const oz = (dx / len) * side;
    for (const sign of [1, -1]) {
      const x = mx + ox * sign;
      const z = mz + oz * sign;
      if (onFloor(boxes, x, z, 0)) continue;
      const back = clearPose(def, x, z);
      const key = `${back.x.toFixed(1)},${back.z.toFixed(1)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      spots.push({ name: `recover ${s.x1},${s.z1}`, x: back.x, z: back.z });
    }
  }
  return spots;
}

function drop(bot: Bend3D, def: TrackDef, x: number, z: number) {
  const pose = lanePose(def, x, z);
  const on = onFloor(floorBoxes(def), x, z, 0);
  bot.pos.set(on ? x : pose.x, 0.44, on ? z : pose.z);
  bot.vel.set(0, 0, 0);
  bot.yaw = pose.yaw;
  bot.steerSm = 0;
  bot.grounded = true;
  bot.alive = true;
  bot.fall = 0;
  bot.grace = 0;
  bot.safeHold = 0;
  bot.recoverTimes = [];
  bot.recovers = 0;
  bot.jumpWas = false;
}

function dwell(bot: Bend3D, def: TrackDef, x: number, z: number, drive: boolean) {
  drop(bot, def, x, z);
  const start = bot.recovers;
  let hurts = 0;
  for (let n = 0; n < 120; n++) {
    const input = drive ? driveInput(bot, def) : { x: 0, y: 0, jump: false, zap: false };
    const ev = bot.step(DT, input, true);
    if (ev.hurt) hurts += 1;
  }
  const recovers = bot.recovers - start;
  const ok = bot.pos.y > -0.2 && bot.alive && recovers === 0 && hurts === 0;
  return { ok, recovers, detail: `y=${bot.pos.y.toFixed(2)} recovers=${recovers} hurts=${hurts}` };
}

function driveInput(bot: Bend3D, def: TrackDef) {
  const fx = -Math.sin(bot.yaw);
  const fz = -Math.cos(bot.yaw);
  const speed = Math.hypot(bot.vel.x, bot.vel.z);
  const reach = 1.8 + speed * 1.15;
  const boxes = floorBoxes(def);
  let blocked = bot.pos.y < 0.15;
  for (let d = 0.4; d <= reach; d += 0.4) {
    const x = bot.pos.x + fx * d;
    const z = bot.pos.z + fz * d;
    if (!onFloor(boxes, x, z, 0.35)) blocked = true;
    for (const s of bot.saws) if (Math.hypot(x - s.x, z - s.z) < 1.8) blocked = true;
    for (const bug of bot.bugs) if (!bug.dead && Math.hypot(x - bug.x, z - bug.z) < 1.7) blocked = true;
  }
  return { x: 0, y: blocked ? 0 : -1, jump: false, zap: false };
}

function rollOff(bot: Bend3D, def: TrackDef, boxes: ReturnType<typeof floorBoxes>) {
  const s = def.segs[0];
  if (!s) return { recovers: 0, hurts: 0 };
  const dx = s.x2 - s.x1;
  const dz = s.z2 - s.z1;
  const len = Math.hypot(dx, dz) || 1;
  const side = (s.narrow ? 2.3 : roadWidth(def.id)) / 2 + 1.15;
  const x = (s.x1 + s.x2) / 2 + (-dz / len) * side;
  const z = (s.z1 + s.z2) / 2 + (dx / len) * side;
  if (onFloor(boxes, x, z, 0)) return { recovers: 0, hurts: 0 };
  drop(bot, def, x, z);
  bot.pos.set(x, 0.44, z);
  bot.yaw = 0;
  let hurts = 0;
  const start = bot.recovers;
  for (let n = 0; n < 300; n++) {
    const ev = bot.step(DT, { x: 0, y: 0 }, true);
    if (ev.hurt) hurts += 1;
  }
  return { recovers: bot.recovers - start, hurts };
}
