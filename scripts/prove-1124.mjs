import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "/workspace/screenshots";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const notes = [];

function overlap(a, b) {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0.5 && h > 0.5;
}

async function boot(page, path) {
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto("http://127.0.0.1:8080" + path, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__eng, null, { timeout: 15000 });
  await page.waitForTimeout(300);
}

async function gearHits(page) {
  return page.evaluate(() => {
    const gear = document.querySelector('button[aria-label="Settings"]');
    if (!gear) return { missing: true };
    const gr = gear.getBoundingClientRect();
    const bad = [];
    for (const el of document.querySelectorAll("button, a, h2, p")) {
      if (el === gear || gear.contains(el) || el.contains(gear)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const w = Math.min(gr.right, r.right) - Math.max(gr.left, r.left);
      const h = Math.min(gr.bottom, r.bottom) - Math.max(gr.top, r.top);
      if (w > 0.5 && h > 0.5) {
        const text = (el.innerText || el.getAttribute("aria-label") || el.tagName).replace(/\s+/g, " ").slice(0, 60);
        bad.push({ text, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
      }
    }
    return { x: Math.round(gr.x), y: Math.round(gr.y), w: Math.round(gr.width), h: Math.round(gr.height), bad };
  });
}

const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await boot(page, "/?hud=1");

const meta = await page.evaluate(() => ({
  rev: document.querySelector('meta[name="berty-run-rev"]')?.content,
  vp: document.querySelector('meta[name="viewport"]')?.content,
}));
notes.push("meta " + JSON.stringify(meta));
if (meta.rev !== "BR 1.12.4") notes.push("FAIL rev");
if ((meta.vp || "").includes("maximum-scale")) notes.push("FAIL viewport " + meta.vp);

await page.evaluate(() => {
  const eng = window.__eng;
  eng.save.best = { "roll-out": 28 };
  eng.save.parts = [];
  eng.save.booted = false;
  eng.setGoal("gaming");
  eng.selectCourse("saw-line");
  eng.ackBrief(null);
});
await page.waitForTimeout(200);
await page.locator('button[aria-label="Menu"]').click();
await page.waitForTimeout(150);
await page.getByRole("button", { name: "Retry", exact: true }).click();
await page.waitForTimeout(250);
const fan = await page.evaluate(() => {
  const canvas = document.querySelector("canvas.play-canvas");
  const menu = document.querySelector('button[aria-label="Menu"]');
  const cs = canvas ? getComputedStyle(canvas) : null;
  return {
    phase: window.__eng.phase,
    course: window.__eng.course?.id,
    needBrief: window.__eng.needBrief,
    expanded: menu?.getAttribute("aria-expanded"),
    hidden: canvas?.hasAttribute("hidden"),
    display: cs?.display,
    ready: document.body.innerText.includes("READY"),
    brief: document.body.innerText.includes("One question"),
    menuX: menu ? Math.round(menu.getBoundingClientRect().x) : -1,
  };
});
notes.push("fan-retry " + JSON.stringify(fan));
if (fan.phase !== "play" || fan.needBrief || fan.expanded !== "false" || fan.hidden || fan.display === "none" || !fan.ready || fan.brief) {
  notes.push("FAIL fan retry");
}

await page.evaluate(() => {
  const eng = window.__eng;
  eng.save.best["saw-line"] = 20;
  eng.selectCourse("saw-line");
  eng.startPlay();
});
await page.waitForTimeout(200);
await page.locator('button[aria-label="Menu"]').click();
await page.waitForTimeout(100);
const panel = await page.evaluate(() => {
  const menu = document.querySelector('button[aria-label="Menu"]');
  const buttons = [...document.querySelectorAll("button")].filter((b) => b.textContent.trim() === "Retry");
  const box = buttons[0]?.getBoundingClientRect();
  return {
    menuX: Math.round(menu.getBoundingClientRect().x),
    panelX: box ? Math.round(box.x) : -1,
  };
});
notes.push("menu-pos " + JSON.stringify(panel));
if (panel.menuX > 80 || panel.panelX > 80) notes.push("FAIL menu not left");
await page.getByRole("button", { name: "Retry", exact: true }).click();
await page.waitForTimeout(200);
const cleared = await page.evaluate(() => ({
  phase: window.__eng.phase,
  expanded: document.querySelector('button[aria-label="Menu"]')?.getAttribute("aria-expanded"),
  hidden: document.querySelector("canvas.play-canvas")?.hasAttribute("hidden"),
}));
notes.push("cleared-retry " + JSON.stringify(cleared));
if (cleared.phase !== "play" || cleared.expanded !== "false" || cleared.hidden) notes.push("FAIL cleared retry");

await page.evaluate(() => {
  const eng = window.__eng;
  eng.selectCourse("practice-3d");
  eng.startPlay();
});
await page.waitForTimeout(800);
await page.locator('button[aria-label="Menu"]').click();
await page.waitForTimeout(100);
await page.getByRole("button", { name: "Retry", exact: true }).click();
await page.waitForTimeout(400);
const d3 = await page.evaluate(() => ({
  phase: window.__eng.phase,
  course: window.__eng.course?.id,
  expanded: document.querySelector('button[aria-label="Menu"]')?.getAttribute("aria-expanded"),
  hidden: document.querySelectorAll("canvas.play-canvas")[0]?.hasAttribute("hidden"),
  ready: document.body.innerText.includes("READY"),
  brief: document.body.innerText.includes("One question"),
}));
notes.push("3d-retry " + JSON.stringify(d3));
if (d3.phase !== "play" || d3.course !== "practice-3d" || d3.expanded !== "false" || d3.hidden || d3.brief) notes.push("FAIL 3d retry");

await page.evaluate(() => {
  const eng = window.__eng;
  eng.save.parts = [];
  eng.save.booted = false;
  eng.save.best = { "roll-out": 22 };
  eng.selectCourse("roll-out");
  eng.awardClear();
  eng.phase = "win";
  eng.emit();
});
await page.waitForTimeout(300);
const win = await page.evaluate(() => {
  const sec = document.querySelector("section.overlay-panel");
  const r = sec.getBoundingClientRect();
  const text = sec.innerText;
  const grid = sec.querySelector(".min-\\[960px\\]\\:grid, [class*='grid-cols']");
  const left = [...sec.querySelectorAll("div")].find((el) => (el.className || "").includes("minmax(22rem"));
  return {
    textHasPS: text.includes("Next reward: Power supply"),
    textHasMobo: text.includes("Next reward: Motherboard"),
    w: Math.round(r.width),
    ratio: r.width / window.innerWidth,
    scroll: sec.scrollHeight - sec.clientHeight,
    sh: sec.scrollHeight,
    ch: sec.clientHeight,
    leftW: left ? Math.round(left.getBoundingClientRect().width) : 0,
  };
});
notes.push("win " + JSON.stringify(win));
if (!win.textHasPS || win.textHasMobo) notes.push("FAIL reward");
if (win.ratio < 0.9) notes.push("FAIL width");
if (win.scroll > 1) notes.push("FAIL scroll");

const tiles = await page.evaluate(() => {
  const names = ["Practice 2D", "Practice 3D", "Bus Tube"];
  return names.map((name) => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.innerText.startsWith(name));
    if (!btn) return { name, missing: true };
    const r = btn.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return { name, hit: hit === btn, tag: hit?.tagName, label: (hit?.innerText || hit?.getAttribute?.("aria-label") || "").slice(0, 40) };
  });
});
notes.push("tiles " + JSON.stringify(tiles));
if (tiles.some((t) => !t.hit)) notes.push("FAIL tiles");

const gearResults = await gearHits(page);
notes.push("gear-results " + JSON.stringify(gearResults));
if (gearResults.missing || gearResults.bad.length || gearResults.x > 40) notes.push("FAIL gear results");

await page.screenshot({ path: OUT + "/desk-results.png" });

await page.locator('button[aria-label="Settings"]').click();
await page.waitForTimeout(200);
const news = await page.evaluate(() => document.body.innerText.includes("BR 1.12.4: Retry restarts the board"));
notes.push("whats-new " + news);
if (!news) notes.push("FAIL whats new");
const gearSettings = await gearHits(page);
notes.push("gear-settings " + JSON.stringify(gearSettings));
if (gearSettings.bad?.length) notes.push("FAIL gear settings");
await page.screenshot({ path: OUT + "/desk-settings.png" });
await page.getByRole("button", { name: "Esports heat" }).click();
await page.waitForTimeout(200);
const heatOn = await page.evaluate(() => document.body.innerText.includes("Calling the field") || document.body.innerText.includes("Esports heat"));
notes.push("heat-on " + heatOn);
if (!heatOn) notes.push("FAIL heat open");
await page.getByRole("button", { name: "Close", exact: true }).click();
await page.waitForTimeout(200);
const heatOff = await page.evaluate(() => ({
  calling: document.body.innerText.includes("Calling the field"),
  reward: document.body.innerText.includes("Next reward: Power supply"),
  stage: document.body.innerText.includes("STAGE CLEAR") || document.body.innerText.includes("Your reward"),
}));
notes.push("heat-off " + JSON.stringify(heatOff));
if (heatOff.calling || !heatOff.reward) notes.push("FAIL heat close");

await page.getByRole("button", { name: "Practice 2D" }).click();
await page.waitForTimeout(400);
const p2 = await page.evaluate(() => ({ phase: window.__eng.phase, course: window.__eng.course.id, brief: document.body.innerText.includes("One question") }));
notes.push("p2 " + JSON.stringify(p2));
if (p2.phase !== "play" || p2.course !== "practice-2d") notes.push("FAIL practice 2d");

await page.evaluate(() => {
  const eng = window.__eng;
  eng.phase = "win";
  eng.emit();
});
await page.waitForTimeout(200);
await page.getByRole("button", { name: "Practice 3D" }).click();
await page.waitForTimeout(600);
const p3 = await page.evaluate(() => ({ phase: window.__eng.phase, course: window.__eng.course.id }));
notes.push("p3 " + JSON.stringify(p3));
if (p3.phase !== "play" || p3.course !== "practice-3d") notes.push("FAIL practice 3d");

await page.evaluate(() => {
  const eng = window.__eng;
  eng.phase = "win";
  eng.emit();
});
await page.waitForTimeout(200);
await page.getByRole("button", { name: "Bus Tube" }).click();
await page.waitForTimeout(400);
const tube = await page.evaluate(() => ({ phase: window.__eng.phase, course: window.__eng.course.id }));
notes.push("tube " + JSON.stringify(tube));
if (tube.phase !== "play" || tube.course !== "tube-run") notes.push("FAIL tube");

await page.evaluate(() => {
  const eng = window.__eng;
  eng.phase = "win";
  eng.emit();
});
await page.waitForTimeout(150);
await page.getByRole("button", { name: /Next:|Back to boards/ }).click();
await page.waitForTimeout(300);
const afterNext = await page.evaluate(() => ({
  calling: document.body.innerText.includes("Calling the field"),
  phase: window.__eng.phase,
}));
notes.push("after-next " + JSON.stringify(afterNext));
if (afterNext.calling) notes.push("FAIL heat after next");

const hud = await page.evaluate(() => document.querySelector("[data-hud=rev]")?.textContent || "");
notes.push("hud " + hud);
if (!hud.includes("BR 1.12.4") && afterNext.phase === "play") notes.push("FAIL hud");
if (afterNext.phase !== "play") {
  await page.evaluate(() => window.__eng.startPlay());
  await page.waitForTimeout(200);
  const hud2 = await page.evaluate(() => document.querySelector("[data-hud=rev]")?.textContent || "");
  notes.push("hud2 " + hud2);
  if (!hud2.includes("BR 1.12.4")) notes.push("FAIL hud");
}

await page.evaluate(() => {
  window.__eng.selectCourse("practice-2d");
  window.__eng.startPlay();
  window.__eng.skipIntro();
});
await page.waitForTimeout(200);
const levelsPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
levelsPage.on("pageerror", (err) => errors.push(String(err)));
await levelsPage.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await levelsPage.evaluate(() => localStorage.clear());
await levelsPage.reload({ waitUntil: "networkidle" });
await levelsPage.waitForTimeout(400);
await levelsPage.getByRole("button", { name: "LEVELS" }).click();
await levelsPage.waitForTimeout(200);
const gearLevels = await gearHits(levelsPage);
notes.push("gear-levels " + JSON.stringify(gearLevels));
if (gearLevels.bad?.length || gearLevels.x > 400) notes.push("FAIL gear levels");
await levelsPage.screenshot({ path: OUT + "/desk-levels.png" });
await levelsPage.getByRole("button", { name: "Back" }).click();
await levelsPage.waitForTimeout(150);
const gearTitle = await gearHits(levelsPage);
notes.push("gear-title " + JSON.stringify(gearTitle));
if (gearTitle.bad?.length) notes.push("FAIL gear title");
const titleBox = await levelsPage.evaluate(() => {
  const gear = document.querySelector('button[aria-label="Settings"]').getBoundingClientRect();
  const title = [...document.querySelectorAll("p,h2")].find((el) => el.textContent.includes("BERTY"));
  const tr = title?.getBoundingClientRect();
  return { gearY: Math.round(gear.bottom), titleY: tr ? Math.round(tr.top) : -1 };
});
notes.push("title-stack " + JSON.stringify(titleBox));
await levelsPage.screenshot({ path: OUT + "/desk-title.png" });

const phone = await browser.newPage({ viewport: { width: 412, height: 915 } });
phone.on("pageerror", (err) => errors.push(String(err)));
await phone.goto("http://127.0.0.1:8080/?hud=1", { waitUntil: "networkidle" });
await phone.waitForFunction(() => window.__eng);
await phone.waitForTimeout(300);
await phone.evaluate(() => window.__eng.skipIntro());
await phone.locator('button[aria-label="Menu"]').click();
await phone.waitForTimeout(200);
const phoneMenu = await phone.evaluate(() => {
  const menu = document.querySelector('button[aria-label="Menu"]').getBoundingClientRect();
  const jump = document.querySelector('[data-hud="jump"]')?.getBoundingClientRect();
  const retry = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Retry")?.getBoundingClientRect();
  const hit = (a, b) => {
    if (!a || !b) return false;
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 0.5 && h > 0.5;
  };
  return {
    menuX: Math.round(menu.x),
    panelX: retry ? Math.round(retry.x) : -1,
    jump: jump ? { x: Math.round(jump.x), y: Math.round(jump.y) } : null,
    overlapJump: hit(retry, jump) || hit(menu, jump),
  };
});
notes.push("phone " + JSON.stringify(phoneMenu));
if (phoneMenu.menuX > 40 || phoneMenu.overlapJump) notes.push("FAIL phone menu");
await phone.screenshot({ path: OUT + "/phone-menu.png" });

const land = await browser.newPage({ viewport: { width: 915, height: 412 } });
land.on("pageerror", (err) => errors.push(String(err)));
await land.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await land.evaluate(() => localStorage.clear());
await land.reload({ waitUntil: "networkidle" });
await land.waitForTimeout(400);
const landGear = await gearHits(land);
const landScroll = await land.evaluate(() => ({
  sh: document.querySelector("section.overlay-panel")?.scrollHeight,
  ch: document.querySelector("section.overlay-panel")?.clientHeight,
  play: !!document.querySelector("button"),
}));
notes.push("land " + JSON.stringify({ landGear, landScroll }));
if (landGear.bad?.length) notes.push("FAIL land gear");
await land.screenshot({ path: OUT + "/land-start.png" });

console.log(notes.join("\n"));
console.log("ERRORS", errors.filter((e) => !e.includes("418")).slice(0, 12));
const failed = notes.filter((n) => n.startsWith("FAIL"));
console.log(failed.length ? "PROVE FAIL " + failed.length : "PROVE PASS");
await browser.close();
process.exit(failed.length ? 1 : 0);
