import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TubeSim } from "./tube.ts";
import { SPIN_BOARDS } from "./spin-boards.ts";

function solid(c: string) {
  return c !== "." && c !== " ";
}

function bestFace(sim: TubeSim, z: number) {
  // Prefer current if solid ahead, else any solid
  for (let f = 0; f < 4; f++) {
    let ok = true;
    for (let i = 0; i < 3; i++) {
      if (!solid((sim as any).cell(z + i, f))) { ok = false; break; }
    }
    if (ok) return f;
  }
  return 0;
}

function humanPolicy(sim: TubeSim, t: number, state: { lastTurn: number }) {
  const reaction = 0.35;
  const target = bestFace(sim, sim.z + 2);
  if (target === sim.face) return { x: 0, jump: false };
  if (t - state.lastTurn < reaction) return { x: 0, jump: false };
  // Must go neutral between turns
  const dir = (target - sim.face + 4) % 4 <= 2 ? 1 : -1;
  state.lastTurn = t;
  return { x: dir * 0.55, jump: false };
}

function runBoard(board: typeof SPIN_BOARDS[0]) {
  const sim = new TubeSim(board.rings, {
    spin: true,
    pace: board.pace,
    gapZ: board.gapZ,
    wireZ: board.wireZ,
    exitZ: board.exitZ,
  });
  sim.assist = false;
  const state = { lastTurn: -10 };
  let t = 0;
  const dt = 1 / 60;
  let won = false;
  for (let i = 0; i < 60 * 180 && !won; i++) {
    const input = humanPolicy(sim, t, state);
    const ev = sim.step(dt, input, false, t);
    if (ev.win) won = true;
    t += dt;
  }
  return { won, time: t, z: sim.z, gems: sim.got, total: sim.gemTotal, falls: sim.falls };
}

describe("Spin Tube boards clearable assist=false", () => {
  for (const board of SPIN_BOARDS) {
    it(`${board.id} human-policy`, () => {
      const r = runBoard(board);
      console.log(`${board.id}: ${r.won ? "PASS" : "FAIL"} time=${r.time.toFixed(1)}s z=${r.z.toFixed(1)} gems=${r.gems}/${r.total} falls=${r.falls}`);
      assert.ok(r.won, `${board.id} failed to clear`);
    });
  }
});
