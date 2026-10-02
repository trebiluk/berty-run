import { readWho } from "@/game/who";

export type Look = "arcade" | "classic";
export type Cab = "neon" | "sunset" | "mint" | "mono";
export type Skin = "lime" | "cyan" | "magenta" | "gold" | "rainbow";
export type Sticker = "bolt" | "star" | "chip" | "heart";

export type Prefs = {
  look: Look;
  cab: Cab;
  skin: Skin;
  sticker: Sticker;
  crt: boolean;
  music: boolean;
  sound: boolean;
  volume: number;
};

export const CABS: { id: Cab; name: string }[] = [
  { id: "neon", name: "Neon" },
  { id: "sunset", name: "Sunset" },
  { id: "mint", name: "Mint" },
  { id: "mono", name: "Mono Green" },
];

export const SKINS: { id: Skin; name: string; need: number; color: string }[] = [
  { id: "lime", name: "Lime", need: 0, color: "#d6ff4a" },
  { id: "cyan", name: "Cyan", need: 1, color: "#3ee0ff" },
  { id: "magenta", name: "Magenta", need: 3, color: "#ff2bd6" },
  { id: "gold", name: "Gold", need: 5, color: "#ffe56a" },
  { id: "rainbow", name: "Rainbow", need: 8, color: "#ff2bd6" },
];

export const STICKERS: { id: Sticker; name: string; need: number; line: string }[] = [
  { id: "bolt", name: "Bolt", need: 0, line: "Power" },
  { id: "star", name: "Bit", need: 1, line: "A bit you caught" },
  { id: "chip", name: "Chip", need: 3, line: "The brain" },
  { id: "heart", name: "Fan", need: 5, line: "Keeps it cool" },
];

const BASE: Prefs = { look: "arcade", cab: "neon", skin: "lime", sticker: "bolt", crt: true, music: true, sound: true, volume: 0.7 };

function storageKey() {
  const code = readWho()?.code;
  return code ? `br-arcade-v1:${code}` : "br-arcade-v1";
}

function themeFromUrl(): Look | null {
  const read = (search: string) => {
    const q = new URLSearchParams(search).get("theme");
    return q === "classic" || q === "arcade" ? q : null;
  };
  const own = read(location.search);
  if (own) return own;
  try {
    if (parent !== window) return read(parent.location.search);
  } catch {
    /* cross-origin frame */
  }
  return null;
}

export function loadPrefs(): Prefs {
  if (typeof window === "undefined") return { ...BASE };
  let saved: Partial<Prefs> = {};
  try {
    const raw = localStorage.getItem(storageKey()) || localStorage.getItem("br-arcade-v1");
    if (raw) saved = JSON.parse(raw) as Partial<Prefs>;
  } catch {
    saved = {};
  }
  const url = themeFromUrl();
  return {
    ...BASE,
    ...saved,
    look: url ?? (saved.look === "classic" ? "classic" : "arcade"),
    volume: typeof saved.volume === "number" ? Math.min(1, Math.max(0, saved.volume)) : BASE.volume,
    sticker: STICKERS.some((s) => s.id === saved.sticker) ? (saved.sticker as Sticker) : "bolt",
  };
}

export function savePrefs(next: Prefs) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(next));
  } catch {
    /* private mode */
  }
  applyPrefs(next);
  for (const fn of listeners) fn(next);
}

const listeners = new Set<(p: Prefs) => void>();

export function watchPrefs(fn: (p: Prefs) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function reducedMotion() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function applyPrefs(p: Prefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = p.look;
  if (p.look !== "arcade") {
    delete root.dataset.cab;
    delete root.dataset.skin;
    delete root.dataset.sticker;
    root.dataset.crt = "0";
    return;
  }
  root.dataset.cab = p.cab;
  const skin = SKINS.find((s) => s.id === p.skin) ?? SKINS[0];
  root.dataset.skin = p.skin === "rainbow" ? "rainbow" : skin.color;
  root.dataset.sticker = p.sticker;
  root.dataset.crt = p.crt && !reducedMotion() ? "1" : "0";
}

export function initials(alias: string) {
  const letters = alias.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (letters + "YOU").slice(0, 3);
}

export function styleName(p: Prefs) {
  const cab = CABS.find((c) => c.id === p.cab)?.name ?? "Neon";
  const skin = SKINS.find((s) => s.id === p.skin)?.name ?? "Lime";
  const sticker = STICKERS.find((s) => s.id === p.sticker)?.name ?? "Bolt";
  return `${cab} ${skin} ${sticker}`;
}

export function skinColor(id: Skin) {
  return SKINS.find((s) => s.id === id)?.color ?? "#d6ff4a";
}
