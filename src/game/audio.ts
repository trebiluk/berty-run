type Bus = { ctx: AudioContext; master: GainNode; sfx: GainNode; music: GainNode };

let bus: Bus | null = null;
let muted = false;
let musicTimer: number | null = null;

function makeBus(): Bus {
  const ctx = new AudioContext({ latencyHint: "interactive" });
  const master = ctx.createGain();
  const sfx = ctx.createGain();
  const music = ctx.createGain();
  sfx.gain.value = 0.7;
  music.gain.value = 0.18;
  master.gain.value = muted ? 0 : 0.85;
  sfx.connect(master);
  music.connect(master);
  master.connect(ctx.destination);
  return { ctx, master, sfx, music };
}

export function unlockAudio() {
  if (!bus) bus = makeBus();
  if (bus.ctx.state === "suspended") void bus.ctx.resume();
  startMusic();
}

export function setMuted(next: boolean) {
  muted = next;
  if (bus) bus.master.gain.setTargetAtTime(next ? 0 : 0.85, bus.ctx.currentTime, 0.03);
}

export function isMuted() {
  return muted;
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.12, dest?: GainNode) {
  if (!bus || muted) return;
  const { ctx } = bus;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq * (1 + (Math.random() * 0.08 - 0.04));
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.connect(g);
  g.connect(dest ?? bus.sfx);
  o.start();
  o.stop(ctx.currentTime + dur);
}

export function sfxGem() {
  duckMusic();
  beep(740, 0.1, "triangle", 0.1);
  beep(1180, 0.16, "sine", 0.07);
  beep(1480, 0.2, "sine", 0.04);
}

export function sfxBump() {
  beep(90, 0.08, "square", 0.08);
}

export function sfxJump() {
  beep(310, 0.07, "square", 0.05);
  beep(470, 0.1, "triangle", 0.06);
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

export function sfxWin() {
  duckMusic();
  beep(523, 0.16, "triangle", 0.1);
  setTimeout(() => beep(659, 0.16, "triangle", 0.1), 80);
  setTimeout(() => beep(784, 0.22, "triangle", 0.11), 160);
  setTimeout(() => beep(1046, 0.32, "sine", 0.08), 260);
}

export function sfxGate() {
  beep(440, 0.2, "sine", 0.08);
}

function duckMusic() {
  if (!bus || muted) return;
  const t = bus.ctx.currentTime;
  bus.music.gain.setTargetAtTime(0.05, t, 0.02);
  bus.music.gain.setTargetAtTime(0.18, t + 0.22, 0.14);
}

function startMusic() {
  if (!bus || musicTimer != null) return;
  const pulse = () => {
    if (!bus || muted) return;
    const t = bus.ctx.currentTime;
    beep(110, 0.28, "sine", 0.045, bus.music);
    beep(165, 0.22, "triangle", 0.025, bus.music);
    const o = bus.ctx.createOscillator();
    const g = bus.ctx.createGain();
    o.type = "triangle";
    o.frequency.value = 330;
    g.gain.setValueAtTime(0.012, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.connect(g);
    g.connect(bus.music);
    o.start(t + 0.35);
    o.stop(t + 0.72);
  };
  pulse();
  musicTimer = window.setInterval(pulse, 1600);
}

export function stopMusic() {
  if (musicTimer != null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
