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
  look: { x: number; z: number };
};

export const TRACKS: TrackDef[] = [
  {
    id: "around-the-bend",
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
      { x: 16, z: -36 },
      { x: 30, z: -50 },
    ],
    gate: { x: 30, z: -58, face: "z" },
    crate: { x: 7.2, z: -18 },
    boosts: [{ x: 0, z: -8.5, w: 2.2, d: 4.2 }],
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
    segs: [
      { x1: 0, z1: 2, x2: 0, z2: -16 },
      { x1: 0, z1: -16, x2: 14, z2: -16 },
      { x1: 14, z1: -16, x2: 14, z2: -36, narrow: true },
      { x1: 14, z1: -36, x2: 28, z2: -36 },
      { x1: 28, z1: -36, x2: 28, z2: -52 },
    ],
    corners: [
      { x: 0, z: -16 },
      { x: 14, z: -16 },
      { x: 14, z: -36 },
      { x: 28, z: -36 },
    ],
    gems: [
      { x: 0, z: -8 },
      { x: 8, z: -16 },
      { x: 14, z: -24 },
      { x: 14, z: -32 },
      { x: 28, z: -44 },
    ],
    gate: { x: 28, z: -52, face: "z" },
    crate: { x: 6, z: -16 },
    checks: [{ x: 14, z: -20, yaw: 0 }],
    lamps: [
      { x: -4.2, z: -6 },
      { x: 18.4, z: -16 },
      { x: 9.6, z: -36 },
      { x: 32.2, z: -44 },
    ],
    look: { x: 8, z: -18 },
  },
  {
    id: "blade-walk",
    segs: [
      { x1: 0, z1: 2, x2: 0, z2: -28 },
      { x1: 0, z1: -28, x2: 22, z2: -28 },
      { x1: 22, z1: -28, x2: 22, z2: -46 },
    ],
    corners: [
      { x: 0, z: -28 },
      { x: 22, z: -28 },
    ],
    gems: [
      { x: 0, z: -8 },
      { x: 0, z: -18 },
      { x: 10, z: -28 },
      { x: 18, z: -28 },
      { x: 22, z: -38 },
    ],
    gate: { x: 22, z: -46, face: "z" },
    boosts: [{ x: 0, z: -6, w: 2.2, d: 3.6 }],
    checks: [{ x: 0, z: -22, yaw: 0 }],
    saws: [
      { x: 0, z: -14 },
      { x: 0, z: -22 },
      { x: 8, z: -28 },
      { x: 16, z: -28 },
    ],
    lamps: [
      { x: -4.2, z: -10 },
      { x: 4.2, z: -28 },
      { x: 26.2, z: -36 },
    ],
    look: { x: 4, z: -20 },
  },
  {
    id: "slick-shelf",
    segs: [
      { x1: 0, z1: 2, x2: 0, z2: -16 },
      { x1: 0, z1: -16, x2: 22, z2: -16 },
      { x1: 22, z1: -16, x2: 22, z2: -40 },
    ],
    corners: [
      { x: 0, z: -16 },
      { x: 22, z: -16 },
    ],
    gems: [
      { x: 0, z: -8 },
      { x: 8, z: -16 },
      { x: 16, z: -16 },
      { x: 22, z: -26 },
      { x: 22, z: -34 },
    ],
    gate: { x: 22, z: -40, face: "z" },
    crate: { x: 4, z: -16 },
    boosts: [{ x: 22, z: -24, w: 2.2, d: 4 }],
    checks: [{ x: 22, z: -20, yaw: 0 }],
    ices: [
      { x: 10, z: -16, w: 8, d: 4.6 },
      { x: 22, z: -30, w: 4.6, d: 6 },
    ],
    lamps: [
      { x: -4.2, z: -8 },
      { x: 12, z: -20.5 },
      { x: 26.4, z: -32 },
    ],
    look: { x: 10, z: -16 },
  },
  {
    id: "shop-exit",
    segs: [
      { x1: 0, z1: 2, x2: 0, z2: -16 },
      { x1: 0, z1: -16, x2: 14, z2: -16 },
      { x1: 14, z1: -16, x2: 14, z2: -32 },
      { x1: 14, z1: -32, x2: 28, z2: -32 },
      { x1: 28, z1: -32, x2: 28, z2: -50 },
      { x1: 28, z1: -50, x2: 28, z2: -62, narrow: true },
    ],
    corners: [
      { x: 0, z: -16 },
      { x: 14, z: -16 },
      { x: 14, z: -32 },
      { x: 28, z: -32 },
      { x: 28, z: -50 },
    ],
    gems: [
      { x: 0, z: -8 },
      { x: 8, z: -16 },
      { x: 14, z: -24 },
      { x: 22, z: -32 },
      { x: 28, z: -42 },
      { x: 28, z: -56 },
    ],
    gate: { x: 28, z: -62, face: "z" },
    crate: { x: 20, z: -32 },
    boosts: [{ x: 14, z: -24, w: 2.2, d: 3.6 }],
    checks: [
      { x: 14, z: -20, yaw: 0 },
      { x: 28, z: -44, yaw: 0 },
    ],
    saws: [{ x: 14, z: -28 }, { x: 28, z: -38 }],
    lamps: [
      { x: -4.2, z: -8 },
      { x: 18.2, z: -16 },
      { x: 9.6, z: -32 },
      { x: 32.2, z: -50 },
    ],
    look: { x: 10, z: -22 },
  },
];

export function trackById(id: CourseId): TrackDef {
  const found = TRACKS.find((t) => t.id === id);
  if (!found) throw new Error(`No 3D track ${id}`);
  return found;
}
