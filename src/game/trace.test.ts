import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  BEATS,
  SPEED,
  START_X,
  STEP,
  begin,
  freshRun,
  gemCount,
  stepRun,
  type Run,
  type TickInput,
} from "./trace.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function play(policy: (run: Run) => TickInput, limit = 80) {
  let run = begin(freshRun(null));
  let guard = 0;
  const max = Math.ceil(limit / STEP);
  while (run.phase === "play" && guard < max) {
    run = stepRun(run, STEP, policy(run));
    guard++;
  }
  return run;
}

function tapAt(pick: (beatIndex: number) => number): (run: Run) => TickInput {
  let armed = -1;
  return (run) => {
    for (let i = 0; i < BEATS.length; i++) {
      const beat = BEATS[i];
      if (run.p.x > beat.cueTo) continue;
      const at = pick(i);
      if (armed !== i && run.p.x >= at) {
        armed = i;
        return { jumpEdge: true, jumpHeld: false };
      }
      break;
    }
    return { jumpEdge: false, jumpHeld: false };
  };
}

test("each glow cue is wide enough to tap, and each gem sits inside its cue", () => {
  assert.deepEqual(
    BEATS.map((b) => b.kind),
    ["gap", "spike", "overhang", "window"],
  );
  assert.equal(BEATS.filter((b) => b.hasGem).length, 3);
  for (const b of BEATS) {
    const cue = (b.cueTo - b.cueFrom) / SPEED;
    assert.ok(cue >= 0.3, `${b.id} cue ${cue.toFixed(3)}s`);
    if (!b.hasGem) continue;
    const gem = (b.gemTo - b.gemFrom) / SPEED;
    assert.ok(gem >= 0.12, `${b.id} gem ${gem.toFixed(3)}s`);
    assert.ok(b.gemFrom >= b.cueFrom, b.id);
    assert.ok(b.gemTo <= b.cueTo, b.id);
    assert.ok(b.gemFrom > b.cueFrom + 4, `${b.id} gem is not the whole cue`);
  }
});

test("taps on the gem glow clear First Trace in 30–40s with 3 gems", () => {
  const run = play(
    tapAt((i) => {
      const b = BEATS[i];
      if (!b.hasGem) return (b.cueFrom + b.cueTo) / 2;
      return (b.gemFrom + b.gemTo) / 2;
    }),
    50,
  );
  assert.equal(run.phase, "win");
  assert.equal(gemCount(run), 3);
  assert.ok(run.time >= 30 && run.time <= 40, `time ${run.time}`);
  assert.ok(run.best != null && run.best <= run.time);
});

test("edge-of-glow taps still clear and miss at least one gem", () => {
  const run = play(
    tapAt((i) => BEATS[i].cueFrom + 2),
    50,
  );
  assert.ok(run.phase === "short" || run.phase === "win", run.phase);
  assert.equal(run.phase, "short");
  assert.ok(gemCount(run) < 3, `gems ${gemCount(run)}`);
});

test("standing still on the trace fails calmly before the exit", () => {
  const run = play(() => ({ jumpEdge: false, jumpHeld: false }), 20);
  assert.equal(run.phase, "fail");
  assert.ok(run.time < 12);
  assert.ok(run.p.x > START_X);
});

test("student chrome has no borrowed runner brands", () => {
  const files = [
    "src/components/game-shell.tsx",
    "src/game/engine.ts",
    "src/l1.css",
    "src/cart-main.tsx",
    "cart/index.html",
  ];
  const banned = [/geometry\s*dash/i, /geometry\s*arrow/i, /\btron\b/i, /curveball/i];
  for (const file of files) {
    const text = readFileSync(join(root, file), "utf8");
    for (const re of banned) assert.doesNotMatch(text, re, file);
  }
});
