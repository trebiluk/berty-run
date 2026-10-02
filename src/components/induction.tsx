import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GOALS, type PcGoal } from "@/game/curriculum";

const BEATS = [
  { kicker: "Lean", title: "Tilt the board.", body: "Berty rolls the way you lean." },
  { kicker: "Bits", title: "Grab every bit.", body: "The gold bits are the ones you need." },
  { kicker: "Port", title: "Park in the port.", body: "The striped door is the end of the run." },
  { kicker: "Reward", title: "The PC is the prize.", body: "Help Berty finish the run. A clear snaps the next part on." },
];

export function Induction({ onDone, forced }: { onDone: () => void; forced?: boolean }) {
  const [i, setI] = useState(0);
  const beat = BEATS[i];
  const last = i >= BEATS.length - 1;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-orange">
        {i + 1} / {BEATS.length} · {beat.kicker}
      </p>
      <h2 className="text-3xl leading-none font-extrabold tracking-tight">{beat.title}</h2>
      <p className="text-base leading-snug text-fg">{beat.body}</p>
      <div className="flex flex-wrap gap-2">
        {i > 0 ? (
          <Button variant="navy" onClick={() => setI((n) => n - 1)}>
            Back
          </Button>
        ) : null}
        <Button
          onClick={() => {
            if (last) onDone();
            else setI((n) => n + 1);
          }}
        >
          {last ? "Done" : "Next"}
        </Button>
        {i > 0 || !forced ? (
          <Button variant="ghost" onClick={onDone}>
            Skip
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** One door. The PC they want, then the first board. Sign-in is the Hub pill. */
export function Splash({ onPlay }: { onPlay: (goal: PcGoal) => void }) {
  const [goal, setGoal] = useState<PcGoal | "">("");
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!goal) return;
        onPlay(goal);
      }}
    >
      <p className="text-sm font-semibold text-orange">Berty's Run</p>
      <h2 className="text-3xl leading-none font-extrabold tracking-tight">Help Berty build a PC.</h2>
      <p className="text-base leading-snug text-fg">He rolls through the computer. You grab the bits. Each win adds a part.</p>
      <div className="grid grid-cols-3 gap-1">
        {GOALS.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={goal === g.id}
            onClick={() => setGoal(g.id)}
            className={
              goal === g.id
                ? "min-h-12 bg-orange px-2 text-sm font-extrabold text-ink ring-1 ring-orange"
                : "min-h-12 bg-navy-2 px-2 text-sm font-extrabold text-fg ring-1 ring-line"
            }
          >
            {g.name.replace(" PC", "")}
          </button>
        ))}
      </div>
      <Button type="submit" disabled={!goal}>
        Play
      </Button>
    </form>
  );
}
