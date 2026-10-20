import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GOALS, type PcGoal } from "@/game/curriculum";
import { readAccess, type Lang } from "@/game/access";

type Beat = { kicker: string; title: string; body: string; icon: string };

const EN: Beat[] = [
  { kicker: "Levels", title: "Every level is open.", body: "Pick any board. A dash means you have not played it yet.", icon: "open" },
  { kicker: "Fact", title: "The CPU fact waits for a win.", body: "After a clear you see: CPU: the computer's brain. It works in a loop: fetch, decode, execute.", icon: "fact" },
  { kicker: "Tilt", title: "Tilt steers every way.", body: "Tip forward, back, left, or right. Tilt is the second row in Controls.", icon: "tilt" },
  { kicker: "Par", title: "The clock says Under par or Over par.", body: "Finish faster than the mark and it says Under par.", icon: "clock" },
  { kicker: "Board", title: "The boards look like real circuit boards.", body: "Chips and parts are walls. Black hatched holes are pits. The bug with a ! is a virus.", icon: "open" },
];

const STEPS: Record<string, Beat[]> = {
  en: EN,
  simple: [
    { kicker: "Levels", title: "All levels are open.", body: "Pick any board.", icon: "open" },
    { kicker: "Fact", title: "The fact shows after a win.", body: "It tells you what a CPU does.", icon: "fact" },
    { kicker: "Tilt", title: "Tilt goes every way.", body: "Tip the device to steer.", icon: "tilt" },
    { kicker: "Par", title: "The clock says Under or Over.", body: "Faster than the mark is Under par.", icon: "clock" },
    { kicker: "Board", title: "Boards look like computer boards.", body: "Each board keeps its color. Follow the glowing path.", icon: "open" },
  ],
  es: [
    { kicker: "Niveles", title: "Todos los niveles están abiertos.", body: "Elige cualquier tablero. Una raya significa que aún no jugaste.", icon: "open" },
    { kicker: "Dato", title: "El dato de la CPU sale al ganar.", body: "Después de una victoria ves qué hace la CPU.", icon: "fact" },
    { kicker: "Inclinación", title: "La inclinación mueve en todas direcciones.", body: "Inclina adelante, atrás, izquierda o derecha.", icon: "tilt" },
    { kicker: "Par", title: "El reloj dice Bajo o Sobre la marca.", body: "Si terminas más rápido, dice Bajo la marca.", icon: "clock" },
    { kicker: "Placa", title: "Las placas parecen placas de circuito.", body: "Cada placa tiene su color. Sigue el camino que brilla.", icon: "open" },
  ],
  uk: [
    { kicker: "Рівні", title: "Усі рівні відкриті.", body: "Обери будь-яку дошку. Рисочка означає, що ти ще не грав.", icon: "open" },
    { kicker: "Факт", title: "Факт про процесор після перемоги.", body: "Після фінішу ти бачиш, що робить процесор.", icon: "fact" },
    { kicker: "Нахил", title: "Нахил керує в усі боки.", body: "Нахили вперед, назад, ліворуч або праворуч.", icon: "tilt" },
    { kicker: "Пар", title: "Годинник каже Краще або Гірше за пар.", body: "Швидше за мітку — Краще за пар.", icon: "clock" },
    { kicker: "Плата", title: "Плати схожі на справжні плати.", body: "Кожна плата має свій колір. Іди за світлом.", icon: "open" },
  ],
  ru: [
    { kicker: "Уровни", title: "Все уровни открыты.", body: "Выбери любую доску. Чёрточка значит, что ты ещё не играл.", icon: "open" },
    { kicker: "Факт", title: "Факт о процессоре после победы.", body: "После финиша ты видишь, что делает процессор.", icon: "fact" },
    { kicker: "Наклон", title: "Наклон управляет во все стороны.", body: "Наклони вперёд, назад, влево или вправо.", icon: "tilt" },
    { kicker: "Пар", title: "Часы говорят Лучше или Хуже пара.", body: "Быстрее отметки — Лучше пара.", icon: "clock" },
    { kicker: "Плата", title: "Платы похожи на настоящие платы.", body: "У каждой платы свой цвет. Иди за светом.", icon: "open" },
  ],
  ar: [
    { kicker: "المستويات", title: "كل المستويات مفتوحة.", body: "اختر أي لوحة. الشرطة تعني أنك لم تلعبها بعد.", icon: "open" },
    { kicker: "المعلومة", title: "معلومة المعالج تظهر بعد الفوز.", body: "بعد الفوز ترى ماذا يفعل المعالج.", icon: "fact" },
    { kicker: "الإمالة", title: "الإمالة توجّه في كل الاتجاهات.", body: "أمِل للأمام أو الخلف أو اليسار أو اليمين.", icon: "tilt" },
    { kicker: "الوقت", title: "الساعة تقول تحت أو فوق الوقت.", body: "إذا أنهيت أسرع، تقول تحت الوقت.", icon: "clock" },
    { kicker: "اللوحة", title: "اللوحات تشبه لوحات الدوائر.", body: "كل لوحة لها لونها. اتبع المسار المضيء.", icon: "open" },
  ],
  "fa-AF": [
    { kicker: "مرحله‌ها", title: "همهٔ مرحله‌ها باز است.", body: "هر تخته را انتخاب کن. خط تیره یعنی هنوز بازی نکردی.", icon: "open" },
    { kicker: "نکته", title: "نکتهٔ پردازنده بعد از برد دیده می‌شود.", body: "بعد از برد می‌بینی پردازنده چه می‌کند.", icon: "fact" },
    { kicker: "کج کردن", title: "کج کردن به هر طرف می‌برد.", body: "به جلو، عقب، چپ یا راست کج کن.", icon: "tilt" },
    { kicker: "زمان", title: "ساعت زیر یا بالای زمان هدف می‌گوید.", body: "اگر سریع‌تر تمام کنی، زیر زمان هدف می‌گوید.", icon: "clock" },
    { kicker: "بورد", title: "بوردها مثل بورد مدار هستند.", body: "هر بورد رنگ خودش را دارد. راه روشن را دنبال کن.", icon: "open" },
  ],
  rw: [
    { kicker: "Inzego", title: "Inzego zose zirafunguye.", body: "Hitamo uruhande urwo arirwo rwose. Umurongo utunganye bivuze utarakinnye.", icon: "open" },
    { kicker: "Amakuru", title: "Amakuru ya CPU agaragara nyuma yo gutsinda.", body: "Nyuma yo gutsinda ubona icyo CPU ikora.", icon: "fact" },
    { kicker: "Kugoreka", title: "Kugoreka bigenda impande zose.", body: "Goreka imbere, inyuma, ibumoso cyangwa iburyo.", icon: "tilt" },
    { kicker: "Par", title: "Isaha ivuga munsi cyangwa hejuru ya par.", body: "Nurangiza vuba, ivuga munsi ya par.", icon: "clock" },
    { kicker: "Ikibaho", title: "Ibibaho bisa n'ibibaho by'amashanyarazi.", body: "Buri kibaho gifite ibara ryacyo. Kurikira inzira imurika.", icon: "open" },
  ],
  ti: [
    { kicker: "ደረጃታት", title: "ኩሎም ደረጃታት ክፉታት እዮም።", body: "ዝኾነ ሰሌዳ ምረጽ። ሕንጻጽ ማለት ገና ኣይተጻወትካን።", icon: "open" },
    { kicker: "ሓበሬታ", title: "ሓበሬታ CPU ድሕሪ ዓወት ይርአ።", body: "ድሕሪ ዓወት CPU እንታይ ከም ዝሰርሕ ትርኢ።", icon: "fact" },
    { kicker: "ምዝንባል", title: "ምዝንባል ናብ ኩሉ ኣንፈት ይመርሕ።", body: "ንቕድሚት፣ ንድሕሪት፣ ንጸጋም ወይ ንየማን ኣዘንብል።", icon: "tilt" },
    { kicker: "ፓር", title: "ሰዓት ትሕቲ ወይ ላዕሊ ፓር ይብል።", body: "ቅልጡፍ እንተ ወዲእካ ትሕቲ ፓር ይብል።", icon: "clock" },
    { kicker: "ሰሌዳ", title: "ሰሌዳታት ከም ሰሌዳ ሰርኪት ይመስሉ።", body: "ነፍሲ ወከፍ ሰሌዳ ሕብሩ ኣለዎ። ነቲ ዝበርህ መገዲ ተኸተል።", icon: "open" },
  ],
};

function icon(kind: string) {
  if (kind === "open") return <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M8 12h8" stroke="currentColor" strokeWidth="2"/></svg>;
  if (kind === "fact") return <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 8v5" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>;
  if (kind === "tilt") return <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true"><rect x="6" y="4" width="12" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(12 12 12)"/></svg>;
  return <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="2"/></svg>;
}

function beats(lang: Lang): Beat[] {
  return STEPS[lang] || EN;
}

export function Induction({ onDone, forced }: { onDone: () => void; forced?: boolean }) {
  const [i, setI] = useState(0);
  const lang = readAccess().lang;
  const list = beats(lang);
  const beat = list[i] || list[0];
  const last = i >= list.length - 1;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-orange">
        {i + 1} / {list.length} · {beat.kicker}
      </p>
      <div className="flex items-center gap-3 text-cyan">
        {icon(beat.icon)}
        <h2 className="text-3xl leading-none font-extrabold tracking-tight">{beat.title}</h2>
      </div>
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
      <div className="flex flex-col gap-2">
        {GOALS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={goal === item.id}
            onClick={() => setGoal(item.id)}
            className="min-h-12 rounded-xl bg-navy-2 px-4 text-left text-base font-bold ring-1 ring-line"
          >
            {item.name}
          </button>
        ))}
      </div>
      <Button type="submit" disabled={!goal}>Play</Button>
    </form>
  );
}
