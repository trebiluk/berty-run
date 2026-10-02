import { resumeBed, setMix, stopMusic, unlockAudio } from "@/game/audio";
import { loadPrefs, watchPrefs, type Prefs } from "@/arcade/cabinet";

type Mood = "title" | "level" | "fast" | "clear" | "over";

let ctx: AudioContext | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let timer: number | null = null;
let step = 0;
let mood: Mood = "title";
let started = false;
let prefs = loadPrefs();

const TITLE = [659, 523, 587, 659, 392, 440, 523, 587];
const LEVEL = [440, 392, 440, 523, 587, 523, 440, 392];
const FAST = [659, 659, 523, 587, 784, 659, 587, 523];

function ensure() {
  if (ctx) return ctx;
  const audio = new AudioContext();
  ctx = audio;
  musicGain = audio.createGain();
  sfxGain = audio.createGain();
  musicGain.connect(audio.destination);
  sfxGain.connect(audio.destination);
  applyGains();
  return audio;
}

function applyGains() {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.tune = prefs.look === "arcade" && prefs.music ? "on" : "off";
    document.documentElement.dataset.fxmix = prefs.sound ? "on" : "off";
  }
  if (!musicGain || !sfxGain || !ctx) return;
  const v = prefs.volume;
  const on = prefs.look === "arcade";
  musicGain.gain.setTargetAtTime(on && prefs.music ? 0.12 * v : 0, ctx.currentTime, 0.03);
  sfxGain.gain.setTargetAtTime(on && prefs.sound ? 0.2 * v : 0, ctx.currentTime, 0.03);
  setMix(on ? 0 : 0.18, prefs.sound ? 0.7 * v : 0);
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, dest: GainNode | null, delay = 0) {
  if (!ctx || !dest) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(dest);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function loop() {
  if (!ctx || prefs.look !== "arcade" || !prefs.music) return;
  const row = mood === "fast" ? FAST : mood === "level" ? LEVEL : TITLE;
  const bass = [110, 130, 146, 164][step % 4];
  tone(bass, 0.22, "square", 0.35, musicGain);
  tone(row[step % row.length], 0.16, "triangle", 0.55, musicGain, 0.02);
  if (step % 4 === 0) tone(row[step % row.length] / 2, 0.3, "sawtooth", 0.12, musicGain);
  step += 1;
}

function arm() {
  if (timer != null) return;
  loop();
  timer = window.setInterval(loop, mood === "fast" ? 160 : mood === "level" ? 210 : 280);
}

function disarm() {
  if (timer != null) {
    clearInterval(timer);
    timer = null;
  }
}

export function arcadeUnlock() {
  prefs = loadPrefs();
  unlockAudio();
  if (prefs.look !== "arcade") {
    disarm();
    resumeBed();
    return;
  }
  stopMusic();
  const audio = ensure();
  if (audio.state === "suspended") void audio.resume();
  if (!started) {
    started = true;
    tone(880, 0.06, "square", 0.5, sfxGain);
    tone(1320, 0.1, "square", 0.35, sfxGain, 0.07);
  }
  applyGains();
  arm();
}

export function arcadeMood(next: Mood) {
  mood = next;
  step = 0;
  if (next === "clear") {
    disarm();
    tone(523, 0.12, "square", 0.5, musicGain);
    tone(659, 0.12, "square", 0.5, musicGain, 0.12);
    tone(784, 0.12, "square", 0.5, musicGain, 0.24);
    tone(1046, 0.28, "triangle", 0.45, musicGain, 0.36);
    return;
  }
  if (next === "over") {
    disarm();
    tone(392, 0.16, "sawtooth", 0.35, musicGain);
    tone(330, 0.16, "sawtooth", 0.3, musicGain, 0.16);
    tone(262, 0.28, "square", 0.3, musicGain, 0.32);
    return;
  }
  if (prefs.look === "arcade" && started) arm();
}

export function arcadeBlip(kind: "menu" | "select" | "jump" | "pickup" | "power" | "hit" | "count") {
  if (prefs.look !== "arcade" || !prefs.sound || !started) return;
  ensure();
  if (kind === "menu") tone(740, 0.05, "square", 0.35, sfxGain);
  if (kind === "select") tone(880, 0.07, "square", 0.4, sfxGain);
  if (kind === "jump") tone(520, 0.08, "square", 0.35, sfxGain);
  if (kind === "pickup") {
    tone(988, 0.06, "square", 0.3, sfxGain);
    tone(1318, 0.08, "triangle", 0.25, sfxGain, 0.05);
  }
  if (kind === "power") tone(660, 0.14, "sawtooth", 0.25, sfxGain);
  if (kind === "hit") tone(140, 0.16, "square", 0.45, sfxGain);
  if (kind === "count") tone(880, 0.08, "square", 0.4, sfxGain);
}

export function bootArcadeAudio() {
  prefs = loadPrefs();
  applyGains();
  watchPrefs((next) => {
    prefs = next;
    if (next.look !== "arcade") {
      disarm();
      resumeBed();
      applyGains();
      return;
    }
    stopMusic();
    applyGains();
    if (started) arm();
  });
  window.addEventListener(
    "pointerdown",
    (ev) => {
      arcadeUnlock();
      const el = ev.target instanceof Element ? ev.target.closest("button, a") : null;
      if (el) arcadeBlip("menu");
    },
    { capture: true },
  );
}
