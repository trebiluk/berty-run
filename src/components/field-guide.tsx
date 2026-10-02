import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GUIDE, guideDone, markGuide } from "@/game/field-guide";
import { unitLabel, voiceOf } from "@/game/guide-voice";
import { readAccess, say, type Lang } from "@/game/access";
import { face } from "@/game/face";
import { cn } from "@/lib/utils";

const UNIT_ORDER = ["Build the PC", "Use it", "How it works", "Beyond the case"];

export function FieldGuide({ code, onBack }: { code: string; onBack: () => void }) {
  const [id, setId] = useState<string | null>(null);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [done, setDone] = useState<string[]>(() => guideDone(code));
  const [unitOpen, setUnitOpen] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const sync = () => setLang(readAccess().lang);
    sync();
    window.addEventListener("br-access", sync);
    return () => window.removeEventListener("br-access", sync);
  }, []);
  const ui = face(lang);
  const topic = GUIDE.find((t) => t.id === id) ?? null;
  const openTopic = (next: string) => {
    setId(next);
    setPicks({});
    setMore(false);
  };
  const allRight = topic != null && topic.checks.every((check, i) => picks[i] === check.answer);
  const save = () => {
    if (!topic || !allRight) return;
    markGuide(code, topic.id);
    setDone(guideDone(code));
    setId(null);
  };
  if (!topic) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">Learn</p>
        <h2 className="text-2xl font-extrabold tracking-tight">Four units</h2>
        <p className="text-sm font-semibold text-fg">
          {lang === "es"
            ? `${done.length} de ${GUIDE.length}. Abre una unidad y luego un tema.`
            : `${done.length} of ${GUIDE.length} done. Open a unit, then one topic.`}
        </p>
        {lang === "es" ? (
          <p className="text-sm text-cyan">La lección larga sigue en inglés. La idea y las preguntas están en español.</p>
        ) : lang === "simple" ? (
          <p className="text-sm text-cyan">The long lesson stays hidden until you ask for it.</p>
        ) : null}
        <div className="flex flex-col gap-3">
          {UNIT_ORDER.map((unit) => {
            const topics = GUIDE.filter((t) => t.unit === unit);
            if (!topics.length) return null;
            const learned = topics.filter((t) => done.includes(t.id)).length;
            const open = unitOpen === unit;
            return (
              <div key={unit} className="flex flex-col gap-2">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setUnitOpen(open ? null : unit)}
                  className="flex min-h-11 w-full items-center justify-between rounded-xl bg-navy-2 px-3 text-left ring-1 ring-line"
                >
                  <span className="text-sm font-extrabold text-fg">{unitLabel(unit, lang)}</span>
                  <span className="text-xs font-bold text-muted">
                    {learned}/{topics.length} · {open ? (lang === "es" ? "Ocultar" : "Hide") : lang === "es" ? "Ver" : "Show"}
                  </span>
                </button>
                {open
                  ? topics.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => openTopic(t.id)}
                        className="flex min-h-14 items-center justify-between gap-2 rounded-xl bg-navy-2 px-3 py-2 text-left ring-1 ring-line"
                      >
                        <span className="text-sm font-extrabold">{voiceOf(t, lang).title}</span>
                        <span className={cn("text-xs font-bold", done.includes(t.id) ? "text-orange" : "text-muted")}>
                          {done.includes(t.id) ? (lang === "es" ? "Listo" : "Learned") : lang === "es" ? "Abrir" : "Open"}
                        </span>
                      </button>
                    ))
                  : null}
              </div>
            );
          })}
        </div>
        <Button variant="navy" onClick={onBack}>
          {ui.back}
        </Button>
      </div>
    );
  }
  const shown = voiceOf(topic, lang);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold text-cyan">{unitLabel(topic.unit, lang)}</p>
      <h2 className="text-2xl font-extrabold tracking-tight">{shown.title}</h2>
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-semibold text-gold">{shown.hook}</p>
        <button
          type="button"
          onClick={() => say(shown.hook, lang)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 px-3 text-sm font-bold ring-1 ring-line"
        >
          <Volume2 className="size-4" /> {ui.readBtn}
        </button>
      </div>
      {lang === "en" || more ? (
        topic.body.map((p) => (
          <p key={p} className="text-sm leading-relaxed text-fg">
            {p}
          </p>
        ))
      ) : (
        <button type="button" onClick={() => setMore(true)} className="min-h-11 text-left text-sm font-bold text-cyan">
          {lang === "es" ? "Leer el texto largo en inglés" : "Read the long lesson"}
        </button>
      )}
      {shown.checks.map((check, i) => (
        <div key={check.prompt} className="flex flex-col gap-2">
          <p className="text-sm font-extrabold">{check.prompt}</p>
          {check.choices.map((choice, n) => {
            const picked = picks[i] === n;
            const right = picked && n === check.answer;
            const wrong = picked && n !== check.answer;
            return (
              <button
                key={choice}
                type="button"
                onClick={() => setPicks((cur) => ({ ...cur, [i]: n }))}
                className={cn(
                  "min-h-11 rounded-xl px-3 text-left text-sm font-bold ring-1",
                  right ? "bg-orange text-ink ring-orange" : wrong ? "bg-navy text-fg ring-gold" : "bg-navy-2 text-fg ring-line",
                )}
              >
                {choice}
                {wrong ? (lang === "es" ? " — no es esa" : " — not that one") : ""}
              </button>
            );
          })}
        </div>
      ))}
      {allRight ? <Button onClick={save}>{lang === "es" ? "Listo" : "Got it"}</Button> : <p className="text-sm text-muted">{lang === "es" ? "Responde las dos. Luego se guarda." : "Answer both. Then it saves."}</p>}
      <Button variant="navy" onClick={() => setId(null)}>
        {lang === "es" ? "Todos los temas" : "All topics"}
      </Button>
    </div>
  );
}
