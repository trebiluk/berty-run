import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "/workspace/screenshots";
mkdirSync(OUT, { recursive: true });

const shots = [
  ["around-the-bend", 16, -30, "bend-spot"],
  ["shop-exit", 16, -16, "ring-io"],
  ["signal-hop", -12, -12, "ring-signal"],
  ["blade-walk", 11, -25.6, "ring-blade"],
  ["case-drop", 16, -19.5, "ring-case"],
  ["blade-walk", 18.2, -18, "gem-blade"],
  ["shop-exit", 18.3, -22, "gem-io"],
];

function overlap(a, b) {
  if (!a || !b || a.w < 2 || b.w < 2 || a.h < 2 || b.h < 2) return false;
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (err) => errors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const hydration = errors.filter((e) => e.includes("418") || e.toLowerCase().includes("hydration"));
console.log("HYDRATION", hydration.length ? hydration.join(" | ") : "clean");
console.log("CONSOLE", errors.length ? errors.slice(0, 8).join(" | ") : "clean");
await page.close();

async function measure(p) {
  return p.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return {
      timer: box("[data-hud=timer]"),
      bar: box("[data-hud=bar]"),
      score: box("[data-hud=score]"),
      hint: box("[data-hud=hint]"),
      jump: box("[data-hud=jump]"),
      rev: box("[data-hud=rev]")?.w ? document.querySelector("[data-hud=rev]")?.textContent : "",
      menu: box("[aria-label=Menu]"),
    };
  });
}

for (const [w, h] of [
  [915, 412],
  [412, 915],
]) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  const bad = [];
  p.on("pageerror", (err) => bad.push(String(err)));
  await p.goto("http://127.0.0.1:8080/?hud=1", { waitUntil: "domcontentloaded" });
  await p.waitForSelector("[data-hud=jump]", { timeout: 20000 });
  await p.waitForFunction(() => window.__eng?.bend?.trackId === "around-the-bend", null, { timeout: 45000 });
  await p.evaluate(() => {
    window.__eng.skipIntro();
    window.__eng.halt = true;
  });
  const hud = await measure(p);
  const pairs = [
    ["timer", "bar"],
    ["timer", "hint"],
    ["timer", "score"],
    ["bar", "hint"],
    ["score", "hint"],
    ["hint", "jump"],
    ["bar", "menu"],
    ["score", "menu"],
  ];
  const hits = pairs.filter(([a, b]) => overlap(hud[a], hud[b]));
  console.log(`HUD ${w}x${h}`, JSON.stringify({ rev: hud.rev, timer: hud.timer, bar: hud.bar, hint: hud.hint, jump: hud.jump, hits }));
  if (bad.length) console.log("ERR", w, bad.slice(0, 3));
  for (const [id, x, z, name] of shots) {
    await p.evaluate(
      async ({ id, x, z }) => {
        const e = window.__eng;
        e.halt = false;
        if (e.course.id !== id) {
          e.selectCourse(id);
          for (let i = 0; i < 60 && e.bend?.trackId !== id; i++) await new Promise((r) => setTimeout(r, 40));
          e.ackBrief(null);
        }
        e.skipIntro();
        e.bend.pos.set(x, 0.5, z);
        e.bend.vel.set(0, 0, 0);
        e.bend.grounded = true;
        e.fast(8);
      },
      { id, x, z },
    );
    await p.waitForTimeout(350);
    await p.screenshot({ path: `${OUT}/br1121-${name}-${w}x${h}.png` });
  }
  await p.evaluate(() => {
    window.__eng.halt = true;
    window.__eng.destroy();
  });
  await p.close();
}
await browser.close();
console.log("SHOTS DONE");
