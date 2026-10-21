import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { CHIP } from "./techworks.ts";

test("built index.html stamp matches CHIP", () => {
  // After build:apps the static index.html must contain the exact CHIP
  const htmlPath = ".vercel/output/static/index.html";
  let html = "";
  try {
    html = readFileSync(htmlPath, "utf8");
  } catch {
    // Skip if not built yet; the check runs in CI after build
    return;
  }
  assert.ok(html.includes(`content="${CHIP}"`), `index.html missing CHIP ${CHIP}`);
  assert.ok(html.includes(`data-version="${CHIP}"`), `data-version missing CHIP ${CHIP}`);
});
