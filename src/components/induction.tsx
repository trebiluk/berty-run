import { useState } from "react";
import { Button } from "@/components/ui/button";
import { INDUCTION } from "@/game/techworks";

export function Induction({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const beat = INDUCTION[i];
  const last = i >= INDUCTION.length - 1;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">{beat.kicker}</p>
      <h2 className="text-2xl font-extrabold tracking-tight">{beat.title}</h2>
      <p className="text-sm leading-relaxed text-fg">{beat.body}</p>
      <div className="flex gap-1.5">
        {INDUCTION.map((b, n) => (
          <span key={b.id} className={`h-1.5 flex-1 rounded-full ${n <= i ? "bg-orange" : "bg-line"}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            if (last) onDone();
            else setI((n) => n + 1);
          }}
        >
          {last ? "Got it — traces" : "Next"}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Skip
        </Button>
      </div>
    </div>
  );
}
