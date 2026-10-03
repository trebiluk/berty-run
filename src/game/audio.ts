import { LOOPS, type Loop } from "./tracks";

type Bus = { ctx: AudioContext; master: GainNode; sfx: GainNode; music: GainNode };
type World = "title" | "flat" | "deep" | "tube" | "fast";

let bus: Bus | null = null;
let muted = false;
let musicOn = true;
let soundOn = true;
let musicVol = 0.7;
let sfxVol = 0.7;
let duck = 1;
let world: World = "title";
let clock: number | null = null;
let nextAt = 0;
let beat = 0;
let loop: Loop = LOOPS.title;
let musicVoices = 0;
let sfxVoices = 0;
let unlocked = false;
let watching = false;

function roomSilent() {
  return typeof document !== "undefined" && document.documentElement.dataset.kpSound === "0";
}

function makeBus(): Bus {
  const ctx = new AudioContext({ latencyHint: "interactive" });
  const master = ctx.createGain();
  const sfx = ctx.createGain();
  const music = ctx.createGain();
  sfx.connect(master);
  music.connect(master);
  master.connect(ctx.destination);
  return { ctx, master, sfx, music };
}

export function applyGains() {
  if (!bus) return;
  const t = bus.ctx.currentTime;
  const silent = muted || roomSilent();
  bus.master.gain.setTargetAtTime(silent ? 0 : 0.85, t, 0.02);
  bus.music.gain.setTargetAtTime(musicOn && !silent ? 0.22 * musicVol * duck : 0, t, 0.04);
  bus.sfx.gain.setTargetAtTime(soundOn && !silent ? 0.55 * sfxVol : 0, t, 0.03);
}

function watchRoom() {
  if (watching || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  watching = true;
  const obs = new MutationObserver(() => applyGains());
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-kp-sound"] });
}

export function noteMix(next: { music: boolean; sound: boolean; musicVolume: number; sfxVolume: number }) {
  musicOn = next.music;
  soundOn = next.sound;
  musicVol = next.musicVolume;
  sfxVol = next.sfxVolume;
  applyGains();
}

export function unlockAudio() {
  unlocked = true;
  if (!bus) bus = makeBus();
  if (bus.ctx.state === "suspended") void bus.ctx.resume();
  applyGains();
  arm();
  watchRoom();
}

export function setMuted(next: boolean) {
  muted = next;
  applyGains();
}

export function isMuted() {
  return muted;
}

export function setDuck(on: boolean) {
  duck = on ? 0.25 : 1;
  applyGains();
}

export function setWorld(next: World) {
  if (world === next) return;
  world = next;
  loop = LOOPS[next];
  beat = 0;
  if (!bus) return;
  const t = bus.ctx.currentTime;
  const silent = muted || roomSilent() || !musicOn;
  const base = silent ? 0 : 0.22 * musicVol * duck;
  bus.music.gain.setTargetAtTime(0, t, 0.04);
  bus.music.gain.setTargetAtTime(base, t + 0.3, 0.12);
  nextAt = t + 0.05;
}

function toneAt(when: number, freq: number, dur: number, type: OscillatorType, gain: number, dest: GainNode, cap: "music" | "sfx") {
  if (!bus || roomSilent() || muted) return;
  if (cap === "music" && musicVoices >= 6) return;
  if (cap === "sfx" && sfxVoices >= 4) return;
  if (cap === "music") musicVoices += 1;
  else sfxVoices += 1;
  const o = bus.ctx.createOscillator();
  const g = bus.ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, when);
  g.gain.setValueAtTime(gain, when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  o.connect(g);
  g.connect(dest);
  o.start(when);
  o.stop(when + dur + 0.02);
  o.onended = () => {
    if (cap === "music") musicVoices = Math.max(0, musicVoices - 1);
    else sfxVoices = Math.max(0, sfxVoices - 1);
  };
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.12) {
  if (!bus || !soundOn || roomSilent() || muted) return;
  toneAt(bus.ctx.currentTime, freq, dur, type, gain, bus.sfx, "sfx");
}

function arm() {
  if (!bus || clock != null) return;
  nextAt = bus.ctx.currentTime + 0.08;
  clock = window.setInterval(pump, 25);
}

function pump() {
  if (!bus || !unlocked || !musicOn || muted || roomSilent()) return;
  const horizon = bus.ctx.currentTime + 0.16;
  const step = 60 / loop.bpm / 4;
  const barBeats = loop.bars * 4;
  while (nextAt < horizon) {
    const at = Math.round((beat % barBeats) * 100) / 100;
    for (const note of loop.notes) {
      if (Math.abs(note.b - at) < 0.02) toneAt(nextAt, note.f, note.d * (60 / loop.bpm), note.type, note.g, bus.music, "music");
    }
    beat += 0.25;
    nextAt += step;
  }
}

export function sfxGem() {
  duckBrief();
  beep(740, 0.1, "triangle", 0.1);
  beep(1180, 0.16, "sine", 0.07);
}
export function sfxBump() {
  beep(90, 0.08, "square", 0.08);
}
export function sfxHurt() {
  beep(160, 0.22, "sawtooth", 0.1);
  beep(70, 0.3, "square", 0.06);
}
export function sfxBoost() {
  beep(220, 0.12, "sawtooth", 0.06);
  beep(440, 0.18, "triangle", 0.07);
}
export function sfxCheck() {
  beep(392, 0.1, "sine", 0.07);
  beep(523, 0.16, "triangle", 0.06);
}
export function sfxBuzz() {
  beep(180, 0.12, "square", 0.08);
}
export function sfxWin() {
  duckBrief();
  beep(523, 0.16, "triangle", 0.1);
  window.setTimeout(() => beep(659, 0.16, "triangle", 0.1), 80);
  window.setTimeout(() => beep(784, 0.22, "triangle", 0.11), 160);
  window.setTimeout(() => beep(1046, 0.32, "sine", 0.08), 260);
}
export function sfxCount() {
  beep(880, 0.12, "sine", 0.12);
}
export function sfxGo() {
  beep(660, 0.08, "triangle", 0.12);
  beep(990, 0.18, "triangle", 0.1);
}
export function sfxGate() {
  beep(440, 0.2, "sine", 0.08);
}
export function sfxChime() {
  beep(880, 0.18, "sine", 0.08);
}
export function sfxThunder() {
  if (!bus || !soundOn || roomSilent() || muted) return;
  const ctx = bus.ctx;
  const t = ctx.currentTime;
  const frames = Math.floor(ctx.sampleRate * 0.35);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = 900;
  g.gain.setValueAtTime(0.45, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  src.connect(filter);
  filter.connect(g);
  g.connect(bus.sfx);
  src.start(t);
  const o = ctx.createOscillator();
  const rg = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(70, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.7);
  rg.gain.setValueAtTime(0.2, t);
  rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  o.connect(rg);
  rg.connect(bus.sfx);
  o.start(t);
  o.stop(t + 0.72);
  duckBrief();
}

function duckBrief() {
  if (!bus) return;
  const t = bus.ctx.currentTime;
  const base = musicOn && !roomSilent() ? 0.22 * musicVol * duck : 0;
  bus.music.gain.setTargetAtTime(base * 0.35, t, 0.02);
  bus.music.gain.setTargetAtTime(base, t + 0.35, 0.12);
}

export function setMix(music: number, sfx: number) {
  musicVol = music;
  sfxVol = sfx;
  applyGains();
}
export function resumeBed() {
  if (unlocked) arm();
}
export function stopMusic() {
  if (clock != null) {
    clearInterval(clock);
    clock = null;
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!bus) return;
    if (document.hidden) void bus.ctx.suspend();
    else if (unlocked) void bus.ctx.resume();
  });
  watchRoom();
}
