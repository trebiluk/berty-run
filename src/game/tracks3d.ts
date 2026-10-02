import type { CourseId } from "./types";

export type TrackDef = {
  id: CourseId;
  segs: { x1: number; z1: number; x2: number; z2: number; narrow?: boolean }[];
  corners: { x: number; z: number }[];
  gems: { x: number; z: number }[];
  gate: { x: number; z: number; face: "z" | "x" };
  crate?: { x: number; z: number };
  boosts?: { x: number; z: number; w: number; d: number }[];
  checks?: { x: number; z: number; yaw: number }[];
  saws?: { x: number; z: number }[];
  lamps?: { x: number; z: number }[];
  ices?: { x: number; z: number; w: number; d: number }[];
  bugs?: { x: number; z: number; kind: "virus" | "worm" | "lock" }[];
  look: { x: number; z: number };
};

export const TRACKS: TrackDef[] = [
  {
    id: "practice-3d",
    segs: [
      { x1: 0, z1: 2, x2: 0, z2: -14 },
      { x1: 0, z1: -14, x2: 12, z2: -14 },
      { x1: 12, z1: -14, x2: 12, z2: -26 },
    ],
    corners: [
      { x: 0, z: -14 },
      { x: 12, z: -14 },
    ],
    gems: [
      { x: 0, z: -6 },
      { x: 6, z: -14 },
      { x: 12, z: -20 },
    ],
    gate: { x: 12, z: -26, face: "z" },
    checks: [{ x: 12, z: -16, yaw: 0 }],
    look: { x: 4, z: -10 },
  },
  {
    id: "around-the-bend",
    bugs: [{ x: 9, z: -18, kind: "virus" }],
    segs: [
      { x1: 0, z1: 2, x2: 0, z2: -18 },
      { x1: 0, z1: -18, x2: 16, z2: -18 },
      { x1: 16, z1: -18, x2: 16, z2: -30 },
      { x1: 16, z1: -30, x2: 16, z2: -40, narrow: true },
      { x1: 16, z1: -40, x2: 30, z2: -40 },
      { x1: 30, z1: -40, x2: 30, z2: -58 },
    ],
    corners: [
      { x: 0, z: -18 },
      { x: 16, z: -18 },
      { x: 16, z: -30 },
      { x: 16, z: -40 },
      { x: 30, z: -40 },
    ],
    gems: [
      { x: 0, z: -9 },
      { x: 9, z: -18 },
      { x: 16, z: -24 },
      { x: 16, z: -34 },
      { x: 16, z: -36 },
      { x: 30, z: -50 },
    ],
    gate: { x: 30, z: -58, face: "z" },
    crate: { x: 7.2, z: -18 },
    boosts: [
      { x: 0, z: -8.5, w: 2.2, d: 4.2 },
      { x: 16, z: -32, w: 2.2, d: 3.2 },
    ],
    checks: [{ x: 16, z: -26, yaw: 0 }],
    saws: [{ x: 24, z: -40 }],
    lamps: [
      { x: -4.2, z: 1 },
      { x: -4.2, z: -10 },
      { x: 4.2, z: -18 },
      { x: 16, z: -10 },
      { x: 20.5, z: -30 },
      { x: 11.5, z: -40 },
      { x: 34.2, z: -48 },
    ],
    look: { x: 8, z: -16 },
  },
  {
    id: "pit-drop",
    bugs: [{ x: 8, z: -14, kind: "worm" }],
    segs: [
      { x1: 0, z1: 2, x2: 0, z2: -14 },
      { x1: 0, z1: -14, x2: 16, z2: -14 },
      { x1: 16, z1: -14, x2: 16, z2: -32 },
      { x1: 16, z1: -32, x2: 0, z2: -32 },
      { x1: 0, z1: -32, x2: 0, z2: -48 },
    ],
    corners: [
      { x: 0, z: -14 },
      { x: 16, z: -14 },
      { x: 16, z: -32 },
      { x: 0, z: -32 },
    ],
    gems: [
      { x: 0, z: -8 },
      { x: 8, z: -14 },
      { x: 16, z: -22 },
      { x: 8, z: -32 },
      { x: 0, z: -40 },
    ],
    gate: { x: 0, z: -48, face: "z" },
    crate: { x: 12, z: -32 },
    boosts: [{ x: 16, z: -22, w: 2.2, d: 3.2 }],
    checks: [
      { x: 16, z: -18, yaw: 0 },
      { x: 8, z: -32, yaw: Math.PI / 2 },
    ],
    lamps: [
      { x: -4.2, z: -6 },
      { x: 8, z: -18 },
      { x: 20.2, z: -24 },
      { x: -4.2, z: -40 },
    ],
    look: { x: 8, z: -24 },
  },
  {
    id: "blade-walk",
    bugs: [{ x: 10, z: -12, kind: "virus" }],
    segs: [
      { x1: 0, z1: 2, x2: 0, z2: -12 },
      { x1: 0, z1: -12, x2: 16, z2: -12 },
      { x1: 16, z1: -12, x2: 16, z2: -24 },
      { x1: 16, z1: -24, x2: 0, z2: -24 },
      { x1: 0, z1: -24, x2: 0, z2: -38 },
    ],
    corners: [
      { x: 0, z: -12 },
      { x: 16, z: -12 },
      { x: 16, z: -24 },
      { x: 0, z: -24 },
    ],
    gems: [
      { x: 0, z: -6 },
      { x: 8, z: -12 },
      { x: 18.2, z: -18 },
      { x: 8, z: -24 },
      { x: 0, z: -32 },
    ],
    gate: { x: 0, z: -38, face: "z" },
    crate: { x: 12, z: -12 },
    boosts: [{ x: 0, z: -30, w: 2.2, d: 3.2 }],
    checks: [
      { x: 1, z: -12, yaw: -Math.PI / 2 },
      { x: 11, z: -25.6, yaw: Math.PI / 2 },
    ],
    saws: [
      { x: 6, z: -12 },
      { x: 16, z: -18 },
      { x: 6, z: -24 },
    ],
    lamps: [
      { x: -4.2, z: -6 },
      { x: 20.2, z: -18 },
      { x: -4.2, z: -32 },
    ],
    look: { x: 8, z: -18 },
  },
  {
    id: "slick-shelf",
    bugs: [{ x: 18, z: -10, kind: "lock" }],
    segs: [
      { x1: 0, z1: 2, x2: 0, z2: -10 },
      { x1: 0, z1: -10, x2: 34, z2: -10 },
      { x1: 34, z1: -10, x2: 34, z2: -28 },
    ],
    corners: [
      { x: 0, z: -10 },
      { x: 34, z: -10 },
    ],
    gems: [
      { x: 0, z: -6 },
      { x: 10, z: -10 },
      { x: 22, z: -10 },
      { x: 34, z: -16 },
      { x: 34, z: -24 },
    ],
    gate: { x: 34, z: -28, face: "z" },
    crate: { x: 28, z: -10 },
    boosts: [{ x: 34, z: -20, w: 2.2, d: 3.4 }],
    checks: [
      { x: 12, z: -10, yaw: -Math.PI / 2 },
      { x: 34, z: -12, yaw: 0 },
    ],
    ices: [
      { x: 16, z: -10, w: 16, d: 4.4 },
      { x: 34, z: -18, w: 4.4, d: 8 },
    ],
    lamps: [
      { x: -4.2, z: -4 },
      { x: 16, z: -14.6 },
      { x: 38.4, z: -22 },
    ],
    look: { x: 16, z: -12 },
  },
  {
    id: "shop-exit",
    bugs: [
      { x: 8, z: -14, kind: "worm" },
      { x: 10, z: -42, kind: "lock" },
    ],
    segs: [
      { x1: 0, z1: 2, x2: 0, z2: -14 },
      { x1: 0, z1: -14, x2: 16, z2: -14 },
      { x1: 16, z1: -14, x2: 16, z2: -28 },
      { x1: 16, z1: -28, x2: 2, z2: -28 },
      { x1: 2, z1: -28, x2: 2, z2: -42 },
      { x1: 2, z1: -42, x2: 18, z2: -42 },
      { x1: 18, z1: -42, x2: 18, z2: -56, narrow: true },
    ],
    corners: [
      { x: 0, z: -14 },
      { x: 16, z: -14 },
      { x: 16, z: -28 },
      { x: 2, z: -28 },
      { x: 2, z: -42 },
      { x: 18, z: -42 },
    ],
    gems: [
      { x: 0, z: -8 },
      { x: 8, z: -14 },
      { x: 18.3, z: -22 },
      { x: 8, z: -28 },
      { x: 2, z: -36 },
      { x: 18, z: -50 },
    ],
    gate: { x: 18, z: -56, face: "z" },
    crate: { x: 12, z: -28 },
    boosts: [{ x: 16, z: -20, w: 2.2, d: 3.4 }],
    checks: [
      { x: 16, z: -16, yaw: 0 },
      { x: 2, z: -36, yaw: 0 },
    ],
    saws: [
      { x: 16, z: -22 },
      { x: 10, z: -42 },
    ],
    ices: [{ x: 8, z: -14, w: 6, d: 3.4 }],
    lamps: [
      { x: -4.2, z: -6 },
      { x: 20.2, z: -20 },
      { x: -2.2, z: -36 },
      { x: 22.2, z: -50 },
    ],
    look: { x: 8, z: -28 },
  },
  {
    id: "signal-hop",
    bugs: [{ x: -8, z: -12, kind: "virus" }],
    segs: [
      { x1: 0, z1: 2, x2: 0, z2: -12 },
      { x1: 0, z1: -12, x2: -16, z2: -12 },
      { x1: -16, z1: -12, x2: -16, z2: -26 },
    ],
    corners: [
      { x: 0, z: -12 },
      { x: -16, z: -12 },
    ],
    gems: [
      { x: 0, z: -6 },
      { x: -8, z: -12 },
      { x: -16, z: -18 },
      { x: -16, z: -24 },
    ],
    gate: { x: -16, z: -26, face: "z" },
    crate: { x: -6, z: -12 },
    boosts: [{ x: 0, z: -6, w: 2.2, d: 3 }],
    checks: [{ x: -12, z: -12, yaw: Math.PI / 2 }],
    lamps: [
      { x: 4.2, z: -4 },
      { x: -8, z: -16.4 },
      { x: -20.2, z: -20 },
    ],
    look: { x: -8, z: -12 },
  },
  {
    id: "case-drop",
    bugs: [{ x: 8, z: -10, kind: "lock" }],
    segs: [
      { x1: 0, z1: 2, x2: 0, z2: -10, narrow: true },
      { x1: 0, z1: -10, x2: 16, z2: -10 },
      { x1: 16, z1: -10, x2: 16, z2: -26 },
      { x1: 16, z1: -26, x2: 0, z2: -26 },
      { x1: 0, z1: -26, x2: 0, z2: -40 },
    ],
    corners: [
      { x: 0, z: -10 },
      { x: 16, z: -10 },
      { x: 16, z: -26 },
      { x: 0, z: -26 },
    ],
    gems: [
      { x: 0, z: -6 },
      { x: 8, z: -10 },
      { x: 16, z: -18 },
      { x: 8, z: -26 },
    ],
    gate: { x: 0, z: -40, face: "z" },
    crate: { x: 12, z: -10 },
    boosts: [{ x: 16, z: -16, w: 2.2, d: 3 }],
    checks: [{ x: 16, z: -19.5, yaw: 0 }],
    ices: [{ x: 8, z: -26, w: 8, d: 3.4 }],
    lamps: [
      { x: -3.4, z: -4 },
      { x: 8, z: -14.4 },
      { x: -4.2, z: -34 },
    ],
    look: { x: 8, z: -18 },
  },
  {
    id: "dark-bay",
    bugs: [
      { x: 12, z: -16, kind: "virus" },
      { x: 12, z: -34, kind: "lock" },
    ],
    segs: [
      { x1: 0, z1: 2, x2: 0, z2: -16 },
      { x1: 0, z1: -16, x2: 22, z2: -16 },
      { x1: 22, z1: -16, x2: 22, z2: -34 },
      { x1: 22, z1: -34, x2: 8, z2: -34, narrow: true },
      { x1: 8, z1: -34, x2: 8, z2: -50 },
    ],
    corners: [
      { x: 0, z: -16 },
      { x: 22, z: -16 },
      { x: 22, z: -34 },
      { x: 8, z: -34 },
    ],
    gems: [
      { x: 0, z: -8 },
      { x: 12, z: -16 },
      { x: 22, z: -24 },
      { x: 14, z: -34 },
      { x: 8, z: -42 },
    ],
    gate: { x: 8, z: -50, face: "z" },
    crate: { x: 6, z: -16 },
    boosts: [{ x: 22, z: -22, w: 2.2, d: 3.2 }],
    checks: [{ x: 22, z: -26, yaw: 0 }],
    ices: [{ x: 15, z: -34, w: 8, d: 3.2 }],
    saws: [{ x: 18, z: -16 }],
    lamps: [
      { x: -4.2, z: -4 },
      { x: 12, z: -20 },
      { x: 26.2, z: -28 },
      { x: 4, z: -42 },
    ],
    look: { x: 12, z: -24 },
  },
];

export function trackById(id: CourseId): TrackDef {
  const found = TRACKS.find((t) => t.id === id);
  if (!found) throw new Error(`No 3D track ${id}`);
  return found;
}
