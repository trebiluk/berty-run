import type { TrackDef } from "./tracks3d";

const EASE_ORDER = ["around-the-bend", "pit-drop", "blade-walk", "dark-bay", "slick-shelf", "shop-exit", "signal-hop", "case-drop"];

export function easeOf(id: string) {
  const i = EASE_ORDER.indexOf(id);
  if (i < 0) return 0.5;
  return 1 - i / (EASE_ORDER.length - 1);
}

export type Box = { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number; kind: "floor" | "wall" };

export function roadWidth(id: string) {
  return 5.2 + easeOf(id) * 1.8;
}

export function floorBoxes(def: TrackDef): Box[] {
  const W = roadWidth(def.id);
  const H = 0.5;
  const boxes: Box[] = [];
  const deck = (x: number, z: number, w: number, d: number) => {
    boxes.push({ minX: x - w / 2, maxX: x + w / 2, minY: -H, maxY: 0, minZ: z - d / 2, maxZ: z + d / 2, kind: "floor" });
  };
  for (const s of def.segs) {
    const cx = (s.x1 + s.x2) / 2;
    const cz = (s.z1 + s.z2) / 2;
    const len = Math.hypot(s.x2 - s.x1, s.z2 - s.z1);
    const alongX = Math.abs(s.x2 - s.x1) > Math.abs(s.z2 - s.z1);
    const ww = s.narrow ? 2.3 : W;
    if (alongX) deck(cx, cz, len + ww * 0.12, ww);
    else deck(cx, cz, ww, len + ww * 0.12);
  }
  for (const c of def.corners) deck(c.x, c.z, W + 0.4, W + 0.4);
  return boxes;
}

export function onFloor(boxes: Box[], x: number, z: number, margin = 0) {
  const pts = margin <= 0 ? [[x, z]] : [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return [x + Math.cos(a) * margin, z + Math.sin(a) * margin];
  });
  return pts.every(([px, pz]) => boxes.some((b) => b.kind === "floor" && px >= b.minX && px <= b.maxX && pz >= b.minZ && pz <= b.maxZ));
}

export function lanePose(def: TrackDef, x: number, z: number) {
  let bestD = Infinity;
  let px = def.segs[0]?.x1 ?? 0;
  let pz = def.segs[0]?.z1 ?? 0;
  let yaw = 0;
  for (const s of def.segs) {
    const dx = s.x2 - s.x1;
    const dz = s.z2 - s.z1;
    const len2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - s.x1) * dx + (z - s.z1) * dz) / len2));
    const qx = s.x1 + dx * t;
    const qz = s.z1 + dz * t;
    const d = (qx - x) ** 2 + (qz - z) ** 2;
    if (d < bestD) {
      bestD = d;
      px = qx;
      pz = qz;
      yaw = Math.atan2(-dx, -dz);
    }
  }
  return { x: px, y: 0.44, z: pz, yaw };
}

function near(ax: number, az: number, bx: number, bz: number, dist: number) {
  return Math.hypot(ax - bx, az - bz) < dist;
}

export function clearPose(def: TrackDef, x: number, z: number) {
  const hazards = [
    ...(def.saws ?? []).map((s) => ({ x: s.x, z: s.z, r: 2.2 })),
    ...(def.bugs ?? []).map((s) => ({ x: s.x, z: s.z, r: 2.8 })),
    ...(def.boosts ?? []).map((s) => ({ x: s.x, z: s.z, r: 2.2 })),
  ];
  const boxes = floorBoxes(def);
  const bad = (px: number, pz: number) =>
    !onFloor(boxes, px, pz, 0.75) || hazards.some((h) => Math.hypot(px - h.x, pz - h.z) < h.r);
  const pose = lanePose(def, x, z);
  if (!bad(pose.x, pose.z)) return pose;
  const fx = -Math.sin(pose.yaw);
  const fz = -Math.cos(pose.yaw);
  for (let d = 0.8; d <= 10; d += 0.8) {
    for (const sign of [1, -1]) {
      const q = lanePose(def, pose.x + fx * d * sign, pose.z + fz * d * sign);
      if (!bad(q.x, q.z)) return q;
    }
  }
  return pose;
}

export function ringClear(def: TrackDef) {
  const bad: string[] = [];
  for (const [i, ring] of (def.checks ?? []).entries()) {
    const hazards = [
      ...(def.saws ?? []).map((s) => ({ k: "fan", x: s.x, z: s.z })),
      ...(def.bugs ?? []).map((s) => ({ k: "bug", x: s.x, z: s.z })),
      ...(def.boosts ?? []).map((s) => ({ k: "boost", x: s.x, z: s.z })),
      ...(def.ices ?? []).map((s) => ({ k: "ice", x: s.x, z: s.z })),
    ].filter((h) => near(ring.x, ring.z, h.x, h.z, 3));
    if (hazards.length) bad.push(`ring ${i}: ${hazards.map((h) => h.k).join(",")}`);
  }
  return bad;
}
