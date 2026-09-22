import { useRef, useState } from "react";
import { BookOpen, Download, Home, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  COMPTIA,
  DESK,
  HOUR,
  HUB,
  ITEEA,
  MST5_STATEMENT,
  MST_TAGS,
  ROOM,
  SISTERS,
  downloadPack,
  hangHint,
  readPackFile,
  type BertyPack,
} from "@/game/techworks";
import { cn } from "@/lib/utils";

export function ShopDesk({
  pack,
  onBack,
  onImport,
}: {
  pack: BertyPack;
  onBack: () => void;
  onImport: (raw: unknown) => string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const hang = hangHint();

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const next = await readPackFile(file);
      const err = onImport(next);
      setMsg(err ?? "Loaded shop pack. No names in the file.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not open that file.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Solvay MS · TechWorks</p>
        <h2 className="text-2xl font-extrabold tracking-tight">Shop desk</h2>
      </div>
      <p className="text-sm leading-relaxed text-muted">
        Berty's Run is a Tech Room lab. Scores stay on this Chromebook. No names. No accounts. Ed Law 2-d / FERPA.
      </p>

      <div className="flex flex-wrap gap-2">
        <a className={linkBtn} href={ROOM}>
          <Home className="size-4" /> Tech Room
        </a>
        <a className={linkBtnGhost} href={DESK}>
          TechWorks desk
        </a>
      </div>

      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange">Sister labs</p>
        <div className="flex flex-wrap gap-1.5">
          {SISTERS.filter((s) => s.id !== "techworks").map((s) => (
            <a
              key={s.id}
              href={s.href}
              title={s.blurb}
              className="inline-flex min-h-11 items-center rounded-lg bg-navy-2 px-3 text-xs font-bold uppercase tracking-wide text-fg ring-1 ring-line"
            >
              {s.name}
            </a>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-navy-2 p-3 ring-1 ring-line">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange">This hour</p>
        <p className="text-sm font-semibold text-fg">{HOUR.ask}</p>
        <ul className="grid gap-1 text-sm text-fg">
          {HOUR.do.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <p className="text-sm text-muted">Need · {HOUR.need}</p>
        <p className="text-sm text-muted">Look-for a 3 · {HOUR.lookFor}</p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {HOUR.beats.map((b) => (
            <div key={b.id} className="rounded-lg bg-navy px-3 py-2 ring-1 ring-line">
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange">{b.name}</p>
              <p className="text-xs text-fg">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange">Standards</p>
        <p className="text-sm leading-relaxed text-muted">NYS MST Standard 5. {MST5_STATEMENT}</p>
        <div className="flex flex-wrap gap-1.5">
          {MST_TAGS.map((t) => (
            <span
              key={t.code}
              title={t.body}
              className="rounded-md bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-orange ring-1 ring-line"
            >
              MST 5 · {t.code}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ITEEA.map((t) => (
            <span
              key={t.code}
              title={t.body}
              className="rounded-md bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted ring-1 ring-line"
            >
              {t.code}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted">
          {COMPTIA.itf} · {COMPTIA.aplus}. Career connection, not a cert course.
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-ink p-3 ring-1 ring-line">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange">Shop pack</p>
        <p className="text-sm text-muted">
          Save or open <span className="font-semibold text-fg">.bertyrun.json</span>. Stamps, watts, and parts only.
          No alias. No roster id.
        </p>
        <p className="font-mono text-xs text-muted">
          {pack.chip} · {Object.keys(pack.best).length} stamped · {pack.watts} W
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              void downloadPack(pack);
              setMsg("Saved bertys-run.bertyrun.json. Keep it local or a class Drive folder.");
            }}
          >
            <Download className="size-4" /> Export
          </Button>
          <Button variant="navy" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Open pack
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.bertyrun.json,application/json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void onFile(file);
            }}
          />
        </div>
        {msg ? <p className="text-sm font-semibold text-orange">{msg}</p> : null}
      </section>

      <section className="flex flex-col gap-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange">Hang in Teach</p>
        <p className="text-xs text-muted">PlanIt / Teach can hang these. Same-tab. No names in the URL.</p>
        <code className="break-all rounded-lg bg-navy-2 px-3 py-2 font-mono text-[11px] text-fg ring-1 ring-line">
          {hang.hour}
        </code>
        <p className="text-[11px] text-muted">
          {hang.board} · {hang.lab} · {hang.help}
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button variant="navy" onClick={onBack}>
          Boards
        </Button>
        <a className={cn(linkBtnGhost, "inline-flex items-center gap-2")} href={HUB.home.href}>
          <BookOpen className="size-4" /> {HUB.home.label}
        </a>
      </div>
    </div>
  );
}

const linkBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-orange px-4 text-sm font-semibold uppercase tracking-wide text-ink ring-1 ring-crate";
const linkBtnGhost =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-transparent px-4 text-sm font-semibold uppercase tracking-wide text-fg ring-1 ring-line";
