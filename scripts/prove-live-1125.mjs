import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const notes = [];
const ok = (c, m) => notes.push((c ? "ok " : "FAIL ") + m);
process.on("unhandledRejection", (err) => {
  console.log(notes.join("\n"));
  console.error(err);
  process.exit(1);
});

async function openHub(width, height, search) {
  const page = await browser.newPage({ viewport: { width, height } });
  const q = "/berty-run/" + (search || "");
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
  if (!frame) throw new Error("no frame");
  await frame.waitForFunction(() => {
    const btn = document.querySelector('button[aria-label="Settings"]');
    return btn && btn.getBoundingClientRect().width > 10;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(300);
  return { page, frame };
}

function measureSrc() {
  const sec = document.querySelector("section.overlay-panel");
  const gear = document.querySelector('button[aria-label="Settings"]');
  const box = [...sec.querySelectorAll("div")].find((el) => el.className.includes("absolute") && el.className.includes("overflow-y-auto") && el.querySelector("h2"));
  const big = [...document.querySelectorAll("button")].find((b) => (b.textContent || "").includes("Big text"));
  const sr = sec.getBoundingClientRect();
  const gr = gear.getBoundingClientRect();
  const br = box.getBoundingClientRect();
  const bbr = big.getBoundingClientRect();
  const hit = document.elementFromPoint(bbr.left + 20, bbr.top + bbr.height / 2);
  const hitBtn = hit && hit.closest("button");
  const text = box.innerText;
  return {
    panel: Math.round(sr.height),
    box: Math.round(br.height),
    gear: Math.round(gr.height),
    gap: Math.round(sr.bottom - br.bottom),
    topGap: Math.round(br.top - gr.bottom),
    big: !!(hitBtn && hitBtn.textContent.includes("Big text")),
    shows: ["Language", "Read aloud", "Big text", "Fewer answers", "Play style"].every((s) => text.includes(s)),
    blank: br.height < sr.height - gr.height - 80,
  };
}

for (const [w, h] of [[1366, 768], [1024, 700], [412, 915], [915, 412]]) {
  const { page, frame } = await openHub(w, h, "");
  const meta = await frame.evaluate(() => ({
    rev: document.querySelector('meta[name="berty-run-rev"]')?.content,
    vp: document.querySelector('meta[name="viewport"]')?.content,
    path: location.pathname,
  }));
  ok(meta.rev === "BR 1.12.5" && meta.path.startsWith("/berty-run") && !meta.vp.includes("maximum-scale"), `${w} meta ${meta.rev}`);
  await frame.locator('button[aria-label="Settings"]').click();
  await page.waitForTimeout(300);
  const title = await frame.evaluate(measureSrc);
  notes.push(`${w}x${h} title ${JSON.stringify(title)}`);
  const fill = title.box >= title.panel - title.gear - 36 && title.gap <= 16 && title.topGap <= 8;
  ok(fill, `${w} title settings fills`);
  ok(title.big, `${w} big text`);
  ok(title.shows && !title.blank, `${w} settings rows show`);
  await frame.locator('button[aria-label="Settings"]').click();
  await page.waitForTimeout(200);
  await frame.getByRole("button", { name: "LEVELS" }).click();
  await page.waitForTimeout(200);
  await frame.locator('button[aria-label="Settings"]').click();
  await page.waitForTimeout(250);
  const levels = await frame.evaluate(measureSrc);
  notes.push(`${w} levels ${JSON.stringify(levels)}`);
  ok(levels.box >= levels.panel - levels.gear - 36 && levels.big, `${w} levels settings fills`);
  await page.close();
}

const desk = await openHub(1366, 768, "?hud=1");
await desk.frame.waitForFunction(() => window.__eng, null, { timeout: 20000 });
await desk.frame.evaluate(() => {
  const eng = window.__eng;
  eng.tryFullUnlock("5656");
  eng.setGoal("gaming");
  eng.save.best["roll-out"] = 30;
  eng.selectCourse("saw-line");
  eng.ackBrief(null);
});
await desk.page.waitForTimeout(400);
await desk.frame.locator('button[aria-label="Menu"]').click();
await desk.page.waitForTimeout(200);
const menu = await desk.frame.evaluate(() => {
  const resume = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Resume");
  return { x: resume ? Math.round(resume.getBoundingClientRect().x) : -1, expanded: document.querySelector('button[aria-label="Menu"]')?.getAttribute("aria-expanded") };
});
ok(menu.x >= 0 && menu.x < 80, "menu opens left " + menu.x);
await desk.frame.getByRole("button", { name: "Retry", exact: true }).click();
await desk.page.waitForTimeout(250);
const fan = await desk.frame.evaluate(() => {
  const canvas = document.querySelector("canvas.play-canvas");
  const cs = canvas ? getComputedStyle(canvas) : null;
  return {
    phase: window.__eng.phase,
    course: window.__eng.course.id,
    brief: document.body.innerText.includes("One question"),
    expanded: document.querySelector('button[aria-label="Menu"]')?.getAttribute("aria-expanded"),
    hidden: canvas?.hidden || canvas?.hasAttribute("hidden"),
    display: cs?.display,
    ready: document.body.innerText.includes("READY"),
    rev: document.querySelector("[data-hud='rev']")?.textContent,
  };
});
notes.push("fan " + JSON.stringify(fan));
ok(fan.phase === "play" && fan.course === "saw-line" && !fan.brief && fan.expanded === "false" && !fan.hidden && fan.display !== "none" && fan.ready && fan.rev === "BR 1.12.5", "fan retry");

await desk.frame.evaluate(() => {
  const eng = window.__eng;
  eng.save.parts = [];
  eng.save.best = { "roll-out": 22 };
  eng.selectCourse("roll-out");
  eng.awardClear();
  eng.phase = "win";
  eng.emit();
});
await desk.page.waitForTimeout(300);
const win = await desk.frame.evaluate(() => {
  const sec = document.querySelector("section.overlay-panel");
  const text = document.body.innerText;
  const left = [...document.querySelectorAll("div")].find((el) => (el.className || "").includes("minmax(22rem"));
  const col = left ? left.children[0].getBoundingClientRect().width : 0;
  return {
    ps: text.includes("Next reward: Power supply"),
    mobo: text.includes("Next reward: Motherboard"),
    ratio: sec.getBoundingClientRect().width / window.innerWidth,
    scroll: sec.scrollHeight - sec.clientHeight,
    left: Math.round(col),
    iw: window.innerWidth,
    ih: window.innerHeight,
  };
});
notes.push("win " + JSON.stringify(win));
ok(win.ps && !win.mobo && win.ratio > 0.9 && win.scroll <= 2 && win.left >= 352, "stage clear");

await desk.frame.locator('button[aria-label="Settings"]').click();
await desk.page.waitForTimeout(250);
const resultsGear = await desk.frame.evaluate(measureSrc);
notes.push("results gear " + JSON.stringify(resultsGear));
ok(resultsGear.box >= resultsGear.panel - resultsGear.gear - 36 && resultsGear.big, "results settings fills");
const gearRect = await desk.frame.evaluate(() => {
  const gear = document.querySelector('button[aria-label="Settings"]').getBoundingClientRect();
  const bad = [];
  for (const el of document.querySelectorAll("button, a")) {
    if (el === document.querySelector('button[aria-label="Settings"]') || el.closest('button[aria-label="Settings"]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const iw = Math.min(gear.right, r.right) - Math.max(gear.left, r.left);
    const ih = Math.min(gear.bottom, r.bottom) - Math.max(gear.top, r.top);
    if (iw > 1 && ih > 1) bad.push((el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24));
  }
  return { x: Math.round(gear.x), bad };
});
ok(gearRect.x < 40 && gearRect.bad.length === 0, "gear rect " + JSON.stringify(gearRect));
await desk.frame.getByRole("button", { name: "Esports heat" }).click();
await desk.page.waitForTimeout(300);
const heatOn = await desk.frame.evaluate(() => document.body.innerText.includes("Esports heat") || document.body.innerText.includes("Calling the field"));
ok(heatOn, "heat opens");
await desk.frame.getByRole("button", { name: "Close" }).click();
await desk.page.waitForTimeout(200);
const heatOff = await desk.frame.evaluate(() => ({
  calling: document.body.innerText.includes("Calling the field"),
  reward: document.body.innerText.includes("Next reward: Power supply"),
}));
ok(!heatOff.calling && heatOff.reward, "heat close");
for (const name of ["Practice 2D", "Practice 3D", "Bus Tube"]) {
  await desk.frame.evaluate(() => { window.__eng.phase = "win"; window.__eng.emit(); });
  await desk.page.waitForTimeout(200);
  await desk.frame.getByRole("button", { name }).click();
  await desk.page.waitForTimeout(500);
  const started = await desk.frame.evaluate(() => window.__eng.course.id + " " + window.__eng.phase + " " + document.body.innerText.includes("One question"));
  notes.push("start " + name + " " + started);
  const id = name === "Practice 2D" ? "practice-2d" : name === "Practice 3D" ? "practice-3d" : "tube-run";
  ok(started.startsWith(id + " play") && started.endsWith("false"), "tile " + name);
}

console.log(notes.join("\n"));
console.log(notes.some((n) => n.startsWith("FAIL")) ? "LIVE FAIL" : "LIVE PASS");
await browser.close();
