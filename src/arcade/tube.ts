/** Bus Tube. The wall Berty is on is always drawn at the bottom. */

export type TubeEvent = {
  turn?: boolean;
  gem?: boolean;
  hurt?: boolean;
  win?: boolean;
  boost?: boolean;
  check?: boolean;
  tip?: string;
  tipKey?: string;
};

type Cell = string;

export const TUBE = {
  ink: "#0b1220",
  edge: "#3ee0ff",
  port: "#d6ff4a",
  floor: "#12302a",
  copper: "#c98a4b",
  crumble: "#3a2414",
  crack: "#f0a35a",
  hot: "#ff7a45",
  speed: "#2e2a0a",
  chev: "#ffe56a",
  fan: "#0c2440",
  blade: "#60a5fa",
  check: "#0e2a3a",
  arch: "#7af0ff",
  saved: "#5dffb1",
  wire: "#0d1a24",
  cable: "#e08a3c",
  cableHi: "#ffd08a",
  spark: "#fff3c4",
  muted: "#e7d7c4",
};

const RINGS: string[] = [];
function add(n: number, cells: string) {
  for (let i = 0; i < n; i++) RINGS.push(cells);
}

add(6, "##.#");
add(5, ".#..");
add(3, ".##.");
add(1, ".KK.");
add(5, "..#.");
add(1, "..K.");
add(10, "wwww");
add(1, "K...");
add(1, "s...");
add(3, "c...");
add(2, "f...");
add(4, "##..");
add(2, "#o..");
add(1, "E...");

export const TUBE_LEN = RINGS.length;
export const TUBE_GAP_Z = 6;
export const TUBE_WIRE_Z = 21;
export const TUBE_EXIT_Z = 31;

export class TubeSim {
  z = 0;
  face = 0;
  roll = 0;
  falls = 0;
  got = 0;
  readonly gemTotal: number;
  falling = 0;
  planted = false;
  private spin = 0;
  private boost = 0;
  private drag = 0;
  private crumb = 0;
  private gems = new Set<string>();
  private checks = new Set<string>();
  private spawnZ = 0;
  private spawnFace = 0;
  private steer = 0;
  private queue = 0;
  private queueAt = 0;
  private turnEase = 0;
  private sawNeutral = false;
  private saidTurn = false;
  private saidWire = false;
  private saidGap = false;
  private missHold = 0;
  private slow = 1.5;
  private first = true;
  private tipAt = 0;
  private spark = 0;
  private boosted = false;
  private starField: HTMLCanvasElement | null = null;
  private sprite: HTMLImageElement | null = null;
  private gem: HTMLImageElement | null = null;
  warp = 0;
  reduced = false;
  lowFx = false;
  screenX = 0;
  screenY = 0;

  constructor() {
    this.gemTotal = RINGS.reduce((n, row) => n + [...row].filter((c) => c === "o").length, 0);
    try {
      this.first = localStorage.getItem("br-tube-seen") !== "1";
    } catch {
      this.first = true;
    }
  }

  reset() {
    this.z = 0;
    this.face = 0;
    this.roll = 0;
    this.falls = 0;
    this.got = 0;
    this.falling = 0;
    this.planted = false;
    this.spin = 0;
    this.boost = 0;
    this.drag = 0;
    this.crumb = 0;
    this.gems.clear();
    this.checks.clear();
    this.spawnZ = 0;
    this.spawnFace = 0;
    this.steer = 0;
    this.queue = 0;
    this.saidTurn = false;
    this.saidWire = false;
    this.saidGap = false;
    this.missHold = 0;
    this.slow = this.first ? 1.5 : 0;
    this.tipAt = 0;
    this.spark = 0;
    this.boosted = false;
    this.warp = 0;
  }

  onWire() {
    return this.cell(this.z, this.face) === "w";
  }

  private cell(z: number, face: number): Cell {
    const row = RINGS[Math.max(0, Math.min(RINGS.length - 1, Math.floor(z)))] ?? "#...";
    return row[(face + 4) % 4] ?? ".";
  }

  private solid(cell: Cell) {
    return cell === "#" || cell === "K" || cell === "s" || cell === "f" || cell === "c" || cell === "o" || cell === "E";
  }

  private tip(ev: TubeEvent, key: string, now: number) {
    if (now - this.tipAt < 2) return;
    this.tipAt = now;
    ev.tipKey = key;
  }

  step(dt: number, input: { x: number; jump: boolean }, reduced: boolean, now = performance.now() / 1000): TubeEvent {
    this.reduced = reduced;
    const ev: TubeEvent = {};
    if (this.warp > 0) return ev;
    if (this.falling > 0) {
      this.falling -= dt;
      if (this.falling <= 0) {
        this.z = this.spawnZ;
        this.face = this.spawnFace;
        this.roll = reduced ? this.spawnFace * (Math.PI / 2) : this.roll;
        this.planted = false;
        this.falling = 0;
        ev.hurt = true;
      }
      return ev;
    }
    if (this.missHold > 0) {
      this.missHold -= dt;
      if (this.missHold <= 0) {
        this.z = this.spawnZ;
        this.face = this.spawnFace;
        this.roll = this.spawnFace * (Math.PI / 2);
      }
      return ev;
    }

    const ix = input.x;
    this.turnEase = Math.max(0, this.turnEase - dt);
    if (Math.abs(ix) < 0.25) {
      this.queue = 0;
      this.steer = 0;
      if (this.turnEase > 0) this.sawNeutral = true;
    } else if (Math.abs(ix) > 0.45 && this.steer === 0 && (this.turnEase <= 0 || this.sawNeutral)) {
      const dir = ix > 0 ? 1 : -1;
      this.face = (this.face + (dir > 0 ? 1 : 3)) % 4;
      this.steer = dir;
      this.queue = 0;
      this.turnEase = 0.25;
      this.sawNeutral = false;
      ev.turn = true;
      if (!this.saidTurn) {
        this.saidTurn = true;
        this.tip(ev, "wall", now);
      }
    }

    const here = this.cell(this.z, this.face);
    if (!this.saidGap && this.z >= TUBE_GAP_Z - 2) {
      this.saidGap = true;
      this.tip(ev, "lit", now);
    }
    if (here === "w") {
      if (!this.saidWire) {
        this.saidWire = true;
        this.tip(ev, "wire", now);
      }
      if (!this.planted) {
        this.spin += dt;
        const beat = reduced ? 0.9 : 0.7;
        if (this.spin >= beat) {
          this.spin = 0;
          this.face = (this.face + 1) % 4;
          ev.turn = true;
        }
      }
      if (input.jump) {
        const exitFace = this.cell(TUBE_EXIT_Z, this.face);
        if (this.solid(exitFace) || exitFace === "K") this.planted = true;
        else ev.tipKey = "wait";
      }
    } else this.planted = false;

    if (here === "s") {
      if (!this.boosted) {
        this.boost = 0.9;
        this.boosted = true;
        ev.boost = true;
      }
    } else this.boosted = false;
    if (here === "f") this.drag = 0.55;
    if (here === "K") {
      const key = `${Math.floor(this.z)}:${this.face}`;
      if (!this.checks.has(key)) {
        this.checks.add(key);
        this.spawnZ = Math.floor(this.z);
        this.spawnFace = this.face;
        ev.check = true;
        this.tip(ev, "saved", now);
      }
    }
    if (here === "o") {
      const key = `${Math.floor(this.z)}:${this.face}`;
      if (!this.gems.has(key)) {
        this.gems.add(key);
        this.got += 1;
        ev.gem = true;
        this.spark = 0.3;
      }
    }
    if (here === "c") {
      this.crumb = this.crumb > 0 ? this.crumb - dt : 0.48;
      if (this.crumb <= 0) {
        this.beginFall();
        return ev;
      }
    } else this.crumb = 0;
    if (here === "E") {
      if (this.got < this.gemTotal) {
        this.tip(ev, "bit", now);
        this.missHold = 1;
        return ev;
      }
      ev.win = true;
      try {
        localStorage.setItem("br-tube-seen", "1");
      } catch {
        /* private */
      }
      this.first = false;
      return ev;
    }

    const pace = this.slow > 0 ? 0.6 : 1;
    this.slow = Math.max(0, this.slow - dt);
    const speed = (this.boost > 0 ? 9 : 4.2) * (this.drag > 0 ? 0.35 : 1) * pace;
    this.boost = Math.max(0, this.boost - dt);
    this.drag = Math.max(0, this.drag - dt);
    this.z = Math.min(RINGS.length - 0.05, this.z + speed * dt);
    this.spark = Math.max(0, this.spark - dt);

    const landed = this.cell(this.z, this.face);
    if (!this.solid(landed) && landed !== "w") {
      this.beginFall();
      return ev;
    }
    const target = this.face * (Math.PI / 2);
    let delta = target - this.roll;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    this.roll = reduced ? target : this.roll + delta * (1 - Math.exp(-dt / 0.08));
    return ev;
  }

  private beginFall() {
    this.falling = 0.55;
    this.falls += 1;
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, reduced: boolean) {
    this.reduced = reduced;
    this.lowFx = typeof document !== "undefined" && document.documentElement.dataset.fx === "low";
    const hud = 94;
    const thumb = Math.min(140, h * 0.22);
    const freeTop = hud + (h > w ? 28 : 56);
    const freeBot = h - thumb;
    const freeH = Math.max(80, freeBot - freeTop);
    const freeW = w;
    const upright = h > w;
    const fit = Math.min(freeW, freeH) * 0.46;
    const ring = Math.min(upright ? freeW * 0.72 : freeH * 0.78, fit * 1.15);
    const cx = w / 2;
    const cy = freeTop + freeH / 2;
    ctx.fillStyle = TUBE.ink;
    ctx.fillRect(0, 0, w, h);
    this.stars(ctx, cx, cy, ring, reduced);
    if (this.boost > 0 && !reduced && !this.lowFx) this.streaks(ctx, cx, cy, ring);
    const bertyH = w >= 1024 ? 64 : 47;
    const frac = this.z - Math.floor(this.z);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.roll);
    for (let step = 19; step >= 0; step--) {
      const tile = Math.floor(this.z) + step;
      const row = RINGS[tile];
      if (!row) continue;
      const depth = step + frac;
      const far = ring / (1.15 + (depth + 1) * 0.55);
      const near = ring / (1.15 + depth * 0.55);
      const alpha = Math.max(0.15, 1 - step / 20);
      for (let face = 0; face < 4; face++) {
        const cell = row[face];
        if (cell === ".") {
          if (face === this.face && step < 2) this.gapLip(ctx, face, near);
          continue;
        }
        this.tile(ctx, face, near, far, cell, alpha, step < 12, tile, step);
      }
    }
    ctx.restore();
    const near0 = ring / (1.15 + frac * 0.55);
    const chord = near0 * Math.cos(0.46 * Math.PI / 2);
    const mid = this.faceAngle(this.face);
    const lx = Math.cos(mid) * chord;
    const ly = Math.sin(mid) * chord;
    const ry = lx * Math.sin(this.roll) + ly * Math.cos(this.roll);
    const feet = cy + ry;
    this.screenX = cx;
    this.screenY = feet - bertyH * 0.45;
    this.berty(ctx, cx, feet, bertyH, reduced);
    if (this.spark > 0) this.sparks(ctx, cx, feet - bertyH * 0.6);
    if (this.z >= TUBE_GAP_Z - 2 && this.z < TUBE_GAP_Z + 1.2) this.arrow(ctx, cx, feet - bertyH * 0.2);
  }

  private stars(ctx: CanvasRenderingContext2D, cx: number, cy: number, ring: number, reduced: boolean) {
    if (!this.starField) {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 256;
      const g = c.getContext("2d");
      if (g) {
        for (let i = 0; i < 60; i++) {
          const a = (i * 2.399) % (Math.PI * 2);
          const d = 14 + ((i * 17) % 108);
          g.globalAlpha = 0.35 + (i % 5) * 0.09;
          g.fillStyle = "#f6efe2";
          const s = i % 3 === 0 ? 2 : 1;
          g.fillRect(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, s, s);
        }
      }
      this.starField = c;
    }
    const rate = reduced ? 0 : ((this.z * (this.boost > 0 ? 2.1 : 1)) % 1.6) / 1.6;
    const draw = (scale: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.drawImage(this.starField as HTMLCanvasElement, -ring * 0.7, -ring * 0.7, ring * 1.4, ring * 1.4);
      ctx.restore();
    };
    draw(1 + rate * 0.6, 1 - rate);
    draw(1 + ((rate + 0.5) % 1) * 0.6, rate);
    ctx.globalAlpha = 1;
  }

  private streaks(ctx: CanvasRenderingContext2D, cx: number, cy: number, ring: number) {
    ctx.strokeStyle = "#7af0ff";
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + this.z;
      const d = ring * (0.25 + (i % 4) * 0.08);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
      ctx.lineTo(cx + Math.cos(a) * (d + ring * 0.15), cy + Math.sin(a) * (d + ring * 0.15));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private faceAngle(face: number) {
    return Math.PI / 2 - face * (Math.PI / 2);
  }

  private tile(ctx: CanvasRenderingContext2D, face: number, near: number, far: number, cell: Cell, alpha: number, marks: boolean, tile: number, step: number) {
    const a0 = this.faceAngle(face) - 0.46 * (Math.PI / 2);
    const a1 = this.faceAngle(face) + 0.46 * (Math.PI / 2);
    const mid = this.faceAngle(face);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a0) * far, Math.sin(a0) * far);
    ctx.lineTo(Math.cos(a0) * near, Math.sin(a0) * near);
    ctx.lineTo(Math.cos(a1) * near, Math.sin(a1) * near);
    ctx.lineTo(Math.cos(a1) * far, Math.sin(a1) * far);
    ctx.closePath();
    ctx.globalAlpha = alpha;
    let fill = TUBE.floor;
    let edge = TUBE.edge;
    if (cell === "c") {
      fill = this.crumb > 0 && face === this.face ? TUBE.hot : TUBE.crumble;
      edge = TUBE.crack;
    } else if (cell === "s") {
      fill = TUBE.speed;
      edge = TUBE.chev;
    } else if (cell === "f") {
      fill = TUBE.fan;
      edge = TUBE.blade;
    } else if (cell === "K") {
      fill = TUBE.check;
      edge = this.checks.has(`${tile}:${face}`) ? TUBE.saved : TUBE.arch;
    } else if (cell === "w") {
      fill = TUBE.wire;
      edge = TUBE.edge;
    } else if (cell === "E") {
      fill = TUBE.ink;
      edge = this.got < this.gemTotal ? TUBE.muted : TUBE.port;
    }
    const exitPulse = cell !== "w" && tile >= TUBE_EXIT_Z - 3 && tile <= TUBE_EXIT_Z && face === 0 && this.z > TUBE_WIRE_Z;
    if (exitPulse) {
      const pulse = this.reduced ? 0.45 : 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(performance.now() / 160));
      ctx.fillStyle = TUBE.saved;
      ctx.globalAlpha = alpha * pulse;
      ctx.fill();
      ctx.globalAlpha = alpha;
      edge = TUBE.saved;
    }
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = step < 4 ? 2 : step < 12 ? 1.5 : 1;
    ctx.stroke();
    if (marks) this.mark(ctx, cell, face, near, far, mid, tile);
    ctx.globalAlpha = 1;
  }

  private mark(ctx: CanvasRenderingContext2D, cell: Cell, face: number, near: number, far: number, mid: number, tile: number) {
    const mx = Math.cos(mid) * ((near + far) / 2);
    const my = Math.sin(mid) * ((near + far) / 2);
    if (cell === "#" || cell === "o") {
      ctx.strokeStyle = TUBE.copper;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(mid) * far, Math.sin(mid) * far);
      ctx.lineTo(Math.cos(mid) * near, Math.sin(mid) * near);
      ctx.stroke();
    }
    if (cell === "c") {
      ctx.strokeStyle = this.crumb > 0 && face === this.face ? TUBE.ink : TUBE.crack;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx - 6, my);
      ctx.lineTo(mx, my - 5);
      ctx.lineTo(mx + 6, my + 2);
      ctx.stroke();
    }
    if (cell === "s") {
      ctx.strokeStyle = TUBE.chev;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(mx - 5, my + 4);
      ctx.lineTo(mx, my - 4);
      ctx.lineTo(mx + 5, my + 4);
      ctx.stroke();
    }
    if (cell === "f") {
      ctx.strokeStyle = TUBE.blade;
      ctx.lineWidth = 2;
      const spin = this.reduced ? 0 : performance.now() / 600;
      ctx.beginPath();
      ctx.arc(mx, my, 6, spin, spin + Math.PI * 1.5);
      ctx.stroke();
    }
    if (cell === "K") {
      ctx.strokeStyle = TUBE.arch;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(mx, my, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    if (cell === "w" && face === this.face) {
      ctx.strokeStyle = TUBE.cable;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(mid) * far, Math.sin(mid) * far);
      ctx.lineTo(Math.cos(mid) * near, Math.sin(mid) * near);
      ctx.stroke();
      ctx.strokeStyle = TUBE.cableHi;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (cell === "E") {
      ctx.strokeStyle = this.got < this.gemTotal ? TUBE.muted : TUBE.port;
      ctx.lineWidth = 4;
      ctx.setLineDash(this.got < this.gemTotal ? [6, 4] : []);
      ctx.strokeRect(mx - 8, my - 8, 16, 16);
      ctx.setLineDash([]);
    }
    if (cell === "o" && !this.gems.has(`${tile}:${face}`)) {
      this.gemSprite(ctx, mx, my - 8);
    }
  }

  private gapLip(ctx: CanvasRenderingContext2D, face: number, near: number) {
    const mid = this.faceAngle(face);
    ctx.strokeStyle = TUBE.hot;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(mid - 0.3) * near, Math.sin(mid - 0.3) * near);
    ctx.lineTo(Math.cos(mid + 0.3) * near, Math.sin(mid + 0.3) * near);
    ctx.stroke();
  }

  private arrow(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.strokeStyle = TUBE.port;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + 28, y);
    ctx.lineTo(x + 20, y - 8);
    ctx.moveTo(x + 28, y);
    ctx.lineTo(x + 20, y + 8);
    ctx.stroke();
  }

  private gemSprite(ctx: CanvasRenderingContext2D, x: number, y: number) {
    if (!this.gem) {
      const img = new Image();
      img.src = `${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}sprites/gem-1.png`;
      img.onload = () => {
        this.gem = img;
      };
      this.gem = img;
    }
    if (this.gem.complete && this.gem.naturalWidth) ctx.drawImage(this.gem, x - 8, y - 8, 16, 16);
    else {
      ctx.fillStyle = TUBE.port;
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + 5, y);
      ctx.lineTo(x, y + 6);
      ctx.lineTo(x - 5, y);
      ctx.closePath();
      ctx.fill();
    }
  }

  private berty(ctx: CanvasRenderingContext2D, x: number, feet: number, h: number, reduced: boolean) {
    if (!this.sprite) {
      const img = new Image();
      img.src = `${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}sprites/berty-1.png`;
      img.onload = () => {
        this.sprite = img;
      };
      this.sprite = img;
    }
    const drop = this.falling > 0 ? 1 - this.falling / 0.55 : 0;
    const warp = this.warp > 0 ? 1 - this.warp / 0.9 : 0;
    ctx.save();
    ctx.translate(x, feet);
    if (drop > 0 && !reduced) ctx.rotate(drop * Math.PI * 1.5);
    const sx = warp > 0.2 && !reduced ? Math.max(0.25, 1 - warp) : 1 - drop * 0.7;
    const sy = warp > 0.2 && !reduced ? 1 + warp * 1.2 : 1;
    ctx.scale(sx, sy);
    ctx.globalAlpha = reduced && warp > 0 ? 1 - warp : warp > 0.55 ? 1 - warp : 1;
    if (this.sprite.complete && this.sprite.naturalWidth) ctx.drawImage(this.sprite, -h * 0.4, -h, h * 0.8, h);
    else {
      ctx.fillStyle = TUBE.port;
      ctx.fillRect(-h * 0.28, -h, h * 0.56, h);
    }
    ctx.restore();
    if (warp > 0.3 && warp < 0.75 && !reduced) {
      ctx.strokeStyle = "#3ee0ff";
      ctx.globalAlpha = 0.6 * (1 - warp);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, feet, h * 0.6, h * 0.18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  private sparks(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = TUBE.port;
    for (let i = 0; i < 8; i++) ctx.fillRect(x + (i - 4) * 6, y - i * 3, 3, 3);
  }
}
