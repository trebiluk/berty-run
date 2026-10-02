import { chromium, devices } from "playwright";

const browser = await chromium.launch({ headless: true });
const notes = [];
const ok = (c, m) => notes.push((c ? "ok " : "FAIL ") + m);
const phone = { ...devices["Pixel 5"] };

function touch(w, h) {
  return browser.newContext({ ...phone, viewport: { width: w, height: h }, deviceScaleFactor: 1 });
}

async function boot(ctx, search = "", access = null) {
  const page = await ctx.newPage();
  if (access) {
    await page.addInitScript((raw) => {
      localStorage.setItem("br-access-v1", JSON.stringify(raw));
      if (raw && raw.lang) localStorage.setItem("kulibert-prefs-v1", JSON.stringify({ v: 1, lang: raw.lang }));
    }, access);
  }
  await page.goto("http://127.0.0.1:8080/" + search, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector('button[aria-label="Settings"], button[aria-label="Menu"], button[aria-label="Menú"]', { timeout: 20000 });
  await page.waitForTimeout(300);
  return page;
}

const EN = [
  "Play style",
  "Sign in",
  "Esports heat",
  "One player",
  "Two players",
  "Hide scores",
  "Scores",
  "Best run on",
  "Best run off",
  "This hour",
  "Teacher pin",
  "Teacher unlock on",
  "Wrong pin",
  "Not signed in",
  "Cabinet",
  "Arcade",
  "Classic",
  "Music",
  "Volume",
  "Scanlines",
  "Off for motion",
  "Berty skin",
  "Sticker",
  "Your rig",
  "Pause",
  "Resume",
  "Mute",
  "Retry",
  "Exit",
  "Full screen",
  "One stick, or WASD",
  "Two thumbs on a phone",
  "Keys + mouse",
  "Neon",
  "Sunset",
  "Mint",
  "Mono Green",
  "Lime",
  "Cyan",
  "Magenta",
  "Rainbow",
  "Bolt",
];

function hits(text) {
  return EN.filter((s) => text.includes(s));
}

for (const [w, h] of [[412, 915], [360, 800], [915, 412], [800, 360], [980, 1400]]) {
  const ctx = await touch(w, h);
  const page = await boot(ctx);
  const title = await page.evaluate(() => {
    const sec = document.querySelector("section.overlay-panel");
    const card = document.querySelector(".title-card");
    const play = [...document.querySelectorAll("button")].find((b) => /play/i.test(b.textContent));
    const levels = [...document.querySelectorAll("button")].find((b) => /levels/i.test(b.textContent));
    const sr = sec.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    const pr = play.getBoundingClientRect();
    const lr = levels.getBoundingClientRect();
    return {
      coarse: matchMedia("(pointer: coarse)").matches,
      pw: sr.width / innerWidth,
      ph: sr.height / innerHeight,
      playH: pr.height,
      levelsH: lr.height,
      cardMid: (cr.top + cr.bottom) / 2,
      panelMid: (sr.top + sr.bottom) / 2,
      vp: document.querySelector('meta[name="viewport"]').content,
      rev: document.querySelector('meta[name="berty-run-rev"]').content,
    };
  });
  notes.push(`${w}x${h} title ${JSON.stringify({ pw: +title.pw.toFixed(3), ph: +title.ph.toFixed(3), playH: Math.round(title.playH), levelsH: Math.round(title.levelsH), mid: Math.round(title.cardMid - title.panelMid) })}`);
  ok(title.coarse && title.rev === "BR 1.12.8" && !title.vp.includes("maximum-scale"), `${w} meta`);
  ok(title.pw >= 0.94 && title.ph >= 0.85, `${w} title panel`);
  ok(title.playH >= 64 && title.levelsH >= 48, `${w} play/levels size`);
  ok(Math.abs(title.cardMid - title.panelMid) < innerShift(h), `${w} title centered`);
  await page.locator('button[aria-label="Settings"]').click();
  await page.waitForTimeout(200);
  const gear = await page.evaluate(() => {
    const bodies = [...document.querySelectorAll(".settings-body")];
    const body = bodies[0];
    const h2 = body.querySelector("h2");
    const next = h2?.nextElementSibling?.textContent || "";
    const area = document.querySelector("[data-version-area]");
    const line = "BR 1.12.8: Sideways results now fit on one screen, with practice tiles and Levels on the right and no scrolling (1.12.7 still hid them on small phones). Esports heat Close goes back to your results.";
    const clones = document.body.innerText.split(line).length - 1;
    const br = body.getBoundingClientRect();
    const sec = document.querySelector("section.overlay-panel").getBoundingClientRect();
    return {
      bw: br.width / innerWidth,
      sw: sec.width / innerWidth,
      next: next.trim(),
      line: area?.innerText.includes(line),
      clones,
      lang: document.documentElement.lang,
    };
  });
  notes.push(`${w} settings ${JSON.stringify(gear)}`);
  ok(gear.bw >= 0.94 && gear.sw >= 0.94, `${w} settings width`);
  ok(gear.next.startsWith("Language") && gear.line && gear.clones === 1, `${w} language then news`);
  await page.getByRole("button", { name: "Español" }).click();
  await page.waitForTimeout(150);
  const es = await page.evaluate((banned) => {
    const area = document.querySelector("[data-version-area]")?.innerText || "";
    let body = document.querySelector(".settings-body")?.innerText || "";
    if (area) body = body.replace(area, "");
    const found = banned.filter((s) => {
      const esc = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?:^|[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ])${esc}(?:[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]|$)`).test(body);
    });
    return { lang: document.documentElement.lang, found, head: body.slice(0, 180) };
  }, EN);
  notes.push(`${w} es ${es.lang} ${es.found.join("|") || "clean"}`);
  ok(es.lang === "es" && es.found.length === 0, `${w} español settings`);
  await page.getByRole("button", { name: "English" }).click();
  await page.waitForTimeout(100);
  await page.locator('button[aria-label="Settings"]').click();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: /^Levels$/i }).click();
  await page.waitForTimeout(150);
  const levels = await page.evaluate(() => {
    const sec = document.querySelector("section.overlay-panel").getBoundingClientRect();
    return sec.width / innerWidth;
  });
  ok(levels >= 0.94, `${w} levels panel ${levels.toFixed(3)}`);
  await ctx.close();
}

function innerShift(h) {
  return h < 500 ? 120 : 90;
}

// Menu, hint, sticks, stage clear, exit — touch sizes.
for (const [w, h] of [[412, 915], [360, 800], [915, 412], [800, 360]]) {
  const ctx = await touch(w, h);
  const page = await boot(ctx, "?hud=1", {
    lang: "en",
    speak: false,
    big: false,
    fewer: false,
    drive: "hands",
    hands: true,
    mouse: false,
    follow: false,
    tilt: false,
  });
  await page.waitForFunction(() => window.__eng && window.__eng.phase === "play", null, { timeout: 30000 });
  await page.evaluate(() => {
    const eng = window.__eng;
    eng.setHands(true);
    eng.skipIntro();
    eng.emit();
  });
  await page.waitForTimeout(200);
  await page.locator('button[aria-label="Menu"]').click();
  await page.waitForTimeout(250);
  const menu = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll("canvas.play-canvas")].map((c) => {
      const cs = getComputedStyle(c);
      return { display: cs.display, w: c.getBoundingClientRect().width, hidden: c.hasAttribute("hidden"), pe: cs.pointerEvents };
    });
    const scrim = document.querySelector("div.menu-scrim");
    const panel = [...document.querySelectorAll("div")].find((el) => (el.className || "").includes("w-[min(22rem,85%)]"));
    const pr = panel?.getBoundingClientRect();
    const buttons = panel ? [...panel.querySelectorAll("button")].slice(0, 4).map((b) => b.textContent.trim()) : [];
    const jump = document.querySelector("[data-hud=jump]");
    const zap = document.querySelector("[data-hud=zap]");
    const c2 = document.querySelectorAll("canvas.play-canvas")[1];
    const ctx = c2.getContext("2d", { willReadFrequently: true });
    let lime = false;
    if (ctx && c2.width > 0) {
      const w = c2.clientWidth;
      const h = c2.clientHeight;
      const size = h < 720 ? 108 : 112;
      const y = h - size - (h < 720 ? 28 : 14);
      const cx = w - size - 12 + size / 2;
      const cy = y + size / 2;
      const dpr = c2.width / w;
      const px = ctx.getImageData(Math.floor(cx * dpr), Math.floor(cy * dpr), 1, 1).data;
      lime = px[1] > 180 && px[0] > 140 && px[2] < 120;
    }
    return {
      phase: window.__eng.phase,
      canvases,
      scrim: !!scrim && getComputedStyle(scrim).display !== "none",
      left: pr ? pr.left : 99,
      width: pr ? pr.width / innerWidth : 1,
      buttons,
      jump: !!jump,
      zap: !!zap,
      lime,
    };
  });
  notes.push(`${w} menu ${JSON.stringify({ phase: menu.phase, canvases: menu.canvases, left: Math.round(menu.left), width: +menu.width.toFixed(3), buttons: menu.buttons, jump: menu.jump, zap: menu.zap, lime: menu.lime })}`);
  ok(menu.phase === "pause", `${w} menu pauses`);
  ok(menu.canvases.length === 2 && menu.canvases.every((c) => c.display !== "none" && c.w > 0 && !c.hidden), `${w} canvases stay up`);
  ok(menu.scrim && menu.left <= 1 && menu.width <= 0.85, `${w} scrim and left menu`);
  ok(!menu.jump && !menu.zap && !menu.lime, `${w} no sticks or buttons`);
  ok(menu.buttons[3] === "Exit", `${w} fourth is Exit`);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.waitForTimeout(250);
  const back = await page.evaluate(() => ({
    phase: window.__eng.phase,
    menu: !!document.querySelector("div.menu-scrim"),
    jump: !!document.querySelector("[data-hud=jump]"),
    zap: !!document.querySelector("[data-hud=zap]"),
    expanded: document.querySelector('button[aria-label="Menu"]')?.getAttribute("aria-expanded"),
  }));
  ok(back.phase === "play" && !back.menu && back.expanded === "false" && back.jump && back.zap, `${w} resume restores controls`);

  const rings = await page.evaluate(() => {
    const inflate = (el, n) => {
      const r = el.getBoundingClientRect();
      return { left: r.left - n, right: r.right + n, top: r.top - n, bottom: r.bottom + n };
    };
    const gap = (a, b) => {
      const dx = Math.max(0, Math.max(a.left - b.right, b.left - a.right));
      const dy = Math.max(0, Math.max(a.top - b.bottom, b.top - a.bottom));
      if (dx === 0 && dy === 0) return -Math.min(a.right, b.right) + Math.max(a.left, b.left) < 0 ? -1 : 0;
      return Math.hypot(dx, dy);
    };
    const zap = document.querySelector("[data-hud=zap]");
    const jump = document.querySelector("[data-hud=jump]");
    const c2 = document.querySelectorAll("canvas.play-canvas")[1];
    const w = c2.clientWidth;
    const h = c2.clientHeight;
    const size = h < 720 ? 108 : 112;
    const y = h - size - (h < 720 ? 28 : 14);
    const cx = w - size - 12 + size / 2;
    const cy = y + size / 2;
    const zr = inflate(zap, 2);
    const jr = inflate(jump, 2);
    const stick = { left: cx - 53, right: cx + 53, top: cy - 53, bottom: cy + 53 };
    const header = document.querySelector("header").getBoundingClientRect();
    const up = [...document.querySelectorAll("[data-hud=score] p")].find((p) => p.textContent.includes("1UP"));
    const ur = up ? up.getBoundingClientRect() : null;
    const touch = (r, box) => !(r.right < box.left || r.left > box.right || r.bottom < box.top || r.top > box.bottom);
    return {
      zj: Math.round(gap(zr, jr)),
      js: Math.round(gap(jr, stick)),
      zs: Math.round(gap(zr, stick)),
      header: touch(zr, header) || touch(jr, header) || touch(stick, header),
      up: ur ? touch(zr, ur) || touch(jr, ur) || touch(stick, ur) : false,
      zapLeft: zr.left < jr.left,
      short: matchMedia("(orientation: landscape) and (max-height: 500px)").matches,
    };
  });
  notes.push(`${w} rings ${JSON.stringify(rings)}`);
  ok(rings.zj >= 12 && rings.js >= 12 && rings.zs >= 12 && !rings.header && !rings.up, `${w} control spacing`);
  if (rings.short) ok(rings.zapLeft, `${w} zap left of jump`);

  await page.evaluate(() => {
    const eng = window.__eng;
    eng.time = 20;
    eng.tipUntil = 0;
    eng.saidRoad = true;
    eng.emit();
  });
  await page.waitForTimeout(80);
  const hint = await page.evaluate(() => {
    const el = document.querySelector("[data-hud=hint]");
    const cs = el ? getComputedStyle(el) : null;
    return { text: el?.textContent || "", op: cs ? Number(cs.opacity) : -1, w: el ? el.getBoundingClientRect().width : 0, pe: cs?.pointerEvents };
  });
  await page.waitForTimeout(2600);
  const faded = await page.evaluate(() => {
    const el = document.querySelector("[data-hud=hint]");
    const cs = getComputedStyle(el);
    return { op: Number(cs.opacity), w: el.getBoundingClientRect().width, pe: cs.pointerEvents, text: el.textContent };
  });
  ok(faded.w <= 320 && faded.w <= w * 0.61 && faded.pe === "none" && faded.op === 0, `${w} hint fade ${faded.op} w=${Math.round(faded.w)} "${faded.text.slice(0, 32)}"`);
  await page.evaluate(() => window.__eng.note("Fresh hint for the phone."));
  await page.waitForTimeout(400);
  const shown = await page.evaluate(() => Number(getComputedStyle(document.querySelector("[data-hud=hint]")).opacity));
  await page.waitForTimeout(2200);
  const again = await page.evaluate(() => {
    const el = document.querySelector("[data-hud=hint]");
    return { op: Number(getComputedStyle(el).opacity), text: el.textContent };
  });
  ok(shown > 0.5 && again.op === 0 && again.text.includes("Fresh hint"), `${w} hint resets op ${shown}->${again.op} ${again.text.slice(0, 24)}`);

  const plate = await page.evaluate(() => {
    const rev = document.querySelector("[data-hud=rev]").getBoundingClientRect();
    const score = document.querySelector("[data-hud=score] p")?.getBoundingClientRect();
    if (!score) return { missing: true };
    const gap = score.bottom <= rev.top ? rev.top - score.bottom : rev.bottom <= score.top ? score.top - rev.bottom : -1;
    const hit = !(rev.right < score.left || rev.left > score.right || rev.bottom < score.top || rev.top > score.bottom);
    return { gap: Math.round(gap * 10) / 10, hit, rev: rev.top, score: score.bottom };
  });
  notes.push(`${w} plate ${JSON.stringify(plate)}`);
  ok(!plate.missing && !plate.hit && plate.gap >= 4, `${w} rev clear of score`);

  await page.locator('button[aria-label="Menu"]').click();
  await page.waitForTimeout(200);
  const exitLabel = await page.evaluate(() => {
    const panel = [...document.querySelectorAll("div")].find((el) => (el.className || "").includes("w-[min(22rem,85%)]"));
    return [...panel.querySelectorAll("button")][3].textContent.trim();
  });
  ok(exitLabel === "Exit", `${w} exit before fullscreen`);
  await page.evaluate(() => {
    window.__eng.selectCourse(window.__eng.course.id);
  });
  await page.waitForTimeout(200);
  await page.locator('button[aria-label="Settings"]').click();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "Full screen" }).click();
  await page.waitForTimeout(150);
  await page.locator('button[aria-label="Settings"]').click();
  await page.waitForTimeout(100);
  await page.getByRole("button", { name: /^Play$/i }).click();
  await page.waitForTimeout(300);
  await page.locator('button[aria-label="Menu"]').click();
  await page.waitForTimeout(200);
  const afterFs = await page.evaluate(() => {
    const panel = [...document.querySelectorAll("div")].find((el) => (el.className || "").includes("w-[min(22rem,85%)]"));
    const label = panel ? [...panel.querySelectorAll("button")][3].textContent.trim() : "";
    return { label, phase: window.__eng.phase };
  });
  ok(afterFs.label === "Exit" && afterFs.phase === "pause", `${w} exit after fullscreen ${afterFs.label}`);
  await page.getByRole("button", { name: "Exit", exact: true }).click();
  await page.waitForTimeout(250);
  const left = await page.evaluate(() => ({
    phase: window.__eng.phase,
    menu: !!document.querySelector("div.menu-scrim"),
    play: [...document.querySelectorAll("button")].some((b) => /play/i.test(b.textContent)),
  }));
  ok(left.phase === "title" && !left.menu && left.play, `${w} exit leaves the run`);

  if (h <= 500) {
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
    const win = await page.evaluate(() => {
      document.querySelector("section.overlay-panel")?.scrollTo(0, 0);
      const inside = (el) => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.height > 2 && r.top >= -1 && r.bottom <= innerHeight + 1 && r.left >= -1 && r.right <= innerWidth + 1;
      };
      const next = [...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith("Next"));
      const line = document.querySelector(".win-compact");
      const name = document.querySelector(".reward-card h2");
      const nr = next?.getBoundingClientRect();
      const shown = (el) => {
        if (!el) return false;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return false;
        return inside(el);
      };
      return {
        next: inside(next),
        banner: shown(line) && (line.textContent || "").includes("watts"),
        name: shown(line) && (line.textContent || "").includes(name?.textContent || "x"),
        nextTop: nr ? Math.round(nr.top) : -1,
        nextBot: nr ? Math.round(nr.bottom) : -1,
        bannerText: line?.textContent,
        reward: name?.textContent,
      };
    });
    notes.push(`${w} clear ${JSON.stringify(win)}`);
    ok(win.next && win.banner && win.name, `${w} stage clear on screen`);
  }
  await ctx.close();
}

function windowWidth(w) {
  return w;
}

// Desktop 1.12.5 behaviors, fine pointer.
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await boot(ctx, "?hud=1");
  await page.waitForFunction(() => window.__eng, null, { timeout: 15000 });
  const coarse = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
  ok(!coarse, "desktop pointer fine");
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
  const reward = await page.evaluate(() => document.body.innerText.includes("Next reward: Power supply") && !document.body.innerText.includes("Next reward: Motherboard"));
  ok(reward, "reward line");
  await page.locator('button[aria-label="Settings"]').click();
  await page.waitForTimeout(250);
  const fill = await page.evaluate(() => {
    const sec = document.querySelector("section.overlay-panel");
    const gear = document.querySelector('button[aria-label="Settings"]');
    const box = [...sec.querySelectorAll("div")].find((el) => el.className.includes("absolute") && el.className.includes("overflow-y-auto") && el.querySelector("h2"));
    const big = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Big text"));
    const sr = sec.getBoundingClientRect();
    const gr = gear.getBoundingClientRect();
    const br = box.getBoundingClientRect();
    const bbr = big.getBoundingClientRect();
    const hit = document.elementFromPoint(bbr.left + 16, bbr.top + bbr.height / 2);
    const gearBad = [];
    for (const el of document.querySelectorAll("button, a")) {
      if (el === gear || el.closest('button[aria-label="Settings"]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const iw = Math.min(gr.right, r.right) - Math.max(gr.left, r.left);
      const ih = Math.min(gr.bottom, r.bottom) - Math.max(gr.top, r.bottom ? gr.top : r.top);
      const ih2 = Math.min(gr.bottom, r.bottom) - Math.max(gr.top, r.top);
      if (iw > 1 && ih2 > 1) gearBad.push((el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 30));
    }
    return {
      fill: br.height >= sr.height - gr.height - 40 && sr.bottom - br.bottom < 24 && br.top - gr.bottom < 16,
      big: !!(hit && hit.closest("button") && hit.closest("button").textContent.includes("Big text")),
      gearX: gr.x,
      gearBad,
    };
  });
  notes.push("desk gear " + JSON.stringify(fill));
  ok(fill.fill && fill.big, "results settings fills");
  ok(fill.gearX < 40 && fill.gearBad.length === 0, "clean gear rect");
  await page.getByRole("button", { name: "Esports heat" }).click();
  await page.waitForTimeout(250);
  const heat = await page.evaluate(() => document.body.innerText.includes("Esports heat") || document.body.innerText.includes("Calling the field"));
  ok(heat, "heat opens from its button");
  await page.locator('button[aria-label="Settings"]').click().catch(() => {});
  await page.evaluate(() => {
    const eng = window.__eng;
    eng.phase = "play";
    eng.emit();
  });
  await page.waitForTimeout(200);
  const menuBtn = await page.locator('button[aria-label="Menu"]').boundingBox();
  ok(menuBtn && menuBtn.x < 80 && menuBtn.y < 80, "menu top-left");
  await page.locator('button[aria-label="Menu"]').click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await page.waitForTimeout(250);
  const retry = await page.evaluate(() => ({
    phase: window.__eng.phase,
    menu: document.querySelector('button[aria-label="Menu"]')?.getAttribute("aria-expanded"),
    hidden: document.querySelector("canvas.play-canvas")?.hasAttribute("hidden"),
  }));
  ok(retry.phase === "play" && retry.menu === "false" && !retry.hidden, "retry restarts");
  await ctx.close();
}

// Español menu labels.
{
  const ctx = await touch(412, 915);
  const page = await boot(ctx, "?hud=1", {
    lang: "es",
    speak: false,
    big: false,
    fewer: false,
    drive: "lean",
    hands: false,
    mouse: false,
    follow: false,
    tilt: false,
  });
  await page.waitForFunction(() => window.__eng, null, { timeout: 15000 });
  await page.waitForTimeout(200);
  await page.locator('button[aria-label="Menú"]').click();
  await page.waitForTimeout(200);
  const menuEs = await page.evaluate((banned) => {
    const panel = [...document.querySelectorAll("div")].find((el) => (el.className || "").includes("w-[min(22rem,85%)]"));
    const text = panel?.innerText || "";
    return { lang: document.documentElement.lang, found: banned.filter((s) => text.includes(s)), text: text.slice(0, 240) };
  }, EN);
  notes.push("es menu " + JSON.stringify(menuEs));
  ok(menuEs.lang === "es" && menuEs.found.length === 0, "español menu");
  await ctx.close();
}

console.log(notes.join("\n"));
console.log(notes.some((n) => n.startsWith("FAIL")) ? "PROVE FAIL" : "PROVE PASS");
await browser.close();
