/** Fake-3D tube. Perspective on a 2D canvas. The field turns; Berty stays down. */

export type TubeEvent = {
  turn?: boolean;
  gem?: boolean;
  hurt?: boolean;
  win?: boolean;
  boost?: boolean;
  tip?: string;
};

type Cell = string;

const RINGS: string[] = [];
function add(n: number, cells: string) {
  for (let i = 0; i < n; i++) RINGS.push(cells);
}

// Face order: floor, right, ceiling, left.
add(6, "##.#");
add(5, ".#..");
add(3, ".##.");
add(1, ".KK.");
add(5, "..#.");
add(1, "..K.");
add(10, "wwww");
add(1, "#...");
add(1, "s...");
add(3, "c...");
add(2, "f...");
add(4, "##..");
add(2, "#o..");
add(1, "E...");

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
  private planted = false;
  private spin = 0;
  private boost = 0;
  private drag = 0;
  private crumb = 0;
  private gems = new Set<string>();
  private spawnZ = 0;
  private spawnFace = 0;
  private steer = 0;
  private saidTurn = false;
  private saidWire = false;

  constructor() {
    this.gemTotal = RINGS.reduce((n, row) => n + [...row].filter((c) => c === "o").length, 0);
  }

  look(dz = 0, turn = 0) {
    const face = (this.face + turn + 8) % 4;
    return this.cell(this.z + dz, face);
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
    this.spawnZ = 0;
    this.spawnFace = 0;
    this.steer = 0;
    this.saidTurn = false;
    this.saidWire = false;
  }

  private cell(z: number, face: number): Cell {
    const row = RINGS[Math.max(0, Math.min(RINGS.length - 1, Math.floor(z)))] ?? "#...";
    return row[face] ?? ".";
  }

  private solid(cell: Cell) {
    return cell === "#" || cell === "K" || cell === "s" || cell === "f" || cell === "c" || cell === "o" || cell === "E";
  }

  step(dt: number, input: { x: number; jump: boolean }, reduced: boolean): TubeEvent {
    const ev: TubeEvent = {};
    if (this.falling > 0) {
      this.falling -= dt;
      if (this.falling <= 0) {
        this.z = this.spawnZ;
        this.face = this.spawnFace;
        this.roll = this.spawnFace * (Math.PI / 2);
        this.planted = false;
        this.falling = 0;
        ev.hurt = true;
      }
      return ev;
    }

    const ix = input.x;
    if (this.steer === 0 && ix > 0.45) {
      this.face = (this.face + 1) % 4;
      this.steer = 1;
      ev.turn = true;
      if (!this.saidTurn) {
        this.saidTurn = true;
        ev.tip = "The side wall is the floor now. Keep rolling.";
      }
    } else if (this.steer === 0 && ix < -0.45) {
      this.face = (this.face + 3) % 4;
      this.steer = -1;
      ev.turn = true;
      if (!this.saidTurn) {
        this.saidTurn = true;
        ev.tip = "The side wall is the floor now. Keep rolling.";
      }
    } else if (Math.abs(ix) < 0.25) this.steer = 0;

    const here = this.cell(this.z, this.face);
    if (here === "w") {
      if (!this.saidWire) {
        this.saidWire = true;
        ev.tip = "Wire. The tube spins. Jump when the floor tile is yours.";
      }
      if (!this.planted) {
        this.spin += dt;
        const beat = reduced ? 0.45 : 0.7;
        if (this.spin >= beat) {
          this.spin = 0;
          this.face = (this.face + 1) % 4;
          ev.turn = true;
        }
      }
      if (input.jump) this.planted = true;
    } else this.planted = false;

    if (here === "s") this.boost = 0.9;
    if (here === "f") this.drag = 0.55;
    if (here === "K") {
      this.spawnZ = Math.floor(this.z);
      this.spawnFace = this.face;
    }
    if (here === "o") {
      const key = `${Math.floor(this.z)}:${this.face}`;
      if (!this.gems.has(key)) {
        this.gems.add(key);
        this.got += 1;
        ev.gem = true;
      }
    }
    if (here === "c" || this.crumb > 0 && here === "c") {
      this.crumb = this.crumb > 0 ? this.crumb - dt : 0.48;
      if (this.crumb <= 0) {
        this.beginFall();
        return ev;
      }
    } else if (here !== "c") this.crumb = 0;
    if (here === "E") {
      if (this.got < this.gemTotal) {
        ev.tip = "Grab both bits, then the port.";
        return ev;
      }
      ev.win = true;
      return ev;
    }

    const speed = (this.boost > 0 ? 9 : 4.2) * (this.drag > 0 ? 0.35 : 1);
    this.boost = Math.max(0, this.boost - dt);
    this.drag = Math.max(0, this.drag - dt);
    this.z = Math.min(RINGS.length - 0.05, this.z + speed * dt);

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
    ctx.fillStyle = "#07010f";
    ctx.fillRect(0, 0, w, h);
    if (!reduced) {
      ctx.fillStyle = "#f6efe2";
      for (let i = 0; i < 36; i++) {
        const x = ((i * 97) % w);
        const y = ((i * 53) % h);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const cx = w / 2;
    const cy = h * 0.4;
    const reach = Math.min(w, h) * 0.48;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-this.roll);
    for (let step = 16; step >= 0; step--) {
      const tile = Math.floor(this.z) + step;
      const row = RINGS[tile];
      if (!row) continue;
      const far = reach / (1.2 + (step + 1) * 0.62);
      const near = reach / (1.2 + step * 0.62);
      for (let face = 0; face < 4; face++) {
        const cell = row[face];
        if (cell === "." ) continue;
        const a0 = Math.PI / 2 - (face + 0.46) * (Math.PI / 2);
        const a1 = Math.PI / 2 - (face - 0.46) * (Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a0) * far, Math.sin(a0) * far);
        ctx.lineTo(Math.cos(a0) * near, Math.sin(a0) * near);
        ctx.lineTo(Math.cos(a1) * near, Math.sin(a1) * near);
        ctx.lineTo(Math.cos(a1) * far, Math.sin(a1) * far);
        ctx.closePath();
        ctx.fillStyle = cell === "w" ? "#142028" : cell === "s" ? "#3a2a08" : cell === "f" ? "#102028" : cell === "c" ? "#24180c" : "#101820";
        ctx.fill();
        ctx.strokeStyle = cell === "w" ? "#ff2bd6" : cell === "s" ? "#ffe56a" : cell === "f" ? "#3ee0ff" : cell === "o" ? "#d6ff4a" : "#3ee0ff";
        ctx.globalAlpha = cell === "w" ? 0.95 : 0.75;
        ctx.lineWidth = cell === "w" ? 2 : 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    ctx.strokeStyle = "#ff2bd6";
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, reach * 0.92);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();

    const drop = this.falling > 0 ? 1 - this.falling / 0.55 : 0;
    const skin = document.documentElement.dataset.skin;
    const color = !skin || skin === "rainbow" ? "#d6ff4a" : skin;
    const size = (1 - drop * 0.7) * Math.min(w, h) * 0.035;
    const by = h * (0.72 - drop * 0.22);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = reduced ? 0 : 12;
    ctx.fillRect(cx - size, by, size * 2, size * 1.35);
    ctx.fillStyle = "#071018";
    ctx.fillRect(cx - size * 0.35, by + size * 0.25, size * 0.3, size * 0.28);
    ctx.fillRect(cx + size * 0.15, by + size * 0.25, size * 0.3, size * 0.28);
    const sticker = document.documentElement.dataset.sticker;
    ctx.fillStyle = "#ffe56a";
    if (sticker === "star") {
      ctx.beginPath();
      ctx.arc(cx, by - size * 0.35, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
    } else if (sticker === "chip") {
      ctx.fillRect(cx - size * 0.3, by - size * 0.55, size * 0.6, size * 0.35);
    } else if (sticker === "heart") {
      ctx.beginPath();
      ctx.arc(cx, by - size * 0.2, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(cx - size * 0.08, by - size * 0.7, size * 0.16, size * 0.4);
    }
    ctx.shadowBlur = 0;
  }
}
