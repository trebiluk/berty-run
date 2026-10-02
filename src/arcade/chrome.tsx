import { useEffect, useRef, useState } from "react";
import { applyPrefs, CABS, SKINS, STICKERS, initials, loadPrefs, reducedMotion, savePrefs, skinColor, watchPrefs, type Prefs, type Skin, type Sticker } from "@/arcade/cabinet";
import { face } from "@/game/face";
import { WHATS_NEW } from "@/game/techworks";
import { useLang } from "@/game/use-lang";
import { arcadeBlip, arcadeMood } from "@/arcade/sound";

export function useCabinet() {
  const [prefs, setPrefs] = useState<Prefs>(() => ({ look: "arcade", cab: "neon", skin: "lime", sticker: "bolt", crt: true, music: true, sound: true, volume: 0.7 }));
  useEffect(() => {
    const first = loadPrefs();
    applyPrefs(first);
    setPrefs(first);
    return watchPrefs(setPrefs);
  }, []);
  return prefs;
}

export function Attract({ skin }: { skin: string }) {
  const sky = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = sky.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let raf = 0;
    const stars = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.55,
      z: 0.3 + Math.random() * 0.7,
    }));
    const draw = () => {
      const w = canvas.clientWidth || 320;
      const h = canvas.clientHeight || 120;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      frame += 1;
      ctx.fillStyle = "#07010f";
      ctx.fillRect(0, 0, w, h);
      for (const star of stars) {
        const tw = 0.45 + Math.sin(frame * 0.08 + star.x * 12) * 0.4;
        ctx.fillStyle = `rgba(255,255,255,${tw})`;
        ctx.fillRect(star.x * w, star.y * h, star.z > 0.7 ? 2 : 1, star.z > 0.7 ? 2 : 1);
      }
      const hor = h * 0.62;
      ctx.strokeStyle = "rgba(255,43,214,0.85)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const y = hor + ((i * 18 + frame) % 90);
        ctx.globalAlpha = 1 - (y - hor) / (h - hor);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const vanish = w / 2;
      ctx.strokeStyle = "rgba(62,224,255,0.75)";
      for (let i = -6; i <= 6; i++) {
        ctx.beginPath();
        ctx.moveTo(vanish, hor);
        ctx.lineTo(vanish + i * 70, h);
        ctx.stroke();
      }
      const x = ((frame * 1.6) % (w + 40)) - 20;
      ctx.fillStyle = skin || "#d6ff4a";
      ctx.shadowColor = skin || "#d6ff4a";
      ctx.shadowBlur = 12;
      ctx.fillRect(x, hor - 16, 14, 10);
      ctx.fillStyle = "#3ee0ff";
      ctx.fillRect(x + 3, hor - 20, 6, 4);
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [skin]);
  const lang = useLang();
  const ui = face(lang);
  const script = lang === "uk" || lang === "ru" || lang === "ar" || lang === "fa-AF" || lang === "ti";
  return (
    <div className="arcade-attract pointer-events-none" dir="ltr">
      <div className="relative h-24 overflow-hidden min-[800px]:h-28" aria-hidden="true">
        <canvas ref={sky} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 grid place-items-center">
          <p className="arcade-logo text-lg leading-tight text-[#ffe56a] min-[800px]:text-2xl"><bdi>BERTY'S RUN</bdi></p>
        </div>
      </div>
      <p
        className={
          script
            ? "script-font px-3 pt-1.5 text-center text-sm font-semibold leading-relaxed text-[#c8fbff]"
            : "px-3 pt-1.5 text-center text-[10px] leading-relaxed tracking-wide text-[#7af0ff]"
        }
        style={script ? undefined : { fontFamily: '"Press Start 2P", ui-monospace, monospace' }}
      >
        {ui.coin}
      </p>
      <p className="px-3 pb-1 text-center text-xs font-semibold leading-snug text-[#ffe56a]">{WHATS_NEW}</p>
    </div>
  );
}

export function ArcadeScore({
  gems,
  time,
  par,
  hearts,
  show,
}: {
  gems: number;
  time: number;
  par: number;
  hearts: number;
  show: boolean;
}) {
  const [shown, setShown] = useState(0);
  const [popup, setPopup] = useState("");
  const last = useRef(gems);
  const combo = useRef(0);
  const comboAt = useRef(0);
  const target = Math.max(0, gems * 100 + Math.floor(Math.max(0, par - time) * 10));
  useEffect(() => {
    if (!show) return;
    const id = window.setInterval(() => {
      setShown((n) => (n < target ? Math.min(target, n + Math.max(7, Math.ceil((target - n) / 8))) : target));
    }, 40);
    return () => window.clearInterval(id);
  }, [show, target]);
  useEffect(() => {
    if (!show) return;
    if (gems > last.current) {
      const now = performance.now();
      combo.current = now - comboAt.current < 1400 ? combo.current + 1 : 1;
      comboAt.current = now;
      arcadeBlip("pickup");
      setPopup(combo.current >= 4 ? "PERFECT!" : combo.current >= 2 ? "GREAT!" : "");
      if (document.documentElement.dataset.fx !== "low" && !reducedMotion()) {
        document.documentElement.dataset.shake = "1";
        window.setTimeout(() => delete document.documentElement.dataset.shake, 160);
      }
      window.setTimeout(() => setPopup(""), 700);
    }
    last.current = gems;
  }, [gems, show]);
  const ui = face(useLang());
  if (!show) return null;
  return (
    <div data-hud="score" dir="ltr" className="pointer-events-none relative flex min-w-0 flex-1 items-center justify-between gap-2 text-[10px] leading-none">
      <p className="shrink-0 text-[10px] leading-none text-[#ffe56a]">
        <span className="script-font">{ui.score}</span>{" "}
        <span className="arcade-digits">{String(shown).padStart(6, "0")}</span>
      </p>
      <p className="shrink-0 text-[10px] leading-none text-[#ff2bd6]">
        {popup ? (
          <span className="script-font">{popup === "PERFECT!" ? ui.perfect : ui.great}</span>
        ) : combo.current > 1 ? (
          <span className="arcade-digits">x{combo.current}</span>
        ) : (
          <span className="arcade-digits">1UP {hearts}</span>
        )}
      </p>
    </div>
  );
}

export function StageClear({ time, par, stars, rig, title, high }: { time: number; par: number; stars: number; rig: string; title?: string; high?: string }) {
  const ui = face(useLang());
  const [n, setN] = useState(0);
  const goal = Math.max(0, Math.round((par - Math.min(time, par * 2)) * 100) + stars * 500);
  useEffect(() => {
    arcadeMood("clear");
    const id = window.setInterval(() => setN((v) => (v < goal ? v + Math.max(25, Math.ceil((goal - v) / 10)) : goal)), 40);
    return () => window.clearInterval(id);
  }, [goal]);
  return (
    <div className="arcade-banner mb-2 p-2 text-center" dir="ltr">
      <p className="script-font text-sm font-extrabold text-[#ffe56a]">{title || ui.stageClear}</p>
      <p className="arcade-digits mt-1 text-xs text-[#3ee0ff]">{String(n).padStart(6, "0")}</p>
      {stars >= 3 ? <p className="script-font mt-1 text-xs text-[#ff2bd6]">{high || ui.newHigh}</p> : null}
      {rig ? <p className="mt-1 text-xs font-bold text-[#d6ff4a]">{rig}</p> : null}
    </div>
  );
}

export function ContinueClock({ onContinue }: { onContinue: () => void }) {
  const [left, setLeft] = useState(10);
  const go = useRef(onContinue);
  go.current = onContinue;
  useEffect(() => {
    arcadeMood("over");
    const id = window.setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          window.clearInterval(id);
          arcadeBlip("select");
          go.current();
          return 0;
        }
        arcadeBlip("count");
        return n - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  const ui = face(useLang());
  return (
    <p className="script-font text-center text-sm text-[#ffe56a]">{ui.continueQ} <span className="arcade-digits">{left}</span></p>
  );
}

export function FpsGuard() {
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      frames += 1;
      if (now - last > 1000) {
        const fps = (frames * 1000) / (now - last);
        document.documentElement.dataset.fps = String(Math.round(fps));
        document.documentElement.dataset.fx = fps < 40 ? "low" : "hi";
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}

export function ArcadeSettings({ stamps }: { stamps: number; lang?: string }) {
  const prefs = useCabinet();
  const set = (patch: Partial<Prefs>) => savePrefs({ ...prefs, ...patch });
  const crtLocked = reducedMotion();
  const ui = face(useLang());
  const onOff = (on: boolean) => (on ? ui.readOn : ui.readOff);
  return (
    <div className="mt-3 flex flex-col gap-1">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gold">{ui.cabinet}</p>
      <div className="grid grid-cols-2 gap-1">
        <button type="button" className="min-h-11 text-sm font-bold ring-1 ring-line" aria-pressed={prefs.look === "arcade"} onClick={() => set({ look: "arcade" })}>
          {ui.arcade}
        </button>
        <button type="button" className="min-h-11 text-sm font-bold ring-1 ring-line" aria-pressed={prefs.look === "classic"} onClick={() => set({ look: "classic" })}>
          {ui.classic}
        </button>
      </div>
      <p className="text-xs font-semibold">{ui.cabinetHelp}</p>
      <div className="grid grid-cols-2 gap-1">
        {CABS.map((cab) => (
          <button key={cab.id} type="button" className="min-h-11 text-xs font-bold ring-1 ring-line" aria-pressed={prefs.cab === cab.id} onClick={() => set({ cab: cab.id })}>
            {ui.cabs[cab.id]}
          </button>
        ))}
      </div>
      <button type="button" className="flex min-h-11 items-center justify-between px-3 text-sm font-bold ring-1 ring-line" aria-pressed={prefs.music} onClick={() => set({ music: !prefs.music })}>
        {ui.music} <span>{onOff(prefs.music)}</span>
      </button>
      <button type="button" className="flex min-h-11 items-center justify-between px-3 text-sm font-bold ring-1 ring-line" aria-pressed={prefs.sound} onClick={() => set({ sound: !prefs.sound })}>
        {ui.sound} <span>{onOff(prefs.sound)}</span>
      </button>
      <label className="flex min-h-11 items-center gap-2 px-3 text-sm font-bold ring-1 ring-line">
        {ui.volume}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(prefs.volume * 100)}
          aria-label={ui.volume}
          onChange={(ev) => set({ volume: Number(ev.target.value) / 100 })}
          className="min-h-11 flex-1"
        />
      </label>
      <button
        type="button"
        className="flex min-h-11 items-center justify-between px-3 text-sm font-bold ring-1 ring-line"
        aria-pressed={prefs.crt && !crtLocked}
        disabled={crtLocked}
        onClick={() => set({ crt: !prefs.crt })}
      >
        {ui.scanlines} <span>{crtLocked ? ui.offMotion : onOff(prefs.crt)}</span>
      </button>
      <p className="text-[10px] font-bold uppercase tracking-wide text-gold">{ui.skin}</p>
      <div className="grid grid-cols-3 gap-1">
        {SKINS.map((skin) => {
          const open = stamps >= skin.need;
          return (
            <button
              key={skin.id}
              type="button"
              disabled={!open}
              aria-pressed={prefs.skin === skin.id}
              onClick={() => set({ skin: skin.id as Skin })}
              className="min-h-11 text-xs font-bold ring-1 ring-line disabled:opacity-40"
            >
              <span className="mr-1 inline-block size-2" style={{ background: skinColor(skin.id) }} />
              {open ? ui.skins[skin.id] : `${skin.need} ${ui.wins}`}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-gold">{ui.sticker}</p>
      <p className="text-xs font-semibold">{ui.rig} · {ui.cabs[prefs.cab]} {ui.skins[prefs.skin]} {ui.stickers[prefs.sticker].name}. {ui.paint}</p>
      <div className="grid grid-cols-2 gap-1">
        {STICKERS.map((sticker) => {
          const open = stamps >= sticker.need;
          return (
            <button
              key={sticker.id}
              type="button"
              disabled={!open}
              aria-pressed={prefs.sticker === sticker.id}
              onClick={() => set({ sticker: sticker.id as Sticker })}
              className="min-h-11 px-2 text-left text-xs font-bold ring-1 ring-line disabled:opacity-40"
            >
              {open ? ui.stickers[sticker.id].name : `${sticker.need} ${ui.wins}`}
              <span className="mt-0.5 block font-semibold opacity-80">{ui.stickers[sticker.id].line}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function heatName(alias: string, demo: boolean) {
  if (typeof document === "undefined" || document.documentElement.dataset.theme !== "arcade") {
    return `${alias}${demo ? " · demo" : ""}`;
  }
  return `${initials(alias)}${demo ? " · demo" : ""}`;
}
