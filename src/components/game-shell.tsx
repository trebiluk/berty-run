import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX, Users, User, Heart, Ghost, Star, CircuitBoard, Home, Wrench, ClipboardList, Settings, Menu, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COURSES, courseById, courseHasZap, courseMode, dyeFor, fmtTime, isUnlocked, nextBoard, nextUnbeaten, pickCourse, previousCourse, starsFromBest, TEMP_UNLOCK_ALL_LEVELS, trackCourses } from "@/game/courses";
import { Engine } from "@/game/engine";
import { unlockAudio } from "@/game/audio";
import { CHIP, ROOM, boardFor, downloadPack, placeLabel, readLaunch, rivalOf, studentsOnBoard, whatsNew } from "@/game/techworks";
import { BOARD_SLOT, BOT_FEATURES, briefFor, botUnlocked, guideTeach, nextBot, slotPart, type LessonId, type PcGoal } from "@/game/curriculum";
import { BuildLab } from "@/components/build-lab";
import { ShopDesk } from "@/components/shop-desk";
import { buildHeat } from "@/game/contest";
import { Induction, Splash } from "@/components/induction";
import { JobPacket } from "@/components/job-packet";
import { FieldGuide } from "@/components/field-guide";
import type { CourseId, HudSnap } from "@/game/types";
import { ACCESS_DEFAULT, DRIVES, askTilt, drivePatch, packFor, readAccess, say, stopSay, writeAccess, type Access, type Drive } from "@/game/access";
import { cheerLine, closeLabel, courseLabel, face, partLabel, placeWord, rewardLine } from "@/game/face";
import { fillHud, hudCopy, line16, localizeLine } from "@/game/hud-copy";
import { chooseLang, installLangWatch, LANGS } from "@/game/hub";
import { appsFor, openSignIn } from "@/game/who";
import { ArcadeScore, ArcadeSettings, Attract, ContinueClock, FpsGuard, StageClear, heatName, useCabinet } from "@/arcade/chrome";
import { applyPrefs, loadPrefs, skinColor } from "@/arcade/cabinet";
import { arcadeBlip, arcadeMood, bootArcadeAudio } from "@/arcade/sound";
import { cn } from "@/lib/utils";

let wideHold = false;

function tellWide(on: boolean) {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "kw-orient", landscape: on }, location.origin);
      window.parent.postMessage({ type: "kw-shell", hide: on }, location.origin);
    }
  } catch {
    /* opened outside the Tech Room */
  }
}

async function lockWide() {
  wideHold = true;
  const root = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
  try {
    if (!document.fullscreenElement) {
      const ask = root.requestFullscreen?.bind(root) || root.webkitRequestFullscreen?.bind(root);
      if (ask) await ask();
    }
  } catch {
    /* the phone can still stay wide in the stage */
  }
  const lock = screen.orientation?.lock?.bind(screen.orientation);
  if (!lock) return false;
  try {
    await lock("landscape");
    return true;
  } catch {
    try {
      await lock("landscape-primary");
      return true;
    } catch {
      return false;
    }
  }
}

function releaseWide() {
  wideHold = false;
  try {
    screen.orientation?.unlock?.();
  } catch {
    /* already free */
  }
  if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => undefined);
}

function useAccess() {
  const [access, setAccess] = useState<Access>(ACCESS_DEFAULT);
  useEffect(() => {
    const sync = () => setAccess(readAccess());
    installLangWatch(
      () => readAccess().lang,
      (lang) => writeAccess({ ...readAccess(), lang }),
    );
    sync();
    window.addEventListener("br-access", sync);
    return () => window.removeEventListener("br-access", sync);
  }, []);
  return access;
}

function AccessPanel({
  hud,
  onClose,
  onLearn,
  onHow,
  onLab,
  onShop,
  onSound,
  onSave,
  onGoal,
  onPick,
  onHeat,
  onCrew,
  onGhost,
  onTryPin,
  onLockOff,
  onJob,
  hour,
  full,
  onFull,
}: {
  hud: HudSnap;
  onClose: () => void;
  onLearn: () => void;
  onHow: () => void;
  onLab: () => void;
  onShop: () => void;
  onSound: () => void;
  onSave: () => void;
  onGoal: () => void;
  onPick: (drive: Drive) => void;
  onHeat: () => void;
  onCrew: (on: boolean) => void;
  onGhost: () => void;
  onTryPin: (pin: string) => boolean;
  onLockOff: () => void;
  onJob: () => void;
  hour: boolean;
  full: boolean;
  onFull: (on: boolean) => void;
}) {
  const access = useAccess();
  const ui = face(access.lang);
  const set = (patch: Partial<Access>) => {
    const next = { ...access, ...patch };
    if (patch.lang) {
      chooseLang(patch.lang, (lang) => writeAccess({ ...next, lang }));
    } else {
      writeAccess(next);
    }
    if (patch.speak) say(ui.readSaid, next.lang);
    if (patch.lang) {
      const name = LANGS.find((item) => item.id === patch.lang)?.name ?? "English";
      say(name, patch.lang);
    }
  };
  const langs = LANGS;
  const [scores, setScores] = useState(false);
  const [pinAsk, setPinAsk] = useState(false);
  const [pin, setPin] = useState("");
  const [pinNo, setPinNo] = useState(false);
  return (
    <div className="settings-body overflow-y-auto bg-ink p-3">
      <h2 className="text-2xl font-extrabold">{ui.settings}</h2>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-gold">{ui.language}</p>
      <div className="mt-1 grid grid-cols-3 gap-1" role="group" aria-label={ui.language}>
        {langs.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={access.lang === item.id}
            onClick={() => set({ lang: item.id })}
            className={cn("min-h-11 px-1 text-xs font-bold leading-tight ring-1", access.lang === item.id ? "bg-orange text-ink ring-orange" : "bg-navy-2 text-fg ring-line")}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-1">
        <button type="button" aria-pressed={access.speak} onClick={() => set({ speak: !access.speak })} className="flex min-h-11 items-center justify-between px-3 text-sm font-bold ring-1 ring-line">
          {ui.read}
          <span>{access.speak ? ui.readOn : ui.readOff}</span>
        </button>
        <button type="button" aria-pressed={access.big} onClick={() => set({ big: !access.big })} className="flex min-h-11 items-center justify-between px-3 text-sm font-bold ring-1 ring-line">
          {ui.big}
          <span>{access.big ? ui.readOn : ui.readOff}</span>
        </button>
        <button type="button" aria-pressed={access.fewer} onClick={() => set({ fewer: !access.fewer })} className="flex min-h-11 items-center justify-between px-3 text-sm font-bold ring-1 ring-line">
          {ui.fewer}
          <span>{access.fewer ? ui.readOn : ui.readOff}</span>
        </button>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-gold">{ui.playStyle}</p>
        <div className="mt-1 flex flex-col gap-1">
          {DRIVES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={access.drive === item.id}
              onClick={() => onPick(item.id)}
              className={cn("min-h-11 px-3 text-left ring-1", access.drive === item.id ? "bg-orange text-ink ring-orange" : "bg-navy-2 text-fg ring-line")}
            >
              <span className="block text-sm font-bold">{ui.drives[item.id].name}</span>
              <span className="block text-xs font-semibold opacity-80">{ui.drives[item.id].line}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm leading-snug">
        {hud.alias ? `${hud.alias}. ${ui.signedIn}` : ui.signedOut}
      </p>
      {hud.code && appsFor(hud.code).length ? (
        <ul className="mt-1 flex flex-col gap-1">
          {appsFor(hud.code).map((row) => (
            <li key={row.id} className="text-sm font-semibold">
              {row.id}: {row.bag.scores?.length ?? row.bag.stamps ?? 0} saved
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-xs font-bold text-gold">{ui.tools}</p>
      <div className="mt-1 flex flex-col gap-1">
        {hud.alias ? null : (
          <Button variant="navy" onClick={openSignIn}>{ui.signIn}</Button>
        )}
        <Button variant="navy" onClick={onHeat}>{ui.heat}</Button>
        <Button variant="navy" onClick={() => onCrew(!hud.crew)}>{hud.crew ? ui.twoPlayers : ui.onePlayer}</Button>
        <Button variant="navy" onClick={() => setScores((v) => !v)}>{scores ? ui.hideScores : ui.scores}</Button>
        {scores ? <RoomBoard courseId={hud.courseId} code={hud.code} /> : null}
        <Button variant="navy" onClick={onLearn}>{ui.learn}</Button>
        <Button variant="navy" onClick={onHow}>{ui.how}</Button>
        <Button variant="ghost" onClick={onSound}>{hud.mute ? ui.soundOff : ui.sound}</Button>
        <Button variant="ghost" onClick={onGhost}>{hud.ghost ? ui.bestOn : ui.bestOff}</Button>
        {hour ? <Button variant="navy" onClick={onJob}>{ui.thisHour}</Button> : null}
        {hud.stamps > 0 ? <Button onClick={onSave}>{ui.save}</Button> : null}
        <Button variant="navy" onClick={onLab}>{ui.lab}</Button>
        <Button variant="navy" onClick={onGoal}>{ui.goal}</Button>
        {hud.fullUnlock ? (
          <Button variant="ghost" onClick={onLockOff}>{ui.teacherOn}</Button>
        ) : pinAsk ? (
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(ev) => {
              ev.preventDefault();
              const ok = onTryPin(pin);
              setPin("");
              setPinNo(!ok);
              if (ok) setPinAsk(false);
            }}
          >
            <input
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={pin}
              aria-label={ui.teacherPin}
              onChange={(ev) => {
                setPin(ev.target.value.replace(/\D/g, "").slice(0, 4));
                setPinNo(false);
              }}
              className="min-h-12 w-24 bg-ink px-3 text-sm font-semibold tracking-widest text-fg ring-1 ring-line"
            />
            <Button type="submit">{ui.open}</Button>
            {pinNo ? <span className="text-xs font-semibold text-orange">{ui.wrongPin}</span> : null}
          </form>
        ) : (
          <Button variant="ghost" onClick={() => setPinAsk(true)}>{ui.teacherPin}</Button>
        )}
        {hud.goal ? (
          <a href={`${ROOM}/paperlab/?plan=${hud.goal}`} className="inline-flex min-h-11 items-center px-4 text-sm font-semibold uppercase tracking-wide text-cyan ring-1 ring-line">
            {ui.paper}
          </a>
        ) : null}
        <Button variant="ghost" onClick={onShop}>{ui.file}</Button>
        <button type="button" aria-pressed={full} onClick={() => onFull(!full)} className="flex min-h-11 items-center justify-between px-3 text-sm font-bold ring-1 ring-line">
          {ui.fullScreen}
          <span>{full ? ui.readOn : ui.readOff}</span>
        </button>
        <ArcadeSettings stamps={hud.stamps} lang={access.lang} />
        <button type="button" data-fs-exit className="min-h-11 px-3 text-sm font-bold text-fg" onClick={() => { void document.exitFullscreen?.(); localStorage.setItem("kulibert-fullscreen", "0"); setFsOn(false); }}>{line16(access.lang, "exitFull")}</button>
        {/iPhone|iPad/.test(navigator.userAgent) ? <p className="px-3 text-xs font-semibold text-fg">{line16(access.lang, "iphoneHint")}</p> : null}
        <a href={ROOM} onClick={stayInShell} className="inline-flex min-h-11 items-center gap-2 px-4 text-sm font-semibold uppercase tracking-wide ring-1 ring-line">
          <Home className="size-4" /> {ui.home}
        </a>
      </div>
      <Button className="mt-3" onClick={onClose}>{ui.back}</Button>
      <div data-version-area className="mt-3">
        <p className="text-xs font-bold text-gold">{CHIP}</p>
        <p className="mt-1 text-sm font-semibold leading-snug"><span className="text-gold">{ui.whatsNew}.</span> {whatsNew(access.lang)}</p>
      </div>
    </div>
  );
}

function fmt(t: number) {
  return fmtTime(t);
}

const idle: HudSnap = {
  phase: "boot",
  courseId: "roll-out",
  courseName: "Roll Out",
  time: 0,
  gems: 0,
  gemTotal: 0,
  hearts: 3,
  crew: false,
  mute: false,
  best: null,
  stars: 0,
  is3d: false,
  par: 32,
  bests: {},
  ghost: true,
  hasGhost: false,
  stamps: 0,
  score: 0,
  bestScore: null,
  portOpen: false,
  watts: 0,
  parts: [],
  passed: [],
  earned: 0,
  booted: false,
  inducted: false,
  fullUnlock: false,
  alias: "",
  code: "",
  botGift: "",
  botLine: "",
  goal: "",
  needGoal: false,
  needBrief: false,
  intro: 0,
  go: false,
  tip: "",
  warp: 0,
  tubeZ: 0,
  tubeWire: false,
  tubeLen: 45,
  follow: false,
  tilt: false,
  mouse: false,
  hands: false,
};

export function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas3dRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [hud, setHud] = useState<HudSnap>(idle);
  const [lab, setLab] = useState(false);
  const [shop, setShop] = useState(false);
  const [hourLink, setHourLink] = useState(false);
  const [job, setJob] = useState(false);
  const [help, setHelp] = useState(false);
  const [learn, setLearn] = useState(false);
  const [induct, setInduct] = useState(false);
  const [splash, setSplash] = useState(false);
  const [heat, setHeat] = useState(false);
  const heatCloseTimer = useRef(0);
  const resultsQuietUntil = useRef(0);
  const [picking, setPicking] = useState(false);
  const cabinet = useCabinet();
  const arcade = cabinet.look === "arcade";
  const [gear, setGear] = useState(false);

  useEffect(() => {
    applyPrefs(loadPrefs());
    bootArcadeAudio();
  }, []);
  useEffect(() => {
    if (hud.intro > 0) arcadeBlip("count");
    if (hud.go) arcadeBlip("power");
  }, [hud.intro, hud.go]);
  useEffect(() => {
    setHeat(false);
    return () => window.clearTimeout(heatCloseTimer.current);
  }, [hud.phase, hud.courseId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const canvas3d = canvas3dRef.current;
    if (!canvas || !canvas3d) return;
    const engine = new Engine(canvas, canvas3d, setHud);
    engineRef.current = engine;
    const labHost = () => {
      const h = location.hostname;
      return h === "localhost" || h === "127.0.0.1" || h.endsWith(".vercel.app");
    };
    const launch = readLaunch();
    void engine.boot().then(() => {
      if (engine.destroyed || engineRef.current !== engine) return;
      if (launch.course) engine.applyLaunch(launch.course);
      const q = new URLSearchParams(location.search);
      const probe = labHost() && (q.get("selftest") === "1" || q.get("bot") === "1" || q.get("hud") === "1");
      if (!probe) return;
      engine.markLab();
      (window as unknown as { __eng?: Engine }).__eng = engine;
      if (q.get("selftest") === "1") {
        void import("@/game/selftest").then(({ runRespawnSelftest }) => {
          const report = runRespawnSelftest();
          const text = report.lines.map((line) => `${line.ok ? "PASS" : "FAIL"}  ${line.name}  ${line.detail}`).join("\n");
          console.log(report.ok ? "SELFTEST PASS" : "SELFTEST FAIL");
          console.log(text);
          const pre = document.createElement("pre");
          pre.id = "selftest";
          pre.textContent = `${report.ok ? "PASS" : "FAIL"}\n${text}`;
          document.body.appendChild(pre);
        });
      }
      if (q.get("bot") === "1") {
        void import("@/game/clear-bot").then(({ runClearBot }) => runClearBot(engine));
      }
      if (q.get("selftest") === "1" || q.get("bot") === "1" || q.get("hud") === "1") {
        (window as unknown as { __eng?: Engine }).__eng = engine;
      }
      if (q.get("hud") === "1") {
        engine.setFullUnlock(false);
        engine.setGoal("gaming");
        engine.selectCourse("around-the-bend");
        engine.ackBrief(null);
        engine.skipIntro();
      }
      if (q.get("selftest") === "1" || q.get("bot") === "1") return;
      if (launch.lab) {
        setLab(true);
      } else if (launch.help) {
        setHourLink(true);
        setHelp(true);
      } else if (launch.job) {
        setHourLink(true);
        setJob(true);
      } else if (launch.plan) {
        setShop(true);
      }
    });
    const pull = () => engineRef.current?.pullSession();
    const onMsg = (ev: MessageEvent) => {
      const data = ev.data as { type?: string } | null;
      if (data?.type === "tw-session") pull();
    };
    window.addEventListener("storage", pull);
    window.addEventListener("kw-mark", pull);
    window.addEventListener("message", onMsg);
    return () => {
      if ((window as unknown as { __eng?: Engine }).__eng === engine) {
        delete (window as unknown as { __eng?: Engine }).__eng;
      }
      engine.destroy();
      engineRef.current = null;
      window.removeEventListener("storage", pull);
      window.removeEventListener("kw-mark", pull);
      window.removeEventListener("message", onMsg);
    };
  }, []);

  useEffect(() => {
    const flush = () => engineRef.current?.flushSave();
    const onPop = () => {
      if (engineRef.current?.guardBack()) history.pushState({ brGuard: 1 }, "");
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  useEffect(() => {
    if (hud.phase !== "play") return;
    if (history.state && (history.state as { brGuard?: number }).brGuard) return;
    history.pushState({ brGuard: 1 }, "");
  }, [hud.phase]);

  const [styleOpen, setStyleOpen] = useState(false);
  const [keysOn, setKeysOn] = useState(false);
  const [askRestart, setAskRestart] = useState(false);
  const [fsOn, setFsOn] = useState(false);
  useEffect(() => {
    const onKey = () => setKeysOn(true);
    window.addEventListener("keydown", onKey);
    setFsOn(localStorage.getItem("kulibert-fullscreen") === "1");
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const ducked = styleOpen || gear || hud.phase === "pause" || hud.phase === "win" || hud.phase === "fail";
    if (ducked) {
      arcadeMood(hud.phase === "fail" ? "over" : "clear");
      return;
    }
    if (hud.phase === "play" && hud.courseId === "tube-run") arcadeMood("tube");
    else if (hud.phase === "play" && hud.is3d) arcadeMood("deep");
    else if (hud.phase === "play" && hud.stamps >= 6) arcadeMood("fast");
    else if (hud.phase === "play") arcadeMood("level");
    else arcadeMood("title");
  }, [hud.phase, hud.is3d, hud.stamps, hud.courseId, styleOpen, gear]);
  const [turnWarn, setTurnWarn] = useState("");
  const [full, setFull] = useState(false);
  const [wide, setWide] = useState(false);
  const styleHold = useRef(false);
  useEffect(() => {
    if (hud.phase !== "play" && hud.phase !== "pause") {
      setStyleOpen(false);
      styleHold.current = false;
    }
  }, [hud.phase]);
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "r" || ev.key === "R") { if (hud.phase === "play") setAskRestart(true); return; }
      if (ev.key !== "Escape") return;
      if (styleOpen) {
        setStyleOpen(false);
        if (styleHold.current) {
          styleHold.current = false;
          engineRef.current?.resumeIfPaused();
        }
        return;
      }
      if (gear) setGear(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [styleOpen, gear]);
  const access = useAccess();
  const ui = face(access.lang);
  const hudWords = hudCopy(access.lang);
  const coarse = useCoarse();
  const hintText = localizeLine(
    access.lang,
    turnWarn && !hud.tip
      ? turnWarn
      : hud.tip
        ? hud.tip
        : hud.time >= 4
          ? rivalOf(hud.courseId, hud.code)
          : hud.is3d
            ? access.drive === "hands"
              ? hudWords.hintHands3d
              : access.drive === "keys"
                ? hudWords.hintKeys3d
                : hud.tilt
                  ? hudWords.hintTilt
                  : hud.follow
                    ? hudWords.hintFollow
                    : hudWords.hintSteer
            : access.drive === "hands"
              ? hudWords.hintHands2d
              : access.drive === "keys"
                ? hudWords.hintKeys2d
                : hud.follow
                  ? hudWords.hintFollow
                  : hud.courseId === "oil-pan"
                    ? hudWords.hintPaste
                    : hud.courseId === "case-fan"
                      ? hudWords.hintVirus
                      : coarse
                        ? courseHasZap(hud.courseId)
                          ? hudWords.hintTouchZap
                          : hudWords.hintTouch
                        : hudWords.hintStick,
  );
  const hintRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = hintRef.current;
    if (!el) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const age = now - start;
      const opacity = age <= 2000 ? 1 : age >= 2300 ? 0 : 1 - (age - 2000) / 300;
      el.style.opacity = String(opacity);
      if (age < 2400) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hintText]);
  useEffect(() => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.setFollow(access.follow);
    eng.setTilt(access.tilt);
    eng.setMouse(access.mouse);
    eng.setHands(access.hands);
  }, [access.follow, access.tilt, access.mouse, access.hands]);

  const pickDrive = (drive: Drive) => {
    void (async () => {
      if (drive === "tilt") {
        const ok = await askTilt();
        if (!ok) {
          engineRef.current?.tiltBlocked();
          return;
        }
        const held = await lockWide();
        setWide(true);
        setFull(true);
        tellWide(true);
        if (!held) setTurnWarn("");
      }
      writeAccess({ ...readAccess(), ...drivePatch(drive) });
      setStyleOpen(false);
      if (styleHold.current) {
        styleHold.current = false;
        engineRef.current?.resumeIfPaused();
      }
    })();
  };

  const setShell = (hide: boolean) => {
    setFull(hide);
    setWide(hide);
    if (hide) {
      tellWide(true);
      void lockWide();
    } else {
      tellWide(false);
      releaseWide();
    }
  };

  useEffect(() => {
    const onFs = () => {
      if (document.fullscreenElement || wideHold) {
        if (wideHold && !document.fullscreenElement) void lockWide();
        return;
      }
      setFull(false);
      setWide(false);
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "kw-shell", hide: false }, location.origin);
        }
      } catch {
        /* ignore */
      }
    };
    const again = () => {
      if (wideHold) void lockWide();
    };
    document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("orientationchange", again);
    screen.orientation?.addEventListener?.("change", again);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("orientationchange", again);
      screen.orientation?.removeEventListener?.("change", again);
    };
  }, []);

  const closeHeat = () => {
    resultsQuietUntil.current = performance.now() + 450;
    window.clearTimeout(heatCloseTimer.current);
    // pointerup runs before click. Unmounting here retargets that click
    // onto Practice, Levels, or Next and can leave results for the title.
    heatCloseTimer.current = window.setTimeout(() => setHeat(false), 0);
  };

  const e = engineRef.current;
  const overlay = hud.phase !== "play";
  const menuOpen = hud.phase === "play" || hud.phase === "pause" ? styleOpen : gear;
  const toggleGameMenu = () => {
    if (hud.phase === "play" || hud.phase === "pause") {
      const opening = !styleOpen;
      if (opening) {
        if (hud.phase === "play") {
          engineRef.current?.togglePause();
          styleHold.current = true;
        }
        setStyleOpen(true);
      } else {
        setStyleOpen(false);
        if (styleHold.current) {
          styleHold.current = false;
          engineRef.current?.resumeIfPaused();
        }
      }
      return;
    }
    setGear((v) => !v);
  };
  const closeGameMenu = () => {
    if (hud.phase === "play" || hud.phase === "pause") {
      setStyleOpen(false);
      if (styleHold.current) {
        styleHold.current = false;
        engineRef.current?.resumeIfPaused();
      }
      return;
    }
    setGear(false);
  };
  const hideBoard = hud.phase === "title" || hud.phase === "win" || hud.phase === "fail" || hud.phase === "boot";
  const boardLocked = hideBoard || hud.phase === "pause" || styleOpen;
  const titlePane = hud.phase === "title";
  const resultsPhase = hud.phase === "win" || hud.phase === "fail";
  const titleHome = titlePane && !gear && !splash && !induct && !lab && !learn && !shop && !job && !help;
  const stage = useStage(wide);

  return (
    <main
      data-menu={overlay || styleOpen ? "1" : "0"}
      className="fixed overflow-hidden bg-ink text-fg"
      style={{
        width: stage.w || "100%",
        height: stage.h || "100%",
        left: stage.turn ? stage.vw : stage.x,
        top: stage.turn ? 0 : stage.y,
        transform: stage.turn ? "rotate(90deg)" : undefined,
        transformOrigin: stage.turn ? "top left" : undefined,
      }}
    >
      <canvas
        ref={canvas3dRef}
        dir="ltr"
        hidden={hideBoard}
        inert={hideBoard}
        className="play-canvas absolute inset-0 z-0 h-full w-full"
        style={{
          zIndex: 0,
          touchAction: boardLocked ? "manipulation" : "none",
          pointerEvents: boardLocked ? "none" : "auto",
          opacity: hud.is3d ? 1 : 0,
        }}
      />
      <canvas
        ref={canvasRef}
        dir="ltr"
        hidden={hideBoard}
        inert={hideBoard}
        className="play-canvas absolute inset-0 z-0 h-full w-full"
        style={{
          zIndex: 0,
          touchAction: boardLocked ? "manipulation" : "none",
          pointerEvents: boardLocked ? "none" : "auto",
        }}
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-50 px-1 pt-[max(0.35rem,env(safe-area-inset-top))]">
        <div className={hud.phase === "play" || hud.phase === "pause" ? "hud-stack flex min-w-0 flex-col gap-1" : ""}>
            <div className="flex min-w-0 items-center gap-1.5">
            <div className="pointer-events-auto flex shrink-0">
              <button
                type="button"
                data-game-menu=""
                aria-expanded={menuOpen}
                aria-label={ui.menu}
                className="inline-flex min-h-11 min-w-11 items-center justify-center bg-navy/80 text-fg ring-1 ring-white/30"
                onClick={(ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                  toggleGameMenu();
                }}
              >
                <Menu className="size-5" />
              </button>
            </div>
            {hud.phase === "play" || hud.phase === "pause" ? (
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-full bg-navy/90 px-3 py-1.5 text-sm font-semibold whitespace-nowrap ring-1 ring-line">
              <span className="truncate"><bdi>{courseLabel(access.lang, hud.courseId, hud.courseName)}{hud.is3d ? " 3D" : ""}</bdi></span>
              <span data-hud="timer" className={cn("shrink-0 tabular-nums", arcade && "arcade-digits text-[11px]")}>{fmt(hud.time)}/{fmt(hud.par)}</span>
              <button type="button" data-hud="pause" aria-label={line16(access.lang, "pause")} className="pointer-events-auto inline-flex min-h-11 min-w-11 items-center justify-center gap-1 bg-navy px-2 text-fg ring-1 ring-line" onClick={() => e?.togglePause()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4"><path d="M8 5v14M16 5v14"/></svg>
                <span className="hidden sm:inline">{line16(access.lang, "pause")}</span>
                {keysOn ? <span className="text-[10px]">P</span> : null}
              </button>
              <button type="button" data-hud="restart" aria-label={line16(access.lang, "restart")} className="pointer-events-auto inline-flex min-h-11 min-w-11 items-center justify-center gap-1 bg-navy px-2 text-fg ring-1 ring-line" onClick={() => setAskRestart(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4"><path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/></svg>
                <span className="hidden sm:inline">{line16(access.lang, "restart")}</span>
                {keysOn ? <span className="text-[10px]">R</span> : null}
              </button>
              <span className="shrink-0 text-orange tabular-nums">{hud.gems}/{hud.gemTotal}</span>
              <span className="inline-flex shrink-0 items-center text-orange">
                {Array.from({ length: hud.hearts }, (_, i) => (
                  <Heart key={i} className="size-3.5 fill-orange text-orange" />
                ))}
              </span>
            </div>
            ) : null}
            </div>
            {hud.phase === "play" || hud.phase === "pause" ? (
            <>
            <div className="ml-12 h-1.5 overflow-hidden rounded-full bg-navy/80" aria-hidden="true">
              <div
                className={cn("h-full", hud.time > hud.par ? "bg-gold" : "bg-orange")}
                style={{ width: `${Math.min(100, (hud.time / Math.max(0.1, hud.par)) * 100)}%` }}
              />
            </div>
            <div data-hud="bar" className="ml-12 flex h-4 items-center text-[10px] leading-none">
              {hud.courseId === "tube-run" ? (
                <div className="h-1 flex-1 rounded-full bg-navy-2" aria-hidden="true">
                  <div className="h-full bg-cyan" style={{ width: `${Math.min(100, (hud.tubeZ / Math.max(1, hud.tubeLen)) * 100)}%` }} />
                </div>
              ) : (
                <ArcadeScore gems={hud.gems} time={hud.time} par={hud.par} hearts={hud.hearts} show={arcade && hud.phase === "play"} />
              )}
            </div>
            <p data-hud="rev" className={cn("ml-12 mt-1 text-[9px] font-bold text-gold opacity-75", hud.phase === "pause" && "hidden")}>{CHIP}</p>
            </>
            ) : null}
        </div>
      </header>

      {hud.phase === "play" && hud.intro <= 3 ? (
        <p data-hud="goal" className="pointer-events-none absolute left-1/2 top-[5.6rem] z-20 max-w-[16rem] -translate-x-1/2 rounded-full bg-navy/90 px-3 py-1 text-center text-xs font-semibold text-fg ring-1 ring-cyan">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="mr-1 inline size-4" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>
          <bdi>{hud.portOpen ? line16(access.lang, "portOpen") : hud.time < 3 || hud.intro > 0 ? line16(access.lang, "goal", { n: hud.gemTotal }) : `${hud.gems}/${hud.gemTotal}`}</bdi>
        </p>
      ) : null}
      {askRestart ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-ink/70 p-4">
          <div className="flex w-full max-w-sm flex-col gap-3 bg-ink p-4 ring-1 ring-cyan">
            <p className="text-lg font-bold">{line16(access.lang, "restartAsk")}</p>
            <button type="button" className="min-h-11 bg-orange font-bold text-ink" onClick={() => { setAskRestart(false); e?.retry(); }}>{line16(access.lang, "restart")}</button>
            <button type="button" className="min-h-11 bg-navy font-bold text-fg ring-1 ring-line" onClick={() => setAskRestart(false)}>{line16(access.lang, "keepPlaying")}</button>
          </div>
        </div>
      ) : null}
      <button type="button" data-fs="1" aria-label={line16(access.lang, "fullScreen")} className={cn("absolute bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-30 size-11 bg-navy/40 text-[10px] font-bold text-fg", access.lang === "ar" || access.lang === "fa-AF" ? "left-1" : "right-1")} onClick={() => {
        const root = document.documentElement;
        if (document.fullscreenElement) { void document.exitFullscreen(); localStorage.setItem("kulibert-fullscreen", "0"); setFsOn(false); }
        else { void root.requestFullscreen?.(); localStorage.setItem("kulibert-fullscreen", "1"); setFsOn(true); }
      }}>{line16(access.lang, "fullScreen")}</button>

      <FpsGuard />

      {gear ? (
        <div
          className="settings-sheet absolute bottom-0 left-0 z-50 flex w-[min(22rem,92%)] flex-col bg-ink ring-1 ring-cyan"
          style={{ left: 0, right: "auto", zIndex: 60, top: 0 }}
          onPointerDown={pressControl}
          onClickCapture={swallowExtraClick}
        >
          <div className="flex shrink-0 justify-start p-1">
            <button type="button" className="inline-flex size-11 items-center justify-center bg-navy text-sm font-extrabold text-fg ring-1 ring-line" onClick={() => setGear(false)}>
              {closeLabel(access.lang)}
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AccessPanel
              hud={hud}
              onClose={() => setGear(false)}
              onLearn={() => { setGear(false); setLearn(true); }}
              onHow={() => { setGear(false); setInduct(true); }}
              onLab={() => { setGear(false); setLab(true); }}
              onShop={() => { setGear(false); setShop(true); }}
              onSound={() => e?.toggleMute()}
              onSave={() => { const pack = e?.exportPack(); if (pack) void downloadPack(pack); }}
              onGoal={() => { setGear(false); setPicking(true); }}
              onPick={pickDrive}
              onHeat={() => { setGear(false); setHeat(true); }}
              onCrew={(on) => e?.setCrew(on)}
              onGhost={() => e?.toggleGhost()}
              onTryPin={(pin) => e?.tryFullUnlock(pin) ?? false}
              onLockOff={() => e?.setFullUnlock(false)}
              onJob={() => { setGear(false); setJob(true); }}
              hour={hourLink}
              full={full}
              onFull={(on) => setShell(on)}
            />
          </div>
        </div>
      ) : null}

      {hud.phase === "play" && (hud.intro > 0 || hud.go) ? (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
          <p
            className="text-8xl leading-none font-extrabold tracking-tight text-paper"
            style={{ textShadow: "0 0 24px rgba(214,255,74,0.45), 4px 4px 0 #0b1220" }}
          >
            {hud.intro > 0 ? (arcade ? `${ui.ready} ${hud.intro}` : hud.intro) : arcade ? ui.go : ui.go}
          </p>
        </div>
      ) : null}

      {styleOpen && (hud.phase === "play" || hud.phase === "pause") ? (
        <div
          className="menu-scrim absolute inset-0 bg-ink/55"
          style={{ zIndex: 20, position: "absolute" }}
          onPointerDown={(ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            setStyleOpen(false);
            if (styleHold.current) {
              styleHold.current = false;
              engineRef.current?.resumeIfPaused();
            }
          }}
        />
      ) : null}

      {styleOpen && (hud.phase === "play" || hud.phase === "pause") ? (
        <div
          className="menu-drawer absolute top-[max(3.4rem,calc(env(safe-area-inset-top)+3rem))] bottom-0 left-0 z-40 flex w-[min(22rem,85%)] flex-col gap-1 overflow-y-auto"
          style={{ zIndex: 30, position: "absolute" }}
          onPointerDown={pressControl}
          onClickCapture={swallowExtraClick}
        >
          <button type="button" className="inline-flex size-11 items-center justify-center self-start bg-navy text-sm font-extrabold text-fg ring-1 ring-line" onClick={closeGameMenu}>
            {closeLabel(access.lang)}
          </button>
          <div className="grid grid-cols-4 gap-1">
            <button type="button" className="min-h-12 bg-navy text-sm font-extrabold text-fg ring-1 ring-line" onClick={() => {
              setStyleOpen(false);
              styleHold.current = false;
              engineRef.current?.resumeIfPaused();
            }}>
              {hud.phase === "pause" ? ui.resume : ui.pause}
            </button>
            <button type="button" className="min-h-12 bg-navy text-sm font-extrabold text-fg ring-1 ring-line" onClick={() => e?.toggleMute()}>
              {hud.mute ? ui.sound : ui.mute}
            </button>
            <button
              type="button"
              className="min-h-12 bg-navy text-sm font-extrabold text-fg ring-1 ring-line"
              onClick={() => {
                setStyleOpen(false);
                styleHold.current = false;
                engineRef.current?.retry();
              }}
            >
              {ui.retry}
            </button>
            <button type="button" className="min-h-12 bg-navy text-sm font-extrabold text-fg ring-1 ring-line" onClick={() => {
              quietTitle(350);
              setStyleOpen(false);
              styleHold.current = false;
              setFull(false);
              setWide(false);
              tellWide(false);
              releaseWide();
              engineRef.current?.selectCourse(hud.courseId);
            }}>
              {ui.exit}
            </button>
          </div>
          <button type="button" className="min-h-12 bg-navy text-sm font-extrabold text-fg ring-1 ring-line" onClick={() => {
            quietTitle(350);
            setStyleOpen(false);
            styleHold.current = false;
            setFull(false);
            setWide(false);
            tellWide(false);
            releaseWide();
            engineRef.current?.selectCourse(hud.courseId);
          }}>
            {ui.levelsWord}
          </button>
          {DRIVES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={access.drive === item.id}
              className={cn("min-h-12 px-3 text-left ring-1", access.drive === item.id ? "bg-orange text-ink ring-orange" : "bg-navy text-fg ring-line")}
              onPointerDown={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                pickDrive(item.id);
              }}
            >
              <span className="block text-sm font-extrabold">{ui.drives[item.id].name}</span>
              <span className="block text-xs font-semibold opacity-80">{ui.drives[item.id].line}</span>
            </button>
          ))}
        </div>
      ) : null}

      {hud.phase === "play" && !styleOpen ? (
        <div
          className={cn(
            "play-controls pointer-events-auto absolute z-20 flex flex-col items-center gap-5",
            "right-[max(0.75rem,env(safe-area-inset-right))]",
            access.drive === "hands"
              ? "hands-controls"
              : "bottom-[max(1rem,env(safe-area-inset-bottom))]",
          )}
          dir="ltr"
        >
          {hud.courseId === "tube-run" ? null : courseHasZap(hud.courseId) ? (
            <button
              type="button"
              className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white/10 text-fg ring-2 ring-white/45"
              data-hud="zap"
              onPointerDown={(ev) => { ev.preventDefault(); ev.stopPropagation(); e?.requestZap(); }}
            >
              <span className="text-sm font-extrabold leading-none">{hudWords.zap}</span>
              <span className="key-hint mt-0.5 text-[10px] font-bold opacity-70">E</span>
            </button>
          ) : null}
          {hud.courseId === "tube-run" && !hud.tubeWire ? null : (
          <button
            type="button"
            className={"flex h-[4.6rem] w-[4.6rem] flex-col items-center justify-center rounded-full bg-white/10 text-fg ring-2 ring-cyan/80" + (hud.tubeWire ? " animate-pulse" : "")}
            data-hud="jump"
            onPointerDown={(ev) => { ev.preventDefault(); ev.stopPropagation(); e?.requestJump(); }}
          >
            <span className="text-sm font-extrabold leading-none">{hudWords.jump}</span>
            <span className="key-hint mt-0.5 text-[10px] font-bold opacity-70">Space</span>
          </button>
          )}
        </div>
      ) : null}
      {hud.phase === "play" && !styleOpen ? (
        <p
          ref={hintRef}
          data-hud="hint"
          className="pointer-events-none absolute top-[max(7.6rem,calc(env(safe-area-inset-top)+7.2rem))] left-1/2 z-10 w-max max-w-[min(20rem,60%)] -translate-x-1/2 truncate rounded-full bg-navy/85 px-2 py-0.5 text-center text-[11px] font-semibold text-fg ring-1 ring-line"
          style={{ opacity: 1 }}
        >
          {hintText}
        </p>
      ) : null}

      {overlay && !styleOpen ? (
        <div
          className={cn(
            "menu-layer pointer-events-auto absolute inset-0 z-40 flex touch-manipulation p-2",
            hud.phase === "pause"
              ? "items-center justify-center bg-ink/80"
              : titleHome
                ? "items-center justify-center bg-ink/70"
                : titlePane && !learn && !lab && !shop && !job && !help && !picking && !gear && !splash
                  ? "items-end justify-center bg-ink/55"
                  : "items-stretch justify-start min-[960px]:bg-ink/15",
            hud.phase !== "pause" && !titleHome && !resultsPhase && (hud.is3d ? "bg-ink/20" : "bg-ink/45"),
          )}
          style={{ zIndex: 20, position: "absolute", isolation: "isolate" }}
          onPointerDown={pressControl}
          onClickCapture={(ev) => {
            if (performance.now() < titleQuietUntil) {
              ev.preventDefault();
              ev.stopPropagation();
              return;
            }
            swallowExtraClick(ev);
          }}
        >
          <section
            key={hud.phase + hud.courseId}
            style={{ position: "relative", zIndex: 20 }}
            className={cn(
              "overlay-panel pointer-events-auto relative z-20 flex min-h-0 w-full max-h-full flex-col p-3 ring-1 ring-cyan",
              resultsPhase && "stage-fit h-full max-w-none",
              !resultsPhase && hud.phase === "pause" && "h-auto max-w-md",
              !resultsPhase && titlePane && (induct || splash) && !gear && "mb-3 h-auto max-w-md",
              !resultsPhase && titleHome && "h-auto max-h-full max-w-md",
              !resultsPhase && hud.phase !== "pause" && !(titlePane && (induct || splash) && !gear) && !titleHome && "h-full max-w-[40rem] min-[960px]:w-[min(40rem,46vw)]",
              learn && "max-w-3xl",
            )}
          >
            {hud.phase === "boot" ? (
              <p className="text-muted">{ui.loading}</p>
            ) : null}
            <div className="gear-row flex min-h-12 shrink-0 items-center" dir="ltr">
              <button
                type="button"
                aria-label={ui.settings}
                onClick={() => setGear((v) => !v)}
                className="inline-flex min-h-12 items-center gap-1.5 bg-navy-2 px-3 text-sm font-extrabold text-fg ring-1 ring-line"
              >
                <Settings className="pointer-events-none size-5 shrink-0" aria-hidden="true" />
                <span>{ui.settings}</span>
              </button>
            </div>
            <div className={cn("panel-body relative min-h-0", gear && "flex-1 overflow-hidden", resultsPhase && !gear && "min-[960px]:flex-1 min-[960px]:overflow-hidden")}>
            {heat ? (
              <div
                className="absolute inset-0 z-30 flex flex-col overflow-hidden bg-ink"
                onPointerDown={pressControl}
                onClickCapture={swallowExtraClick}
              >
              <HeatCard
                courseId={hud.courseId}
                courseName={hud.courseName}
                par={hud.par}
                alias={hud.alias}
                code={hud.code}
                yourTime={hud.bests[hud.courseId] ?? null}
                onClose={closeHeat}
              />
              </div>
            ) : null}

            {titlePane && splash ? (
              <Splash
                onPlay={(goal) => {
                  const eng = engineRef.current;
                  if (!eng) return;
                  eng.setGoal(goal);
                  eng.finishInduction();
                  eng.selectCourse("roll-out");
                  setSplash(false);
                  unlockAudio();
                  eng.startPlay();
                }}
              />
            ) : null}

            {titlePane && induct && !splash ? (
              <Induction onDone={() => setInduct(false)} />
            ) : null}

            {(titlePane || hud.phase === "win") && lab && !induct ? (
              <BuildLab
                watts={hud.watts}
                parts={hud.parts}
                passed={hud.passed}
                bests={hud.bests}
                booted={hud.booted}
                onBack={() => {
                  setLab(false);
                  if (hud.phase === "win") e?.parkOnNext();
                }}
                onPass={(id) => e?.passLesson(id)}
                onInstall={(id) => e?.installPart(id) ?? "Lab closed."}
                onBoot={() => {
                  unlockAudio();
                  e?.bootMachine();
                }}
              />
            ) : null}

            {titlePane && learn && !induct ? <FieldGuide code={hud.code} onBack={() => setLearn(false)} /> : null}

            {titlePane && shop && !learn && !lab && !induct && !job && !help ? (
              <ShopDesk
                pack={e?.exportPack() ?? {
                  kind: "bertyrun",
                  v: 1,
                  app: "Berty's Run",
                  chip: CHIP,
                  school: "Solvay MS · TechWorks",
                  saved: "",
                  best: hud.bests,
                  watts: hud.watts,
                  parts: hud.parts,
                  passed: hud.passed,
                  booted: hud.booted,
                  ghostOn: hud.ghost,
                  alias: hud.alias,
                  code: hud.code,
                  successes: [],
                  bot: [],
                  handoff: "file",
                  board: [],
                }}
                onBack={() => setShop(false)}
                onImport={(raw) => e?.importPack(raw) ?? "Lab closed."}
              />
            ) : null}

            {titlePane && (job || help) && !learn && !lab && !induct && !shop ? (
              <JobPacket
                teacher={help}
                stamps={hud.stamps}
                watts={hud.watts}
                onPlay={() => {
                  unlockAudio();
                  e?.applyLaunch("roll-out");
                  e?.startPlay();
                }}
                onLab={() => {
                  setJob(false);
                  setHelp(false);
                  setLab(true);
                }}
                onBack={() => {
                  setJob(false);
                  setHelp(false);
                }}
              />
            ) : null}

            {titlePane && !splash && !learn && !lab && !shop && !job && !help && !induct && (picking || hud.needGoal) ? (
              <GoalCard
                stamps={hud.stamps}
                onPick={(id) => {
                  const fromPlay = Boolean(hud.needGoal) && !picking;
                  engineRef.current?.setGoal(id);
                  setPicking(false);
                  if (fromPlay) engineRef.current?.startPlay();
                }}
              />
            ) : null}

            {titlePane && !learn && !lab && !shop && !job && !help && !induct && hud.needBrief && hud.goal && !picking ? (
              <PartBrief
                key={hud.courseId}
                courseId={hud.courseId}
                goal={hud.goal}
                onPass={(id) => engineRef.current?.ackBrief(id)}
                onBack={() => engineRef.current?.cancelBrief()}
              />
            ) : null}

            {titlePane && !splash && !learn && !lab && !shop && !job && !help && !induct && !(picking || hud.needGoal) && !(hud.needBrief && hud.goal && !picking) ? (
              <TitleCard
                hud={hud}
                onPlay={() => {
                  const eng = engineRef.current;
                  if (!eng) return;
                  const next = nextUnbeaten(hud.bests, hud.fullUnlock);
                  eng.selectCourse(next.id);
                  unlockAudio();
                  eng.startPlay();
                }}
                onCourse={(id) => {
                  const eng = engineRef.current;
                  if (!eng) return;
                  eng.selectCourse(id);
                  unlockAudio();
                  eng.startPlay();
                }}
              />
            ) : null}

            {hud.phase === "pause" ? (
              <div className="mt-24 flex w-full max-w-md flex-col gap-4 bg-ink p-4 ring-1 ring-cyan">
                <h2 className="text-2xl font-bold tracking-tight">{ui.paused}</h2>
                <p className="text-sm font-semibold text-fg">{keysOn ? "Esc · " + line16(access.lang, "pause") : ""}</p>
                <p className="text-2xl font-extrabold tabular-nums">{fmt(hud.time)} / {fmt(hud.par)}</p>
                <p className="text-muted">{ui.clockStopped}</p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => e?.togglePause()}>{ui.resume}</Button>
                  <Button variant="navy" onClick={() => e?.retry()}>{ui.retry}</Button>
                  <Button
                    variant="ghost"
                    onPointerDown={(ev) => {
                      ev.preventDefault();
                      ev.stopPropagation();
                    }}
                    onPointerUp={(ev) => {
                      ev.preventDefault();
                      ev.stopPropagation();
                      quietTitle(350);
                      engineRef.current?.selectCourse(hud.courseId);
                    }}
                    onClick={(ev) => {
                      ev.preventDefault();
                      ev.stopPropagation();
                      if (ev.detail !== 0) return;
                      quietTitle(350);
                      engineRef.current?.selectCourse(hud.courseId);
                    }}
                  >
                    {ui.boards}
                  </Button>
                  <Button variant="ghost" onClick={() => e?.toggleMute()}>{hud.mute ? ui.unmute : ui.mute}</Button>
                </div>
              </div>
            ) : null}

            {hud.phase === "win" && !lab ? (
              <div
                className="contents"
                onClickCapture={(ev) => {
                  if (performance.now() >= resultsQuietUntil.current) return;
                  ev.preventDefault();
                  ev.stopPropagation();
                }}
              >
              <WinBoard
                hud={hud}
                arcade={arcade}
                rig={`${ui.cabs[cabinet.cab]} ${ui.skins[cabinet.skin]} ${ui.stickers[cabinet.sticker].name}`}
                onAgain={() => e?.retry()}
                onNext={() => nextCourse(hud.courseId, hud.bests, hud.fullUnlock, e)}
                onLab={() => setLab(true)}
                onSave={() => {
                  const pack = e?.exportPack();
                  if (!pack) return false;
                  return downloadPack(pack);
                }}
                onCourse={(id) => {
                  const eng = engineRef.current;
                  if (!eng) return;
                  eng.selectCourse(id);
                  unlockAudio();
                  eng.startPlay();
                }}
              />
              </div>
            ) : null}

            {hud.phase === "fail" ? (
              <div className="flex flex-col gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">{ui.outHearts}</p>
                <h2 className="text-3xl font-extrabold tracking-tight">{arcade ? ui.gameOver : ui.tryAgain}</h2>
                {arcade ? <ContinueClock onContinue={() => e?.retry()} /> : null}
                <p className="text-lg font-extrabold tabular-nums">{hud.gems}/{hud.gemTotal} {ui.bits} · {fmt(hud.time)}</p>
                <p className="text-muted">
                  {hud.is3d ? ui.early3d : ui.holes}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => e?.retry()}>{ui.retry}</Button>
                  <Button variant="ghost" onClick={() => e?.selectCourse(hud.courseId)}>
                    {ui.levelsWord}
                  </Button>
                </div>
              </div>
            ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

const PC_PARTS = [
  { id: "mobo", name: "Board" },
  { id: "psu", name: "Power" },
  { id: "cpu", name: "CPU" },
  { id: "ram", name: "RAM" },
  { id: "os", name: "OS" },
];

function PcStrip({ parts, onOpen }: { parts: string[]; onOpen?: () => void }) {
  const next = PC_PARTS.find((p) => !parts.includes(p.id));
  const boxes = PC_PARTS.map((p) => {
    const inPc = parts.includes(p.id);
    const isNext = next?.id === p.id;
    return (
      <div
        key={p.id}
        className={cn(
          "flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-lg px-1 text-center text-[10px] font-bold uppercase leading-tight",
          inPc ? "bg-orange text-ink" : isNext ? "bg-navy-2 text-fg ring-2 ring-orange" : "bg-navy-2 text-muted ring-1 ring-line",
        )}
      >
        {p.name}
      </div>
    );
  });
  if (!onOpen) return <div className="flex gap-1">{boxes}</div>;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Your PC. Opens Build Lab."
      className="flex w-full gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
    >
      {boxes}
    </button>
  );
}

function TwoCol({ left, right, levelsFirst }: { left: ReactNode; right: ReactNode; levelsFirst?: boolean }) {
  return (
    <div className="grid grid-cols-1 items-start gap-2 min-[720px]:grid-cols-2">
      <div className={cn("flex min-w-0 flex-col gap-2", levelsFirst && "order-2 min-[720px]:order-1")}>{left}</div>
      <div className={cn("min-h-0 min-w-0", levelsFirst && "order-1 min-[720px]:order-2")}>{right}</div>
    </div>
  );
}

function useStage(wide: boolean) {
  const [stage, setStage] = useState({ w: 0, h: 0, x: 0, y: 0, turn: false, vw: 0 });
  useEffect(() => {
    let frame = 0;
    const read = () => {
      const vv = window.visualViewport;
      const w = vv?.width ?? document.documentElement.clientWidth;
      const h = vv?.height ?? document.documentElement.clientHeight;
      const x = vv?.offsetLeft ?? 0;
      const y = vv?.offsetTop ?? 0;
      const portrait = h > w + 80;
      document.documentElement.dataset.sideways = wide && portrait && w <= 500 ? "1" : "";
      if (wide && portrait) {
        document.documentElement.dataset.turn = "1";
        setStage({ w: Math.max(280, Math.round(h)), h: Math.max(280, Math.round(w)), x: 0, y: 0, turn: true, vw: Math.round(w) });
        return;
      }
      document.documentElement.dataset.turn = "0";
      setStage({ w: Math.max(280, Math.round(w)), h: Math.max(280, Math.round(h)), x: Math.round(x), y: Math.round(y), turn: false, vw: 0 });
    };
    const on = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", on);
    vv?.addEventListener("scroll", on);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", on);
      window.removeEventListener("orientationchange", on);
      vv?.removeEventListener("resize", on);
      vv?.removeEventListener("scroll", on);
      delete document.documentElement.dataset.sideways;
    };
  }, [wide]);
  return stage;
}

let titleQuietUntil = 0;

function quietTitle(ms = 350) {
  titleQuietUntil = Math.max(titleQuietUntil, performance.now() + ms);
}

function guardedPress(run: () => void) {
  return {
    onPointerDown: (ev: PointerEvent<HTMLButtonElement>) => {
      ev.preventDefault();
      ev.stopPropagation();
    },
    onPointerUp: (ev: PointerEvent<HTMLButtonElement>) => {
      ev.preventDefault();
      ev.stopPropagation();
      quietTitle(350);
      run();
    },
    onClick: (ev: MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (ev.detail === 0) {
        quietTitle(350);
        run();
      }
    },
  };
}

function swallowIfQuiet(ev: { preventDefault: () => void; stopPropagation: () => void }) {
  if (performance.now() >= titleQuietUntil) return;
  ev.preventDefault();
  ev.stopPropagation();
}

let swallowClicksUntil = 0;
let swallowInstalled = false;

function armClickSwallow() {
  swallowClicksUntil = performance.now() + 400;
  if (swallowInstalled || typeof document === "undefined") return;
  swallowInstalled = true;
  document.addEventListener("click", (ev) => {
    if (performance.now() >= swallowClicksUntil) return;
    if (!ev.isTrusted) return;
    ev.preventDefault();
    ev.stopPropagation();
  }, true);
}

function pressControl(ev: PointerEvent<HTMLElement>) {
  if (ev.pointerType !== "touch") return;
  const el = (ev.target as HTMLElement).closest("button, a");
  if (!(el instanceof HTMLElement)) return;
  if (!ev.currentTarget.contains(el)) return;
  if ((el as HTMLButtonElement).disabled) return;
  const arm = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, t: performance.now(), el, moved: false };
  const move = (e: PointerEvent) => {
    if (e.pointerId !== arm.id) return;
    const dx = e.clientX - arm.x;
    const dy = e.clientY - arm.y;
    if (dx * dx + dy * dy >= 100) arm.moved = true;
  };
  const end = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", cancel);
  };
  const up = (e: PointerEvent) => {
    if (e.pointerId !== arm.id) return;
    end();
    const dx = e.clientX - arm.x;
    const dy = e.clientY - arm.y;
    if (arm.moved || dx * dx + dy * dy >= 100) return;
    armClickSwallow();
    if (performance.now() - arm.t >= 600) return;
    if (!arm.el.isConnected) return;
    arm.el.click();
  };
  const cancel = (e: PointerEvent) => {
    if (e.pointerId !== arm.id) return;
    arm.moved = true;
    end();
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", cancel);
}

function swallowExtraClick(ev: MouseEvent<HTMLElement>) {
  if (performance.now() >= swallowClicksUntil) return;
  if (ev.nativeEvent.isTrusted) {
    ev.preventDefault();
    ev.stopPropagation();
  }
}

function useMinWidth(px: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`);
    const go = () => setOn(mq.matches);
    go();
    mq.addEventListener("change", go);
    return () => mq.removeEventListener("change", go);
  }, [px]);
  return on;
}

function useShortLandscape() {
  const query = "(orientation: landscape) and (max-height: 500px)";
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const go = () => setOn(mq.matches);
    go();
    mq.addEventListener("change", go);
    return () => mq.removeEventListener("change", go);
  }, []);
  return on;
}

function useCoarse() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const go = () => setOn(mq.matches);
    go();
    mq.addEventListener("change", go);
    return () => mq.removeEventListener("change", go);
  }, []);
  return on;
}

function usePhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 719px)");
    const go = () => setPhone(mq.matches);
    go();
    mq.addEventListener("change", go);
    return () => mq.removeEventListener("change", go);
  }, []);
  return phone;
}

function Fold({
  title,
  hint,
  startOpen,
  children,
}: {
  title: string;
  hint?: string;
  startOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(startOpen);
  useEffect(() => {
    setOpen(startOpen);
  }, [startOpen]);
  const words = hudCopy(useAccess().lang);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl bg-navy-2 px-3 text-left ring-1 ring-line focus-visible:ring-2 focus-visible:ring-cyan [&_*]:pointer-events-none"
      >
        <span className="text-sm font-extrabold">{title}</span>
        <span className="text-xs font-bold text-muted">{hint ? `${hint} · ` : ""}{open ? words.hide : words.show}</span>
      </button>
      {open ? children : null}
    </div>
  );
}
function SequenceRail({
  hud,
  onCourse,
  flash,
  part = "all",
}: {
  hud: HudSnap;
  onCourse?: (id: CourseId) => void;
  flash?: string;
  part?: "all" | "practice" | "campaign";
}) {
  const phone = usePhone();
  const lang = useAccess().lang;
  const words = hudCopy(lang);
  const groups = [
    { title: words.levels2d, mode: "2d" as const },
    { title: words.levels3d, mode: "3d" as const },
  ];
  const practice = (
    <div className="grid grid-cols-2 gap-1">
      {COURSES.filter((c) => c.arcade).map((c) => (
        <button
          key={c.id}
          type="button"
          className={cn(
            "min-h-11 px-2 text-left text-sm font-bold ring-1 [&_*]:pointer-events-none",
            hud.courseId === c.id ? "bg-orange text-ink ring-orange" : "bg-navy-2 text-fg ring-line",
          )}
          onClick={() => onCourse?.(c.id)}
        >
          {courseLabel(lang, c.id, c.name)}
          <span className="mt-0.5 block text-xs font-semibold opacity-80">{c.id === "tube-run" ? words.turnTube : words.learnControls}</span>
        </button>
      ))}
    </div>
  );
  const campaign = (
    <>
      {groups.map((group) => {
        const list = COURSES.filter((c) => courseMode(c) === group.mode && !c.arcade);
        const current = list.find((c) => c.id === hud.courseId);
        return (
        <Fold key={group.mode} title={group.title} hint={current ? courseLabel(lang, current.id, current.name) : `${list.length}`} startOpen={group.mode === "2d" && !phone}>
          <ol className="grid grid-cols-2 gap-1">
            {list.map((c, n) => {
              const slot = slotPart(c.id);
              const cleared = hud.bests[c.id] != null;
              const on = hud.courseId === c.id;
              const open = hud.fullUnlock || isUnlocked(c, hud.bests);
              const prev = previousCourse(c);
              const cls = cn(
                "flex min-h-11 w-full flex-col items-start justify-center gap-0 px-2 py-1 text-left ring-1 [&_*]:pointer-events-none",
                on ? "bg-orange text-ink ring-orange" : cleared ? "bg-navy-2 text-fg ring-orange" : "bg-navy-2 text-fg ring-line",
                !open && "opacity-50",
                flash === c.id && "part-snap",
              );
              const label = (
                <>
                  <span className="text-sm font-bold leading-tight">{n + 1}. {courseLabel(lang, c.id, c.name)}</span>
                  <span className={cn("text-xs font-semibold", on ? "text-ink" : "text-muted")}>
                    {!open && prev
                      ? fillHud(words.beat, { name: courseLabel(lang, prev.id, prev.name) })
                      : slot
                        ? (cleared ? fillHud(words.gotIt, { part: partLabel(lang, slot.id, slot.name) }) : partLabel(lang, slot.id, slot.name))
                        : words.practice}
                  </span>
                </>
              );
              if (!onCourse) {
                return (
                  <li key={c.id} className={cls}>
                    {label}
                  </li>
                );
              }
              return (
                <li key={c.id} className="min-w-0">
                  <button type="button" disabled={!open} className={cls} onClick={() => open && onCourse(c.id)}>
                    {label}
                  </button>
                </li>
              );
            })}
          </ol>
        </Fold>
        );
      })}
    </>
  );
  if (part === "practice") return practice;
  if (part === "campaign") return <div className="flex flex-col gap-1">{campaign}</div>;
  return (
    <div className="flex flex-col gap-1">
      {practice}
      {campaign}
    </div>
  );
}

const LIGHTS = [
  { id: "lime", name: "Lime", color: "#c8f542" },
  { id: "cyan", name: "Cyan", color: "#3ee0ff" },
  { id: "gold", name: "Gold", color: "#f5c542" },
  { id: "magenta", name: "Magenta", color: "#ff4fd8" },
  { id: "violet", name: "Violet", color: "#9b7bff" },
  { id: "orange", name: "Orange", color: "#ff8a2a" },
  { id: "white", name: "White", color: "#f4fff6" },
  { id: "rgb", name: "RGB", color: "" },
] as const;
type LightId = (typeof LIGHTS)[number]["id"];
const SHELLS = [
  { id: "black", name: "Black", color: "#141816" },
  { id: "white", name: "White", color: "#e7f3ea" },
  { id: "graphite", name: "Graphite", color: "#3a4450" },
] as const;
type ShellId = (typeof SHELLS)[number]["id"];
const LIGHT_KEY = "br-rgb-v1";
const SHELL_KEY = "br-shell-v1";

function readLight(code: string): LightId {
  try {
    const all = JSON.parse(localStorage.getItem(LIGHT_KEY) || "{}") as Record<string, string>;
    const v = all[code || "guest"];
    if (LIGHTS.some((s) => s.id === v)) return v as LightId;
  } catch {
    /* private mode */
  }
  return "rgb";
}

function readShell(code: string): ShellId {
  try {
    const all = JSON.parse(localStorage.getItem(SHELL_KEY) || "{}") as Record<string, string>;
    const v = all[code || "guest"];
    if (SHELLS.some((s) => s.id === v)) return v as ShellId;
  } catch {
    /* private mode */
  }
  return "black";
}

function writeLight(code: string, id: LightId) {
  try {
    const all = JSON.parse(localStorage.getItem(LIGHT_KEY) || "{}") as Record<string, string>;
    all[code || "guest"] = id;
    localStorage.setItem(LIGHT_KEY, JSON.stringify(all));
  } catch {
    /* private mode */
  }
  document.documentElement.dataset.lights = id === "cyan" || id === "gold" || id === "lime" ? id : "lime";
  window.dispatchEvent(new Event("br-rgb"));
}

function writeShell(code: string, id: ShellId) {
  try {
    const all = JSON.parse(localStorage.getItem(SHELL_KEY) || "{}") as Record<string, string>;
    all[code || "guest"] = id;
    localStorage.setItem(SHELL_KEY, JSON.stringify(all));
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event("br-rgb"));
}

function Swatches<T extends string>({
  label,
  value,
  items,
  onPick,
}: {
  label: string;
  value: T;
  items: readonly { id: T; name: string; color: string }[];
  onPick: (id: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gold">{label}</p>
      <div className="grid grid-cols-4 gap-1" role="group" aria-label={label}>
        {items.map((swatch) => (
          <button
            key={swatch.id}
            type="button"
            aria-pressed={value === swatch.id}
            onClick={() => onPick(swatch.id)}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 bg-navy-2 px-1 text-[10px] font-bold text-fg ring-1 ring-line",
              value === swatch.id && "ring-2 ring-fg",
            )}
          >
            <span
              className={cn("h-3 w-8", swatch.id === "rgb" && "pc-swatch-rgb")}
              style={swatch.color ? { background: swatch.color } : undefined}
            />
            {swatch.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function CaseFan({ cx, cy, hot }: { cx: number; cy: number; hot: boolean }) {
  return (
    <g className="pc-fan" opacity={hot ? 1 : 0.45}>
      <circle cx={cx} cy={cy} r="18" fill="#050605" stroke="currentColor" strokeWidth="3" />
      <circle cx={cx} cy={cy} r="4" fill="currentColor" />
      <path
        d={`M${cx} ${cy - 14}v10M${cx - 12} ${cy + 7}l8-5M${cx + 12} ${cy + 7}l-8-5`}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </g>
  );
}

function PcCase({ hud }: { hud: HudSnap }) {
  const slots: { id: string; label: string }[] = [
    { id: "mobo", label: "Board" },
    { id: "psu", label: "Power" },
    { id: "cpu", label: "CPU" },
    { id: "ram", label: "RAM" },
    { id: "fan", label: "Cooler" },
    { id: "ssd", label: "SSD" },
    { id: "gpu", label: "GPU" },
    { id: "nic", label: "Net" },
    { id: "os", label: "OS" },
  ];
  const earned = new Set(
    COURSES.map((c) => (hud.bests[c.id] != null ? BOARD_SLOT[c.id] : undefined)).filter((id): id is string => !!id),
  );
  const installed = new Set(hud.parts);
  if (hud.booted) installed.add("os");
  const lit = (id: string) => installed.has(id) || earned.has(id);
  const mark = (id: string) => (installed.has(id) ? "in" : earned.has(id) ? "got it" : "not yet");
  const current = slotPart(hud.courseId)?.id ?? "";
  const [light, setLight] = useState<LightId>(readLight(hud.code));
  const [shell, setShell] = useState<ShellId>(readShell(hud.code));
  useEffect(() => {
    const sync = () => {
      setLight(readLight(hud.code));
      setShell(readShell(hud.code));
    };
    sync();
    window.addEventListener("br-rgb", sync);
    return () => window.removeEventListener("br-rgb", sync);
  }, [hud.code]);
  const shellFill = SHELLS.find((s) => s.id === shell)?.color ?? "#141816";
  const on = "currentColor";
  const dim = "rgba(255,255,255,0.16)";
  const fill = (id: string) => (lit(id) ? on : dim);
  return (
    <div className="flex flex-col gap-2 bg-ink p-3 ring-1 ring-line">
        <Swatches
          label="Lights"
          value={light}
          items={LIGHTS}
          onPick={(id) => {
            setLight(id);
            writeLight(hud.code, id);
          }}
        />
        <Swatches
          label="Shell"
          value={shell}
          items={SHELLS}
          onPick={(id) => {
            setShell(id);
            writeShell(hud.code, id);
          }}
        />
        <div
          className="pc-tower mx-auto w-full max-w-[240px]"
          data-rgb={light}
          style={light === "rgb" ? undefined : { color: LIGHTS.find((s) => s.id === light)?.color }}
        >
          <svg viewBox="0 0 180 248" className="h-auto w-full" role="img" aria-label="Your computer case">
            <rect x="8" y="6" width="164" height="232" fill={shellFill} stroke="currentColor" strokeWidth="4" />
            <rect x="20" y="18" width="112" height="186" fill="#070908" stroke="currentColor" strokeWidth="2" />
            <rect x="28" y="28" width="96" height="150" fill={lit("mobo") ? "#101612" : "#070908"} stroke={fill("mobo")} strokeWidth="1.5" />
            <rect className="pc-strip" x="140" y="18" width="18" height="186" fill="currentColor" />
            <CaseFan cx={48} cy={58} hot />
            <CaseFan cx={48} cy={112} hot />
            <rect x="74" y="36" width="8" height="34" fill={fill("ram")} />
            <rect x="86" y="36" width="8" height="34" fill={fill("ram")} />
            <rect x="98" y="36" width="8" height="34" fill={fill("ram")} />
            <rect x="74" y="82" width="34" height="26" fill={fill("cpu")} className={current === "cpu" ? "part-snap" : undefined} />
            <rect x="28" y="146" width="96" height="20" fill={fill("gpu")} className={current === "gpu" ? "part-snap" : undefined} />
            <circle cx="44" cy="156" r="5" fill="#050605" stroke="currentColor" />
            <circle cx="60" cy="156" r="5" fill="#050605" stroke="currentColor" />
            <rect x="28" y="172" width="26" height="12" fill={fill("ssd")} />
            <rect x="60" y="174" width="16" height="10" fill={fill("nic")} />
            <rect x="20" y="210" width="112" height="16" fill={fill("psu")} />
            <circle cx="156" cy="222" r="5" fill={lit("os") || hud.booted ? on : dim} className={lit("os") || hud.booted ? "pc-led" : undefined} />
          </svg>
        </div>
        <div className="flex flex-wrap gap-1" role="list" aria-label="PC parts">
        {slots.map((slot) => (
          <span
            key={slot.id}
            role="listitem"
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-bold ring-1",
              lit(slot.id) ? "bg-orange text-ink ring-orange" : "text-muted ring-line",
              slot.id === current && "part-snap",
            )}
          >
            {slot.label} {mark(slot.id)}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeatCard({
  courseId,
  courseName,
  par,
  alias,
  code,
  yourTime,
  onClose,
}: {
  courseId: string;
  courseName: string;
  par: number;
  alias: string;
  code: string;
  yourTime: number | null;
  onClose: () => void;
}) {
  const [seed, setSeed] = useState(1);
  const [shown, setShown] = useState(0);
  const field = buildHeat(courseId, par, { alias, code, time: yourTime }, seed);
  useEffect(() => {
    setShown(0);
    const id = window.setInterval(() => {
      setShown((n) => (n >= field.length ? n : n + 1));
    }, 380);
    return () => window.clearInterval(id);
  }, [seed, field.length]);
  const call = [...field].sort((a, b) => b.time - a.time).slice(0, shown);
  const standings = [...call].sort((a, b) => a.time - b.time);
  const done = shown >= field.length;
  const you = field.find((row) => row.you);
  const winner = field[0];
  const rowH = 44;
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-orange">Esports heat · {courseName}</p>
          <h2 className="text-2xl leading-none font-extrabold tracking-tight">
            {done ? `${winner.alias} takes it` : "Calling the field"}
          </h2>
          <ol className="flex flex-col" style={{ minHeight: field.length * rowH }}>
            {standings.map((row) => (
              <li
                key={row.alias + row.place}
                className={cn(
                  "flex h-11 min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-sm font-extrabold",
                  row.you ? "bg-orange text-ink" : "bg-navy-2 text-fg ring-1 ring-line",
                )}
              >
                <span>
                  {placeLabel(row.place)} {heatName(row.alias, row.demo)}
                </span>
                <span className="tabular-nums">{fmt(row.time)}</span>
              </li>
            ))}
          </ol>
          {done ? (
            <p className="text-sm font-semibold text-fg">
              {you
                ? you.place === 1
                  ? "That time is yours."
                  : `You are ${placeLabel(you.place)}.`
                : "No time from you yet. Clear the board and your name takes a seat."}
            </p>
          ) : null}
          <p className="text-xs font-semibold text-muted">Real times come from this computer. Demo names fill the empty seats.</p>
        </div>
      </div>
      <div className="sticky bottom-0 z-10 flex shrink-0 flex-wrap gap-2 bg-ink px-3 py-2">
        <Button {...guardedPress(() => setSeed((n) => n + 1))}>Run again</Button>
        <Button
          variant="navy"
          onPointerDown={(ev) => {
            ev.preventDefault();
            ev.stopPropagation();
          }}
          onPointerUp={(ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            onClose();
          }}
          onClick={(ev) => {
            ev.preventDefault();
            ev.stopPropagation();
          }}
        >
          Close
        </Button>
      </div>
    </>
  );
}

function RoomBoard({ courseId, code }: { courseId: string; code: string }) {
  const kids = studentsOnBoard();
  return (
    <div className="max-h-80 overflow-y-auto rounded-2xl bg-navy-2 px-3 py-3 ring-1 ring-line">
      <p className="text-xs font-bold uppercase tracking-wide text-orange">Stats</p>
      {kids.length ? (
        <div className="mt-2 flex flex-col gap-2">
          {kids.map((kid) => {
            const cleared = kid.levels.filter((level) => level.time != null).length;
            return (
              <section
                key={kid.code}
                className={cn("rounded-xl px-2 py-2", kid.code === code ? "bg-orange text-ink" : "bg-navy text-fg ring-1 ring-line")}
              >
                <p className="text-sm font-extrabold">
                  {kid.alias} · {cleared} of {kid.levels.length} levels · {kid.stars} {kid.stars === 1 ? "star" : "stars"}
                </p>
                <ul className="mt-1">
                  {kid.levels.map((level) => (
                    <li key={level.id} className="flex min-h-8 items-baseline justify-between gap-2 text-xs">
                      <span className={cn("font-semibold", level.id === courseId && "underline")}>{level.name}</span>
                      <span className="shrink-0 tabular-nums">
                        {level.time == null
                          ? "no time"
                          : `${fmt(level.time)} · ${level.stars} ${level.stars === 1 ? "star" : "stars"} · ${level.time <= level.par ? "under par" : "over par"}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted">Clear a level. Best time and stars stay on the short name.</p>
      )}
    </div>
  );
}

function WinBoard({
  hud,
  arcade,
  rig,
  onAgain,
  onNext,
  onLab,
  onSave,
  onCourse,
}: {
  hud: HudSnap;
  arcade: boolean;
  rig: string;
  onAgain: () => void;
  onNext: () => void;
  onLab: () => void;
  onSave: () => boolean | void | Promise<boolean | void>;
  onCourse: (id: CourseId) => void;
}) {
  const desk = useMinWidth(960);
  const shortLand = useShortLandscape();
  const access = useAccess();
  const ui = face(access.lang);
  const [note, setNote] = useState("");
  const part = slotPart(hud.courseId);
  const ahead = nextBoard(hud.courseId, hud.bests, hud.fullUnlock);
  const place = hud.code ? boardFor(hud.courseId).findIndex((row) => row.code === hud.code) + 1 : 0;
  const boardName = courseLabel(access.lang, hud.courseId, hud.courseName);
  const cheer = cheerLine(access.lang, place, boardName);
  const partName = part ? partLabel(access.lang, part.id, part.name) : boardName;
  const stage = (
    <div className="win-stage-inner flex w-full flex-col items-center justify-center gap-2 min-[960px]:h-full">
      <p className="win-compact hidden text-sm font-extrabold leading-snug">
        {ui.stageClear} · {partName} · +{hud.earned} {ui.watts} · <bdi>{line16(access.lang, "bestScore", { score: hud.bestScore ?? hud.score })}</bdi>
      </p>
      {hud.botGift ? <p className="win-gift-line hidden truncate text-sm font-extrabold leading-tight">{hud.botGift}</p> : null}
      {arcade ? (
        <StageClear time={hud.time} par={hud.par} stars={hud.stars} bits={hud.gems} rig={rig} title={ui.stageClear} high={ui.newHigh} />
      ) : (
        <p className="win-kicker text-xs font-bold uppercase tracking-[0.18em] text-orange">{ui.stageClear}</p>
      )}
      <div className="reward-card w-full max-w-lg rounded-2xl bg-orange px-4 py-4 text-ink">
        <p className="text-xs font-bold uppercase tracking-wide">{ui.yourReward}</p>
        <h2 className="part-snap text-4xl leading-none font-extrabold tracking-tight">{partName}</h2>
        <p className="mt-2 text-sm font-bold">
          {part ? ui.youWon : ui.practiceClear}
        </p>
        <p className="mt-2 text-2xl font-extrabold">+{hud.earned} {ui.watts}</p>
      </div>
      {hud.botGift ? (
        <div className="win-gift-card w-full max-w-lg rounded-2xl bg-cyan px-4 py-3 text-ink">
          <p className="text-xs font-bold uppercase tracking-wide">{ui.newOn}</p>
          <p className="text-2xl font-extrabold leading-tight">{hud.botGift}</p>
          <p className="text-sm font-semibold">{hud.botLine}</p>
        </div>
      ) : null}
    </div>
  );
  return (
    <div className="win-board flex flex-col gap-2 min-[960px]:grid min-[960px]:h-full min-[960px]:min-h-0 min-[960px]:grid-cols-[minmax(22rem,27rem)_1fr] min-[960px]:items-stretch min-[960px]:gap-3">
      <div className="win-col">
        <div className="win-stage order-1 min-w-0 min-[960px]:order-2">{stage}</div>
        <div className="win-rest">
          <div className="berty-card rounded-2xl bg-navy px-3 py-2 ring-2 ring-orange">
            <p className="text-xs font-bold uppercase tracking-wide text-orange"><bdi>Berty</bdi></p>
            <p className="text-base font-extrabold leading-snug">{cheer}</p>
            {place > 0 ? (
              <p className="text-sm font-semibold text-cyan">
                {ui.onComputer.replace("{place}", placeWord(access.lang, place))} · <bdi>{hud.alias}</bdi>
              </p>
            ) : null}
            <p className="text-2xl leading-none font-extrabold tabular-nums" dir="ltr">{fmt(hud.time)}</p>
            <p className="text-sm font-extrabold">
              {hud.gems}/{hud.gemTotal} {ui.bits} · {hud.stars} {hud.stars === 1 ? ui.star : ui.stars} · {hud.time <= hud.par ? ui.underPar : ui.overPar} {fmt(hud.par)}
            </p>
          </div>
          <p className="clear-line text-sm font-semibold text-fg">{rewardLine(access.lang, hud.earned, hud.watts, hud.parts, hud.booted, hud.bests)}</p>
          <div className="win-more">
            <SequenceRail hud={hud} onCourse={onCourse} flash={hud.courseId} part="practice" />
            <Fold title={ui.levelsWord} startOpen={!desk && !shortLand}>
              <SequenceRail hud={hud} onCourse={onCourse} flash={hud.courseId} part="campaign" />
            </Fold>
          </div>
        </div>
      </div>
      <div className="win-actions flex flex-col gap-1">
        <Button onClick={onNext}>{ahead ? `${ui.nextWord}: ${courseLabel(access.lang, ahead.id, ahead.name)}` : ui.backBoards}</Button>
        <div className="win-action-pair flex flex-col gap-1">
          {part && !hud.parts.includes(part.id) ? (
            <Button variant="navy" onClick={onLab}>
              <CircuitBoard className="pointer-events-none size-4" />
              {(hud.passed.includes(part.lesson) && hud.watts >= part.cost ? ui.installPart : ui.learnPart).replace("{part}", partName)}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onAgain}>
            {ui.runAgain}
          </Button>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            void Promise.resolve(onSave()).then((ok) => {
              setNote(ok === false ? ui.saveNo : ui.saveOk);
            });
          }}
        >
          {ui.save}
        </Button>
        {note ? <p className="text-sm font-semibold text-fg">{note}</p> : null}
      </div>
    </div>
  );
}

function stayInShell(event: { preventDefault: () => void }) {
  if (window.parent === window) return;
  event.preventDefault();
  window.parent.postMessage({ type: "tech-room-home" }, window.location.origin);
}

function nextCourse(id: CourseId, bests: Record<string, number>, full: boolean, e: Engine | null) {
  const n = nextBoard(id, bests, full);
  if (n) {
    e?.selectCourse(n.id);
    e?.startPlay();
    return;
  }
  e?.selectCourse(id);
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-xl bg-navy/85 text-fg ring-1 ring-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
    >
      {children}
    </button>
  );
}

function BertyFace() {
  return (
    <img
      src={`${import.meta.env.BASE_URL}art/title.jpg?v=185`}
      alt="Berty"
      className="size-14 shrink-0 object-cover object-[92%_center] ring-1 ring-crate"
    />
  );
}

function GearArt({ id, on }: { id: string; on: boolean }) {
  const ink = on ? "currentColor" : "rgba(232,255,228,0.35)";
  return (
    <svg viewBox="0 0 48 48" className="size-8" aria-hidden="true">
      {id === "glow" ? (
        <>
          <circle cx="24" cy="24" r="8" fill={on ? "currentColor" : "none"} stroke={ink} strokeWidth="2" />
          <path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4" stroke={ink} strokeWidth="2" />
        </>
      ) : null}
      {id === "heart" ? (
        <path d="M24 40 8 24a8 8 0 0 1 12-10l4 4 4-4a8 8 0 0 1 12 10Z" fill={on ? "currentColor" : "none"} stroke={ink} strokeWidth="2" />
      ) : null}
      {id === "pull" ? (
        <>
          <circle cx="24" cy="24" r="5" fill={ink} />
          <circle cx="8" cy="10" r="3" fill={ink} />
          <circle cx="40" cy="12" r="3" fill={ink} />
          <circle cx="38" cy="38" r="3" fill={ink} />
          <path d="M12 13l8 8M36 16l-7 5M34 34l-6-6" stroke={ink} strokeWidth="2" />
        </>
      ) : null}
      {id === "boost" ? (
        <path d="M8 14h14l8-6v32l-8-6H8Z M30 18h8M30 24h12M30 30h8" fill={on ? "currentColor" : "none"} stroke={ink} strokeWidth="2" />
      ) : null}
      {id === "trail" ? (
        <>
          <circle cx="36" cy="24" r="7" fill={on ? "currentColor" : "none"} stroke={ink} strokeWidth="2" />
          <circle cx="22" cy="24" r="4" fill={ink} opacity="0.7" />
          <circle cx="12" cy="24" r="3" fill={ink} opacity="0.4" />
        </>
      ) : null}
      {id === "crown" ? (
        <>
          <circle cx="24" cy="24" r="10" fill="none" stroke={ink} strokeWidth="3" />
          <path d="M14 30l2-12 8 6 8-6 2 12Z" fill={on ? "currentColor" : "none"} stroke={ink} strokeWidth="2" />
        </>
      ) : null}
    </svg>
  );
}

function BotTrack({ stamps }: { stamps: number }) {
  const ui = face(useAccess().lang);
  const next = nextBot(stamps);
  const left = next ? next.at - stamps : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <BertyFace />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold"><bdi>Berty</bdi></p>
          <p className="text-sm font-bold text-fg">
            {next ? ui.moreWins.replace("{n}", String(left)).replace("{unit}", left === 1 ? ui.win : ui.wins) : ui.allPowers}
          </p>
          <p className="text-sm text-fg">{next ? ui.turnsOn.replace("{name}", next.name) : ui.zapStill}</p>
        </div>
      </div>
      <ul className="grid grid-cols-6 gap-1" aria-label={ui.powers}>
        {BOT_FEATURES.map((f) => {
          const on = stamps >= f.at;
          const up = next?.id === f.id;
          return (
            <li
              key={f.id}
              className={cn(
                "flex flex-col items-center px-0.5 py-1 text-center ring-1",
                on && "bg-orange text-ink ring-orange",
                up && !on && "text-cyan ring-cyan",
                !on && !up && "text-muted ring-line",
              )}
            >
              <GearArt id={f.id} on={on || up} />
              <span className="text-[10px] font-bold leading-none">{on ? ui.yours : up ? ui.soon : f.at}</span>
            </li>
          );
        })}
      </ul>
      <Fold title={ui.whatTheyDo} hint={next ? next.name : ui.allOn} startOpen={false}>
        <ul className="flex flex-col gap-1">
          {BOT_FEATURES.map((f) => (
            <li key={f.id} className="text-sm">
              <span className="font-bold">{f.name}. </span>
              {f.line} {f.at} {f.at === 1 ? ui.win : ui.wins}.
            </li>
          ))}
        </ul>
      </Fold>
    </div>
  );
}

function GoalCard({ stamps, onPick }: { stamps: number; onPick: (id: PcGoal) => void }) {
  const ui = face(useAccess().lang);
  const goals = [
    { id: "gaming" as const, name: ui.goalGaming, line: ui.goalGamingLine },
    { id: "creator" as const, name: ui.goalCreator, line: ui.goalCreatorLine },
    { id: "laptop" as const, name: ui.goalLaptop, line: ui.goalLaptopLine },
  ];
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">{ui.goalKicker}</p>
      <h2 className="text-3xl font-extrabold tracking-tight">{ui.goalTitle}</h2>
      <BotTrack stamps={stamps} />
      <p className="text-base leading-snug">{ui.goalLine}</p>
      {goals.map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => onPick(g.id)}
          className="min-h-14 rounded-2xl bg-navy-2 px-4 py-3 text-start ring-1 ring-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
        >
          <span className="block text-base font-extrabold">{g.name}</span>
          <span className="block text-sm text-muted">{g.line}</span>
        </button>
      ))}
    </div>
  );
}

function PartBrief({
  courseId,
  goal,
  onPass,
  onBack,
}: {
  courseId: string;
  goal: PcGoal;
  onPass: (lessonId: LessonId | null) => void;
  onBack: () => void;
}) {
  const brief = briefFor(courseId, goal);
  const access = useAccess();
  const ui = face(access.lang);
  const pack = packFor(brief.lessonId ?? courseId, access.lang) ?? packFor(courseId, access.lang) ?? (brief.lessonId ? null : packFor("boot", access.lang));
  const title = pack?.title ?? brief.title;
  const line = pack?.line ?? brief.line;
  const prompt = pack?.prompt ?? brief.prompt;
  const choices = pack?.choices ?? brief.choices;
  const [pick, setPick] = useState<number | null>(null);
  const right = pick === brief.answer;
  const spare = choices.findIndex((_, i) => i !== brief.answer);
  const shown = choices.map((choice, i) => ({ choice, i })).filter(({ i }) => !access.fewer || i === brief.answer || i === spare);
  useEffect(() => {
    if (!access.speak) return;
    say(`${title}. ${line} ${prompt} ${shown.map((row) => row.choice).join(". ")}`, access.lang);
    return () => stopSay();
  }, [courseId, access.speak, access.lang]);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">{ui.oneQuestion}</p>
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      <p className="text-base leading-snug">{line}</p>
      {pack?.help ? <p className="text-sm font-semibold text-cyan">{pack.help}</p> : null}
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-extrabold">{prompt}</p>
        <button
          type="button"
          onClick={() => say(`${prompt}. ${shown.map((row) => row.choice).join(". ")}`, access.lang)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 px-3 text-sm font-bold ring-1 ring-line"
        >
          <Volume2 className="size-4" /> {ui.readBtn}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {shown.map(({ choice, i }) => (
          <button
            key={choice}
            type="button"
            onClick={() => setPick(i)}
            className={cn(
              "min-h-12 rounded-xl px-4 py-2 text-left text-base font-semibold leading-snug ring-1",
              pick === i && right ? "bg-orange text-ink ring-orange" : "bg-navy-2 text-fg ring-line",
            )}
          >
            {choice}
          </button>
        ))}
      </div>
      {pick != null && !right ? <p className="text-sm font-semibold text-gold">{ui.try}</p> : null}
      <Button onClick={() => onPass(null)}>{line16(access.lang, "playNow")}</Button>
      {right ? (
        <Button onClick={() => onPass(brief.lessonId)}>{ui.go}</Button>
      ) : (
        <Button variant="navy" onClick={onBack}>
          {ui.back}
        </Button>
      )}
    </div>
  );
}

function LevelPicker({
  hud,
  onCourse,
  onBack,
}: {
  hud: HudSnap;
  onCourse: (id: CourseId) => void;
  onBack: () => void;
}) {
  const access = useAccess();
  const ui = face(access.lang);
  const groups = [
    { title: "2D", items: [courseById("practice-2d"), ...trackCourses("2d")] },
    { title: "3D", items: [courseById("practice-3d"), ...trackCourses("3d")] },
    { title: courseLabel(access.lang, "tube-run", "Bus Tube"), items: [courseById("tube-run")] },
  ];
  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={onBack} className="min-h-12 w-fit px-4 text-sm font-bold ring-1 ring-line">
        {ui.back}
      </button>
      {groups.map((group) => (
        <div key={group.title} className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-gold">{group.title}</p>
          <div className="grid grid-cols-2 gap-2">
            {group.items.map((c, n) => {
              const open = hud.fullUnlock || isUnlocked(c, hud.bests);
              const on = hud.courseId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={!open}
                  onClick={() => open && onCourse(c.id)}
                  className={cn(
                    "flex !min-h-12 items-center gap-2 px-3 text-left text-base font-bold ring-1",
                    on ? "bg-orange text-ink ring-orange" : "bg-navy-2 text-fg ring-line",
                    !open && "opacity-70",
                  )}
                >
                  {open ? <span className="w-6 shrink-0 tabular-nums">{n}</span> : <Lock className="size-5 shrink-0" aria-label={line16(access.lang, "clearToOpen", { board: previousCourse(c)?.name || "" })} />}
                  <span className="leading-tight">{courseLabel(access.lang, c.id, c.name)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function TitleCard({
  hud,
  onPlay,
  onCourse,
}: {
  hud: HudSnap;
  onPlay: () => void;
  onCourse: (id: CourseId) => void;
}) {
  const [levels, setLevels] = useState(false);
  const cabinet = useCabinet();
  const access = useAccess();
  const ui = face(access.lang);
  const arcade = cabinet.look === "arcade";
  if (levels) {
    return (
      <LevelPicker
        hud={hud}
        onBack={() => setLevels(false)}
        onCourse={(id) => {
          onCourse(id);
          setLevels(false);
        }}
      />
    );
  }
  return (
    <div
      className="title-card flex flex-col gap-3"
      onPointerDownCapture={swallowIfQuiet}
      onPointerUpCapture={swallowIfQuiet}
      onClickCapture={swallowIfQuiet}
    >
      {arcade ? (
        <Attract skin={skinColor(cabinet.skin)} />
      ) : (
        <div className="px-1 py-3 text-center">
          <h2 className="text-3xl font-extrabold leading-none tracking-tight text-paper"><bdi>BERTY'S RUN</bdi></h2>
          <p className="script-font mt-2 text-sm font-bold text-gold">{ui.coin}</p>
          <p className="mt-2 text-xs font-semibold leading-snug text-gold">{whatsNew(access.lang)}</p>
        </div>
      )}
      <Button className="!min-h-16 w-full text-xl" onClick={onPlay}>
        <Play className="size-6" /> {ui.playWord}
      </Button>
      <button type="button" onClick={() => setLevels(true)} className="!min-h-12 text-sm font-bold ring-1 ring-line">
        {ui.levelsWord}
      </button>
    </div>
  );
}
