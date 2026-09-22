import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX, Heart, Ghost, Star, CircuitBoard, Home, Wrench, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COURSES, fmtTime, starsFromBest } from "@/game/courses";
import { Engine } from "@/game/engine";
import { unlockAudio } from "@/game/audio";
import { CHIP, ROOM, readLaunch } from "@/game/techworks";
import { BuildLab } from "@/components/build-lab";
import { ShopDesk } from "@/components/shop-desk";
import { Induction } from "@/components/induction";
import { JobPacket } from "@/components/job-packet";
import type { CourseId, HudSnap } from "@/game/types";
import { cn } from "@/lib/utils";

function fmt(t: number) {
  return fmtTime(t);
}

const idle: HudSnap = {
  phase: "boot",
  courseId: "roll-out",
  courseName: "First Trace",
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
  watts: 0,
  parts: [],
  passed: [],
  earned: 0,
  booted: false,
  inducted: false,
};

export function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [hud, setHud] = useState<HudSnap>(idle);
  const [how, setHow] = useState(false);
  const [lab, setLab] = useState(false);
  const [shop, setShop] = useState(false);
  const [job, setJob] = useState(false);
  const [help, setHelp] = useState(false);
  const [induct, setInduct] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new Engine(canvas, setHud);
    engineRef.current = engine;
    const launch = readLaunch();
    void engine.boot().then(() => {
      if (launch.course) engine.applyLaunch(launch.course);
      const fresh = !engine.save.inducted;
      if (launch.lab) {
        setLab(true);
      } else if (launch.help) {
        setHelp(true);
      } else if (launch.job) {
        setJob(true);
      } else if (launch.plan) {
        setShop(true);
      } else if (launch.induct || fresh) {
        setInduct(true);
      }
    });
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const e = engineRef.current;
  const overlay = hud.phase !== "play";
  const titlePane = hud.phase === "title";

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-ink text-fg">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ touchAction: "none" }}
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="rounded-[20px] bg-navy/80 px-3 py-2 ring-1 ring-line">
          <p className="text-[10px] font-bold tracking-[0.18em] text-orange uppercase">{CHIP}</p>
          <h1 className="text-lg font-extrabold leading-tight tracking-tight">
            {hud.courseName}
          </h1>
        </div>
        {hud.phase === "play" || hud.phase === "pause" ? (
          <div className="flex items-center gap-2 rounded-[20px] bg-navy/80 px-3 py-2 font-semibold tabular-nums ring-1 ring-line">
            <span className="text-orange">{hud.gems}/{hud.gemTotal}</span>
            <span className="text-muted">bits</span>
            <span className="text-fg">{fmt(hud.time)}</span>
            <span className={hud.time > hud.par ? "text-orange" : "text-muted"}>par {fmt(hud.par)}</span>
            <span className="inline-flex items-center gap-1 text-orange">
              {Array.from({ length: hud.hearts }, (_, i) => (
                <Heart key={i} className="size-3.5 fill-orange text-orange" />
              ))}
            </span>
          </div>
        ) : (
          <p className="rounded-[20px] bg-navy/80 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted ring-1 ring-line">
            {hud.watts} W · Solvay MS · TechWorks
          </p>
        )}
      </header>

      {hud.phase === "play" || hud.phase === "pause" ? (
        <div className="pointer-events-auto absolute top-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] right-3 z-10 flex flex-col gap-2">
          <IconBtn label={hud.phase === "pause" ? "Resume" : "Pause"} onClick={() => e?.togglePause()}>
            {hud.phase === "pause" ? <Play className="size-5" /> : <Pause className="size-5" />}
          </IconBtn>
          <IconBtn label={hud.mute ? "Unmute" : "Mute"} onClick={() => e?.toggleMute()}>
            {hud.mute ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </IconBtn>
          <IconBtn label="Retry" onClick={() => e?.retry()}>
            <RotateCcw className="size-5" />
          </IconBtn>
        </div>
      ) : null}

      {hud.phase === "play" && hud.time < 5.5 ? (
        <p className="pointer-events-none absolute bottom-36 left-1/2 z-10 w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl bg-navy/80 px-3 py-2 text-center text-sm font-semibold text-fg ring-1 ring-line">
          Space or tap to jump · bits first · then the gate
        </p>
      ) : null}

      {overlay ? (
        <div
          className={cn(
            "absolute inset-0 z-20 flex items-center justify-center p-4",
            hud.is3d ? "bg-ink/28" : "bg-ink/55 backdrop-blur-[2px]",
          )}
        >
          <section
            key={hud.phase + hud.courseId}
            className={cn(
              "overlay-panel w-full max-w-lg max-h-[min(94dvh,52rem)] overflow-y-auto rounded-[28px] bg-navy p-5 ring-1 ring-line",
              "shadow-[0_24px_60px_rgba(0,0,0,0.35)]",
            )}
          >
            {hud.phase === "boot" ? (
              <p className="text-muted">Loading the copper…</p>
            ) : null}

            {titlePane && induct ? (
              <Induction
                onDone={() => {
                  e?.finishInduction();
                  setInduct(false);
                }}
              />
            ) : null}

            {titlePane && lab && !induct ? (
              <BuildLab
                watts={hud.watts}
                parts={hud.parts}
                passed={hud.passed}
                bests={hud.bests}
                booted={hud.booted}
                onBack={() => setLab(false)}
                onPass={(id) => e?.passLesson(id)}
                onInstall={(id) => e?.installPart(id) ?? "Lab closed."}
                onBoot={() => {
                  unlockAudio();
                  e?.bootMachine();
                }}
              />
            ) : null}

            {titlePane && shop && !lab && !induct && !job && !help ? (
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
                }}
                onBack={() => setShop(false)}
                onImport={(raw) => e?.importPack(raw) ?? "Lab closed."}
              />
            ) : null}

            {titlePane && (job || help) && !lab && !induct && !shop ? (
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

            {titlePane && !lab && !shop && !job && !help && !induct ? (
              <TitleCard
                hud={hud}
                how={how}
                onHow={() => setHow((v) => !v)}
                onPlay={() => {
                  unlockAudio();
                  e?.startPlay();
                }}
                onCourse={(id) => e?.selectCourse(id)}
                onCrew={(on) => e?.setCrew(on)}
                onMute={() => e?.toggleMute()}
                onGhost={() => e?.toggleGhost()}
                onLab={() => setLab(true)}
                onShop={() => setShop(true)}
                onJob={() => setJob(true)}
              />
            ) : null}

            {hud.phase === "pause" ? (
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold tracking-tight">Paused</h2>
                <p className="text-muted">
                  Berty keeps running. Space or tap to jump.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button className="min-h-14 min-w-[12rem] text-base" onClick={() => e?.togglePause()}>
                    Resume
                  </Button>
                  <Button variant="navy" onClick={() => e?.retry()}>
                    Retry
                  </Button>
                  <Button variant="ghost" onClick={() => e?.selectCourse(hud.courseId)}>
                    Title
                  </Button>
                  <Button variant="ghost" onClick={() => { e?.selectCourse(hud.courseId); setLab(true); }}>
                    Lab
                  </Button>
                  <a
                    href={ROOM}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-transparent px-4 text-sm font-semibold uppercase tracking-wide text-fg ring-1 ring-line"
                  >
                    <Home className="size-4" /> Home
                  </a>
                </div>
              </div>
            ) : null}

            {hud.phase === "win" ? (
              <div className="flex flex-col gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Gate locked</p>
                <h2 className="text-3xl font-extrabold tracking-tight">Clear</h2>
                <div className="flex gap-1">
                  {[1, 2, 3].map((n) => (
                    <Star
                      key={n}
                      className={cn("size-6", n <= hud.stars ? "fill-orange text-orange" : "text-line")}
                    />
                  ))}
                </div>
                <p className="text-muted">
                  {fmt(hud.time)} · par {fmt(hud.par)} · {hud.gems} bits
                  {hud.best != null ? ` · best ${fmt(hud.best)}` : ""}
                  {hud.earned > 0 ? ` · +${hud.earned} W` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button className="min-h-14 min-w-[12rem] text-base" onClick={() => e?.retry()}>
                    Run again
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      e?.selectCourse(hud.courseId);
                      setLab(true);
                    }}
                  >
                    Build Lab
                  </Button>
                </div>
              </div>
            ) : null}

            {hud.phase === "fail" ? (
              <div className="flex flex-col gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Wiped out</p>
                <h2 className="text-3xl font-extrabold tracking-tight">Try again</h2>
                <p className="text-muted">
                  Tap or Space to retry. Crates, fans, and pits cost a heart. Three misses and the run is over.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button className="min-h-14 min-w-[12rem] text-base" onClick={() => e?.retry()}>
                    Retry
                  </Button>
                  <Button variant="ghost" onClick={() => e?.selectCourse(hud.courseId)}>
                    Courses
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </main>
  );
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
      className="grid size-11 place-items-center rounded-xl bg-navy/85 text-fg ring-1 ring-line"
    >
      {children}
    </button>
  );
}

function TitleCard({
  hud,
  how,
  onHow,
  onPlay,
  onMute,
  onGhost,
  onLab,
  onShop,
  onJob,
}: {
  hud: HudSnap;
  how: boolean;
  onHow: () => void;
  onPlay: () => void;
  onCourse: (id: CourseId) => void;
  onCrew: (on: boolean) => void;
  onMute: () => void;
  onGhost: () => void;
  onLab: () => void;
  onShop: () => void;
  onJob: () => void;
}) {
  const best = hud.bests["roll-out"];
  const stars = starsFromBest(best, COURSES[0].par);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange">L1 · First Trace</p>
        <h2 className="text-3xl font-extrabold tracking-tight">Berty Run</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Space or tap to jump. Berty runs the copper. Grab bits. Hit the gate.
        </p>
      </div>
      {stars > 0 || best != null ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-orange">
          {[1, 2, 3].map((n) => (n <= stars ? "★" : "☆")).join("")}
          {best != null ? ` · best ${fmtTime(best)}` : ""}
        </p>
      ) : null}
      {how ? (
        <ul className="grid gap-1 text-sm text-fg">
          <li>One button: Space, click, or tap. Hold for a higher jump.</li>
          <li>Crates, fans, and pits cost a heart. Rings save a checkpoint.</li>
          <li>Clear the gate to earn watts. Build Lab spends them.</li>
          <li>Best time stays on this Chromebook. No names. No accounts.</li>
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button className="min-h-14 min-w-[12rem] text-base" onClick={onPlay}>
          <Play className="size-5" /> Play
        </Button>
        <Button variant="ghost" onClick={onHow}>
          {how ? "Hide how" : "How"}
        </Button>
        <Button variant="ghost" onClick={onMute} aria-label={hud.mute ? "Unmute" : "Mute"}>
          {hud.mute ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="navy" onClick={onJob}>
          <ClipboardList className="size-4" /> Job
        </Button>
        <Button variant="navy" onClick={onLab}>
          <CircuitBoard className="size-4" /> Build Lab
        </Button>
        <Button variant="ghost" onClick={onShop}>
          <Wrench className="size-4" /> Shop
        </Button>
        <a
          href={ROOM}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-transparent px-4 text-sm font-semibold uppercase tracking-wide text-fg ring-1 ring-line"
        >
          <Home className="size-4" /> Home
        </a>
        <Button variant="ghost" onClick={onGhost} aria-label={hud.ghost ? "Hide ghost" : "Show ghost"}>
          <Ghost className="size-4" />
          {hud.ghost ? "Ghost" : "No ghost"}
        </Button>
      </div>
    </div>
  );
}
