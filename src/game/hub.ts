/** Hub language. KulibertPrefs and ?lang= win. English if neither is set. */
export type Lang = "en" | "simple" | "uk" | "ru" | "es" | "ar" | "fa-AF" | "rw" | "ti";

export const LANGS: { id: Lang; name: string }[] = [
  { id: "en", name: "English" },
  { id: "simple", name: "Simple" },
  { id: "uk", name: "Українська" },
  { id: "ru", name: "Русский" },
  { id: "es", name: "Español" },
  { id: "ar", name: "العربية" },
  { id: "fa-AF", name: "دری" },
  { id: "rw", name: "Ikinyarwanda" },
  { id: "ti", name: "ትግርኛ" },
];

const OK: Record<string, 1> = { en: 1, simple: 1, uk: 1, ru: 1, es: 1, ar: 1, "fa-AF": 1, rw: 1, ti: 1 };

/** English only. Used when /shared/i18n has not loaded. Never a blank, never a raw key. */
const SHARED_EN: Record<string, string> = {
  home: "Home",
  signIn: "Sign in",
  settings: "Settings",
  play: "Play",
  pause: "Pause",
  resume: "Resume",
  retry: "Retry",
  exit: "Exit",
  sound: "Sound",
  music: "Music",
  volume: "Volume",
  next: "Next",
  back: "Back",
  help: "Help",
  whatsNew: "What's new",
  scores: "Scores",
  levels: "Levels",
  language: "Language",
  menu: "Menu",
  close: "Close",
  readAloud: "Read aloud",
  noVoice: "No voice yet. Read the words.",
};

type PrefsApi = {
  lang?: string;
  dir?: string;
  acceptLang?: (lang: string) => void;
  say?: (text: string) => void;
  voiceFor?: (lang: string, voices?: SpeechSynthesisVoice[]) => SpeechSynthesisVoice | null;
};

type I18nApi = {
  t?: (key: string, fallback?: string) => string;
  ready?: (lang: string, cb: () => void) => void;
};

function root(): (Window & { KulibertPrefs?: PrefsApi; KulibertI18n?: I18nApi }) | null {
  return typeof window === "undefined" ? null : window;
}

export function normLang(value: unknown): Lang | "" {
  const s = String(value ?? "");
  return OK[s] ? (s as Lang) : "";
}

export function dirOf(lang: Lang): "rtl" | "ltr" {
  return lang === "ar" || lang === "fa-AF" ? "rtl" : "ltr";
}

export function htmlLang(lang: Lang): string {
  return lang === "simple" ? "en" : lang;
}

export function classicTheme(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(location.search);
    if (q.get("theme") === "classic" || q.get("hub") === "classic") return true;
    if (localStorage.getItem("tech-room-hub") === "classic") return true;
  } catch {
    /* private mode */
  }
  return false;
}

function queryLang(href: string): Lang | "" {
  try {
    return normLang(new URL(href, "http://local").searchParams.get("lang"));
  } catch {
    return "";
  }
}

/** ?lang= on this frame, then the Hub frame when we can read it. */
export function frameLang(): Lang | "" {
  if (typeof window === "undefined") return "";
  const own = queryLang(location.search);
  if (own) return own;
  try {
    if (window.parent && window.parent !== window) {
      const fromParent = queryLang(window.parent.location.search);
      if (fromParent) return fromParent;
    }
  } catch {
    /* cross-origin hub: the postMessage kp-lang path covers this */
  }
  return "";
}

export function pickLang(storedApp?: Lang | ""): Lang {
  if (classicTheme()) return "en";
  const fromFrame = frameLang();
  if (fromFrame) return fromFrame;
  const w = root();
  const fromPrefs = normLang(w?.KulibertPrefs?.lang);
  if (fromPrefs) return fromPrefs;
  try {
    const raw = JSON.parse(localStorage.getItem("kulibert-prefs-v1") || "null") as { lang?: string } | null;
    const stored = normLang(raw?.lang);
    if (stored) return stored;
  } catch {
    /* ignore */
  }
  return storedApp || "en";
}

export function shared(key: string): string {
  const w = root();
  let hit = "";
  try {
    hit = w?.KulibertI18n?.t?.(key) || "";
  } catch {
    hit = "";
  }
  if (hit && hit !== key) return hit;
  return SHARED_EN[key] || "";
}

export function applyDom(lang: Lang) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.lang = htmlLang(lang);
  el.dir = dirOf(lang);
  el.dataset.lang = lang;
  el.dataset.kpLang = lang;
  const board = document.querySelectorAll(".play-canvas, .arcade-attract, [data-hud='score'], [data-ltr]");
  board.forEach((node) => node.setAttribute("dir", "ltr"));
}

function liveLine(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let node = document.getElementById("kp-live");
  if (!node) {
    node = document.createElement("p");
    node.id = "kp-live";
    node.setAttribute("role", "status");
    document.body.appendChild(node);
  }
  return node;
}

function voiceList(): SpeechSynthesisVoice[] {
  try {
    return window.speechSynthesis?.getVoices?.() || [];
  } catch {
    return [];
  }
}

/** Speak only with a voice for this language. Otherwise show the words and "No voice yet". */
export function sayLine(text: string, lang: Lang) {
  const words = String(text || "").replace(/\s+/g, " ").trim().slice(0, 180);
  if (!words || typeof window === "undefined") return;
  const line = liveLine();
  if (line) {
    line.hidden = false;
    line.lang = htmlLang(lang);
    line.dir = dirOf(lang);
    line.textContent = words;
  }
  const prefs = root()?.KulibertPrefs;
  const voice = prefs?.voiceFor?.(lang, voiceList()) ?? null;
  const want = (lang === "simple" ? "en" : lang).toLowerCase().split("-")[0];
  const got = String(voice?.lang || "").toLowerCase().replace(/_/g, "-");
  const match = !!voice && (got === want || got.startsWith(`${want}-`));
  if (!match || !window.speechSynthesis) {
    if (line) line.textContent = `${words} ${shared("noVoice")}`;
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(words);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = lang === "simple" ? 0.85 : 0.95;
    window.speechSynthesis.speak(u);
  } catch {
    if (line) line.textContent = `${words} ${shared("noVoice")}`;
  }
}

export function chooseLang(lang: Lang, write: (lang: Lang) => void) {
  if (classicTheme()) {
    write("en");
    return;
  }
  try {
    const prefs = root()?.KulibertPrefs;
    if (prefs?.acceptLang && prefs.lang !== lang) prefs.acceptLang(lang);
  } catch {
    /* hub script missing in this preview */
  }
  write(lang);
  root()?.KulibertI18n?.ready?.(lang, () => {
    window.dispatchEvent(new Event("br-access"));
  });
}

let watching = false;

export function installLangWatch(read: () => Lang, write: (lang: Lang) => void) {
  if (typeof window === "undefined" || watching) return;
  watching = true;
  const adopt = (value: unknown) => {
    const next = classicTheme() ? "en" : normLang(value) || pickLang(read());
    applyDom(next);
    try {
      const prefs = root()?.KulibertPrefs;
      if (!classicTheme() && prefs?.acceptLang && prefs.lang !== next) prefs.acceptLang(next);
    } catch {
      /* hub script missing */
    }
    if (read() !== next) write(next);
    root()?.KulibertI18n?.ready?.(next, () => {
      window.dispatchEvent(new Event("br-access"));
    });
  };
  adopt(pickLang(read()));
  window.addEventListener("kulibert-lang", (ev) => {
    const detail = (ev as CustomEvent<{ lang?: string }>).detail;
    adopt(detail?.lang);
  });
  window.addEventListener("message", (ev) => {
    const data = ev.data as { type?: string; lang?: string } | null;
    if (!data || (data.type !== "kp-lang" && data.type !== "kulibert-lang")) return;
    adopt(data.lang);
  });
  window.addEventListener("storage", (ev) => {
    if (ev.key !== "kulibert-prefs-v1") return;
    adopt(pickLang(read()));
  });
}
