import { applyDom, normLang, sayLine, type Lang } from "@/game/hub";
import { QUIZ } from "@/game/quiz";

export type { Lang };

export type Access = {
  lang: Lang;
  speak: boolean;
  big: boolean;
  fewer: boolean;
  follow: boolean;
  tilt: boolean;
  mouse: boolean;
  hands: boolean;
  drive: Drive;
};

const KEY = "br-access-v1";

export type Drive = "lean" | "hands" | "keys" | "follow" | "tilt";

export const DRIVES: { id: Drive; name: string; line: string }[] = [
  { id: "lean", name: "Lean", line: "One stick, or WASD." },
  { id: "hands", name: "Two hands", line: "Two thumbs on a phone. Two fingers on a touch screen." },
  { id: "keys", name: "Keys + mouse", line: "2D: hold the mouse, Berty follows. 3D: WASD plus mouse." },
  { id: "follow", name: "Follow", line: "Put a finger where Berty should roll." },
  { id: "tilt", name: "Tilt", line: "Tip the iPad. Many Chromebooks have no sensor." },
];

export function driveOf(raw: Partial<Access> | null | undefined): Drive {
  const id = raw?.drive;
  if (id === "lean" || id === "hands" || id === "keys" || id === "follow" || id === "tilt") return id;
  if (raw?.follow) return "follow";
  if (raw?.tilt) return "tilt";
  if (raw?.mouse) return "keys";
  if (raw?.hands) return "hands";
  return "lean";
}

export function drivePatch(drive: Drive): Pick<Access, "drive" | "hands" | "mouse" | "follow" | "tilt"> {
  return {
    drive,
    hands: drive === "hands",
    mouse: drive === "keys",
    follow: drive === "follow",
    tilt: drive === "tilt",
  };
}

export const ACCESS_DEFAULT: Access = { lang: "en", speak: false, big: false, fewer: false, follow: false, tilt: false, mouse: false, hands: false, drive: "lean" };

export function readAccess(): Access {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<Access>;
    const lang = normLang(raw.lang) || "en";
    const drive = driveOf(raw);
    const flags = drivePatch(drive);
    return { lang, speak: !!raw.speak, big: !!raw.big, fewer: !!raw.fewer, ...flags };
  } catch {
    return ACCESS_DEFAULT;
  }
}

export function writeAccess(next: Access) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  document.documentElement.dataset.big = next.big ? "1" : "0";
  document.documentElement.dataset.lang = next.lang;
  applyDom(next.lang);
  window.dispatchEvent(new Event("br-access"));
}

/** iPads need a tap before tilt events. Android usually just fires them. */
export async function askTilt(): Promise<boolean> {
  if (typeof window === "undefined" || typeof window.DeviceOrientationEvent === "undefined") return false;
  const Ori = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
  if (typeof Ori.requestPermission === "function") {
    try {
      return (await Ori.requestPermission()) === "granted";
    } catch {
      return false;
    }
  }
  const perms = navigator.permissions;
  if (perms?.query) {
    try {
      for (const name of ["accelerometer", "gyroscope"]) {
        const status = await perms.query({ name: name as PermissionName });
        if (status.state === "denied") return false;
      }
    } catch {
      /* this browser has no sensor permission name; the events may still arrive */
    }
  }
  return true;
}

export function say(text: string, lang: Lang) {
  sayLine(text, lang);
}

export function stopSay() {
  window.speechSynthesis?.cancel();
}

type Pack = { title: string; line: string; prompt: string; choices: string[]; help: string };

const SIMPLE: Record<string, Pack> = {
  storage: {
    title: "Storage",
    line: "Storage keeps files when the power is off.",
    prompt: "How is an SSD different from RAM?",
    choices: ["RAM is always bigger", "An SSD keeps files when the power is off. RAM does not.", "RAM is only for pictures", "They are the same"],
    help: "RAM = short memory. It forgets. SSD = storage. It keeps files.",
  },
  board: {
    title: "Motherboard",
    line: "The motherboard is the big board. The other parts plug into it.",
    prompt: "What do the metal lines on the board carry?",
    choices: ["Water", "Electric signals", "Cool air", "Sound"],
    help: "Traces = metal lines that carry signals.",
  },
  power: {
    title: "Power",
    line: "The power supply turns wall power into power the chips can use.",
    prompt: "What does a power supply do?",
    choices: ["Stores files", "Changes wall power so chips can use it", "Draws the screen", "Cools the CPU with water only"],
    help: "PSU = power supply. It feeds the parts.",
  },
  cpu: {
    title: "CPU",
    line: "The CPU follows instructions, one step at a time.",
    prompt: "What does the CPU do, in order?",
    choices: ["Heat, cool, sleep", "Get an instruction, read it, do it", "Click, drag, save", "Ping, pong, pause"],
    help: "CPU = the chip that does the thinking.",
  },
  ram: {
    title: "RAM",
    line: "RAM is fast memory. Turn the power off and it forgets.",
    prompt: "Why does RAM forget when you unplug?",
    choices: ["It is shy", "It needs power to hold the bits", "The SSD deletes it", "The metal lines melt"],
    help: "RAM forgets without power. Save your work.",
  },
  cool: {
    title: "Cooling",
    line: "Chips get hot. Fans and paste move the heat out.",
    prompt: "What is thermal paste for?",
    choices: ["To glue the GPU down", "To help heat move into the cooler", "To store files", "To paint the board"],
    help: "Paste helps heat leave the chip.",
  },
  gpu: {
    title: "GPU",
    line: "A GPU draws many pixels at the same time.",
    prompt: "Why is a GPU fast at pictures?",
    choices: ["It has a bigger button", "It does many small jobs at once", "It stores files better", "It does not need a board"],
    help: "GPU = the chip that draws the screen.",
  },
  os: {
    title: "Operating system",
    line: "The operating system lets programs use the parts.",
    prompt: "What does an operating system do?",
    choices: ["Changes wall power", "Shares the parts so programs can run", "Cools the GPU", "Replaces the board"],
    help: "The OS is the main program. ChromeOS is one.",
  },
  net: {
    title: "Network",
    line: "A network sends small bundles of bits from one computer to another.",
    prompt: "What is a packet?",
    choices: ["A fan", "A labeled bundle of bits sent to another computer", "A kind of SSD", "Always a picture"],
    help: "Packet = a small message sent on a network.",
  },
  "cable-loom": {
    title: "Cable",
    line: "A cable carries a signal from one part to another.",
    prompt: "What does a cable carry?",
    choices: ["A signal", "Cool air", "Paint", "Photos"],
    help: "A cable is a wire for a signal.",
  },
  "case-fan": {
    title: "Case fan",
    line: "A case fan blows heat out of the computer.",
    prompt: "What does a case fan move?",
    choices: ["Heat", "Files", "The mouse", "The wallpaper"],
    help: "The fan moves hot air out.",
  },
  "signal-hop": {
    title: "Signal",
    line: "A signal is a message on a wire.",
    prompt: "A signal on a wire is mostly?",
    choices: ["Electricity", "Wind", "Glue", "Sand"],
    help: "Signal = a message made of electricity.",
  },
  "case-drop": {
    title: "Case",
    line: "The case holds the parts and protects them.",
    prompt: "Why do parts sit in a case?",
    choices: ["To hold and protect them", "To erase files", "To slow the CPU", "To hide the power button"],
    help: "The case is the box around the parts.",
  },
  boot: {
    title: "Boot",
    line: "Boot means the computer starts up.",
    prompt: "What is a boot?",
    choices: ["Starting the computer", "Painting the case", "Erasing the files", "Stopping the fan forever"],
    help: "Boot = turn on and start up.",
  },
  "heat-sink": {
    title: "Heat sink",
    line: "A heat sink pulls heat off a hot chip.",
    prompt: "What does a heat sink take off a chip?",
    choices: ["Heat", "Files", "The mouse", "The wallpaper"],
    help: "The sink takes heat off the chip.",
  },
  "packet-lane": {
    title: "Packet",
    line: "A packet is a labeled bundle of bits.",
    prompt: "What is a packet?",
    choices: ["A labeled bundle of bits", "A fan blade", "A kind of RAM", "The power button"],
    help: "Packet = bits with a label.",
  },
  "dark-bay": {
    title: "Firewall",
    line: "A firewall decides which packets get in.",
    prompt: "What does a firewall check?",
    choices: ["Which packets may come in", "The color of the case", "How loud the fans are", "The size of the mouse"],
    help: "A firewall checks who may come in.",
  },
};

const ES: Record<string, Pack> = {
  storage: {
    title: "Almacenamiento",
    line: "El almacenamiento guarda los archivos cuando la computadora está apagada.",
    prompt: "¿En qué se diferencia un SSD de la RAM?",
    choices: ["La RAM siempre es más grande", "El SSD guarda datos sin electricidad; la RAM no", "La RAM es solo para fotos", "Son la misma pieza"],
    help: "RAM = memoria corta. Se olvida. SSD = disco. Guarda archivos.",
  },
  board: {
    title: "Placa base",
    line: "La placa base es la tabla grande. Las otras piezas se conectan ahí.",
    prompt: "¿Qué llevan las líneas de metal de la placa?",
    choices: ["Agua", "Señales eléctricas", "Aire frío", "Sonido"],
    help: "Placa base = la tabla donde se conectan las piezas.",
  },
  power: {
    title: "Energía",
    line: "La fuente cambia la electricidad de la pared para los chips.",
    prompt: "¿Qué hace la fuente de poder?",
    choices: ["Guarda archivos", "Cambia la electricidad para los chips", "Dibuja la pantalla", "Enfría el CPU solo con agua"],
    help: "Fuente = la caja que da energía a las piezas.",
  },
  cpu: {
    title: "CPU",
    line: "El CPU sigue instrucciones, un paso a la vez.",
    prompt: "¿Qué hace el CPU, en orden?",
    choices: ["Calentar, enfriar, dormir", "Tomar una instrucción, leerla y hacerla", "Clic, arrastrar, guardar", "Ping, pong, pausa"],
    help: "CPU = el chip que piensa.",
  },
  ram: {
    title: "RAM",
    line: "La RAM es memoria rápida. Sin electricidad, se olvida.",
    prompt: "¿Por qué la RAM olvida al desconectar?",
    choices: ["Es tímida", "Necesita electricidad para guardar los bits", "El SSD la borra", "Las líneas se derriten"],
    help: "RAM olvida sin electricidad. Guarda tu trabajo.",
  },
  cool: {
    title: "Enfriamiento",
    line: "Los chips se calientan. El ventilador saca el calor.",
    prompt: "¿Para qué sirve la pasta térmica?",
    choices: ["Para pegar la GPU", "Para pasar el calor al enfriador", "Para guardar archivos", "Para pintar la placa"],
    help: "La pasta ayuda a sacar el calor del chip.",
  },
  gpu: {
    title: "GPU",
    line: "La GPU dibuja muchos puntos de la pantalla a la vez.",
    prompt: "¿Por qué la GPU es rápida con las imágenes?",
    choices: ["Tiene un botón más grande", "Hace muchos trabajos pequeños a la vez", "Guarda archivos mejor", "No necesita placa"],
    help: "GPU = el chip que dibuja la pantalla.",
  },
  os: {
    title: "Sistema operativo",
    line: "El sistema operativo deja que los programas usen las piezas.",
    prompt: "¿Qué hace el sistema operativo?",
    choices: ["Cambia la electricidad", "Reparte las piezas para que los programas funcionen", "Enfría la GPU", "Reemplaza la placa"],
    help: "El sistema operativo es el programa principal.",
  },
  net: {
    title: "Red",
    line: "Una red manda paquetes de bits de una computadora a otra.",
    prompt: "¿Qué es un paquete?",
    choices: ["Un ventilador", "Un grupo de bits con etiqueta, enviado a otra computadora", "Un tipo de SSD", "Siempre una foto"],
    help: "Paquete = un mensaje pequeño en la red.",
  },
  "cable-loom": {
    title: "Cable",
    line: "Un cable lleva una señal de una pieza a otra.",
    prompt: "¿Qué lleva un cable?",
    choices: ["Una señal", "Aire frío", "Pintura", "Fotos"],
    help: "Un cable es un alambre para una señal.",
  },
  "case-fan": {
    title: "Ventilador",
    line: "El ventilador saca el calor de la computadora.",
    prompt: "¿Qué mueve un ventilador?",
    choices: ["Calor", "Archivos", "El mouse", "El fondo de pantalla"],
    help: "El ventilador mueve el aire caliente.",
  },
  "signal-hop": {
    title: "Señal",
    line: "Una señal es un mensaje en un cable.",
    prompt: "Una señal en un cable es sobre todo…",
    choices: ["Electricidad", "Viento", "Pegamento", "Arena"],
    help: "Señal = un mensaje eléctrico.",
  },
  "case-drop": {
    title: "Caja",
    line: "La caja sostiene las piezas y las protege.",
    prompt: "¿Por qué las piezas van en una caja?",
    choices: ["Para sostenerlas y protegerlas", "Para borrar archivos", "Para frenar el CPU", "Para esconder el botón"],
    help: "La caja es la cubierta de las piezas.",
  },
  boot: {
    title: "Arranque",
    line: "Arrancar es cuando la computadora se enciende.",
    prompt: "¿Qué es un arranque?",
    choices: ["Encender la computadora", "Pintar la caja", "Borrar los archivos", "Parar el ventilador para siempre"],
    help: "Arranque = encender y empezar.",
  },
  "heat-sink": {
    title: "Disipador",
    line: "El disipador saca el calor de un chip caliente.",
    prompt: "¿Qué saca un disipador del chip?",
    choices: ["Calor", "Archivos", "El mouse", "El fondo"],
    help: "El disipador saca el calor.",
  },
  "packet-lane": {
    title: "Paquete",
    line: "Un paquete es un grupo de bits con etiqueta.",
    prompt: "¿Qué es un paquete?",
    choices: ["Un grupo de bits con etiqueta", "Una aspa", "Un tipo de RAM", "El botón de encendido"],
    help: "Paquete = bits con una etiqueta.",
  },
  "dark-bay": {
    title: "Cortafuegos",
    line: "El cortafuegos decide qué paquetes entran.",
    prompt: "¿Qué revisa un cortafuegos?",
    choices: ["Qué paquetes pueden entrar", "El color de la caja", "Qué tan fuerte suenan los ventiladores", "El tamaño del mouse"],
    help: "El cortafuegos revisa quién puede entrar.",
  },
};

export function packFor(key: string, lang: Lang): Pack | null {
  if (lang === "en") return null;
  const quiz = QUIZ[lang]?.[key];
  if (quiz) return quiz;
  if (lang === "es") return ES[key] ?? null;
  if (lang === "simple") return SIMPLE[key] ?? null;
  return null;
}

export const ACCESS_UI = {
  en: {
    settings: "Settings",
    language: "Language",
    read: "Read aloud",
    readOn: "On",
    readOff: "Off",
    big: "Big text",
    fewer: "Fewer answers",
    follow: "Follow my finger",
    tilt: "Tilt the device",
    mouse: "Mouse tilt",
    tools: "Also here",
    learn: "Learn",
    how: "How to",
    sound: "Sound",
    soundOff: "Sound off",
    save: "Save successes",
    lab: "Build lab",
    goal: "Change PC",
    paper: "Paper plan",
    home: "Home",
    file: "Open a saved file",
    back: "Back",
    readBtn: "Read",
    try: "Try another answer.",
    go: "Test this part",
    part: "Part test",
    playStyle: "Play style",
    signIn: "Sign in",
    heat: "Esports heat",
    onePlayer: "One player",
    twoPlayers: "Two players",
    scores: "Scores",
    hideScores: "Hide scores",
    bestOn: "Best run on",
    bestOff: "Best run off",
    thisHour: "This hour",
    teacherPin: "Teacher pin",
    teacherOn: "Teacher unlock on",
    open: "Open",
    wrongPin: "Wrong pin",
    signedIn: "Signed in. Scores use the TechWorks code.",
    signedOut: "Not signed in. You can play. Scores stay on this device.",
    pause: "Pause",
    menu: "Menu",
    resume: "Resume",
    mute: "Mute",
    retry: "Retry",
    exit: "Exit",
    fullScreen: "Full screen",
    cabinet: "Cabinet",
    arcade: "Arcade",
    classic: "Classic",
    cabinetHelp: "Classic is the quiet look. Arcade is the cabinet.",
    music: "Music",
    volume: "Volume",
    scanlines: "Scanlines",
    offMotion: "Off for motion",
    skin: "Berty skin",
    sticker: "Sticker",
    rig: "Your rig",
    paint: "Paint only. The parts still come from the boards.",
    wins: "wins",
    drives: {
      lean: { name: "Lean", line: "One stick, or WASD." },
      hands: { name: "Two hands", line: "Two thumbs on a phone. Two fingers on a touch screen." },
      keys: { name: "Keys + mouse", line: "2D: hold the mouse, Berty follows. 3D: WASD plus mouse." },
      follow: { name: "Follow", line: "Put a finger where Berty should roll." },
      tilt: { name: "Tilt", line: "Tip the iPad. Many Chromebooks have no sensor." },
    },
    cabs: { neon: "Neon", sunset: "Sunset", mint: "Mint", mono: "Mono Green" },
    skins: { lime: "Lime", cyan: "Cyan", magenta: "Magenta", gold: "Gold", rainbow: "Rainbow" },
    stickers: {
      bolt: { name: "Bolt", line: "Power" },
      star: { name: "Bit", line: "A bit you caught" },
      chip: { name: "Chip", line: "The brain" },
      heart: { name: "Fan", line: "Keeps it cool" },
    },
  },
  simple: {
    settings: "Settings",
    language: "Words",
    read: "Read to me",
    readOn: "On",
    readOff: "Off",
    big: "Big letters",
    fewer: "Fewer choices",
    follow: "Follow my finger",
    tilt: "Tilt the device",
    mouse: "Mouse tilt",
    tools: "More tools",
    learn: "Learn",
    how: "How to play",
    sound: "Sound",
    soundOff: "Sound off",
    save: "Save my wins",
    lab: "Build the PC",
    goal: "Change the PC",
    paper: "Paper plan",
    home: "Home",
    file: "Open a saved file",
    back: "Back",
    readBtn: "Read",
    try: "Try a different answer.",
    go: "Go",
    part: "Part check",
    playStyle: "How to steer",
    signIn: "Sign in",
    heat: "Esports heat",
    onePlayer: "One player",
    twoPlayers: "Two players",
    scores: "Scores",
    hideScores: "Hide scores",
    bestOn: "Best run on",
    bestOff: "Best run off",
    thisHour: "This hour",
    teacherPin: "Teacher pin",
    teacherOn: "Teacher unlock on",
    open: "Open",
    wrongPin: "Wrong pin",
    signedIn: "Signed in. Scores use the TechWorks code.",
    signedOut: "Not signed in. You can play. Scores stay on this device.",
    pause: "Pause",
    menu: "Menu",
    resume: "Resume",
    mute: "Mute",
    retry: "Retry",
    exit: "Exit",
    fullScreen: "Full screen",
    cabinet: "Cabinet",
    arcade: "Arcade",
    classic: "Classic",
    cabinetHelp: "Classic is quiet. Arcade is the cabinet.",
    music: "Music",
    volume: "Volume",
    scanlines: "Scanlines",
    offMotion: "Off for motion",
    skin: "Berty skin",
    sticker: "Sticker",
    rig: "Your rig",
    paint: "Paint only. The parts still come from the boards.",
    wins: "wins",
    drives: {
      lean: { name: "Lean", line: "One stick, or WASD." },
      hands: { name: "Two hands", line: "Two thumbs. Or two fingers." },
      keys: { name: "Keys + mouse", line: "Mouse on the board. In 3D, WASD too." },
      follow: { name: "Follow", line: "Touch where Berty should go." },
      tilt: { name: "Tilt", line: "Tip the tablet. Many Chromebooks cannot." },
    },
    cabs: { neon: "Neon", sunset: "Sunset", mint: "Mint", mono: "Mono Green" },
    skins: { lime: "Lime", cyan: "Cyan", magenta: "Magenta", gold: "Gold", rainbow: "Rainbow" },
    stickers: {
      bolt: { name: "Bolt", line: "Power" },
      star: { name: "Bit", line: "A bit you caught" },
      chip: { name: "Chip", line: "The brain" },
      heart: { name: "Fan", line: "Keeps it cool" },
    },
  },
  es: {
    settings: "Ajustes",
    language: "Idioma",
    read: "Leer en voz alta",
    readOn: "Sí",
    readOff: "No",
    big: "Letra grande",
    fewer: "Menos respuestas",
    follow: "Seguir mi dedo",
    tilt: "Inclinar el aparato",
    mouse: "Inclinar con el ratón",
    tools: "También aquí",
    learn: "Aprender",
    how: "Cómo jugar",
    sound: "Sonido",
    soundOff: "Sin sonido",
    save: "Guardar mis logros",
    lab: "Armar la PC",
    goal: "Cambiar la PC",
    paper: "Plan de papel",
    home: "Inicio",
    file: "Abrir un archivo",
    back: "Volver",
    readBtn: "Leer",
    try: "Prueba otra respuesta.",
    go: "Probar esta pieza",
    part: "Prueba de la pieza",
    playStyle: "Modo de juego",
    signIn: "Entrar",
    heat: "Competencia",
    onePlayer: "Un jugador",
    twoPlayers: "Dos jugadores",
    scores: "Marcas",
    hideScores: "Ocultar marcas",
    bestOn: "Mejor vuelta sí",
    bestOff: "Mejor vuelta no",
    thisHour: "Esta hora",
    teacherPin: "Clave docente",
    teacherOn: "Clave docente activa",
    open: "Abrir",
    wrongPin: "Clave mal",
    signedIn: "Con sesión. Los puntos usan el código de TechWorks.",
    signedOut: "Sin sesión. Puedes jugar. Los puntos quedan en este dispositivo.",
    pause: "Pausa",
    menu: "Menú",
    resume: "Continuar",
    mute: "Silencio",
    retry: "Reintentar",
    exit: "Salir",
    fullScreen: "Pantalla completa",
    cabinet: "Gabinete",
    arcade: "Recreativa",
    classic: "Clásico",
    cabinetHelp: "Clásico es el estilo tranquilo. Recreativa es la máquina.",
    music: "Música",
    volume: "Nivel",
    scanlines: "Líneas",
    offMotion: "Apagado si hay movimiento",
    skin: "Color de Berty",
    sticker: "Calcomanía",
    rig: "Tu equipo",
    paint: "Solo pintura. Las piezas siguen saliendo de los tableros.",
    wins: "logros",
    drives: {
      lean: { name: "Palanca", line: "Una palanca, o WASD." },
      hands: { name: "Dos manos", line: "Dos pulgares en el teléfono. Dos dedos en la pantalla." },
      keys: { name: "Teclas y ratón", line: "2D: mantén el ratón y Berty sigue. 3D: WASD y el ratón." },
      follow: { name: "Seguir", line: "Pon un dedo donde Berty debe rodar." },
      tilt: { name: "Inclinar", line: "Inclina la tablet. Muchos Chromebooks no tienen sensor." },
    },
    cabs: { neon: "Neón", sunset: "Atardecer", mint: "Menta", mono: "Verde" },
    skins: { lime: "Lima", cyan: "Cian", magenta: "Fucsia", gold: "Oro", rainbow: "Arcoíris" },
    stickers: {
      bolt: { name: "Rayo", line: "Energía" },
      star: { name: "Dato", line: "Un dato que atrapaste" },
      chip: { name: "Micro", line: "El cerebro" },
      heart: { name: "Aire", line: "Lo mantiene fresco" },
    },
  },
} as const;
