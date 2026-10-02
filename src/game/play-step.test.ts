import assert from "node:assert/strict";
import test from "node:test";
import { playStep } from "./play-step.ts";

const ready = { alias: "", unlocked: true, goal: "gaming", cleared: false, briefPass: false };

test("a player can roll without typing a name", () => {
  assert.equal(playStep({ ...ready, alias: "" }), "brief");
});

test("a player without a goal picks the PC", () => {
  assert.equal(playStep({ ...ready, goal: "" }), "goal");
});

test("a new board asks the question once", () => {
  assert.equal(playStep(ready), "brief");
  assert.equal(playStep({ ...ready, briefPass: true }), "play");
});

test("a cleared board starts with no question", () => {
  assert.equal(playStep({ ...ready, cleared: true, briefPass: false }), "play");
});

test("the first board rolls before a goal", () => {
  assert.equal(
    playStep({ alias: "", unlocked: true, goal: "", cleared: false, briefPass: false, firstFree: true }),
    "play",
  );
});

test("a locked board stays locked", () => {
  assert.equal(playStep({ ...ready, unlocked: false }), "locked");
});
