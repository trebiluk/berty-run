import { COURSES, fmtTime, starsFor } from "./courses";
import { LESSONS, PARTS, asGoal, botUnlocked, type LessonId } from "./curriculum";
import { signedWho } from "./who";
import { GUIDE, guideDone } from "./field-guide";
import type { CourseId } from "./types";

export const CHIP = "BR 1.12.14";
export const WHATS_NEW =
  "BR 1.12.14: Picking your PC takes you straight into the level.";

const WHATS_NEW_LANG: Record<string, string> = {
  en: WHATS_NEW,
  simple: WHATS_NEW,
  es: "BR 1.12.14: Elegir tu PC te lleva directo al nivel.",
  uk: "BR 1.12.14: Вибір ПК одразу веде в рівень.",
  ru: "BR 1.12.14: Выбор ПК сразу ведёт в уровень.",
  ar: "BR 1.12.14: اختيار الحاسوب يدخلك المستوى مباشرة.",
  "fa-AF": "BR 1.12.14: انتخاب کامپیوتر تو را مستقیم به مرحله می‌برد.",
  rw: "BR 1.12.14: Guhitamo PC bigutwara mu rwego ako kanya.",
  ti: "BR 1.12.14: ፒሲ ምምራጽ ብቐጥታ ናብ ደረጃ የእቱ።",
};

export function whatsNew(lang: string) {
  return WHATS_NEW_LANG[lang] || WHATS_NEW;
}
export const APP_NAME = "Berty's Run";
export const PACK_KIND = "bertyrun";
export const PACK_VERSION = 1;
export const PACK_NAME = "bertys-run.bertyrun.json";
export const HOWTO_KEY = "br-howto-v1";

export function howtoSeen() {
  try {
    return localStorage.getItem(HOWTO_KEY) === "1";
  } catch {
    return false;
  }
}

export function markHowto() {
  try {
    localStorage.setItem(HOWTO_KEY, "1");
  } catch {
    /* private mode */
  }
}
export function cleanAlias(raw: string) {
  return raw
    .replace(/[^\p{L}\p{N} \-']/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
}

export function aliasCode(alias: string) {
  const s = alias.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 8);
  if (!s) return "";
  let h = 2166136261;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const n = (h >>> 0) % (chars.length * chars.length);
  return `${s.toUpperCase()}-${chars[Math.floor(n / chars.length)]}${chars[n % chars.length]}`;
}

export function packFileName(alias: string, code = "") {
  const slug = (code || alias)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return slug ? `${slug}.bertyrun.json` : PACK_NAME;
}

/** Live classroom origins. Same-tab so Chromebooks stay in the shop. */
export const ROOM = "https://apps.kulibert.net";
export const DESK = "https://tw.kulibert.net";
export const CART = `${ROOM}/berty-run`;

export const HUB = {
  home: { href: ROOM, label: "Tech Room", blurb: "Shop apps. Same Chromebook." },
  desk: { href: DESK, label: "TechWorks", blurb: "Wall, Teach, Deck, PlanIt." },
} as const;

export const SISTERS: { id: string; name: string; href: string; blurb: string }[] = [
  { id: "techworks", name: "TechWorks", href: DESK, blurb: "The shop desk." },
  { id: "bertybots", name: "Berty's Botz", href: `${ROOM}/bertybots/`, blurb: "Physics machines." },
  { id: "koderized", name: "Koderized", href: `${DESK}/coderized/`, blurb: "Coding arena." },
  { id: "paperlab", name: "PaperLab", href: `${ROOM}/paperlab/`, blurb: "Paper tech labs." },
  { id: "logolab", name: "LogoLab", href: `${ROOM}/logolab/`, blurb: "How logos work." },
  { id: "bertycad", name: "BertyCAD", href: `${ROOM}/bertycad/`, blurb: "Draw, then make." },
  { id: "baboo", name: "Baboo", href: "https://baboo.kulibert.net", blurb: "Room tools." },
];

export const MST5_STATEMENT =
  "Students will apply technological knowledge and skills to design, construct, use, and evaluate products and systems to satisfy human and environmental needs.";

export const MST_TAGS = [
  { code: "CT", name: "Computer technology", body: "Computers as tools for design, modeling, and control. This lab is a model of a real machine." },
  { code: "TS", name: "Technological systems", body: "Input, process, output. Bits in, traces, port out. Subsystems plug the board." },
  { code: "ED", name: "Engineering design", body: "Plan a lean, test, change one thing, test again. Ghosts are recorded procedures." },
  { code: "TR", name: "Tools, resources, processes", body: "Choose the right part. Power, cooling, and storage change energy and information into a working system." },
  { code: "IT", name: "Impacts of technology", body: "No names on a network. Phishing is a fake ask. Design can protect people." },
] as const;

export const ITEEA = [
  { code: "STL 2", name: "Core concepts", body: "Systems, resources, processes, control." },
  { code: "STL 8", name: "Attributes of design", body: "A computer is a designed system with constraints." },
  { code: "STL 11", name: "Apply the design process", body: "Iterate a run. Debug one change at a time." },
  { code: "STL 12", name: "Use and maintain", body: "Install parts in order. Boot when the core is in." },
  { code: "STL 17", name: "Info and communication", body: "Bits, packets, ports, and an OS that shares the machine." },
] as const;

export const COMPTIA = {
  itf: "CompTIA ITF+ (FC0-U61) intro",
  aplus: "CompTIA A+ 220-1101 hardware intro",
} as const;

export const LESSON_STANDARDS: Record<
  LessonId,
  { mst: string[]; comptia: string }
> = {
  binary: { mst: ["CT"], comptia: "ITF+ 1.2 bits" },
  board: { mst: ["TS", "CT"], comptia: "A+ 1101-3 motherboard" },
  power: { mst: ["TR", "TS"], comptia: "A+ 1101-3 PSU" },
  cpu: { mst: ["TS"], comptia: "A+ 1101-3 CPU" },
  ram: { mst: ["TS"], comptia: "A+ 1101-3 RAM" },
  cool: { mst: ["TR"], comptia: "A+ 1101-3 cooling" },
  storage: { mst: ["TS"], comptia: "A+ 1101-3 storage" },
  io: { mst: ["TS"], comptia: "A+ 1101-3 ports" },
  gpu: { mst: ["CT", "TS"], comptia: "A+ 1101-3 GPU" },
  code: { mst: ["CT"], comptia: "ITF+ 4.0 software" },
  os: { mst: ["CT", "TS"], comptia: "ITF+ 3.1 OS" },
  algo: { mst: ["ED", "CT"], comptia: "ITF+ 4.1 procedures" },
  net: { mst: ["CT"], comptia: "ITF+ 2.4 / A+ 1101-2" },
  debug: { mst: ["ED"], comptia: "A+ 1101-5 troubleshoot" },
  safe: { mst: ["IT"], comptia: "ITF+ 6.0 security" },
};

export const HOUR = {
  ask: "How does a computer go from bits to a boot?",
  do: [
    "Clear Roll Out. Collect every bit. Hit the port.",
    "Open Build Lab. Pass the Bits check (8 bits in a byte).",
    "If you have watts, install Motherboard.",
  ],
  need: "Chromebook. Headphones optional. No names.",
  lookFor: "Names bit, byte, and port. Leans before the corner.",
  say: "Berty is learning the computer. You help him explore. The PC is the reward.",
  beats: [
    { id: "enter", name: "Enter", body: "Sit. Open Berty's Run from the Tech Room." },
    { id: "listen", name: "Listen", body: "Berty explores. You lean. Bits in, port out." },
    { id: "crew", name: "Crew work", body: "Run Roll Out. Pass the Bits check. Install a part if you have watts." },
    { id: "clean", name: "Clean up", body: "Export .bertyrun.json if asked. Close the tab." },
  ],
};

export const INDUCTION = [
  {
    id: "in",
    kicker: "Hey",
    title: "Help Berty.",
    body: "He is learning the computer by exploring. Lean to roll. Grab the bits. Park in the port.",
    accent: "#e87722",
  },
  {
    id: "tracks",
    kicker: "Two tracks",
    title: "2D leans. 3D steers.",
    body: "Each run is lime, cyan, or gold. The 3D levels are listed under their own heading.",
    accent: "#4c8dff",
  },
  {
    id: "par",
    kicker: "The lock",
    title: "Par opens the next board",
    body: "Finish at or under par. The next board on that track unlocks. A slow clear still saves your score.",
    accent: "#2ee0d0",
  },
  {
    id: "watts",
    kicker: "Build Lab",
    title: "The PC is the reward",
    body: "Clears pay watts. Spend them on the machine you are building with Berty.",
    accent: "#f0b429",
  },
  {
    id: "go",
    kicker: "Ready",
    title: "Small lean. Small turn.",
    body: "The stick is in the corner. WASD works too. On a 3D board, W rolls and A/D steers. Home brings you back to the Tech Room.",
    accent: "#1fbfa7",
  },
];

export type Launch = {
  course?: CourseId;
  lab: boolean;
  plan: boolean;
  job: boolean;
  help: boolean;
  induct: boolean;
};

export type BertyPack = {
  kind: typeof PACK_KIND;
  v: number;
  app: string;
  chip: string;
  school: string;
  saved: string;
  best: Record<string, number>;
  watts: number;
  parts: string[];
  passed: string[];
  booted: boolean;
  ghostOn: boolean;
  alias: string;
  code: string;
  goal: string;
  /** Board clears in this file. Desk ingest later. The file is the record for now. */
  successes: { id: string; name: string; time: number; stars: number }[];
  bot: string[];
  handoff: "file";
  /** Room times. TechWorks can ingest this later. Alias codes only. */
  board: BoardRow[];
};

export type BoardRow = {
  code: string;
  alias: string;
  courseId: string;
  time: number;
  stars: number;
  par: number;
  at: string;
};

const BOARD_KEY = "br-board-v1";

const COURSE_IDS = new Set<string>(COURSES.map((c) => c.id));
const PART_IDS = new Set<string>(PARTS.map((p) => p.id));
const LESSON_IDS = new Set<string>(LESSONS.map((l) => l.id));

function verifiedCode(raw: string) {
  const code = raw.toUpperCase().replace(/[^A-Z2-9]/g, "");
  return code.length === 5 ? code : "";
}

function asBoardRow(v: unknown): BoardRow | null {
  if (typeof v !== "object" || v == null) return null;
  const o = v as Record<string, unknown>;
  const alias = cleanAlias(typeof o.alias === "string" ? o.alias : "");
  const code = verifiedCode(typeof o.code === "string" ? o.code : "");
  const courseId = typeof o.courseId === "string" ? o.courseId : "";
  const time = typeof o.time === "number" && Number.isFinite(o.time) ? o.time : 0;
  const course = COURSES.find((c) => c.id === courseId);
  if (!code || !course || time <= 0) return null;
  return {
    code,
    alias,
    courseId,
    time,
    stars: starsFor(time, course.par),
    par: course.par,
    at: typeof o.at === "string" ? o.at : "",
  };
}

export function readBoard(): BoardRow[] {
  try {
    const raw = localStorage.getItem(BOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { rows?: unknown };
    if (!Array.isArray(parsed.rows)) return [];
    return parsed.rows.map(asBoardRow).filter((row): row is BoardRow => row != null);
  } catch {
    return [];
  }
}

export function postScore(row: BoardRow) {
  const clean = asBoardRow(row);
  if (!clean) return readBoard();
  const rows = readBoard();
  const i = rows.findIndex((r) => r.code === clean.code && r.courseId === clean.courseId);
  if (i < 0) rows.push(clean);
  else if (clean.time < rows[i].time) rows[i] = clean;
  rows.sort((a, b) => a.time - b.time || a.code.localeCompare(b.code));
  try {
    localStorage.setItem(BOARD_KEY, JSON.stringify({ kind: "bertyboard", v: 1, rows }));
  } catch {
    /* private mode */
  }
  return rows;
}

export function boardFor(courseId: string) {
  return readBoard()
    .filter((r) => r.courseId === courseId)
    .sort((a, b) => a.time - b.time);
}

export function rivalOf(courseId: string, code: string) {
  const rows = boardFor(courseId);
  if (!rows.length) return "No best time yet. Set one!";
  const best = rows[0];
  if (code && best.code === code) return "You hold the best time";
  return `Beat ${best.alias} ${fmtTime(best.time)}`;
}

export function studentsOnBoard() {
  const all = readBoard();
  const codes = [...new Set(all.map((r) => r.code))];
  const cards = codes.map((code) => {
    const mine = all.filter((r) => r.code === code);
    const levels = COURSES.map((c) => {
      const row = mine.find((r) => r.courseId === c.id) ?? null;
      return { id: c.id, name: c.name, time: row?.time ?? null, stars: row?.stars ?? 0, par: c.par };
    });
    return {
      code,
      alias: mine[0]?.alias ?? code,
      stars: levels.reduce((n, l) => n + l.stars, 0),
      levels,
    };
  });
  cards.sort((a, b) => b.stars - a.stars || a.alias.localeCompare(b.alias));
  return cards;
}

export function placeLabel(n: number) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

export function bertyCheer(place: number, name: string) {
  if (place === 1) return `I stuck ${name} on the top shelf. You are first.`;
  if (place === 2) return `Second on ${name}. I can hear the one ahead of you.`;
  if (place === 3) return `Third on ${name}. I wrote your short name on the board.`;
  if (place > 3) return `${placeLabel(place)} on ${name}. Back will not erase it.`;
  return `I pocketed the bits from ${name}. Your stars stay if you hit Back.`;
}

export function readLaunch(search = typeof window !== "undefined" ? window.location.search : ""): Launch {
  const q = new URLSearchParams(search);
  const raw = (q.get("course") ?? q.get("board") ?? "").trim();
  const course = COURSE_IDS.has(raw as CourseId) ? (raw as CourseId) : undefined;
  const lab = flag(q.get("lab"));
  const plan = flag(q.get("plan")) || flag(q.get("hour"));
  const job = flag(q.get("job"));
  const help = flag(q.get("help")) || flag(q.get("teacher"));
  const induct = flag(q.get("induct")) || flag(q.get("induction"));
  return { course, lab, plan, job, help, induct };
}

function flag(v: string | null) {
  if (v == null) return false;
  const s = v.trim().toLowerCase();
  return s === "" || s === "1" || s === "true" || s === "yes";
}

export function hangHint(_origin = typeof window !== "undefined" ? window.location.origin : "") {
  const base = CART;
  return {
    board: `${base}/?course=roll-out`,
    lab: `${base}/?lab=1`,
    hour: `${base}/?job=1&course=roll-out`,
    help: `${base}/?help=1`,
  };
}

export function makePack(input: {
  best: Record<string, number>;
  watts: number;
  parts: string[];
  passed: string[];
  booted: boolean;
  ghostOn: boolean;
  alias?: string;
  goal?: string;
}): BertyPack {
  const goal = asGoal(input.goal);
  return {
    kind: PACK_KIND,
    v: PACK_VERSION,
    app: APP_NAME,
    chip: CHIP,
    school: "Solvay MS · TechWorks",
    saved: new Date().toISOString(),
    best: scrubBest(input.best),
    watts: Math.max(0, Math.round(input.watts)),
    parts: unique(input.parts.filter((id) => PART_IDS.has(id))),
    passed: unique(input.passed.filter((id) => LESSON_IDS.has(id))),
    booted: !!input.booted,
    ghostOn: input.ghostOn !== false,
    alias: signedWho()?.alias || cleanAlias(input.alias ?? ""),
    code: signedWho()?.code ?? "",
    goal,
    successes: successList(scrubBest(input.best)),
    bot: botUnlocked(Object.keys(scrubBest(input.best)).length).map((f) => f.name),
    handoff: "file",
    board: readBoard(),
  };
}

export function parsePack(raw: unknown): { pack: BertyPack } | { error: string } {
  if (typeof raw !== "object" || raw == null) return { error: "Not a shop pack." };
  const p = raw as Record<string, unknown>;
  if (p.kind !== PACK_KIND) return { error: "This file is not a Berty's Run pack." };
  const watts = typeof p.watts === "number" && Number.isFinite(p.watts) ? Math.max(0, Math.round(p.watts)) : 0;
  const pack = makePack({
    best: isRecord(p.best) ? (p.best as Record<string, number>) : {},
    watts,
    parts: Array.isArray(p.parts) ? p.parts.map(String) : [],
    passed: Array.isArray(p.passed) ? p.passed.map(String) : [],
    booted: !!p.booted,
    ghostOn: p.ghostOn !== false,
    alias: typeof p.alias === "string" ? p.alias : "",
    goal: typeof p.goal === "string" ? p.goal : "",
  });
  const incoming = Array.isArray(p.board) ? p.board.map(asBoardRow).filter((row): row is BoardRow => row != null) : [];
  if (incoming.length) pack.board = incoming;
  return { pack };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v != null && !Array.isArray(v);
}

function successList(best: Record<string, number>) {
  return COURSES.filter((c) => best[c.id] != null).map((c) => ({
    id: c.id,
    name: c.name,
    time: best[c.id],
    stars: starsFor(best[c.id], c.par),
  }));
}

function scrubBest(best: Record<string, number>) {
  const out: Record<string, number> = {};
  for (const [id, t] of Object.entries(best)) {
    if (!COURSE_IDS.has(id as CourseId)) continue;
    if (typeof t !== "number" || !Number.isFinite(t) || t <= 0) continue;
    out[id] = t;
  }
  return out;
}

function unique(ids: string[]) {
  return [...new Set(ids)];
}

export function progressText(pack: BertyPack) {
  const lines = [
    "Berty's Run",
    `Alias: ${pack.alias || "(none)"}`,
    `Code: ${pack.code || "(none)"}`,
    `Watts: ${pack.watts}`,
    `Parts: ${pack.parts.join(", ") || "(none yet)"}`,
    `Bot: ${pack.bot.join(", ") || "(none yet)"}`,
    "Boards:",
    ...(pack.successes.length
      ? pack.successes.map((s) => `- ${s.name}: ${s.time.toFixed(1)}s · ${s.stars} stars`)
      : ["- none yet"]),
    "Learned:",
    ...(() => {
      const ids = new Set(guideDone(pack.code));
      const names = GUIDE.filter((t) => ids.has(t.id)).map((t) => t.title);
      return names.length ? names.map((n) => `- ${n}`) : ["- none yet"];
    })(),
  ];
  return lines.join("\n") + "\n";
}

export function downloadText(name: string, text: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function downloadPack(pack: BertyPack): Promise<boolean> {
  const text = JSON.stringify(pack, null, 2);
  const picker = (window as Window & {
    showSaveFilePicker?: (opts: {
      suggestedName: string;
      types: { description: string; accept: Record<string, string[]> }[];
    }) => Promise<{ createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }> }>;
  }).showSaveFilePicker;
  if (picker) {
    try {
      const handle = await picker({
        suggestedName: packFileName(pack.alias, pack.code),
        types: [{ description: "Berty Run pack", accept: { "application/json": [".json"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return true;
    } catch (err) {
      if (err && typeof err === "object" && "name" in err && err.name === "AbortError") return false;
    }
  }
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = packFileName(pack.alias, pack.code);
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}

export function readPackFile(file: File) {
  return new Promise<BertyPack>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      try {
        const parsed = parsePack(JSON.parse(String(reader.result)));
        if ("error" in parsed) reject(new Error(parsed.error));
        else resolve(parsed.pack);
      } catch {
        reject(new Error("That file is not valid JSON."));
      }
    };
    reader.readAsText(file);
  });
}
