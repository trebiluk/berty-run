import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const notes = [];
const ok = (c, m) => notes.push((c ? "ok " : "FAIL ") + m);

async function open(w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForSelector('button[aria-label="Settings"]', { timeout: 15000 });
  return page;
}

function measure() {
  const sec = document.querySelector("section.overlay-panel");
  const gear = document.querySelector('button[aria-label="Settings"]');
  const box = sec && [...sec.querySelectorAll("div")].find((el) => el.className.includes("absolute") && el.className.includes("overflow-y-auto") && el.querySelector("h2"));
  const big = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Big text"));
  const sr = sec.getBoundingClientRect();
  const gr = gear.getBoundingClientRect();
  const br = box.getBoundingClientRect();
  const hit = big ? document.elementFromPoint(big.getBoundingClientRect().left + 24, big.getBoundingClientRect().top + big.getBoundingClientRect().height / 2) : null;
  const hitBtn = hit && hit.closest("button");
  return {
    panel: Math.round(sr.height),
    box: Math.round(br.height),
    gear: Math.round(gr.height),
    gap: Math.round(sr.bottom - br.bottom),
    topGap: Math.round(br.top - gr.bottom),
    big: !!(hitBtn && hitBtn.textContent.includes("Big text")),
    hit: hitBtn ? hitBtn.textContent.replace(/\s+/g, " ").slice(0, 40) : hit && hit.tagName,
  };
}

for (const [w, h] of [[1366, 768], [1024, 700], [412, 915], [915, 412]]) {
  const page = await open(w, h);
  const rev = await page.locator('meta[name="berty-run-rev"]').getAttribute("content");
  const vp = await page.locator('meta[name="viewport"]').getAttribute("content");
  ok(rev === "BR 1.12.5", `${w} rev ${rev}`);
  ok(!vp.includes("maximum-scale"), `${w} viewport`);
  await page.locator('button[aria-label="Settings"]').click();
  await page.waitForTimeout(250);
  const title = await page.evaluate(measure);
  notes.push(`${w}x${h} title ${JSON.stringify(title)}`);
  ok(title.box > title.panel - title.gear - 40, `${w} title box fills panel`);
  ok(title.gap < 24 && title.topGap < 16, `${w} title box reaches the gear and the bottom`);
  ok(title.big, `${w} big text hit`);
  await page.keyboard.press("Escape").catch(() => {});
  await page.locator('button[aria-label="Settings"]').click();
  await page.waitForTimeout(150);
  const closed = await page.evaluate(() => {
    const play = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("PLAY"));
    const gear = document.querySelector('button[aria-label="Settings"]').getBoundingClientRect();
    const pr = play.getBoundingClientRect();
    return { play: !!play, overlap: !(gear.bottom <= pr.top || gear.top >= pr.bottom || gear.right <= pr.left || gear.left >= pr.right) };
  });
  ok(closed.play && !closed.overlap, `${w} title card unchanged`);
  await page.getByRole("button", { name: "LEVELS" }).click();
  await page.waitForTimeout(150);
  await page.locator('button[aria-label="Settings"]').click();
  await page.waitForTimeout(200);
  const levels = await page.evaluate(measure);
  notes.push(`${w} levels ${JSON.stringify(levels)}`);
  ok(levels.box > levels.panel - levels.gear - 40 && levels.big, `${w} levels settings fills`);
  await page.close();
}

const page = await open(1366, 768);
await page.goto("http://127.0.0.1:8080/?hud=1", { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__eng, null, { timeout: 15000 });
await page.evaluate(() => {
  const eng = window.__eng;
  eng.save.parts = [];
  eng.save.best = { "roll-out": 22 };
  eng.selectCourse("roll-out");
  eng.setGoal("gaming");
  eng.awardClear();
  eng.phase = "win";
  eng.emit();
});
await page.waitForTimeout(300);
await page.locator('button[aria-label="Settings"]').click();
await page.waitForTimeout(200);
const results = await page.evaluate(measure);
notes.push("results " + JSON.stringify(results));
ok(results.box > results.panel - results.gear - 40 && results.big, "results settings fills");
const reward = await page.evaluate(() => document.body.innerText.includes("Next reward: Power supply") && !document.body.innerText.includes("Next reward: Motherboard"));
ok(reward, "reward line");
const fit = await page.evaluate(() => {
  const sec = document.querySelector("section.overlay-panel");
  return { ratio: sec.getBoundingClientRect().width / window.innerWidth, scroll: sec.scrollHeight - sec.clientHeight };
});
notes.push("fit " + JSON.stringify(fit));
await page.locator('button[aria-label="Settings"]').click();
await page.waitForTimeout(200);
const still = await page.evaluate(() => document.body.innerText.includes("Next reward: Power supply"));
ok(still && fit.scroll <= 2 && fit.ratio > 0.9, "results still full and no scroll");
console.log(notes.join("\n"));
console.log(notes.some((n) => n.startsWith("FAIL")) ? "PROVE FAIL" : "PROVE PASS");
await browser.close();
