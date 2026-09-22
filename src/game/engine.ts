// Canvas shell for First Trace. Tick lives in trace.ts (waiting-game runner
// timing, MIT). This file only draws the PCB lane and reads input.

import { primeSfx, setMuted, sfxGem, sfxHurt, sfxJump, sfxWin } from "./audio";
import {
  BEATS,
  EXIT,
  GROUND,
  PH,
  PW,
  START_X,
  STEP,
  VIEW_H,
  VIEW_W,
  WORLD_W,
  begin,
  floorSpans,
  freshRun,
  gemCount,
  glowFor,
  readBest,
  stepRun,
  writeBest,
  type Run,
} from "./trace";
import type { HudSnap } from "./types";

const INK = "#050814";
const SNOW = "#F8FAFC";
const CYAN = "#22D3EE";
const TEAL = "#14B8A6";
const AMBER = "#FBBF24";
const GREEN = "#1A5C3A";
const COPPER = "#B87333";
const MASK = "#071a14";

type Bit = { x: number; y: number; vx: number; vy: number; life: number; max: number };

export class Engine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  onHud: (h: HudSnap) => void;
  run: Run;
  mute = false;
  reduced = false;
  jumpHeld = false;
  jumpEdge = false;
  suppress = false;
  acc = 0;
  last = 0;
  raf = 0;
  destroyed = false;
  idle = 0;
  trauma = 0;
  hudAcc = 0;
  bits: Bit[] = [];
  got = 0;
  spans = floorSpans();

  constructor(canvas: HTMLCanvasElement, onHud: (h: HudSnap) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2D context");
    this.ctx = ctx;
    this.onHud = onHud;
    this.mute = false;
    setMuted(false);
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.run = freshRun(readBest(), this.mute);
    this.bind();
  }

  async boot() {
    this.run = freshRun(readBest(), this.mute);
    this.emit();
    this.last = performance.now();
    const loop = (now: number) => {
      if (this.destroyed) return;
      let dt = (now - this.last) / 1000;
      this.last = now;
      dt = Math.min(dt, 0.05);
      this.acc += dt;
      let n = 0;
      while (this.acc >= STEP && n < 4) {
        this.tick(STEP);
        this.acc -= STEP;
        n++;
      }
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    this.canvas.removeEventListener("pointerdown", this.onPtrDown);
  }

  startPlay() {
    primeSfx();
    this.run = begin(this.run);
    this.got = 0;
    this.bits = [];
    this.suppress = true;
    this.jumpEdge = false;
    this.jumpHeld = false;
    this.emit();
  }

  retry() {
    primeSfx();
    this.run = begin(this.run);
    this.got = 0;
    this.bits = [];
    this.suppress = true;
    this.jumpEdge = false;
    this.jumpHeld = false;
    this.emit();
  }

  togglePause() {
    if (this.run.phase === "play") this.run = { ...this.run, phase: "pause", hot: false };
    else if (this.run.phase === "pause") this.run = { ...this.run, phase: "play" };
    this.emit();
  }

  toggleMute() {
    this.mute = !this.mute;
    setMuted(this.mute);
    this.run = { ...this.run, mute: this.mute };
    this.emit();
  }

  holdJump(on: boolean) {
    if (on) this.armJump();
    else this.jumpHeld = false;
  }

  private bind() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    this.canvas.addEventListener("pointerdown", this.onPtrDown);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener?.("change", () => {
      this.reduced = mq.matches;
    });
  }

  private armJump() {
    this.jumpHeld = true;
    this.jumpEdge = true;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "ArrowDown") e.preventDefault();
    if (e.repeat) return;
    const phase = this.run.phase;
    if ((e.code === "Space" || e.code === "Enter") && phase === "title") {
      this.startPlay();
      return;
    }
    if ((e.code === "Space" || e.code === "Enter") && (phase === "fail" || phase === "short" || phase === "win")) {
      this.retry();
      return;
    }
    if (e.code === "KeyP" || e.code === "Escape") this.togglePause();
    if ((e.code === "Space" || e.code === "ArrowUp") && phase === "play") this.armJump();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.code === "ArrowUp") this.jumpHeld = false;
  };

  private onBlur = () => {
    this.jumpHeld = false;
  };

  private onPtrDown = () => {
    primeSfx();
    const phase = this.run.phase;
    if (phase === "title") {
      this.startPlay();
      return;
    }
    if (phase === "fail" || phase === "short" || phase === "win") {
      this.retry();
      return;
    }
    if (phase === "pause") {
      this.togglePause();
      return;
    }
    if (phase === "play") this.armJump();
  };

  private tick(dt: number) {
    this.idle += dt;
    if (!this.reduced) this.trauma = Math.max(0, this.trauma - dt * 3);
    else this.trauma = 0;
    for (const b of this.bits) {
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    this.bits = this.bits.filter((b) => b.life > 0);

    if (this.run.phase !== "play") {
      this.hudAcc += dt;
      if (this.hudAcc > 0.2) {
        this.hudAcc = 0;
        this.emit();
      }
      return;
    }

    const edge = this.jumpEdge && !this.suppress;
    this.jumpEdge = false;
    this.suppress = false;
    const before = gemCount(this.run);
    const prev = this.run.phase;
    if (edge) sfxJump();
    this.run = stepRun(this.run, dt, { jumpEdge: edge, jumpHeld: this.jumpHeld });
    const after = gemCount(this.run);
    if (after > before) {
      sfxGem();
      const gem = BEATS.filter((b) => b.hasGem)[after - 1];
      if (gem && !this.reduced) this.burst(gem.gemX, gem.gemY);
    }
    if (prev === "play" && this.run.phase === "fail") {
      sfxHurt();
      if (!this.reduced) this.trauma = 0.45;
    }
    if (prev === "play" && this.run.phase === "win") {
      sfxWin();
      if (this.run.best != null) writeBest(this.run.best);
      if (!this.reduced) this.burst(this.run.p.x, this.run.p.y, 16);
    }
    this.got = after;
    this.hudAcc += dt;
    if (this.hudAcc >= 0.08 || this.run.phase !== "play") {
      this.hudAcc = 0;
      this.emit();
    }
  }

  private burst(x: number, y: number, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n;
      this.bits.push({
        x,
        y,
        vx: Math.cos(a) * 90,
        vy: Math.sin(a) * 90,
        life: 0.35,
        max: 0.35,
      });
    }
  }

  emit() {
    const snap: HudSnap = {
      phase: this.run.phase,
      courseName: "First Trace",
      time: this.run.time,
      gems: gemCount(this.run),
      gemTotal: 3,
      mute: this.mute,
      best: this.run.best,
      hint: this.run.hint,
      hot: this.run.hot,
    };
    this.onHud(snap);
    window.__bertyRun = {
      phase: snap.phase,
      gems: snap.gems,
      gemTotal: snap.gemTotal,
      time: snap.time,
      x: this.run.p.x,
      hot: snap.hot,
      hint: snap.hint,
    };
  }

  private draw() {
    const c = this.canvas;
    const ctx = this.ctx;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const cssW = c.clientWidth || VIEW_W;
    const cssH = c.clientHeight || VIEW_H;
    const bw = Math.max(1, Math.floor(cssW * dpr));
    const bh = Math.max(1, Math.floor(cssH * dpr));
    if (c.width !== bw || c.height !== bh) {
      c.width = bw;
      c.height = bh;
    }
    const scale = Math.min(cssW / VIEW_W, cssH / VIEW_H);
    const ox = (cssW - VIEW_W * scale) / 2;
    const oy = (cssH - VIEW_H * scale) / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VIEW_W * scale, VIEW_H * scale);
    ctx.clip();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    const focus = this.run.phase === "title" ? START_X : this.run.p.x;
    let cam = Math.max(0, Math.min(WORLD_W - VIEW_W, focus - 280));
    if (this.run.phase === "title") cam = 0;
    const jx = this.reduced ? 0 : (Math.random() - 0.5) * this.trauma * 8;
    const jy = this.reduced ? 0 : (Math.random() - 0.5) * this.trauma * 6;
    ctx.translate(-cam + jx, jy);

    this.drawBoard(cam);
    this.drawTrace();
    this.drawBeats();
    this.drawGems();
    this.drawExit();
    this.drawGlow();
    this.drawBerty();
    this.drawBits();
    ctx.restore();
  }

  private drawBoard(cam: number) {
    const ctx = this.ctx;
    ctx.fillStyle = MASK;
    ctx.fillRect(cam - 20, 0, VIEW_W + 40, VIEW_H);
    ctx.fillStyle = GREEN;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(cam - 20, 36, VIEW_W + 40, VIEW_H - 72);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(248,250,252,0.08)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 10]);
    for (let y = 70; y < VIEW_H - 40; y += 54) {
      ctx.beginPath();
      ctx.moveTo(cam, y);
      ctx.lineTo(cam + VIEW_W, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(248,250,252,0.45)";
    ctx.font = "600 13px Segoe UI, system-ui, sans-serif";
    ctx.fillText("FIRST TRACE", cam + 28, 28);
  }

  private drawTrace() {
    const ctx = this.ctx;
    for (const s of this.spans) {
      ctx.fillStyle = "#123528";
      ctx.fillRect(s.x, s.y, s.w, VIEW_H - s.y);
      ctx.fillStyle = COPPER;
      ctx.fillRect(s.x, s.y - 8, s.w, 10);
      ctx.fillStyle = "#e2a86b";
      ctx.fillRect(s.x, s.y - 8, s.w, 3);
      ctx.fillStyle = TEAL;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(s.x, s.y + 6, s.w, 4);
      ctx.globalAlpha = 1;
    }
  }

  private drawBeats() {
    const ctx = this.ctx;
    for (const b of BEATS) {
      if (b.kind === "gap") {
        ctx.fillStyle = "#02040a";
        ctx.fillRect(b.x, GROUND - 8, b.w, VIEW_H - GROUND + 8);
        ctx.strokeStyle = COPPER;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(b.x - 8, GROUND - 4);
        ctx.lineTo(b.x + 10, GROUND + 18);
        ctx.moveTo(b.x + b.w - 10, GROUND + 18);
        ctx.lineTo(b.x + b.w + 8, GROUND - 4);
        ctx.stroke();
      } else if (b.kind === "spike") {
        const top = GROUND - b.h;
        ctx.fillStyle = COPPER;
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, top + 16, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, top + 16, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d7dde6";
        ctx.fillRect(b.x + b.w / 2 - 3, top + 18, 6, b.h - 10);
        ctx.fillStyle = "rgba(248,250,252,0.7)";
        ctx.font = "600 12px Segoe UI, system-ui, sans-serif";
        ctx.fillText("VIA", b.x - 4, top - 10);
      } else if (b.kind === "overhang") {
        const top = GROUND - b.h;
        ctx.fillStyle = "#10243f";
        ctx.fillRect(b.x, top, b.w, b.h);
        ctx.strokeStyle = CYAN;
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x + 1, top + 1, b.w - 2, b.h - 2);
        ctx.fillStyle = SNOW;
        ctx.fillRect(b.x + 16, top + 18, b.w - 32, 16);
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = COPPER;
          ctx.fillRect(b.x + 14 + i * 22, top + b.h - 8, 8, 10);
        }
        ctx.fillStyle = "rgba(248,250,252,0.75)";
        ctx.font = "600 12px Segoe UI, system-ui, sans-serif";
        ctx.fillText("CHIP", b.x + 8, top - 8);
      } else if (b.kind === "window") {
        const sill = GROUND - b.h;
        ctx.fillStyle = "#10243f";
        ctx.fillRect(b.x, sill, b.w, b.h);
        ctx.fillStyle = COPPER;
        ctx.fillRect(b.x - 8, b.barBottom - 16, b.w + 16, 16);
        ctx.strokeStyle = AMBER;
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x - 10, b.barBottom, b.w + 20, sill - b.barBottom);
        ctx.fillStyle = "rgba(248,250,252,0.75)";
        ctx.font = "600 12px Segoe UI, system-ui, sans-serif";
        ctx.fillText("SLOT", b.x - 2, b.barBottom - 22);
      }
    }
  }

  private drawGems() {
    const gems = BEATS.filter((b) => b.hasGem);
    gems.forEach((b, i) => {
      if (this.run.gems[i]) return;
      const bob = this.reduced ? 0 : Math.sin(this.idle * 3 + i) * 3;
      this.diamond(b.gemX, b.gemY + bob, 14);
    });
  }

  private diamond(x: number, y: number, r: number) {
    const ctx = this.ctx;
    ctx.fillStyle = AMBER;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.8, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r * 0.8, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff4cc";
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.45);
    ctx.lineTo(x + r * 0.28, y);
    ctx.lineTo(x, y + r * 0.2);
    ctx.lineTo(x - r * 0.28, y);
    ctx.closePath();
    ctx.fill();
  }

  private drawExit() {
    const ctx = this.ctx;
    const g = EXIT;
    ctx.fillStyle = "#123528";
    ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.strokeStyle = TEAL;
    ctx.lineWidth = 4;
    ctx.strokeRect(g.x + 2, g.y + 2, g.w - 4, g.h - 4);
    ctx.fillStyle = SNOW;
    ctx.font = "800 16px Segoe UI, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("EXIT", g.x + g.w / 2, g.y + 28);
    ctx.textAlign = "left";
    this.diamond(g.x + 24, g.y + 58, 7);
    this.diamond(g.x + g.w / 2, g.y + 58, 7);
    this.diamond(g.x + g.w - 24, g.y + 58, 7);
  }

  private drawGlow() {
    const glow = glowFor(this.run);
    if (!glow) return;
    const ctx = this.ctx;
    const b = glow.beat;
    const cx = b.x + b.w / 2;
    const cy = b.kind === "window" ? b.barBottom + 40 : GROUND - Math.max(36, b.h);
    const pulse = this.reduced ? 0.85 : 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(this.idle * (glow.hot ? 9 : 4)));
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = CYAN;
    ctx.lineWidth = glow.hot ? 6 : 3;
    ctx.beginPath();
    ctx.arc(cx, cy, glow.hot ? 46 : 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawBerty() {
    const ctx = this.ctx;
    const p = this.run.p;
    const bob = this.run.phase === "title" && !this.reduced ? Math.sin(this.idle * 6) * 2 : 0;
    const frame = Math.floor(this.idle * 8) % 2;
    const x = p.x;
    const y = p.y + bob;
    const cx = x + PW / 2;
    const feet = y + PH;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(cx, feet + 2, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COPPER;
    const step = frame === 0 ? 4 : -4;
    const stepping = (this.run.phase === "play" || this.run.phase === "title") && p.onGround;
    ctx.fillRect(cx - 10, feet - 12, 6, 12 + (stepping ? step : 0));
    ctx.fillRect(cx + 4, feet - 12, 6, 12 + (stepping ? -step : 0));
    ctx.fillStyle = "#16324e";
    roundRect(ctx, cx - 16, y + 16, 32, 22, 4);
    ctx.fill();
    ctx.fillStyle = CYAN;
    ctx.fillRect(cx - 10, y + 22, 20, 6);
    ctx.fillStyle = COPPER;
    ctx.fillRect(cx - 22, y + 20, 6, 12);
    ctx.fillRect(cx + 16, y + 20, 6, 12);
    ctx.fillStyle = "#d7dde6";
    ctx.beginPath();
    ctx.arc(cx, y + 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.fillRect(cx - 6, y + 7, 4, 4);
    ctx.fillRect(cx + 2, y + 7, 4, 4);
    if (!p.onGround) {
      ctx.strokeStyle = CYAN;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, feet - 8, 18, Math.PI, 0);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  private drawBits() {
    const ctx = this.ctx;
    ctx.fillStyle = AMBER;
    for (const b of this.bits) {
      ctx.globalAlpha = Math.max(0, b.life / b.max);
      ctx.fillRect(b.x, b.y, 4, 4);
    }
    ctx.globalAlpha = 1;
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
