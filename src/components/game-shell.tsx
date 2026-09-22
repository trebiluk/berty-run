import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX, Heart, Ghost, CircuitBoard, Home, Wrench, ClipboardList } from "lucide-react";
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
        setHow(true);
      } else if (launch.job) {
        setJob(true);
      } else if (launch.plan) {
        setShop(true);
      } else if (launch.induct) {
        setInduct(true);
      } else if (fresh) {
        engine.finishInduction();
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

      {hud.phase === "play" ? (
        <button
          type="button"
          aria-label="Jump"
          className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-10 min-h-16 min-w-28 rounded-2xl bg-orange px-6 text-base font-extrabold uppercase tracking-wide text-ink ring-1 ring-crate"
          onPointerDown={(ev) => {
            ev.preventDefault();
            e?.holdJump(true);
          }}
          onPointerUp={() => e?.holdJump(false)}
          onPointerCancel={() => e?.holdJump(false)}
          onPointerLeave={() => e?.holdJump(false)}
        >
          Jump
        </button>
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
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">First Trace</p>
                <h2 className="text-3xl font-extrabold tracking-tight">Trace complete</h2>
                <p className="text-sm font-semibold text-fg">3 bits + gate</p>
                <div className="flex gap-2" aria-label="3 bits collected">
                  {[0, 1, 2].map((n) => (
                    <span
                      key={n}
                      className={cn(
                        "grid size-11 place-items-center rounded-xl text-lg font-extrabold ring-1",
                        n < hud.gems ? "bg-orange text-ink ring-crate" : "bg-navy-2 text-muted ring-line",
                      )}
                    >
                      ◆
                    </span>
                  ))}
                </div>
                <p className="text-muted">
                  {fmt(hud.time)}
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
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">First Trace</p>
                <h2 className="text-3xl font-extrabold tracking-tight">Trace broke</h2>
                <p className="text-muted">Try again. Space or tap also works.</p>
                <Button className="min-h-14 min-w-[12rem] text-base" onClick={() => e?.retry()}>
                  Retry
                </Button>
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
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange">L1 · First Trace</p>
        <h2 className="text-3xl font-extrabold tracking-tight">Berty Run</h2>
        <p className="mt-2 text-sm font-semibold text-fg">Tap JUMP · collect all 3 gems.</p>
      </div>
      {best != null ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-orange">best {fmtTime(best)}</p>
      ) : null}
      {how ? (
        <ul className="grid gap-1 text-sm text-fg">
          <li>Space, Up, or the JUMP button. Hold for a higher jump.</li>
          <li>Three bits sit on the copper. Then the gate.</li>
          <li>Best time stays on this Chromebook. No names.</li>
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button className="min-h-14 min-w-[12rem] text-base" onClick={onPlay}>
          <Play className="size-5" /> Play
        </Button>
        <Button variant="navy" className="min-h-14 min-w-[7rem] text-base" onClick={onHow}>
          {how ? "Hide" : "Help"}
        </Button>
        <Button variant="ghost" onClick={onMute} aria-label={hud.mute ? "Unmute" : "Mute"}>
          {hud.mute ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
