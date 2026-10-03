import type { Course, CourseId } from "./types";
import { trackById } from "./tracks3d";

export const TILE = 48;

const ROWS_3D = [
  "##########",
  "#S......E#",
  "##########",
];

export const COURSES: Course[] = [
  {
    id: "practice-2d",
    name: "Practice 2D",
    blurb: "Learn the controls. Lean, hop the hole or go around it, grab the bits, park in the port.",
    par: 40,
    arcade: true,
    rows: [
      "######################",
      "#S..o..........o.....#",
      "#....................#",
      "#....XXXX....o.......#",
      "#............C.......#",
      "#..o..............o.E#",
      "######################",
    ],
  },
  {
    id: "practice-3d",
    name: "Practice 3D",
    blurb: "Learn to steer. A wide road, a bend, and bits. No virus.",
    par: 40,
    arcade: true,
    mode: "3d",
    rows: ROWS_3D,
  },
  {
    id: "tube-run",
    name: "Bus Tube",
    blurb: "The data bus is a tube. Step onto a wall and the whole run turns. Ride the wire, then jump off.",
    par: 24,
    arcade: true,
    rows: ["######", "#S...E#", "######"],
  },
  {
    id: "roll-out",
    name: "Roll Out",
    blurb: "Lean across the board. Grab every bit. The ring saves your spot. Park in the port.",
    par: 36,
    rows: [
      "############################",
      "#S.......o..........o......#",
      "#...####......####.........#",
      "#.........P....B....C......#",
      "#......o.............o.....#",
      "#....................o....E#",
      "############################",
    ],
  },
  {
    id: "mind-the-pit",
    name: "Mind the Pit",
    blurb: "Holes swallow a fast lean. Hit the ring before the long gap.",
    par: 50,
    rows: [
      "############################",
      "#S.....o..XXXX.............#",
      "#.........XXXX...o....C....#",
      "#...o..........P...........#",
      "#......XXXXXXXXXXXX........#",
      "#............P..o..XXXX....#",
      "#...T..XXXX......B....o...E#",
      "############################",
    ],
  },
  {
    id: "saw-line",
    name: "Fan Line",
    blurb: "Fans move. Boost, then cross the gap when the blade is clear.",
    par: 68,
    rows: [
      "##############################",
      "#S.....o.......#......o.....E#",
      "#..............#.............#",
      "#...o.....B....P....C....o...#",
      "#............................#",
      "#.......o......#........o....#",
      "##############################",
    ],
    saws: [
      { x: 9.5, y: 1.5, x2: 9.5, y2: 5.5, period: 2.8 },
      { x: 14.5, y: 5.5, x2: 14.5, y2: 1.5, period: 3.2 },
      { x: 20.5, y: 2.5, x2: 20.5, y2: 5.5, period: 2.9 },
    ],
  },
  {
    id: "oil-pan",
    name: "Thermal Paste",
    blurb: "Silver tiles slide. Arrows push. Hit the ring before the belt.",
    par: 62,
    rows: [
      "##############################",
      "#S.....o..IIII...............#",
      "#.........IIII...o......C....#",
      "#...o.............P..........#",
      "#......IIIIIIII>>>>..C.......#",
      "#............P..o.......o...E#",
      "##############################",
    ],
  },
  {
    id: "crew-gate",
    name: "Crew Gate",
    blurb: "Two lanes. Both bots must reach the port. Boosts are in each lane.",
    par: 64,
    rows: [
      "##############################",
      "#S..B......XXXX........o....T#",
      "#...o..##........##.....B....#",
      "#......##...o....##.....C....#",
      "#...C..##........##..........#",
      "#.......................E....#",
      "#...o.......XXXX......o......#",
      "##############################",
    ],
    saws: [
      { x: 13.5, y: 2.5, x2: 13.5, y2: 5.5, period: 2.6 },
    ],
  },
  {
    id: "around-the-bend",
    name: "Around the Bend",
    blurb: "Wide and slow. Jump with the button. Zap the pink virus.",
    par: 62,
    mode: "3d",
    rows: ROWS_3D,
  },
  {
    id: "pit-drop",
    name: "Pit Drop",
    blurb: "The worm crawls across the lane. Steer around it. There is no hole.",
    par: 56,
    mode: "3d",
    rows: ROWS_3D,
  },
  {
    id: "blade-walk",
    name: "Blade Walk",
    blurb: "A zigzag. Three fans. Go around them.",
    par: 58,
    mode: "3d",
    rows: ROWS_3D,
  },
  {
    id: "slick-shelf",
    name: "Slick Shelf",
    blurb: "A long icy shelf. Steer less.",
    par: 54,
    mode: "3d",
    rows: ROWS_3D,
  },
  {
    id: "shop-exit",
    name: "I/O Exit",
    blurb: "The long snake. Fans, ice, then a thin port.",
    par: 72,
    mode: "3d",
    rows: ROWS_3D,
  },
  {
    id: "cable-loom",
    name: "Cable Loom",
    blurb: "One lane is ice. The bottom lane is clear. Both reach the port.",
    par: 60,
    rows: [
      "##############################",
      "#S......o....................#",
      "#....####....o....####.......#",
      "#....####..III....####..C....#",
      "#....####..B......####.......#",
      "#o...............o........o.E#",
      "##############################",
    ],
  },
  {
    id: "case-fan",
    name: "Case Fan",
    blurb: "A virus sits in the lane. Press Zap, or the E key, before you roll into it.",
    par: 66,
    rows: [
      "##############################",
      "#S..o..........#.............#",
      "#..............#......o......#",
      "#....o....B....P.....C.......#",
      "#..............#.............#",
      "#......o...V...#........o...E#",
      "##############################",
    ],
    saws: [
      { x: 8.5, y: 1.5, x2: 8.5, y2: 4.5, period: 3.0 },
      { x: 22.5, y: 4.5, x2: 22.5, y2: 1.5, period: 3.3 },
    ],
  },
  {
    id: "heat-sink",
    name: "Heat Sink",
    blurb: "The silver lane slides. Go around it, or cross when the fan is clear.",
    par: 58,
    rows: [
      "##############################",
      "#S.....o.....................#",
      "#..........IIIIIIII..........#",
      "#...B..o...IIIIIIII..P...C...#",
      "#..........IIIIIIII..........#",
      "#......o................o...E#",
      "##############################",
    ],
    saws: [{ x: 14.5, y: 1.5, x2: 14.5, y2: 5.5, period: 2.7 }],
  },
  {
    id: "packet-lane",
    name: "Packet Lane",
    blurb: "Arrows push the packet right. Ride them, or take the quiet lane.",
    par: 54,
    rows: [
      "##############################",
      "#S..o........................#",
      "#....>>>>....................#",
      "#......o....P....B....C....o.#",
      "#............................#",
      "#.........o..............o..E#",
      "##############################",
    ],
  },
  {
    id: "signal-hop",
    name: "Signal Hop",
    blurb: "A short hop to the left.",
    par: 48,
    mode: "3d",
    rows: ROWS_3D,
  },
  {
    id: "case-drop",
    name: "Case Drop",
    blurb: "A thin start, then a square room.",
    par: 58,
    mode: "3d",
    rows: ROWS_3D,
  },
  {
    id: "dark-bay",
    name: "Dark Bay",
    blurb: "A night run. Zap the virus. Jump the lock. The shelf is ice.",
    par: 64,
    mode: "3d",
    rows: ROWS_3D,
  },
];

export function courseById(id: CourseId): Course {
  const found = COURSES.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown course ${id}`);
  return found;
}

export function starsFor(time: number, par: number) {
  if (time <= par * 0.75) return 3;
  if (time <= par) return 2;
  return 1;
}

export function starsFromBest(best: number | null | undefined, par: number) {
  if (best == null) return 0;
  return starsFor(best, par);
}

export function fmtTime(t: number) {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}

export type Dye = { name: string; floor: string; wall: string; accent: string; ink: string };

const DYES: Record<string, Dye> = {
  lime: { name: "Lime", floor: "#245c22", wall: "#3a2e24", accent: "#d6ff4a", ink: "#0b1220" },
  cyan: { name: "Cyan", floor: "#14506a", wall: "#1a3344", accent: "#7af0ff", ink: "#0b1220" },
  gold: { name: "Gold", floor: "#6a4a12", wall: "#4a3418", accent: "#ffc857", ink: "#0b1220" },
};

const DYE_OF: Record<CourseId, keyof typeof DYES> = {
  "roll-out": "lime",
  "mind-the-pit": "cyan",
  "saw-line": "gold",
  "oil-pan": "lime",
  "crew-gate": "cyan",
  "around-the-bend": "gold",
  "pit-drop": "cyan",
  "blade-walk": "lime",
  "slick-shelf": "gold",
  "shop-exit": "cyan",
  "cable-loom": "gold",
  "case-fan": "cyan",
  "heat-sink": "cyan",
  "packet-lane": "lime",
  "signal-hop": "lime",
  "case-drop": "gold",
  "dark-bay": "gold",
  "practice-2d": "lime",
  "practice-3d": "cyan",
  "tube-run": "cyan",
};

export function dyeFor(id: CourseId): Dye {
  return DYES[DYE_OF[id]];
}

export function courseMode(c: Course): "2d" | "3d" {
  return c.mode === "3d" ? "3d" : "2d";
}

/** Zap is a button. It never fires by itself. Only boards with a virus show it. */
export function courseHasZap(id: CourseId) {
  const c = courseById(id);
  if (c.rows.some((row) => row.includes("V"))) return true;
  if (c.mode !== "3d") return false;
  return (trackById(id).bugs?.length ?? 0) > 0;
}

export function trackCourses(mode: "2d" | "3d") {
  const list = COURSES.filter((c) => courseMode(c) === mode && !c.arcade);
  if (mode !== "3d") return list;
  return [...list].sort((a, b) => ORDER_3D.indexOf(a.id) - ORDER_3D.indexOf(b.id));
}

/**
 * TEMP_UNLOCK_ALL_LEVELS — Diego test Ord (2026-09-23).
 * false: the next board opens after the one before has any clear.
 * Practice boards stay open either way.
 * Set true to open every board again. Do not delete isUnlocked.
 */
export const TEMP_UNLOCK_ALL_LEVELS = false;

export const ORDER_3D = [
  "around-the-bend",
  "pit-drop",
  "blade-walk",
  "dark-bay",
  "slick-shelf",
  "shop-exit",
  "signal-hop",
  "case-drop",
  "cable-loom",
  "case-fan",
  "heat-sink",
  "packet-lane",
];

const LEGACY_PREV: Record<string, string> = {
  "slick-shelf": "blade-walk",
  "shop-exit": "slick-shelf",
  "cable-loom": "shop-exit",
  "case-fan": "cable-loom",
  "heat-sink": "case-fan",
  "packet-lane": "heat-sink",
  "signal-hop": "packet-lane",
  "case-drop": "signal-hop",
  "dark-bay": "case-drop",
};

/** At or under par. Stars and watts still use this. A slow clear still opens the next board. */
export function acceptable(c: Course, bests: Record<string, number>) {
  const best = bests[c.id];
  return best != null && best <= c.par;
}

export function cleared(id: string, bests: Record<string, number>) {
  return bests[id] != null;
}

export function campaignClears(bests: Record<string, number>) {
  return COURSES.filter((c) => !c.arcade && bests[c.id] != null).length;
}

export function isUnlocked(c: Course, bests: Record<string, number>) {
  if (c.arcade) return true;
  if (TEMP_UNLOCK_ALL_LEVELS) return true;
  const track = trackCourses(courseMode(c));
  const i = track.findIndex((x) => x.id === c.id);
  if (i <= 0) return true;
  if (cleared(track[i - 1].id, bests)) return true;
  const legacy = LEGACY_PREV[c.id];
  return legacy ? cleared(legacy, bests) : false;
}

export function nextBoard(id: CourseId, bests: Record<string, number>, full: boolean): Course | null {
  const cur = courseById(id);
  const track = trackCourses(courseMode(cur));
  const i = track.findIndex((c) => c.id === id);
  const n = track[i + 1];
  if (n && (full || isUnlocked(n, bests))) return n;
  return null;
}

export function previousCourse(c: Course) {
  const track = trackCourses(courseMode(c));
  const i = track.findIndex((x) => x.id === c.id);
  return i > 0 ? track[i - 1] : null;
}

/** Next board still short of par, else the latest open one on that track. */
export function pickCourse(mode: "2d" | "3d", bests: Record<string, number>) {
  const track = trackCourses(mode);
  const next = track.find((c) => isUnlocked(c, bests) && !acceptable(c, bests));
  if (next) return next;
  const open = track.filter((c) => isUnlocked(c, bests));
  return open[open.length - 1] ?? track[0];
}

/** First open campaign board that is not under par. Practice stays in the list, not on Play. */
export function nextUnbeaten(bests: Record<string, number>, full: boolean) {
  const tube = courseById("tube-run");
  const order = [...trackCourses("2d"), ...trackCourses("3d"), tube];
  const open = order.filter((c) => full || isUnlocked(c, bests));
  return open.find((c) => !acceptable(c, bests)) ?? open[open.length - 1] ?? order[0];
}
