import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CART, HOUR, hangHint } from "@/game/techworks";

export function JobPacket({
  teacher,
  stamps,
  watts,
  onPlay,
  onLab,
  onBack,
}: {
  teacher: boolean;
  stamps: number;
  watts: number;
  onPlay: () => void;
  onLab: () => void;
  onBack: () => void;
}) {
  const hang = hangHint();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">
          {teacher ? "Helper · this hour" : "Job packet"}
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight">{teacher ? "Say this out loud" : "This hour's job"}</h2>
      </div>
      <p className="rounded-2xl bg-ink px-3 py-2 text-sm font-semibold text-fg ring-1 ring-line">{HOUR.say}</p>
      <p className="text-sm font-semibold text-fg">{HOUR.ask}</p>
      <ul className="grid gap-1 text-sm text-fg">
        {HOUR.do.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <p className="text-sm text-muted">Look-for a 3 · {HOUR.lookFor}</p>
      <p className="text-xs text-muted">
        {stamps} board{stamps === 1 ? "" : "s"} stamped · {watts} W on this Chromebook. No names.
      </p>
      {teacher ? (
        <section className="flex flex-col gap-2 rounded-2xl bg-navy-2 p-3 ring-1 ring-line">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange">Hang in Teach</p>
          <code className="break-all rounded-lg bg-ink px-3 py-2 font-mono text-[11px] text-fg ring-1 ring-line">
            {hang.hour}
          </code>
          <p className="text-[11px] text-muted">
            {hang.board} · {hang.lab} · {hang.help}
          </p>
          <p className="text-xs text-muted">Door · {CART}/</p>
        </section>
      ) : (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {HOUR.beats.map((b) => (
            <div key={b.id} className="rounded-lg bg-navy-2 px-3 py-2 ring-1 ring-line">
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange">{b.name}</p>
              <p className="text-xs text-fg">{b.body}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button onClick={onPlay}>
          <ClipboardList className="size-4" /> Play Roll Out
        </Button>
        <Button variant="navy" onClick={onLab}>
          Build Lab
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Boards
        </Button>
      </div>
    </div>
  );
}
