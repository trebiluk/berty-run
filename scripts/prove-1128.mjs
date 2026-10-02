import { chromium, devices } from "playwright";

const browser = await chromium.launch({ headless: true });
const phone = { ...devices["Pixel 5"] };
const notes = [];
const ok = (c, m) => notes.push((c ? "ok " : "FAIL ") + m);

function ctxFor(w, h) {
  return browser.newContext({ ...phone, viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
}

async function boot(w, h, search = "?hud=1", access = null) {
  const ctx = await ctxFor(w, h);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  if (access) {
    await page.addInitScript((raw) => localStorage.setItem("br-access-v1", JSON.stringify(raw)), access);
  }
  await page.goto("http://127.0.0.1:8080/" + search, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("button[aria-label='Settings'], button[aria-label='Menu'], button[aria-label='Menú']", { timeout: 20000 });
  if (search.includes("hud=1")) {
    await page.waitForFunction(() => window.__eng && window.__eng.phase === "play", null, { timeout: 30000 });
  }
  return { ctx, page, errors };
}

async function showWin(page) {
  await page.evaluate(() => {
    const eng = window.__eng;
    eng.save.parts = [];
    eng.save.passed = [];
    eng.save.best = { "roll-out": 22 };
    eng.selectCourse("roll-out");
    eng.setGoal("gaming");
    eng.awardClear();
    eng.phase = "win";
    eng.emit();
  });
  await page.waitForTimeout(280);
  await page.evaluate(() => {
    document.querySelectorAll(".win-rest, .panel-body, .overlay-panel").forEach((el) => {
      el.scrollTop = 0;
    });
  });
}

async function tapButton(page, re) {
  const box = await page.evaluate((source) => {
    const rx = new RegExp(source);
    const b = [...document.querySelectorAll("button")].find((el) => rx.test((el.textContent || "").replace(/\s+/g, " ").trim()));
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, top: r.top, bottom: r.bottom, w: r.width, h: r.height };
  }, re);
  if (!box) return null;
  await page.touchscreen.tap(box.x, box.y);
  return box;
}

const hands = { lang: "en", speak: false, big: false, fewer: false, drive: "hands", hands: true, mouse: false, follow: false, tilt: false };

for (const [w, h] of [[800, 360], [915, 412]]) {
  const { ctx, page, errors } = await boot(w, h);
  await showWin(page);
  const geo = await page.evaluate(() => {
    const fit = (el, scroll) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const sr = scroll ? scroll.getBoundingClientRect() : null;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      const inView = r.width >= 43.5 && r.height >= 43.5 && r.top >= -1 && r.bottom <= innerHeight + 1 && r.left >= -1 && r.right <= innerWidth + 1;
      const inScroll = !sr || (r.top >= sr.top - 1 && r.bottom <= sr.bottom + 1 && r.left >= sr.left - 1 && r.right <= sr.right + 1);
      return { inView, inScroll, self: !!(hit && (hit === el || hit.closest("button") === el)), w: r.width, h: r.height };
    };
    const board = document.querySelector(".win-board");
    const rest = document.querySelector(".win-rest");
    const buttons = [...document.querySelectorAll(".win-board button")];
    const find = (re) => buttons.find((b) => re.test((b.textContent || "").replace(/\s+/g, " ").trim()));
    const compact = document.querySelector(".win-compact");
    const cr = compact?.getBoundingClientRect();
    return {
      p2: fit(find(/^Practice 2D/), rest),
      p3: fit(find(/^Practice 3D/), rest),
      tube: fit(find(/^Bus Tube/), rest),
      levels: fit(find(/^Levels/), rest),
      next: fit(find(/^Next/), board),
      learn: fit(find(/^Learn |^Install /), board),
      again: fit(find(/^Run this board again/), board),
      save: fit(find(/^Save/), board),
      open: find(/^Levels/)?.getAttribute("aria-expanded"),
      reward: compact && getComputedStyle(compact).display !== "none" && cr.bottom <= innerHeight && cr.height > 8 && /Stage clear/.test(compact.textContent) && compact.textContent.includes("watts"),
      hx: document.documentElement.scrollWidth > innerWidth + 2,
      errs: 0,
    };
  });
  for (const key of ["p2", "p3", "tube", "levels", "next", "learn", "again", "save"]) {
    const b = geo[key];
    ok(!!b && b.inView && b.inScroll && b.self, `${w}x${h} ${key} ${JSON.stringify(b)}`);
  }
  ok(geo.open === "false" && geo.reward && !geo.hx, `${w}x${h} closed levels, reward, no h-scroll`);
  ok(errors.length === 0, `${w}x${h} console ${errors.join(" | ") || "clean"}`);

  const p2 = await tapButton(page, "^Practice 2D");
  await page.waitForTimeout(400);
  const p2s = await page.evaluate(() => ({ phase: window.__eng.phase, course: window.__eng.course.id }));
  ok(!!p2 && p2s.phase === "play" && p2s.course === "practice-2d", `${w} practice-2d ${JSON.stringify(p2s)}`);
  await showWin(page);
  await tapButton(page, "^Bus Tube");
  await page.waitForTimeout(400);
  const tb = await page.evaluate(() => ({ phase: window.__eng.phase, course: window.__eng.course.id }));
  ok(tb.phase === "play" && tb.course === "tube-run", `${w} tube ${JSON.stringify(tb)}`);
  await showWin(page);
  await page.waitForTimeout(450);
  await tapButton(page, "^Levels");
  await page.waitForTimeout(250);
  const mid = await page.evaluate(() => document.querySelector(".win-more [aria-expanded]")?.getAttribute("aria-expanded"));
  await page.waitForTimeout(450);
  await tapButton(page, "^Levels");
  await page.waitForTimeout(250);
  const end = await page.evaluate(() => document.querySelector(".win-more [aria-expanded]")?.getAttribute("aria-expanded"));
  ok(mid === "true" && end === "false", `${w} levels toggle ${mid}->${end}`);
  await ctx.close();
}

for (const [w, h] of [[360, 800], [412, 915]]) {
  const { ctx, page } = await boot(w, h);
  await showWin(page);
  const port = await page.evaluate(() => {
    const next = [...document.querySelectorAll(".win-board button")].find((b) => (b.textContent || "").trim().startsWith("Next"));
    const r = next.getBoundingClientRect();
    const sc = document.querySelector(".panel-body") || document.querySelector(".overlay-panel");
    const levels = [...document.querySelectorAll(".win-board button")].find((b) => (b.textContent || "").includes("Levels"));
    return {
      next: r.height >= 44 && r.top >= -1 && r.bottom <= innerHeight + 1,
      scroll: sc ? sc.scrollTop : 0,
      levelsOpen: levels?.getAttribute("aria-expanded"),
      compact: getComputedStyle(document.querySelector(".win-compact")).display,
      banner: !!document.querySelector(".arcade-banner") && getComputedStyle(document.querySelector(".arcade-banner")).display !== "none",
    };
  });
  ok(port.next && port.scroll === 0 && port.levelsOpen === "true" && port.compact === "none" && port.banner, `${w}x${h} portrait unchanged ${JSON.stringify(port)}`);
  await ctx.close();
}

async function openHeat(page) {
  await page.locator('button[aria-label="Settings"]').click();
  await page.waitForTimeout(120);
  await page.getByRole("button", { name: "Esports heat" }).click();
  await page.waitForTimeout(180);
}

for (const [w, h] of [[800, 360], [915, 412], [360, 800], [412, 915]]) {
  const { ctx, page, errors } = await boot(w, h);
  await showWin(page);
  await openHeat(page);
  const a = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "Close");
    const r = b.getBoundingClientRect();
    return { x: r.x, y: r.y, on: r.top >= -1 && r.bottom <= innerHeight + 1 && r.height >= 43 };
  });
  await page.waitForFunction(() => document.body.innerText.includes("takes it"), null, { timeout: 8000 });
  const b = await page.evaluate(() => {
    const el = [...document.querySelectorAll("button")].find((n) => n.textContent.trim() === "Close");
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, on: r.top >= -1 && r.bottom <= innerHeight + 1 };
  });
  ok(a.on && b.on && Math.abs(a.x - b.x) <= 2 && Math.abs(a.y - b.y) <= 2, `${w}x${h} close stays ${a.y}->${b.y} on ${a.on}/${b.on}`);
  await page.touchscreen.tap(b.x + 24, b.y + 18);
  await page.waitForTimeout(200);
  let phase = await page.evaluate(() => window.__eng.phase);
  ok(phase === "win", `${w}x${h} close back ${phase}`);

  for (const wait of [1000, 3000, 6000]) {
    for (let i = 0; i < 5; i++) {
      await showWin(page);
      await openHeat(page);
      await page.waitForTimeout(wait);
      const box = await page.evaluate(() => {
        const el = [...document.querySelectorAll("button")].find((n) => n.textContent.trim() === "Close");
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, on: r.bottom <= innerHeight + 1 && r.top >= -1 };
      });
      await page.touchscreen.tap(box.x, box.y);
      const seen = [];
      for (const ms of [200, 400, 900]) {
        await page.waitForTimeout(ms);
        seen.push(await page.evaluate(() => window.__eng.phase));
      }
      ok(box.on && seen.every((p) => p === "win"), `${w}x${h} heat ${wait} #${i + 1} ${seen.join(",")} on=${box.on}`);
    }
  }
  ok(errors.length === 0, `${w}x${h} heat console ${errors.join(" | ") || "clean"}`);
  await ctx.close();
}

{
  const { ctx, page } = await boot(915, 412);
  let boardsOk = 0;
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => {
      const eng = window.__eng;
      eng.selectCourse("around-the-bend");
      eng.phase = "play";
      eng.skipIntro();
      eng.emit();
    });
    await page.waitForTimeout(200);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await tapButton(page, "^Boards$");
    await page.waitForTimeout(500);
    const st = await page.evaluate(() => ({ phase: window.__eng.phase, course: window.__eng.course.id }));
    if (st.phase === "title") boardsOk++;
    else notes.push("FAIL boards " + JSON.stringify(st));
  }
  ok(boardsOk === 5, `boards 5/5 title (${boardsOk})`);
  await ctx.close();
}

{
  const { ctx, page } = await boot(800, 360, "?hud=1", hands);
  await page.evaluate(() => {
    window.__eng.setHands(true);
    window.__eng.skipIntro();
    window.__eng.emit();
  });
  await page.waitForTimeout(200);
  const rings = await page.evaluate(() => {
    const header = document.querySelector("header").getBoundingClientRect();
    const up = [...document.querySelectorAll("[data-hud=score] p")].find((p) => p.textContent.includes("1UP"));
    const ur = up.getBoundingClientRect();
    const gapBelow = (el, edge) => el.getBoundingClientRect().top - edge;
    const zap = document.querySelector("[data-hud=zap]");
    const jump = document.querySelector("[data-hud=jump]");
    return {
      zapH: Math.round(gapBelow(zap, header.bottom) * 10) / 10,
      jumpH: Math.round(gapBelow(jump, header.bottom) * 10) / 10,
      zapU: Math.round((zap.getBoundingClientRect().left - ur.right) * 10) / 10,
      jumpU: Math.round((jump.getBoundingClientRect().top - ur.bottom) * 10) / 10,
    };
  });
  ok(rings.zapH >= 12 && rings.jumpH >= 12 && rings.zapU >= 12 && rings.jumpU >= 12, `rings ${JSON.stringify(rings)}`);
  await ctx.close();
}

{
  const { ctx, page } = await boot(412, 915, "?hud=1", { ...hands, lang: "es", drive: "lean", hands: false });
  const label = await page.locator("header button").first().getAttribute("aria-label");
  ok(label === "Menú", `es menu ${label}`);
  await ctx.close();
}

{
  const { ctx, page } = await boot(800, 360, "?theme=classic&hud=1");
  const theme = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute("data-theme"),
    rev: document.querySelector('meta[name="berty-run-rev"]')?.content,
    vp: document.querySelector('meta[name="viewport"]')?.content,
  }));
  ok(theme.theme === "classic" && theme.rev === "BR 1.12.8" && !theme.vp.includes("maximum-scale"), `classic ${JSON.stringify(theme)}`);
  await ctx.close();
}

console.log(notes.join("\n"));
const failed = notes.filter((n) => n.startsWith("FAIL")).length;
console.log(`\n${notes.length - failed} pass, ${failed} fail`);
await browser.close();
process.exit(failed ? 1 : 0);
