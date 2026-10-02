import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "/workspace/screenshots";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const notes = [];
process.on("unhandledRejection", (err) => {
  console.log(notes.join("\n"));
  console.error(err);
  process.exit(1);
});

async function openHub(width, height, search) {
  const page = await browser.newPage({ viewport: { width, height } });
  const q = search ? "/berty-run/" + search : "/berty-run/";
  await page.goto("https://apps.kulibert.net/?open=" + encodeURIComponent(q), { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate((src) => {
    const frame = document.querySelector("#app-frame");
    if (frame) frame.src = src;
  }, q);
  let frame = null;
  for (let i = 0; i < 40 && !frame; i++) {
    await page.waitForTimeout(400);
    frame = page.frames().find((f) => {
      try { return new URL(f.url()).pathname.startsWith("/berty-run"); } catch { return false; }
    });
  }
  if (!frame) throw new Error("no frame " + page.frames().map((f) => f.url()).join(" | "));
  await frame.waitForFunction(() => {
    const btn = document.querySelector("button");
    if (!btn) return false;
    const r = btn.getBoundingClientRect();
    return r.width > 10 && r.height > 10;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(400);
  return { page, frame };
}

function ok(name, cond) {
  notes.push((cond ? "ok " : "FAIL ") + name);
}

const desk = await openHub(1366, 768, "?hud=1");
await desk.frame.waitForFunction(() => window.__eng, null, { timeout: 20000 });
const meta = await desk.frame.evaluate(() => ({
  rev: document.querySelector('meta[name="berty-run-rev"]')?.content,
  bar: document.querySelector("script[data-app='berty-run']")?.getAttribute("data-version")
    || [...document.scripts].some((s) => (s.getAttribute("data-version") || "") === "BR 1.12.4"),
  vp: document.querySelector('meta[name="viewport"]')?.content,
  path: location.pathname,
}));
notes.push("meta " + JSON.stringify(meta));
ok("rev", meta.rev === "BR 1.12.4");
ok("viewport", meta.vp && !meta.vp.includes("maximum-scale") && meta.vp.includes("viewport-fit=cover"));
ok("path", meta.path.startsWith("/berty-run"));

await desk.frame.evaluate(() => {
  const eng = window.__eng;
  eng.save.best = { "roll-out": 28 };
  eng.save.parts = [];
  eng.save.booted = false;
  eng.setGoal("gaming");
  eng.selectCourse("saw-line");
  eng.ackBrief(null);
});
await desk.page.waitForTimeout(250);
await desk.frame.locator('button[aria-label="Menu"]').click();
await desk.page.waitForTimeout(150);
const panelX = await desk.frame.evaluate(() => {
  const pause = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Pause");
  return pause ? Math.round(pause.getBoundingClientRect().x) : -1;
});
ok("menu panel left", panelX >= 0 && panelX < 40);
await desk.frame.getByRole("button", { name: "Retry", exact: true }).click();
await desk.page.waitForTimeout(300);
const fan = await desk.frame.evaluate(() => {
  const canvas = document.querySelector("canvas.play-canvas");
  const menu = document.querySelector('button[aria-label="Menu"]');
  return {
    phase: window.__eng.phase,
    needBrief: window.__eng.needBrief,
    expanded: menu?.getAttribute("aria-expanded"),
    hidden: !!canvas?.hasAttribute("hidden"),
    display: canvas ? getComputedStyle(canvas).display : "",
    ready: document.body.innerText.includes("READY"),
    brief: document.body.innerText.includes("One question"),
    menuX: Math.round(menu.getBoundingClientRect().x),
    rev: document.querySelector("[data-hud=rev]")?.textContent || "",
  };
});
notes.push("fan " + JSON.stringify(fan));
ok("fan retry", fan.phase === "play" && !fan.needBrief && fan.expanded === "false" && !fan.hidden && fan.display !== "none" && fan.ready && !fan.brief && fan.menuX < 80 && fan.rev.includes("BR 1.12.4"));

await desk.frame.evaluate(() => {
  const eng = window.__eng;
  eng.save.parts = [];
  eng.save.booted = false;
  eng.save.best = { "roll-out": 22 };
  eng.selectCourse("roll-out");
  eng.awardClear();
  eng.phase = "win";
  eng.emit();
});
await desk.page.waitForTimeout(400);
const win = await desk.frame.evaluate(() => {
  const sec = document.querySelector("section.overlay-panel");
  const r = sec.getBoundingClientRect();
  const text = sec.innerText;
  const col = [...sec.querySelectorAll("div")].find((el) => String(el.className).includes("minmax(22rem"));
  const left = col?.firstElementChild;
  return {
    ps: text.includes("Next reward: Power supply"),
    mobo: text.includes("Next reward: Motherboard"),
    ratio: +(r.width / window.innerWidth).toFixed(3),
    scroll: sec.scrollHeight - sec.clientHeight,
    left: left ? Math.round(left.getBoundingClientRect().width) : 0,
    iw: window.innerWidth,
    ih: window.innerHeight,
  };
});
notes.push("win " + JSON.stringify(win));
ok("reward", win.ps && !win.mobo);
ok("width", win.ratio >= 0.9);
ok("no scroll", win.scroll <= 1);
ok("left col", win.left >= 352);

const tiles = await desk.frame.evaluate(() => ["Practice 2D", "Practice 3D", "Bus Tube"].map((name) => {
  const btn = [...document.querySelectorAll("button")].find((b) => (b.innerText || "").startsWith(name));
  if (!btn) return { name, missing: true };
  const r = btn.getBoundingClientRect();
  const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
  return { name, hit: hit === btn };
}));
notes.push("tiles " + JSON.stringify(tiles));
ok("tiles", tiles.every((t) => t.hit));

async function gearBad(frame) {
  return frame.evaluate(() => {
    const gear = document.querySelector('button[aria-label="Settings"]');
    const gr = gear.getBoundingClientRect();
    const bad = [];
    for (const el of document.querySelectorAll("button, a, h2, p")) {
      if (el === gear || gear.contains(el) || el.contains(gear)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const w = Math.min(gr.right, r.right) - Math.max(gr.left, r.left);
      const h = Math.min(gr.bottom, r.bottom) - Math.max(gr.top, r.top);
      if (w > 0.5 && h > 0.5) bad.push((el.innerText || "").replace(/\s+/g, " ").slice(0, 32));
    }
    return { x: Math.round(gr.x), bad };
  });
}
const gRes = await gearBad(desk.frame);
notes.push("gear-results " + JSON.stringify(gRes));
ok("gear results", gRes.bad.length === 0 && gRes.x < 40);
await desk.page.screenshot({ path: OUT + "/live-desk-results.png" });

await desk.frame.locator('button[aria-label="Settings"]').click();
await desk.page.waitForTimeout(250);
const news = await desk.frame.evaluate(() => document.body.innerText.includes("BR 1.12.4: Retry restarts the board"));
ok("whats new", news);
const gSet = await gearBad(desk.frame);
notes.push("gear-settings " + JSON.stringify(gSet));
ok("gear settings", gSet.bad.length === 0);
await desk.frame.getByRole("button", { name: "Esports heat" }).click();
await desk.page.waitForTimeout(300);
const calling = await desk.frame.evaluate(() => document.body.innerText.includes("Calling the field"));
ok("heat opens", calling);
await desk.frame.getByRole("button", { name: "Close", exact: true }).click();
await desk.page.waitForTimeout(200);
const closed = await desk.frame.evaluate(() => ({
  calling: document.body.innerText.includes("Calling the field"),
  reward: document.body.innerText.includes("Next reward: Power supply"),
}));
notes.push("heat-close " + JSON.stringify(closed));
ok("heat close", !closed.calling && closed.reward);

for (const name of ["Practice 2D", "Practice 3D", "Bus Tube"]) {
  if (name !== "Practice 2D") {
    await desk.frame.evaluate(() => { window.__eng.phase = "win"; window.__eng.emit(); });
    await desk.page.waitForTimeout(250);
  }
  await desk.frame.getByRole("button", { name }).click();
  await desk.page.waitForTimeout(name === "Practice 3D" ? 800 : 400);
  const got = await desk.frame.evaluate(() => window.__eng.course.name + " " + window.__eng.phase);
  notes.push("start " + got);
  ok("start " + name, got.startsWith(name) && got.endsWith("play"));
}

await desk.frame.evaluate(() => { window.__eng.phase = "win"; window.__eng.selectCourse("roll-out"); window.__eng.emit(); });
await desk.page.waitForTimeout(200);
const popped = await desk.frame.evaluate(() => document.body.innerText.includes("Calling the field"));
ok("heat stays down", !popped);

console.log("--- desk ---\n" + notes.join("\n"));
const phone = await openHub(412, 915, "?hud=1");
await phone.frame.waitForFunction(() => window.__eng, null, { timeout: 20000 });
await phone.frame.evaluate(() => { window.__eng.skipIntro(); });
await phone.page.waitForTimeout(200);
await phone.frame.locator('button[aria-label="Menu"]').click();
await phone.page.waitForTimeout(200);
const pm = await phone.frame.evaluate(() => {
  const menu = document.querySelector('button[aria-label="Menu"]').getBoundingClientRect();
  const jump = document.querySelector("[data-hud=jump]")?.getBoundingClientRect();
  const pause = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Pause")?.getBoundingClientRect();
  const hit = (a, b) => a && b && (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5) && (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5);
  return { menuX: Math.round(menu.x), panelX: pause ? Math.round(pause.x) : -1, overlap: hit(pause, jump) || hit(menu, jump) };
});
notes.push("phone " + JSON.stringify(pm));
ok("phone menu", pm.menuX < 40 && pm.panelX < 40 && !pm.overlap);
await phone.page.screenshot({ path: OUT + "/live-phone-menu.png" });

const land = await openHub(915, 412, "");
await land.frame.evaluate(() => localStorage.clear());
await land.frame.evaluate(() => location.reload());
await land.page.waitForTimeout(1500);
let lf = land.page.frames().find((f) => { try { return new URL(f.url()).pathname.startsWith("/berty-run"); } catch { return false; } });
await lf.waitForSelector('button[aria-label="Settings"]', { timeout: 20000 });
await land.page.waitForTimeout(400);
const lg = await gearBad(lf);
const title = await lf.evaluate(() => {
  const gear = document.querySelector('button[aria-label="Settings"]').getBoundingClientRect();
  const word = [...document.querySelectorAll("p,h2")].find((el) => el.textContent.includes("BERTY"));
  const tr = word?.getBoundingClientRect();
  const sec = document.querySelector("section.overlay-panel");
  return { gearBottom: Math.round(gear.bottom), titleTop: tr ? Math.round(tr.top) : -1, scroll: sec.scrollHeight - sec.clientHeight };
});
notes.push("land " + JSON.stringify({ lg, title }));
ok("land gear", lg.bad.length === 0 && title.titleTop >= title.gearBottom - 1);
await land.page.screenshot({ path: OUT + "/live-land.png" });

console.log(notes.join("\n"));
const failed = notes.filter((n) => n.startsWith("FAIL"));
console.log(failed.length ? "LIVE FAIL" : "LIVE PASS");
await browser.close();
process.exit(failed.length ? 1 : 0);
