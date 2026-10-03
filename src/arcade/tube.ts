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
export const TUBE_EXIT_Z = 32;

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
  private saidTurn = false;
  private saidWire = false;
  private saidGap = false;
  private missHold = 0;
  private slow = 1.5;
  private first = true;
  private tipAt = 0;
  private spark = 0;
  warp = 0;
  reduced = false;
  lowFx = false;

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
    if (this.warp > 0) {
      this.warp = Math.max(0, this.warp - dt);
      return ev;
    }
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
    if (this.steer === 0 && ix > 0.45) {
      this.face = (this.face + 1) % 4;
      this.steer = 1;
      this.queue = 0;
      ev.turn = true;
      if (!this.saidTurn) {
        this.saidTurn = true;
        this.tip(ev, "wall", now);
      }
    } else if (this.steer === 0 && ix < -0.45) {
      this.face = (this.face + 3) % 4;
      this.steer = -1;
      this.queue = 0;
      ev.turn = true;
      if (!this.saidTurn) {
        this.saidTurn = true;
        this.tip(ev, "wall", now);
      }
    } else if (Math.abs(ix) < 0.25) {
      if (this.queue && now - this.queueAt < 0.12 && this.steer === 0) {
        this.face = (this.face + (this.queue > 0 ? 1 : 3)) % 4;
        this.steer = this.queue > 0 ? 1 : -1;
        this.queue = 0;
        ev.turn = true;
      } else this.steer = 0;
    } else if (this.steer !== 0 && Math.sign(ix) === this.steer) {
      this.queue = Math.sign(ix);
      this.queueAt = now;
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
      this.boost = 0.9;
      ev.boost = true;
    }
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
        ev.tipKey = "bit";
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
    const hud = 94;
    const thumb = 126;
    const freeTop = hud + 32;
    const freeBot = h - thumb;
    const freeH = Math.max(80, freeBot - freeTop);
    const freeW = w;
    const upright = h > w;
    const ring = upright ? freeW * 0.92 : freeH * 0.88;
    const cx = w / 2;
    const cy = freeTop + freeH / 2;
    ctx.fillStyle = TUBE.ink;
    ctx.fillRect(0, 0, w, h);
    this.stars(ctx, cx, cy, reduced);
    const bertyH = Math.max(44, Math.round(0.115 * Math.min(freeW, freeH)));
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.roll);
    const frac = this.z - Math.floor(this.z);
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
        if (cell === ".") continue;
        this.tile(ctx, face, near, far, cell, alpha, step < 12, tile);
      }
    }
    ctx.restore();
    const feet = cy + ring * 0.42;
    this.berty(ctx, cx, feet, bertyH, reduced);
    if (this.spark > 0) this.sparks(ctx, cx, feet - bertyH);
    if (!this.saidGap && this.z >= TUBE_GAP_Z - 2) {
      ctx.fillStyle = TUBE.port;
      ctx.beginPath();
      ctx.moveTo(cx + 18, feet - 20);
      ctx.lineTo(cx + 36, feet - 8);
      ctx.lineTo(cx + 18, feet + 4);
      ctx.stroke();
    }
  }

  private stars(ctx: CanvasRenderingContext2D, cx: number, cy: number, reduced: boolean) {
    const rate = reduced ? 0 : (this.boost > 0 ? 2.1 : 1) * (this.z * 0.04);
    for (let i = 0; i < 60; i++) {
      const a = (i * 0.73) % (Math.PI * 2);
      const d = ((i * 17 + rate * 40) % 180) + 8;
      ctx.globalAlpha = 0.35 + (i % 5) * 0.09;
      ctx.fillStyle = "#f6efe2";
      ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1;
  }

  private tile(ctx: CanvasRenderingContext2D, face: number, near: number, far: number, cell: Cell, alpha: number, marks: boolean, tile: number) {
    const a0 = Math.PI / 2 + (face - 0.46) * (Math.PI / 2);
    const a1 = Math.PI / 2 + (face + 0.46) * (Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a0) * far, Math.sin(a0) * far);
    ctx.lineTo(Math.cos(a0) * near, Math.sin(a0) * near);
    ctx.lineTo(Math.cos(a1) * near, Math.sin(a1) * near);
    ctx.lineTo(Math.cos(a1) * far, Math.sin(a1) * far);
    ctx.closePath();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = cell === "c" ? TUBE.crumble : cell === "s" ? TUBE.speed : cell === "f" ? TUBE.fan : cell === "K" ? TUBE.check : cell === "w" ? TUBE.wire : cell === "E" ? TUBE.ink : TUBE.floor;
    if (cell === "c" && this.crumb > 0 && face === this.face) ctx.fillStyle = TUBE.hot;
    ctx.fill();
    ctx.strokeStyle = cell === "c" ? TUBE.crack : cell === "s" ? TUBE.chev : cell === "f" ? TUBE.blade : cell === "K" ? TUBE.arch : cell === "E" ? TUBE.port : TUBE.edge;
    ctx.lineWidth = tile < 4 ? 2 : 1.5;
    ctx.stroke();
    if (marks && (cell === "s" || cell === "w" || cell === "E")) {
      ctx.strokeStyle = cell === "s" ? TUBE.chev : cell === "w" ? TUBE.cable : TUBE.port;
      ctx.lineWidth = cell === "w" ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(Math.PI / 2 + face * Math.PI / 2) * far, Math.sin(Math.PI / 2 + face * Math.PI / 2) * far);
      ctx.lineTo(Math.cos(Math.PI / 2 + face * Math.PI / 2) * near, Math.sin(Math.PI / 2 + face * Math.PI / 2) * near);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private berty(ctx: CanvasRenderingContext2D, x: number, feet: number, h: number, reduced: boolean) {
    const drop = this.falling > 0 ? 1 - this.falling / 0.55 : 0;
    const warp = this.warp > 0 ? 1 - this.warp / 0.9 : 0;
    ctx.save();
    ctx.translate(x, feet);
    if (drop > 0) ctx.rotate(reduced ? 0 : drop * Math.PI * 1.5);
    const sx = warp > 0.2 ? Math.max(0.25, 1 - warp) : 1 - drop * 0.7;
    const sy = warp > 0.2 ? 1 + warp : 1;
    ctx.scale(sx, sy);
    ctx.fillStyle = "#d6ff4a";
    ctx.fillRect(-h * 0.28, -h, h * 0.56, h);
    ctx.fillStyle = "#071018";
    ctx.fillRect(-h * 0.16, -h * 0.72, h * 0.1, h * 0.1);
    ctx.fillRect(h * 0.06, -h * 0.72, h * 0.1, h * 0.1);
    ctx.restore();
  }

  private sparks(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = TUBE.port;
    for (let i = 0; i < 8; i++) ctx.fillRect(x + (i - 4) * 6, y - i * 3, 3, 3);
  }
}
