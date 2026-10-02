import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";

const browser = await chromium.launch({ headless: true });
const notes = [];
const ok = (c, m) => notes.push((c ? "ok " : "FAIL ") + m);
mkdirSync("/workspace/screenshots", { recursive: true });

const PLAY = {
  en: "Play",
  simple: "Play",
  uk: "Грати",
  ru: "Играть",
  es: "Jugar",
  ar: "العب",
  "fa-AF": "بازی",
  rw: "Kina",
  ti: "ተጻወት",
};
const LEVELS = {
  en: "Levels",
  simple: "Levels",
  uk: "Рівні",
  ru: "Уровни",
  es: "Niveles",
  ar: "المستويات",
  "fa-AF": "مرحله‌ها",
  rw: "Ibyiciro",
  ti: "ደረጃታት",
};

async function open(lang, w, h, extra = "") {
  const ctx = await browser.newContext({
    ...devices["Pixel 5"],
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.addInitScript(() => {
    localStorage.setItem("br-howto-v1", "1");
  });
  await page.goto(`http://127.0.0.1:8080/?lang=${encodeURIComponent(lang)}${extra}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForSelector(".title-card button", { timeout: 20000 });
  await page.waitForTimeout(400);
  return { ctx, page, errors };
}

for (const lang of Object.keys(PLAY)) {
  const { ctx, page, errors } = await open(lang, 412, 915);
  const text = await page.locator(".title-card").innerText();
  ok(text.includes(PLAY[lang]), `${lang} play in door: ${text.split("\n").slice(-3).join(" | ")}`);
  ok(text.includes(LEVELS[lang]), `${lang} levels in door`);
  const meta = await page.locator('meta[name="berty-run-rev"]').getAttribute("content");
  ok(meta === "BR 1.12.8", `${lang} rev ${meta}`);
  const dir = await page.evaluate(() => document.documentElement.dir);
  const want = lang === "ar" || lang === "fa-AF" ? "rtl" : "ltr";
  ok(dir === want, `${lang} dir ${dir}`);
  const canvasDir = await page.evaluate(() => document.querySelector(".play-canvas")?.getAttribute("dir"));
  ok(canvasDir === "ltr", `${lang} canvas dir ${canvasDir}`);
  const scroll = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth <= el.clientWidth + 2;
  });
  ok(scroll, `${lang} no sideways scroll 412`);
  ok(errors.length === 0, `${lang} console ${errors.join(" | ") || "clean"}`);
  if (lang === "ar" || lang === "ti" || lang === "en") {
    await page.screenshot({ path: `/workspace/screenshots/lang-${lang}-412.png` });
  }
  await ctx.close();
}

{
  const { ctx, page } = await open("en", 412, 915);
  await page.evaluate(() => window.KulibertPrefs.acceptLang("uk"));
  await page.waitForFunction(() => document.querySelector(".title-card")?.innerText.includes("Грати"), null, { timeout: 8000 });
  const dir = await page.evaluate(() => document.documentElement.lang);
  ok(dir === "uk", `hub change without reload lang=${dir}`);
  await ctx.close();
}

for (const [w, h] of [[412, 915], [1366, 768]]) {
  for (const lang of ["ar", "fa-AF"]) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      hasTouch: true,
      isMobile: w < 800,
    });
    const page = await ctx.newPage();
    await page.addInitScript(() => localStorage.setItem("br-howto-v1", "1"));
    await page.goto(`http://127.0.0.1:8080/?lang=${lang}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".title-card button", { timeout: 20000 });
    await page.waitForTimeout(300);
    const box = await page.evaluate(() => {
      const el = document.documentElement;
      const main = document.querySelector("main");
      return {
        dir: el.dir,
        html: el.scrollWidth <= el.clientWidth + 2,
        main: !main || main.scrollWidth <= main.clientWidth + 2,
        canvas: document.querySelector(".play-canvas")?.getAttribute("dir"),
        left: document.querySelector(".menu-drawer, button[aria-expanded]")?.getBoundingClientRect?.().left ?? null,
      };
    });
    ok(box.dir === "rtl" && box.html && box.main && box.canvas === "ltr", `${lang} ${w}x${h} rtl scroll=${box.html}/${box.main} canvas=${box.canvas}`);
    await ctx.close();
  }
}

{
  const { ctx, page } = await open("rw", 412, 915);
  await page.locator(".overlay-panel button").first().click();
  const read = page.getByRole("button", { name: /ijwi|Read aloud|Soma/i }).first();
  await page.locator(".settings-body button").nth(0).click().catch(() => {});
  const line = await page.evaluate(async () => {
    const btn = [...document.querySelectorAll(".settings-body button")].find((b) => /ijwi|aloud|Soma|gusoma|Read/i.test(b.textContent || ""));
    btn?.click();
    await new Promise((r) => setTimeout(r, 200));
    return document.getElementById("kp-live")?.textContent || "";
  });
  const noVoice = await page.evaluate(() => window.KulibertI18n.t("noVoice"));
  ok(line.includes(noVoice), `rw no voice: ${line.slice(0, 120)}`);
  await ctx.close();
}

{
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("kulibert-prefs-v1", JSON.stringify({ v: 1, lang: "ar", size: "M" }));
    localStorage.setItem("br-howto-v1", "1");
  });
  await page.goto("http://127.0.0.1:8080/?theme=classic", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".title-card button", { timeout: 20000 });
  await page.waitForTimeout(300);
  const text = await page.locator(".title-card").innerText();
  const dir = await page.evaluate(() => document.documentElement.dir || "ltr");
  ok(text.includes("Play") && !text.includes("العب") && dir !== "rtl", `classic stays English dir=${dir}`);
  await ctx.close();
}

await browser.close();
const fails = notes.filter((n) => n.startsWith("FAIL"));
console.log(notes.join("\n"));
console.log(fails.length ? `\n${fails.length} failed` : "\nall passed");
process.exit(fails.length ? 1 : 0);
