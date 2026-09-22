import { useMemo, useState } from "react";
import {
  Binary,
  Bug,
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  MemoryStick,
  Monitor,
  Shield,
  Workflow,
  Zap,
  Wifi,
  BookOpen,
  Cable,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LESSONS, PARTS, canBoot, lessonById, lessonOpen, lockReason, partById, type Lesson, type LessonId, type PartId } from "@/game/curriculum";
import { LESSON_STANDARDS, ROOM } from "@/game/techworks";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Cpu> = {
  binary: Binary,
  board: CircuitBoard,
  power: Zap,
  cpu: Cpu,
  ram: MemoryStick,
  cool: Fan,
  storage: HardDrive,
  io: Cable,
  gpu: Monitor,
  code: BookOpen,
  os: Monitor,
  algo: Workflow,
  net: Wifi,
  debug: Bug,
  safe: Shield,
  mobo: CircuitBoard,
  psu: Zap,
  fan: Fan,
  ssd: HardDrive,
  nic: Wifi,
};

export function BuildLab({
  watts,
  parts,
  passed,
  bests,
  booted,
  onBack,
  onPass,
  onInstall,
  onBoot,
}: {
  watts: number;
  parts: string[];
  passed: string[];
  bests: Record<string, number>;
  booted: boolean;
  onBack: () => void;
  onPass: (id: LessonId) => void;
  onInstall: (id: PartId) => string | null;
  onBoot: () => void;
}) {
  const [sel, setSel] = useState<LessonId>("binary");
  const [pick, setPick] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const lesson = lessonById(sel) ?? LESSONS[0];
  const open = lessonOpen(lesson, bests);
  const done = passed.includes(lesson.id);
  const part = lesson.part ? partById(lesson.part) : undefined;
  const installed = part ? parts.includes(part.id) : false;
  const ready = canBoot(parts);
  const units = useMemo(() => {
    const u: Record<string, Lesson[]> = { Hardware: [], Software: [], Thinking: [] };
    for (const l of LESSONS) u[l.unit].push(l);
    return u;
  }, []);

  function submit() {
    if (!open) return;
    if (pick === lesson.q.answer) {
      onPass(lesson.id);
      setMsg("Correct. Lesson stamped.");
    } else {
      setMsg("Not that one. Read it once more, then try.");
    }
  }

  function buy() {
    if (!part) return;
    const err = onInstall(part.id);
    setMsg(err ?? `Installed ${part.name}.`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Build Lab</p>
          <h2 className="text-2xl font-extrabold tracking-tight">Your machine</h2>
        </div>
        <div className="rounded-xl bg-navy-2 px-3 py-2 text-right ring-1 ring-line">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Watts</p>
          <p className="font-extrabold tabular-nums text-orange">{watts}</p>
        </div>
      </div>
      <p className="text-sm text-muted">
        Clear boards to earn watts. Open a lesson. Pass the check. Install the part. Boot when the core is in.
      </p>

      <Tower parts={parts} booted={booted} ready={ready} />

      {ready ? (
        <div className="rounded-2xl bg-ink px-3 py-2 font-mono text-xs text-orange ring-1 ring-line">
          {booted ? (
            <BootLog parts={parts} />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>POST ready. CPU RAM PSU MOBO OS present.</p>
              <Button onClick={onBoot}>
                <Play className="size-4" /> Boot
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted">Need motherboard, PSU, CPU, RAM, and BertyOS to boot.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <nav className="flex max-h-56 flex-col gap-2 overflow-y-auto sm:max-h-72">
          {(Object.keys(units) as Array<keyof typeof units>).map((unit) => (
            <div key={unit}>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange">{unit}</p>
              <div className="flex flex-col gap-1">
                {units[unit].map((l) => {
                  const Icon = ICONS[l.id] ?? BookOpen;
                  const on = l.id === sel;
                  const ok = lessonOpen(l, bests);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setSel(l.id);
                        setPick(null);
                        setMsg("");
                      }}
                      className={cn(
                        "flex min-h-11 items-center gap-2 rounded-lg px-2.5 text-left text-sm ring-1",
                        on ? "bg-orange text-ink ring-crate" : "bg-navy-2 text-fg ring-line",
                        !ok && !on && "opacity-55",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1 font-semibold">{l.title}</span>
                      {passed.includes(l.id) ? <span className="text-[10px] font-bold">OK</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <article className="flex flex-col gap-3 rounded-2xl bg-navy-2 p-3 ring-1 ring-line">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange">{lesson.unit}</p>
            <h3 className="text-lg font-extrabold tracking-tight">{lesson.title}</h3>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
              {LESSON_STANDARDS[lesson.id].mst.map((c) => `MST 5 · ${c}`).join(" · ")}
              {" · "}
              {LESSON_STANDARDS[lesson.id].comptia}
            </p>
          </div>
          {open ? (
            <>
              {lesson.body.map((p) => (
                <p key={p} className="text-sm leading-relaxed text-fg">
                  {p}
                </p>
              ))}
              <p className="text-sm text-muted">{lesson.board}</p>
              {!done ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold">{lesson.q.prompt}</p>
                  {lesson.q.choices.map((c, i) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPick(i)}
                      className={cn(
                        "min-h-11 rounded-lg px-3 text-left text-sm ring-1",
                        pick === i ? "bg-orange text-ink ring-crate" : "bg-navy text-fg ring-line",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                  <Button onClick={submit} disabled={pick == null}>
                    Check
                  </Button>
                </div>
              ) : (
                <p className="text-sm font-semibold text-orange">Check passed.</p>
              )}
              {part && done ? (
                installed ? (
                  <p className="text-sm text-muted">{part.name} is in the case.</p>
                ) : (
                  <Button onClick={buy}>
                    Install {part.name} · {part.cost} W
                  </Button>
                )
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted">{lockReason(lesson, bests)}</p>
          )}
          {msg ? <p className="text-sm font-semibold text-orange">{msg}</p> : null}
        </article>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="navy" onClick={onBack}>
          Boards
        </Button>
        <a
          href={ROOM}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-transparent px-4 text-sm font-semibold uppercase tracking-wide text-fg ring-1 ring-line"
        >
          Tech Room
        </a>
      </div>
    </div>
  );
}

function Tower({ parts, booted, ready }: { parts: string[]; booted: boolean; ready: boolean }) {
  const on = (id: string) => parts.includes(id);
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-ink p-3 ring-1 ring-line">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{
        backgroundImage:
          "linear-gradient(#e8772222 1px, transparent 1px), linear-gradient(90deg, #e8772222 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      }} />
      <div className="relative grid grid-cols-3 gap-2 sm:grid-cols-5">
        <Slot label="PSU" on={on("psu")} icon={Zap} />
        <Slot label="Board" on={on("mobo")} icon={CircuitBoard} />
        <Slot label="CPU" on={on("cpu")} icon={Cpu} hot={on("cpu") && on("fan")} />
        <Slot label="RAM" on={on("ram")} icon={MemoryStick} />
        <Slot label="SSD" on={on("ssd")} icon={HardDrive} />
        <Slot label="Cooler" on={on("fan")} icon={Fan} spin={on("fan") && (booted || ready)} />
        <Slot label="GPU" on={on("gpu")} icon={Monitor} />
        <Slot label="NET" on={on("nic")} icon={Wifi} />
        <Slot label="OS" on={on("os")} icon={BookOpen} />
      </div>
    </div>
  );
}

function Slot({
  label,
  on,
  icon: Icon,
  spin,
  hot,
}: {
  label: string;
  on: boolean;
  icon: typeof Cpu;
  spin?: boolean;
  hot?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl ring-1",
        on ? "bg-navy-2 text-orange ring-crate" : "bg-navy/40 text-muted ring-line",
      )}
    >
      <Icon className={cn("size-4", spin && "animate-spin", hot && "text-orange")} style={spin ? { animationDuration: "1.4s" } : undefined} />
      <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </div>
  );
}

function BootLog({ parts }: { parts: string[] }) {
  const lines = [
    "BERTOS 1.0 — Solvay Tech Ed",
    "POST ........ CPU OK",
    parts.includes("ram") ? "RAM ........ bits mapped" : null,
    parts.includes("ssd") ? "SSD ........ persistent" : null,
    parts.includes("gpu") ? "GPU ........ frames" : null,
    parts.includes("nic") ? "NET ........ link down (local only)" : null,
    parts.includes("fan") ? "THERMAL .... fans up" : null,
    "WELCOME, BERT.",
  ].filter(Boolean) as string[];
  return (
    <div className="flex flex-col gap-0.5">
      {lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
    </div>
  );
}
