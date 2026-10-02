import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const p = await browser.newPage({ viewport: { width: 915, height: 412 } });
const bad = [];
p.on("pageerror", (err) => bad.push(String(err)));
p.on("console", (msg) => {
  if (msg.type() === "error") bad.push(msg.text());
});
await p.goto("http://127.0.0.1:8080/?hud=1", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(8000);
const info = await p.evaluate(() => {
  const e = window.__eng;
  return {
    eng: !!e,
    phase: e?.phase,
    course: e?.course?.id,
    track: e?.bend?.trackId ?? null,
    jump: !!document.querySelector("[data-hud=jump]"),
    text: document.body.innerText.slice(0, 200),
  };
});
console.log(JSON.stringify(info, null, 2));
console.log("ERR", bad.slice(0, 6));
await browser.close();
