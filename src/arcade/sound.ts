import { noteMix, setDuck, setWorld, sfxBump, sfxCheck, sfxGem, sfxGo, unlockAudio } from "@/game/audio";
import { loadPrefs, watchPrefs, type Prefs } from "@/arcade/cabinet";

type Mood = "title" | "level" | "fast" | "clear" | "over" | "tube" | "deep";

let prefs = loadPrefs();
let started = false;

function pushMix(next: Prefs = prefs) {
  noteMix({
    music: next.music,
    sound: next.sound,
    musicVolume: next.musicVolume,
    sfxVolume: next.sfxVolume,
  });
}

export function arcadeUnlock() {
  prefs = loadPrefs();
  unlockAudio();
  pushMix();
  started = true;
  setWorld("title");
}

export function arcadeMood(next: Mood) {
  if (next === "clear" || next === "over") {
    setDuck(true);
    return;
  }
  setDuck(false);
  if (next === "tube") setWorld("tube");
  else if (next === "deep") setWorld("deep");
  else if (next === "fast") setWorld("fast");
  else if (next === "level") setWorld("flat");
  else setWorld("title");
}

export function arcadeBlip(kind: "menu" | "select" | "jump" | "pickup" | "power" | "hit" | "count") {
  if (!started || !prefs.sound) return;
  if (kind === "jump") sfxBump();
  if (kind === "pickup") sfxGem();
  if (kind === "count") sfxGo();
  if (kind === "hit") sfxBump();
  if (kind === "menu" || kind === "select" || kind === "power") sfxCheck();
}

export function bootArcadeAudio() {
  prefs = loadPrefs();
  watchPrefs((next) => {
    prefs = next;
    pushMix(next);
  });
  window.addEventListener(
    "pointerdown",
    () => {
      arcadeUnlock();
    },
    { capture: true, once: false },
  );
  window.addEventListener("keydown", () => arcadeUnlock(), { once: true });
}
