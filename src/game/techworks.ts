import { COURSES } from "./courses";
import { LESSONS, PARTS, type LessonId } from "./curriculum";
import type { CourseId } from "./types";

export const CHIP = "BR 1.3.0";
export const APP_NAME = "Berty's Run";
export const PACK_KIND = "bertyrun";
export const PACK_VERSION = 1;
export const PACK_NAME = "bertys-run.bertyrun.json";

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
  { code: "TS", name: "Technological systems", body: "Input, process, output. Bits in, traces, gate out. Subsystems plug the board." },
  { code: "ED", name: "Engineering design", body: "Plan a jump, test, change one thing, test again. Ghosts are recorded procedures." },
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
    "Clear First Trace. Collect every bit. Hit the gate.",
    "Open Build Lab. Pass the Bits check (8 bits in a byte).",
    "If you have watts, install Motherboard.",
  ],
  need: "Chromebook. Headphones optional. No names.",
  lookFor: "Names bit, byte, and port. Jump before the crate.",
  say: "You are inside the computer. Bits in. Gate out.",
  beats: [
    { id: "enter", name: "Enter", body: "Sit. Open Berty's Run from the Tech Room." },
    { id: "listen", name: "Listen", body: "Bits, traces, gate. You are inside the machine." },
    { id: "crew", name: "Crew work", body: "Run First Trace. Stamp Bits. Install a part if watts allow." },
    { id: "clean", name: "Clean up", body: "Export .bertyrun.json if asked. Close the tab." },
  ],
};

export const INDUCTION = [
  {
    id: "in",
    kicker: "Site induction",
    title: "You are inside the computer",
    body: "This board is a machine. Traces carry signals. Bits are data. The striped gate is a port — the way out.",
  },
  {
    id: "run",
    kicker: "The job",
    title: "Jump. Collect bits. Hit the port",
    body: "Berty auto-runs the copper. Space, click, or tap to jump. Hold for a higher jump. Grab every amber bit, then park in the gate. Timing over twitch.",
  },
  {
    id: "build",
    kicker: "Then build",
    title: "Earn watts. Build a machine",
    body: "A clear pays watts. Build Lab spends them on real parts: board, PSU, CPU, RAM. Boot when the core is in. No names. No accounts.",
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
};

const COURSE_IDS = new Set<string>(COURSES.map((c) => c.id));
const PART_IDS = new Set<string>(PARTS.map((p) => p.id));
const LESSON_IDS = new Set<string>(LESSONS.map((l) => l.id));

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
}): BertyPack {
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
  });
  return { pack };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v != null && !Array.isArray(v);
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

export async function downloadPack(pack: BertyPack) {
  const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = PACK_NAME;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
