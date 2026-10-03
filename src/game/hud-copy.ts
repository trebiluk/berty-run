import type { Lang } from "@/game/hub";

/** Short HUD and results-rail words. rw, ti, and fa-AF need a native check. */
export type HudCopy = {
  jump: string;
  zap: string;
  levels2d: string;
  levels3d: string;
  show: string;
  hide: string;
  learnControls: string;
  turnTube: string;
  beat: string;
  gotIt: string;
  practice: string;
  hintHands3d: string;
  hintKeys3d: string;
  hintTilt: string;
  hintFollow: string;
  hintSteer: string;
  hintHands2d: string;
  hintKeys2d: string;
  hintPaste: string;
  hintVirus: string;
  hintStick: string;
  hintTouch: string;
  hintTouchZap: string;
};

const EN: HudCopy = {
  jump: "Jump",
  zap: "Zap",
  levels2d: "2D levels",
  levels3d: "3D levels",
  show: "Show",
  hide: "Hide",
  learnControls: "Learn the controls",
  turnTube: "Turn the tube",
  beat: "Beat {name}",
  gotIt: "{part} · got it",
  practice: "Practice",
  hintHands3d: "Left finger speed. Right finger steers.",
  hintKeys3d: "WASD and the mouse together. Center is straight.",
  hintTilt: "Tilt the top down to roll. Left and right steer.",
  hintFollow: "Hold a finger on the board. Berty rolls to it.",
  hintSteer: "Steer, or tap Lean to pick a grip.",
  hintHands2d: "Two thumbs. Either one leans. Both together is a choice.",
  hintKeys2d: "Hold the mouse on the board. Berty rolls to it.",
  hintPaste: "Paste slides. Drag Lean before the slick.",
  hintVirus: "A pink virus is in the lane. Get close, then tap Zap.",
  hintStick: "Stick or WASD. Jump is Space. Zap is E.",
  hintTouch: "Left thumb steers. Tap Jump.",
  hintTouchZap: "Left thumb steers. Tap Jump. Tap Zap to zap.",
};

const SIMPLE: HudCopy = {
  ...EN,
  learnControls: "Learn the buttons",
  hintHands3d: "Left finger is speed. Right finger turns.",
  hintKeys3d: "WASD and the mouse. The middle is straight.",
  hintTilt: "Tip the top down. Left and right turn.",
  hintFollow: "Hold a finger on the board. Berty goes there.",
  hintSteer: "Steer, or tap Lean to pick how.",
  hintHands2d: "Two thumbs. One leans. Both together picks.",
  hintKeys2d: "Hold the mouse on the board.",
  hintPaste: "Paste is slippery. Drag Lean first.",
  hintVirus: "A pink virus is in the lane. Get close, then tap Zap.",
  hintStick: "Stick or WASD. Jump is Space. Zap is E.",
  hintTouch: "Left thumb steers. Tap Jump.",
  hintTouchZap: "Left thumb steers. Tap Jump. Tap Zap to zap.",
};

const ES: HudCopy = {
  jump: "Salto",
  zap: "Zap",
  levels2d: "Niveles 2D",
  levels3d: "Niveles 3D",
  show: "Ver",
  hide: "Ocultar",
  learnControls: "Aprende los controles",
  turnTube: "Gira el tubo",
  beat: "Vence {name}",
  gotIt: "{part} · listo",
  practice: "Práctica",
  hintHands3d: "Dedo izquierdo: velocidad. Dedo derecho: gira.",
  hintKeys3d: "WASD y el ratón juntos. El centro es recto.",
  hintTilt: "Inclina la parte de arriba. Izquierda y derecha giran.",
  hintFollow: "Deja un dedo en el tablero. Berty va hacia él.",
  hintSteer: "Gira, o toca Palanca para elegir.",
  hintHands2d: "Dos pulgares. Uno inclina. Los dos juntos eligen.",
  hintKeys2d: "Deja el ratón en el tablero. Berty va hacia él.",
  hintPaste: "La pasta resbala. Arrastra Palanca antes.",
  hintVirus: "Hay un virus rosa. Acércate y toca Zap.",
  hintStick: "Palanca o WASD. Salto es Espacio. Zap es E.",
  hintTouch: "El pulgar izquierdo gira. Toca Salto.",
  hintTouchZap: "El pulgar izquierdo gira. Toca Salto. Toca Zap para zapear.",
};

const UK: HudCopy = {
  jump: "Стрибок",
  zap: "Зап",
  levels2d: "Рівні 2D",
  levels3d: "Рівні 3D",
  show: "Показати",
  hide: "Сховати",
  learnControls: "Вивчи керування",
  turnTube: "Поверни трубу",
  beat: "Обжени {name}",
  gotIt: "{part} · є",
  practice: "Тренування",
  hintHands3d: "Лівий палець — швидкість. Правий керує.",
  hintKeys3d: "WASD і миша разом. Центр — прямо.",
  hintTilt: "Нахили верх, щоб котитись. Ліво і право керують.",
  hintFollow: "Тримай палець на дошці. Берті котиться туди.",
  hintSteer: "Керуй, або торкни Нахил і вибери хват.",
  hintHands2d: "Два великі пальці. Один нахиляє. Разом — вибір.",
  hintKeys2d: "Тримай мишу на дошці. Берті котиться туди.",
  hintPaste: "Паста слизька. Потягни Нахил до неї.",
  hintVirus: "Рожевий вірус на доріжці. Підійди і натисни Зап.",
  hintStick: "Стік або WASD. Стрибок — пробіл. Зап — E.",
  hintTouch: "Лівий палець керує. Торкни Стрибок.",
  hintTouchZap: "Лівий палець керує. Торкни Стрибок. Торкни Зап, щоб запнути.",
};

const RU: HudCopy = {
  jump: "Прыжок",
  zap: "Зап",
  levels2d: "Уровни 2D",
  levels3d: "Уровни 3D",
  show: "Показать",
  hide: "Скрыть",
  learnControls: "Выучи управление",
  turnTube: "Поверни трубу",
  beat: "Обыграй {name}",
  gotIt: "{part} · есть",
  practice: "Тренировка",
  hintHands3d: "Левый палец — скорость. Правый рулит.",
  hintKeys3d: "WASD и мышь вместе. Центр — прямо.",
  hintTilt: "Наклони верх, чтобы катиться. Лево и право рулят.",
  hintFollow: "Держи палец на доске. Берти катится туда.",
  hintSteer: "Рули, или нажми Наклон и выбери хват.",
  hintHands2d: "Два больших пальца. Один наклоняет. Вместе — выбор.",
  hintKeys2d: "Держи мышь на доске. Берти катится туда.",
  hintPaste: "Паста скользкая. Потяни Наклон до неё.",
  hintVirus: "Розовый вирус на дорожке. Подойди и нажми Зап.",
  hintStick: "Стик или WASD. Прыжок — пробел. Зап — E.",
  hintTouch: "Левый палец рулит. Нажми Прыжок.",
  hintTouchZap: "Левый палец рулит. Нажми Прыжок. Нажми Зап, чтобы запнуть.",
};

const AR: HudCopy = {
  jump: "اقفز",
  zap: "زاب",
  levels2d: "مستويات 2D",
  levels3d: "مستويات 3D",
  show: "أظهر",
  hide: "أخفِ",
  learnControls: "تعلّم التحكم",
  turnTube: "أدر الأنبوب",
  beat: "اهزم {name}",
  gotIt: "{part} · تم",
  practice: "تدريب",
  hintHands3d: "الإصبع اليسرى للسرعة. اليمنى توجه.",
  hintKeys3d: "WASD والفأرة معًا. الوسط مستقيم.",
  hintTilt: "أمِل الأعلى ليتدحرج. اليسار واليمين يوجهان.",
  hintFollow: "أبقِ إصبعًا على اللوح. بيرتي يتدحرج إليه.",
  hintSteer: "وجّه، أو المس الميل لتختار القبضة.",
  hintHands2d: "إبهامين. واحد يميل. الاثنان معًا اختيار.",
  hintKeys2d: "أبقِ الفأرة على اللوح. بيرتي يتدحرج إليها.",
  hintPaste: "المعجون يزلق. اسحب الميل قبل الزلق.",
  hintVirus: "فيروس وردي في الممر. اقترب ثم المس زاب.",
  hintStick: "العصا أو WASD. القفز مسافة. زاب هو E.",
  hintTouch: "الإبهام الأيسر يوجه. المس القفز.",
  hintTouchZap: "الإبهام الأيسر يوجه. المس القفز. المس زاب للزاب.",
};

/** Dari (fa-AF), not Iranian Persian. Needs a native check. */
const FA: HudCopy = {
  jump: "بپر",
  zap: "زاپ",
  levels2d: "مرحله‌های 2D",
  levels3d: "مرحله‌های 3D",
  show: "نشان بده",
  hide: "پنهان کن",
  learnControls: "کنترل را بیاموز",
  turnTube: "لوله را بپرخان",
  beat: "{name} را ببر",
  gotIt: "{part} · شد",
  practice: "تمرین",
  hintHands3d: "انگشت چپ سرعت است. انگشت راست لار می‌دهد.",
  hintKeys3d: "WASD و ماوس یکجا. وسط مستقیم است.",
  hintTilt: "سر را خم کن تا بغلطد. چپ و راست لار است.",
  hintFollow: "انگشت را روی تخته نگه دار. برتی به آنجا می‌رود.",
  hintSteer: "لار بده، یا Lean را بزن تا شیوه را برگزینی.",
  hintHands2d: "دو شست. یکی خم می‌کند. هر دو یکجا انتخاب است.",
  hintKeys2d: "ماوس را روی تخته نگه دار. برتی به آنجا می‌رود.",
  hintPaste: "خمیر لیز است. پیش از لغزش Lean را بکش.",
  hintVirus: "ویروس گلابی در راه است. نزدیک شو، بعد زاپ بزن.",
  hintStick: "سویچ یا WASD. پرش Space است. زاپ E است.",
  hintTouch: "شست چپ می‌راند. پرش را بزن.",
  hintTouchZap: "شست چپ می‌راند. پرش را بزن. زاپ را بزن تا بزنی.",
};

/** Ikinyarwanda. Needs a native check. */
const RW: HudCopy = {
  jump: "Simbuka",
  zap: "Zap",
  levels2d: "Ibyiciro 2D",
  levels3d: "Ibyiciro 3D",
  show: "Erekana",
  hide: "Hisha",
  learnControls: "Iga uko ukora",
  turnTube: "Zunguza umuhora",
  beat: "Tsinza {name}",
  gotIt: "{part} · birarangiye",
  practice: "Imyitozo",
  hintHands3d: "Urutoki rw'ibumoso ni umuvuduko. Urw'iburyo ruyobora.",
  hintKeys3d: "WASD n'imbeba hamwe. Hagati ni mu muhanda.",
  hintTilt: "Zungurura hejuru ngo yikinguke. Ibumoso n'iburyo biyobora.",
  hintFollow: "Fata urutoki ku kibaho. Berty yerekeza aho.",
  hintSteer: "Yobora, cyangwa kanda Lean uhitemo.",
  hintHands2d: "Inguni ebyiri. Imwe yunama. Zombi hamwe ni guhitamo.",
  hintKeys2d: "Fata imbeba ku kibaho. Berty yerekeza aho.",
  hintPaste: "Umutobe uratera. Kurura Lean mbere.",
  hintVirus: "Virusi y'iroza iri mu muhanda. Eguka, ukande Zap.",
  hintStick: "Agakoni cyangwa WASD. Gusimbuka ni Space. Zap ni E.",
  hintTouch: "Agakono k'ibumoso kayobora. Kanda Gusimbuka.",
  hintTouchZap: "Agakono k'ibumoso kayobora. Kanda Gusimbuka. Kanda Zap kugira ngo uzape.",
};

/** ትግርኛ (Ge'ez). Needs a native check. */
const TI: HudCopy = {
  jump: "ዘሊ",
  zap: "ዛፕ",
  levels2d: "ደረጃታት 2D",
  levels3d: "ደረጃታት 3D",
  show: "ኣርኢ",
  hide: "ሕባእ",
  learnControls: "መቆጻጸሪ ተማሕር",
  turnTube: "ቱቦ ዘውር",
  beat: "{name} ስዓብ",
  gotIt: "{part} · ተረኺቡ",
  practice: "ልምምድ",
  hintHands3d: "ጸጋማይ ኣጻብዕ ፍጥነት እዩ። የማናይ የመርሕ።",
  hintKeys3d: "WASDን ማውስን ብሓንሳብ። ማእኸል ቀጥታ እዩ።",
  hintTilt: "ላዕሊ ኣንክል ንኽንከባበር። ጸጋምን የማንን የመርሑ።",
  hintFollow: "ኣጻብዕ ኣብ ሰሌዳ ሓዝ። በርቲ ናብኡ ይንከባበር።",
  hintSteer: "መርሕ፣ ወይ ንኽትመርጽ Lean ጠውቕ።",
  hintHands2d: "ክልተ ኣጻብዕ። ሓደ የንክል። ክልቲኡ ብሓንሳብ ምርጫ እዩ።",
  hintKeys2d: "ማውስ ኣብ ሰሌዳ ሓዝ። በርቲ ናብኡ ይንከባበር።",
  hintPaste: "ለቕለቕ ይንሽር። ቅድሚ ምንሽራር Lean ጎተት።",
  hintVirus: "ሮዛ ቫይረስ ኣብ መንገዲ ኣሎ። ቀረብ፣ ድሕሪኡ ዛፕ ጠውቕ።",
  hintStick: "ስቲክ ወይ WASD። ዘላይ Space እዩ። ዛፕ E እዩ።",
  hintTouch: "ጸጋም ኣጻብዕ የመርሕ። ዘላይ ጠውቕ።",
  hintTouchZap: "ጸጋም ኣጻብዕ የመርሕ። ዘላይ ጠውቕ። ዛፕ ንኽትዛፕ ጠውቕ።",
};

const ALL: Record<Lang, HudCopy> = {
  en: EN,
  simple: SIMPLE,
  es: ES,
  uk: UK,
  ru: RU,
  ar: AR,
  "fa-AF": FA,
  rw: RW,
  ti: TI,
};

export function hudCopy(lang: Lang): HudCopy {
  return ALL[lang] ?? EN;
}

export function fillHud(template: string, extra: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => extra[key] ?? "");
}

type LineBag = Partial<Record<Lang, string>>;

/** Exact engine lines. Missing language falls back to the English sentence. */
const LINES: Record<string, LineBag> = {
  "No best time yet. Set one!": {
    simple: "No best time yet. Set one!",
    uk: "Ще немає кращого часу. Постав свій!",
    ru: "Лучшего времени ещё нет. Поставь своё!",
    es: "Aún no hay mejor tiempo. ¡Pon uno!",
    ar: "لا يوجد أفضل وقت بعد. ضع واحدًا!",
    "fa-AF": "هنوز بهترین وقت نیست. یکی بگذار!",
    rw: "Nta mwanya mwiza urabaho. Shyira umwe!",
    ti: "ዝበለጸ ግዜ የለን። ሓደ ኣቐምጥ!",
  },
  "You hold the best time": {
    simple: "You have the best time.",
    uk: "У тебе найкращий час",
    ru: "У тебя лучшее время",
    es: "Tienes el mejor tiempo",
    ar: "وقتك هو الأفضل",
    "fa-AF": "بهترین وقت پیش تو است",
    rw: "Ufite umwanya mwiza",
    ti: "ዝበለጸ ግዜ ኣብ ኢድካ እዩ",
  },
  "Hold a finger where Berty should roll.": {
    simple: "Touch where Berty should go.",
    uk: "Тримай палець, куди Берті має котитись.",
    ru: "Держи палец, куда Берти должен катиться.",
    es: "Deja un dedo donde Berty debe rodar.",
    ar: "أبقِ إصبعًا حيث يجب أن يتدحرج بيرتي.",
    "fa-AF": "انگشت را جایی بگذار که برتی بغلطد.",
    rw: "Shyira urutoki aho Berty agomba kujya.",
    ti: "ኣጻብዕ ኣብ ዝንከባበር ቦታ በርቲ ኣቐምጥ።",
  },
  "This angle is straight. Tilt the top down to roll.": {
    simple: "This way is straight. Tip the top to roll.",
    uk: "Цей кут прямий. Нахили верх, щоб котитись.",
    ru: "Этот угол прямой. Наклони верх, чтобы катиться.",
    es: "Este ángulo es recto. Inclina arriba para rodar.",
    ar: "هذه الزاوية مستقيمة. أمِل الأعلى ليتدحرج.",
    "fa-AF": "این زاویه مستقیم است. سر را خم کن تا بغلطد.",
    rw: "Uyu mwanya ni mu muhanda. Zungurura hejuru ngo yikinguke.",
    ti: "እዚ ኩርናዕ ቀጥታ እዩ። ላዕሊ ኣንክል ንኽንከባበር።",
  },
  "Tilt the phone. The board leans with it.": {
    simple: "Tip the phone. The board tips too.",
    uk: "Нахили телефон. Дошка нахиляється з ним.",
    ru: "Наклони телефон. Доска наклоняется с ним.",
    es: "Inclina el teléfono. El tablero se inclina.",
    ar: "أمِل الهاتف. اللوح يميل معه.",
    "fa-AF": "تلفن را خم کن. تخته هم خم می‌شود.",
    rw: "Zungurura telefoni. Ikibaho kinama na cyo.",
    ti: "ተሌፎን ኣንክል። ሰሌዳ ምስኡ ትንከል።",
  },
  "WASD and the mouse together. Center is straight. Up rolls forward.": {
    simple: "WASD and the mouse. Middle is straight. Up goes forward.",
    uk: "WASD і миша разом. Центр прямо. Вгору — вперед.",
    ru: "WASD и мышь вместе. Центр прямо. Вверх — вперёд.",
    es: "WASD y el ratón juntos. El centro es recto. Arriba avanza.",
    ar: "WASD والفأرة معًا. الوسط مستقيم. الأعلى يتقدم.",
    "fa-AF": "WASD و ماوس یکجا. وسط مستقیم است. بالا به پیش می‌رود.",
    rw: "WASD n'imbeba hamwe. Hagati ni mu muhanda. Hejuru ijya imbere.",
    ti: "WASDን ማውስን ብሓንሳብ። ማእኸል ቀጥታ እዩ። ላዕሊ ንቕድሚት ይንከባበር።",
  },
  "Hold the mouse on the board. Berty rolls to it.": {
    simple: "Hold the mouse on the board. Berty goes there.",
    uk: "Тримай мишу на дошці. Берті котиться туди.",
    ru: "Держи мышь на доске. Берти катится туда.",
    es: "Deja el ratón en el tablero. Berty va hacia él.",
    ar: "أبقِ الفأرة على اللوح. بيرتي يتدحرج إليها.",
    "fa-AF": "ماوس را روی تخته نگه دار. برتی به آنجا می‌رود.",
    rw: "Fata imbeba ku kibaho. Berty yerekeza aho.",
    ti: "ማውስ ኣብ ሰሌዳ ሓዝ። በርቲ ናብኡ ይንከባበር።",
  },
  "Left finger is speed. Right finger steers.": {
    simple: "Left finger is speed. Right finger turns.",
    uk: "Лівий палець — швидкість. Правий керує.",
    ru: "Левый палец — скорость. Правый рулит.",
    es: "Dedo izquierdo: velocidad. Dedo derecho: gira.",
    ar: "الإصبع اليسرى للسرعة. اليمنى توجه.",
    "fa-AF": "انگشت چپ سرعت است. انگشت راست لار می‌دهد.",
    rw: "Urutoki rw'ibumoso ni umuvuduko. Urw'iburyo ruyobora.",
    ti: "ጸጋማይ ኣጻብዕ ፍጥነት እዩ። የማናይ የመርሕ።",
  },
  "Either thumb leans. Both together is a choice.": {
    simple: "Either thumb leans. Both together picks.",
    uk: "Будь-який палець нахиляє. Разом — вибір.",
    ru: "Любой палец наклоняет. Вместе — выбор.",
    es: "Cualquier pulgar inclina. Los dos juntos eligen.",
    ar: "أي إبهام يميل. الاثنان معًا اختيار.",
    "fa-AF": "هر شست خم می‌کند. هر دو یکجا انتخاب است.",
    rw: "Inguni iyo ari yo yose yunama. Zombi hamwe ni guhitamo.",
    ti: "ዝኾነ ኣጻብዕ የንክል። ክልቲኡ ብሓንሳብ ምርጫ እዩ።",
  },
  "Tap Allow on the tilt question, or use Steer.": {
    simple: "Tap Allow, or use Steer.",
    uk: "Торкни Дозволити, або обери Кермо.",
    ru: "Нажми Разрешить, или выбери Руль.",
    es: "Toca Permitir, o usa el volante.",
    ar: "المس السماح، أو استخدم التوجيه.",
    "fa-AF": "اجازه را بزن، یا لار را برگزین.",
    rw: "Kanda Emerera, cyangwa koresha kuyobora.",
    ti: "ፍቐድ ጠውቕ፣ ወይ መርሕ ተጠቐም።",
  },
  "This phone is not sending tilt. Use Lean, or allow motion sensors.": {
    simple: "This phone has no tilt. Use Lean, or allow motion.",
    uk: "Телефон не шле нахил. Обери Нахил або дозволь датчик.",
    ru: "Телефон не шлёт наклон. Выбери Наклон или разреши датчик.",
    es: "El teléfono no manda inclinación. Usa Palanca o permite el sensor.",
    ar: "الهاتف لا يرسل الميل. استخدم الميل أو اسمح بالحساس.",
    "fa-AF": "تلفن خم شدن را نمی‌فرستد. Lean را بزن یا سنسور را اجازه بده.",
    rw: "Telefoni ntabwo itanga kunama. Koresha Lean, cyangwa emerera senseri.",
    ti: "እዚ ተሌፎን ኣንክላ ኣይሰድድን። Lean ተጠቐም፣ ወይ ሴንሰር ፍቀድ።",
  },
  "Stay on my road. Jump a lock. I roll with you.": {
    simple: "Stay on the road. Jump a lock. I roll with you.",
    uk: "Тримайся моєї доріжки. Стрибай через замок. Я кочусь з тобою.",
    ru: "Держись моей дорожки. Прыгай через замок. Я качусь с тобой.",
    es: "Quédate en mi camino. Salta un candado. Ruedo contigo.",
    ar: "ابقَ على طريقي. اقفز فوق القفل. أتدحرج معك.",
    "fa-AF": "در راه من بمان. از قفل بپر. با تو می‌غلطم.",
    rw: "Guma ku muhanda wanjye. Simbuka urufunguzo. Nkinguka nawe.",
    ti: "ኣብ መንገደይ ጽናሕ። መዕጸዊ ዘሊ። ምስኻ እንከባበር።",
  },
  "All bits in my pocket. Roll me into the port.": {
    simple: "All bits are in. Roll me to the door.",
    uk: "Усі біти в кишені. Закоти мене в порт.",
    ru: "Все биты в кармане. Закати меня в порт.",
    es: "Todos los datos en el bolsillo. Rueda al puerto.",
    ar: "كل البتات في جيبي. دحرجني إلى المنفذ.",
    "fa-AF": "همه بیت‌ها در جیب است. مرا به پورت بغلطان.",
    rw: "Bits zose ziri mu mufuka. Nkingukize mu muryango.",
    ti: "ኩሉ ቢት ኣብ ጁቢ እዩ። ናብ ፖርት ኣንከባብረኒ።",
  },
  "Still with you. Take a slower line.": {
    simple: "Still here. Go a little slower.",
    uk: "Я ще з тобою. Візьми повільнішу лінію.",
    ru: "Я ещё с тобой. Возьми линию помедленнее.",
    es: "Sigo contigo. Toma una línea más lenta.",
    ar: "ما زلت معك. خذ خطًا أبطأ.",
    "fa-AF": "هنوز با توام. راه آهسته‌تر بگیر.",
    rw: "Ndi kumwe nawe. Fata umurongo woroheje.",
    ti: "ገና ምስኻ እየ። ዝንእስ መስመር ውሰድ።",
  },
  "That was my last heart.": {
    simple: "That was my last heart.",
    uk: "Це було моє останнє серце.",
    ru: "Это было моё последнее сердце.",
    es: "Ese era mi último corazón.",
    ar: "ذلك كان آخر قلب.",
    "fa-AF": "این آخرین قلب من بود.",
    rw: "Ibyo byari umutima wanjye wa nyuma.",
    ti: "እዚ ናይ መወዳእታ ልበይ እዩ።",
  },
  "Virus deleted. Antivirus removes that copy.": {
    simple: "Virus gone. The cleaner removed it.",
    uk: "Вірус стерто. Антивірус прибрав ту копію.",
    ru: "Вирус стёрт. Антивирус убрал ту копию.",
    es: "Virus borrado. El antivirus quitó esa copia.",
    ar: "حُذف الفيروس. مضاد الفيروسات أزال تلك النسخة.",
    "fa-AF": "ویروس پاک شد. ضدویروس آن کاپی را برداشت.",
    rw: "Virusi yasibwe. Antivirus yakuye iyo kopi.",
    ti: "ቫይረስ ተደምሲሱ። ኣንቲቫይረስ ነቲ ቅዳሕ ኣውጺኡ።",
  },
  "Move closer, then tap Zap. It does not fire by itself.": {
    simple: "Get closer, then tap Zap.",
    uk: "Підійди ближче, тоді Зап. Сам він не стріляє.",
    ru: "Подойди ближе, потом Зап. Сам он не стреляет.",
    es: "Acércate y toca Zap. No dispara solo.",
    ar: "اقترب ثم المس زاب. لا يطلق وحده.",
    "fa-AF": "نزدیک شو، بعد زاپ بزن. خودش شلیک نمی‌کند.",
    rw: "Eguka, ukande Zap. Ntizikorana ubwayo.",
    ti: "ቀረብ፣ ድሕሪኡ ዛፕ ጠውቕ። ባዕሉ ኣይተኽልን።",
  },
  "Hop. Jump a pit or a fan. Walls still stop you.": {
    simple: "Hop. Jump a hole or a fan. Walls still stop you.",
    uk: "Стрибай. Яму чи вентилятор. Стіни все одно спиняють.",
    ru: "Прыгай. Яму или вентилятор. Стены всё равно останавливают.",
    es: "Salta. Un hueco o un ventilador. Los muros sí paran.",
    ar: "اقفز. حفرة أو مروحة. الجدران ما زالت توقفك.",
    "fa-AF": "بپر. از چقوری یا پکه. دیوار هنوز تو را می‌ایستاند.",
    rw: "Simbuka. Umwobo cyangwa umuyaga. Inkuta ziraguhagarika.",
    ti: "ዘሊ። ጉድጓድ ወይ ፋን። መንደቕ ገና የቋርጸካ።",
  },
  "That hole is an open socket. Hop it, or go around.": {
    simple: "That hole is an open socket. Jump it, or go around.",
    uk: "Ця яма — відкрите гніздо. Стрибай, або обійди.",
    ru: "Эта яма — открытое гнездо. Прыгай или обойди.",
    es: "Ese hueco es un zócalo abierto. Sáltalo o rodéalo.",
    ar: "تلك الحفرة مقبس مفتوح. اقفزه أو دُر حوله.",
    "fa-AF": "آن چقوری یک سوکت باز است. بپر یا دور بزن.",
    rw: "Uwo mwobo ni socket ifunguye. Simbuka, cyangwa zenguruka.",
    ti: "እቲ ጉድጓድ ክፉት ሶኬት እዩ። ዘሊ ወይ ዞር።",
  },
  "Those blades are a cooling fan. Wait, or hop.": {
    simple: "Those blades are a fan. Wait, or jump.",
    uk: "Ці лопаті — вентилятор. Зачекай або стрибай.",
    ru: "Эти лопасти — вентилятор. Подожди или прыгай.",
    es: "Esas aspas son un ventilador. Espera o salta.",
    ar: "تلك الريش مروحة تبريد. انتظر أو اقفز.",
    "fa-AF": "آن پرها پکه سردکننده است. صبر کن یا بپر.",
    rw: "Ayo mapapa ni umuyaga. Tegereza, cyangwa simbuka.",
    ti: "እቶም ክንፊ ፋን ምዝሓል እዮም። ተጸበ ወይ ዘሊ።",
  },
  "Slick lane. Thermal paste slides. Steer before it.": {
    simple: "Slippery lane. Paste slides. Steer first.",
    uk: "Слизька доріжка. Термопаста ковзає. Керуй заздалегідь.",
    ru: "Скользкая дорожка. Термопаста скользит. Рули заранее.",
    es: "Carril resbaloso. La pasta se desliza. Gira antes.",
    ar: "ممر زلق. المعجون ينزلق. وجّه قبله.",
    "fa-AF": "راه لیز. خمیر گرما می‌لغزد. پیش از آن لار بده.",
    rw: "Umurongo uterera. Umutobe w'ubushyuhe uraterera. Yobora mbere.",
    ti: "ዝንሽር መንገዲ። ለቕለቕ ሙቐት ይንሽር። ቅድሚኡ መርሕ።",
  },
  "Two bits close together. I like a streak.": {
    simple: "Two bits close together. I like a streak.",
    uk: "Два біти близько. Мені подобається серія.",
    ru: "Два бита рядом. Мне нравится серия.",
    es: "Dos datos juntos. Me gusta la racha.",
    ar: "بتّان قريبان. أحب السلسلة.",
    "fa-AF": "دو بیت نزدیک هم. سلسله را دوست دارم.",
    rw: "Bits ebyiri hafi. Nkunda urukurikirane.",
    ti: "ክልተ ቢት ቀረባ። ሰንሰለት ይፍትወኒ።",
  },
  "Jump. Hop a lock, or a low fan.": {
    simple: "Jump. Hop a lock, or a low fan.",
    uk: "Стрибай. Через замок або низький вентилятор.",
    ru: "Прыгай. Через замок или низкий вентилятор.",
    es: "Salta. Un candado o un ventilador bajo.",
    ar: "اقفز. قفل أو مروحة منخفضة.",
    "fa-AF": "بپر. از قفل یا پکه کوتاه.",
    rw: "Simbuka. Urufunguzo cyangwa umuyaga uri hasi.",
    ti: "ዘሊ። መዕጸዊ ወይ ትሑት ፋን።",
  },
  "Defrag. Files get packed. You get a push.": {
    simple: "Defrag. Files pack up. You get a push.",
    uk: "Дефраг. Файли складаються. Тебе штовхає.",
    ru: "Дефраг. Файлы складываются. Тебя толкает.",
    es: "Desfragmentar. Los archivos se juntan. Te da un empujón.",
    ar: "ترتيب الملفات. تتجمع. تحصل على دفعة.",
    "fa-AF": "دیفرگ. فایل‌ها جمع می‌شوند. یک هل می‌گیری.",
    rw: "Defrag. Dosiye zisanzaye. Uhabwa umusunikiro.",
    ti: "ዲፍራግ። ፋይላት ይእከቡ። ምድፋእ ትረክብ።",
  },
  "Back at the ring. One heart.": {
    simple: "Back at the ring. One heart.",
    uk: "Знову на кільці. Мінус серце.",
    ru: "Снова на кольце. Минус сердце.",
    es: "Otra vez en el anillo. Un corazón.",
    ar: "عدت إلى الحلقة. قلب واحد.",
    "fa-AF": "باز سر حلقه. یک قلب.",
    rw: "Wasubiye ku mpeta. Umutima umwe.",
    ti: "ዳግማይ ኣብ ቀለቤት። ሓደ ልቢ።",
  },
  "Back on the board. Steer a little less.": {
    simple: "Back on the board. Steer a little less.",
    uk: "Знову на дошці. Керуй трохи менше.",
    ru: "Снова на доске. Рули чуть меньше.",
    es: "Otra vez en el tablero. Gira un poco menos.",
    ar: "عدت إلى اللوح. وجّه أقل قليلًا.",
    "fa-AF": "باز روی تخته. کمی کمتر لار بده.",
    rw: "Wasubiye ku kibaho. Yobora gato.",
    ti: "ዳግማይ ኣብ ሰሌዳ። ቁሩብ ውሕድ መርሕ።",
  },
  "Worm. It crawls to the next machine. Zap stops it.": {
    simple: "Worm. It crawls to the next machine. Zap stops it.",
    uk: "Черв'як. Повзає до наступної машини. Зап зупиняє.",
    ru: "Червь. Ползёт к следующей машине. Зап останавливает.",
    es: "Gusano. Se arrastra a la otra máquina. Zap lo para.",
    ar: "دودة. تزحف إلى الجهاز التالي. زاب يوقفها.",
    "fa-AF": "کرم. به کمپیوتر بعدی می‌خزد. زاپ آن را می‌ایستاند.",
    rw: "Inzoka. Irerembera ku mudasobwa ikurikira. Zap iyihagarika.",
    ti: "ትእንቲ። ናብ ዝቕጽል ኮምፒተር ትንቀሳቐስ። ዛፕ የቋርጻ።",
  },
  "Ransomware. It locks the path. Jump it, or zap it.": {
    simple: "Ransomware. It locks the path. Jump it, or zap it.",
    uk: "Вимагач. Замикає шлях. Стрибай або Зап.",
    ru: "Вымогатель. Запирает путь. Прыгай или Зап.",
    es: "Secuestrador. Cierra el camino. Sáltalo o zapéalo.",
    ar: "فدية. تقفل الطريق. اقفزها أو اضربها بزاب.",
    "fa-AF": "باج‌افزار. راه را قفل می‌کند. بپر یا زاپ بزن.",
    rw: "Ransomware. Ifunga inzira. Simbuka, cyangwa Zap.",
    ti: "ራንሰምዌር። መንገዲ ይዓጽው። ዘልዮ ወይ ዛፕ ግበሮ።",
  },
  "Virus. It copies itself. Zap deletes that copy.": {
    simple: "Virus. It copies itself. Zap deletes that copy.",
    uk: "Вірус. Копіює себе. Зап стирає ту копію.",
    ru: "Вирус. Копирует себя. Зап стирает ту копию.",
    es: "Virus. Se copia. Zap borra esa copia.",
    ar: "فيروس. ينسخ نفسه. زاب يمسح تلك النسخة.",
    "fa-AF": "ویروس. از خود کاپی می‌سازد. زاپ آن کاپی را پاک می‌کند.",
    rw: "Virusi. Iyikopisha. Zap isiba iyo kopi.",
    ti: "ቫይረስ። ባዕሉ ይቕድሕ። ዛፕ ነቲ ቅዳሕ የጥፍእ።",
  },
};

const AROUND: Record<Lang, string> = {
  en: "Or steer around it.",
  simple: "Or go around it.",
  uk: "Або об'їдь.",
  ru: "Или объедь.",
  es: "O rodéalo.",
  ar: "أو دُر حوله.",
  "fa-AF": "یا دورش بزن.",
  rw: "Cyangwa uzenguruke.",
  ti: "ወይ ዞሮ።",
};

export function localizeLine(lang: Lang, text: string): string {
  const raw = String(text || "");
  if (!raw || lang === "en") return raw;
  const hit = LINES[raw]?.[lang];
  if (hit) return hit;
  const around = " Or steer around it.";
  if (raw.endsWith(around)) {
    const base = raw.slice(0, -around.length);
    const translated = LINES[base]?.[lang];
    if (translated) return `${translated} ${AROUND[lang] || AROUND.en}`;
  }
  const beat = raw.match(/^Beat (.+) (\d+:\d+\.\d+)$/);
  if (beat) {
    const templates: LineBag = {
      simple: "Beat {name} {time}",
      uk: "Обжени {name} {time}",
      ru: "Обыграй {name} {time}",
      es: "Vence a {name} {time}",
      ar: "اهزم {name} {time}",
      "fa-AF": "{name} را در {time} ببر",
      rw: "Tsinza {name} {time}",
      ti: "{name} ኣብ {time} ስዓብ",
    };
    const template = templates[lang];
    if (template) return fillHud(template, { name: beat[1], time: beat[2] });
  }
  return raw;
}

