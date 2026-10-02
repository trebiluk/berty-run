import { COURSES, starsFor } from "./courses";

/** Shared Hub record. Verified codes come from TechWorks. This app never types or invents one. */
export const WHO_KEY = "kw-who-v1";
export const BAG_KEY = "kw-bag-v1";
const SESSION = "kw-session-v1";
const DAY = 10 * 60 * 60 * 1000;
export const APP_ID = "berty-run";

export type Who = { alias: string; code: string; verified: boolean; at: number };

type AppBag = {
  saved?: string;
  watts?: number;
  stamps?: number;
  parts?: string[];
  scores?: { id: string; name: string; time: number; stars: number }[];
  line?: string;
};

type KidBag = { alias: string; apps: Record<string, AppBag> };
type BagFile = { v: 1; kids: Record<string, KidBag> };

type WhoApi = {
  read?: () => { alias?: string; code?: string; verified?: boolean; at?: number } | null;
  active?: () => boolean;
  mark?: (app: string, line: string) => unknown;
  record?: (row: {
    app: string;
    version?: string;
    event?: string;
    level?: string;
    score?: number;
    max?: number;
    stars?: number;
    xp?: number;
    skill?: string;
    ms?: number;
  }) => unknown;
};

function api(): WhoApi | null {
  const root = globalThis as { KulibertWho?: WhoApi };
  return root.KulibertWho ?? null;
}

function cleanCode(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5);
}

export function readWho(): Who | null {
  const live = api()?.read?.();
  if (live && live.alias && live.code) {
    const code = cleanCode(live.code);
    return {
      alias: String(live.alias).trim().slice(0, 16),
      code: live.verified && code.length === 5 ? code : String(live.code),
      verified: !!live.verified && code.length === 5,
      at: Number(live.at) || 0,
    };
  }
  try {
    const raw = JSON.parse(localStorage.getItem(WHO_KEY) || "null") as {
      v?: number;
      alias?: string;
      code?: string;
      verified?: boolean;
      at?: number;
    } | null;
    const alias = String(raw?.alias || "").trim().slice(0, 16);
    const code = cleanCode(raw?.code || "");
    if (!alias || raw?.v !== 2 || raw.verified !== true || code.length !== 5) return null;
    return { alias, code, verified: true, at: Number(raw.at) || 0 };
  } catch {
    return null;
  }
}

export function sessionOn() {
  const live = api();
  if (live?.active) return !!live.active();
  const who = readWho();
  if (!who?.verified) return false;
  try {
    if (sessionStorage.getItem(SESSION) === "1") return true;
  } catch {
    /* private */
  }
  return !!(who.at && Date.now() - who.at < DAY);
}

/** Alias and TechWorks code, only after Hub sign-in. */
export function signedWho(): Who | null {
  const who = readWho();
  if (!who?.verified || who.code.length !== 5) return null;
  if (!sessionOn()) return null;
  return who;
}

/** One shared TechWorks row for a real clear. Local watts stay on this Chromebook. */
export function recordClear(input: { version: string; level: string; score: number; max: number; stars: number; xp: number; ms: number }) {
  const who = signedWho();
  if (!who) return;
  const stars = Math.max(0, Math.min(3, Math.round(input.stars)));
  const row = {
    app: APP_ID,
    version: input.version,
    event: "score" as const,
    level: input.level,
    score: input.score,
    max: input.max,
    stars,
    xp: Math.max(0, Math.round(input.xp)),
    skill: "motion",
    ms: Math.max(0, Math.round(input.ms)),
  };
  const send = () => {
    const live = api();
    if (live?.record) {
      live.record(row);
      return;
    }
    live?.mark?.(APP_ID, `${row.level} ${row.score}/${row.max}`.slice(0, 32));
  };
  if (api()?.record || api()?.mark) {
    send();
    return;
  }
  if (typeof document === "undefined") return;
  const s = document.createElement("script");
  s.src = "/shared/kw-who.js?v=2026-10-01-job";
  s.onload = () => send();
  document.head.appendChild(s);
}

function readBag(): BagFile {
  try {
    const raw = JSON.parse(localStorage.getItem(BAG_KEY) || "null") as BagFile | null;
    if (!raw || raw.v !== 1 || typeof raw.kids !== "object" || raw.kids == null) return { v: 1, kids: {} };
    return raw;
  } catch {
    return { v: 1, kids: {} };
  }
}

export function stashRun(input: { alias: string; code: string; watts: number; parts: string[]; best: Record<string, number> }) {
  const who = signedWho();
  if (!who || who.code !== input.code) return;
  const scores = COURSES.filter((c) => input.best[c.id] != null).map((c) => ({
    id: c.id,
    name: c.name,
    time: input.best[c.id],
    stars: starsFor(input.best[c.id], c.par),
  }));
  const bag = readBag();
  const kid = bag.kids[who.code] ?? { alias: who.alias, apps: {} };
  kid.alias = who.alias;
  kid.apps[APP_ID] = {
    ...(kid.apps[APP_ID] ?? {}),
    saved: new Date().toISOString(),
    watts: input.watts,
    stamps: scores.length,
    parts: input.parts.slice(),
    scores,
  };
  bag.kids[who.code] = kid;
  try {
    localStorage.setItem(BAG_KEY, JSON.stringify(bag));
  } catch {
    /* private */
  }
}

export function appsFor(code: string): { id: string; bag: AppBag }[] {
  const kid = readBag().kids[code];
  if (!kid) return [];
  return Object.entries(kid.apps).map(([id, bag]) => ({ id, bag }));
}

export function openSignIn() {
  if (typeof window === "undefined") return;
  if (window.parent !== window) {
    try {
      window.parent.postMessage({ type: "tw-session-open" }, window.location.origin);
    } catch {
      /* hub bar is the control */
    }
    return;
  }
  const btn = document.querySelector<HTMLButtonElement>(".tw-out, .tw-app-status");
  btn?.click();
}
