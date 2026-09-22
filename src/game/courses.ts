import type { Course, CourseId } from "./types";

export const TILE = 48;

const ROWS_3D = [
  "##########",
  "#S......E#",
  "##########",
];

export const COURSES: Course[] = [
  {
    id: "roll-out",
    name: "Roll Out",
    blurb: "Lean Berty across the board. Grab every bit. Park in the port.",
    par: 32,
    rows: [
      "############################",
      "#S........o................#",
      "#...####......####....C....#",
      "#..............B...........#",
      "#......o.............o.....#",
      "#....................o....E#",
      "############################",
    ],
  },
  {
    id: "mind-the-pit",
    name: "Mind the Pit",
    blurb: "Empty sockets swallow a rushed lean. Hit the checkpoint. Stay on the copper.",
    par: 46,
    rows: [
      "############################",
      "#S.....o..XXXX.............#",
      "#.........XXXX...o....C....#",
      "#...o......................#",
      "#......XXXXXXXXXXXX........#",
      "#............P..o..XXXX....#",
      "#...T..XXXX...........o...E#",
      "############################",
    ],
  },
  {
    id: "saw-line",
    name: "Fan Line",
    blurb: "Cooling fans do not wait. Boost the bus. Time the blades.",
    par: 52,
    rows: [
      "##############################",
      "#S.....o.......#......o.....E#",
      "#..............#.............#",
      "#...o.....B....#....C....o...#",
      "#..............#.............#",
      "#.......o......#........o....#",
      "##############################",
    ],
    saws: [
      { x: 9.5, y: 1.5, x2: 9.5, y2: 5.5, period: 2.3 },
      { x: 14.5, y: 5.5, x2: 14.5, y2: 1.5, period: 2.8 },
      { x: 20.5, y: 2.5, x2: 20.5, y2: 5.5, period: 2.5 },
      { x: 25.5, y: 3.5 },
    ],
  },
  {
    id: "oil-pan",
    name: "Thermal Paste",
    blurb: "Thermal paste slides. Bus arrows shove. Lean before the slick.",
    par: 50,
    rows: [
      "##############################",
      "#S.....o..IIII...............#",
      "#.........IIII...o......C....#",
      "#...o........................#",
      "#......IIIIIIII>>>>..........#",
      "#............P..o.......o...E#",
      "##############################",
    ],
  },
  {
    id: "crew-gate",
    name: "Crew Gate",
    blurb: "Two Berties. Split the bits. Both in the port.",
    par: 60,
    rows: [
      "##############################",
      "#S.........XXXX........o....T#",
      "#...o..##........##..........#",
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
    blurb: "3D board. W rolls, A/D steers. Boost the bus. Corners dump a rushed marble.",
    par: 58,
    mode: "3d",
    rows: ROWS_3D,
  },
  {
    id: "pit-drop",
    name: "Pit Drop",
    blurb: "3D. Skinny trace over the void. Checkpoint after the pinch.",
    par: 52,
    mode: "3d",
    rows: ROWS_3D,
  },
  {
    id: "blade-walk",
    name: "Blade Walk",
    blurb: "3D. Fans do not wait. Boost, then time the blades.",
    par: 54,
    mode: "3d",
    rows: ROWS_3D,
  },
  {
    id: "slick-shelf",
    name: "Slick Shelf",
    blurb: "3D. Thermal paste on the shelf. Steer less, slide more.",
    par: 50,
    mode: "3d",
    rows: ROWS_3D,
  },
  {
    id: "shop-exit",
    name: "I/O Exit",
    blurb: "3D finale. Long snake, two fans, skinny port.",
    par: 68,
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
