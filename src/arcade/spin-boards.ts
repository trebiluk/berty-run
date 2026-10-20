/** Spin Tube pack. Reuses the Bus Tube engine. Bus Tube rings stay untouched. */

function run(n: number, cells: string, out: string[]) {
  for (let i = 0; i < n; i++) out.push(cells);
}

export type SpinBoard = {
  id: string;
  rings: string[];
  pace: number;
  gapZ: number;
  wireZ: number;
  exitZ: number;
};

function board(id: string, build: (add: (n: number, cells: string) => void) => void, pace = 0.62): SpinBoard {
  const rings: string[] = [];
  build((n, cells) => run(n, cells, rings));
  const gapZ = rings.findIndex((row) => row.includes("."));
  const wireZ = rings.findIndex((row) => row.includes("w"));
  const exitZ = rings.findIndex((row) => row.includes("E"));
  return { id, rings, pace, gapZ: gapZ < 0 ? 8 : gapZ, wireZ: wireZ < 0 ? 0 : wireZ, exitZ: exitZ < 0 ? rings.length - 1 : exitZ };
}

export const SPIN_BOARDS: SpinBoard[] = [
  board("spin-1", (add) => {
    add(8, "####");
    add(3, "o###");
    add(6, "####");
    add(3, ".###");
    add(14, "####");
    add(2, "#.##");
    add(3, "#o##");
    add(4, "####");
    add(3, "#..#");
    add(10, "####");
    add(1, "E###");
  }),
  board("spin-2", (add) => {
    add(6, "####");
    add(3, "#.##");
    add(8, "####");
    add(3, "##.#");
    add(6, "####");
    add(2, "#.##");
    add(3, "#o##");
    add(8, "####");
    add(1, "E###");
  }),
  board("spin-3", (add) => {
    add(6, "####");
    add(6, "wwww");
    add(2, ".###");
    add(4, "####");
    add(4, "#ccc");
    add(3, "#o##");
    add(6, "####");
    add(1, "E###");
  }),
  board("spin-4", (add) => {
    add(6, "####");
    add(6, "LLLL");
    add(1, "s###");
    add(4, "#...");
    add(6, "####");
    add(2, ".o#o");
    add(4, ".###");
    add(6, "####");
    add(1, "E###");
  }),
  board("spin-5", (add) => {
    add(5, "####");
    add(2, ".###");
    add(6, "####");
    add(2, "#.##");
    add(4, "wwww");
    add(2, ".###");
    add(3, "#ccc");
    add(2, "##.#");
    add(4, "####");
    add(2, "###.");
    add(3, "o#o#");
    add(3, "#o##");
    add(6, "####");
    add(1, "E###");
  }),
];

export function spinBoard(id: string) {
  return SPIN_BOARDS.find((b) => b.id === id) ?? null;
}
