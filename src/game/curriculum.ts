import { COURSES, starsFor, starsFromBest } from "./courses";
import type { CourseId } from "./types";

export type LessonId =
  | "binary"
  | "board"
  | "power"
  | "cpu"
  | "ram"
  | "cool"
  | "storage"
  | "io"
  | "gpu"
  | "code"
  | "os"
  | "algo"
  | "net"
  | "debug"
  | "safe";

export type PartId = "mobo" | "psu" | "cpu" | "ram" | "fan" | "ssd" | "gpu" | "nic" | "os";

export type Lesson = {
  id: LessonId;
  unit: "Hardware" | "Software" | "Thinking";
  title: string;
  stamps: number;
  course?: CourseId;
  any3d?: boolean;
  body: string[];
  board: string;
  q: { prompt: string; choices: string[]; answer: number };
  part?: PartId;
};

export type Part = {
  id: PartId;
  name: string;
  cost: number;
  lesson: LessonId;
  blurb: string;
};

export const PARTS: Part[] = [
  { id: "mobo", name: "Motherboard", cost: 20, lesson: "board", blurb: "The board. Traces carry every signal." },
  { id: "psu", name: "Power supply", cost: 24, lesson: "power", blurb: "Wall power in. Clean rails out." },
  { id: "cpu", name: "CPU", cost: 40, lesson: "cpu", blurb: "Fetch. Decode. Execute." },
  { id: "ram", name: "RAM", cost: 32, lesson: "ram", blurb: "Working memory. Fast. Volatile." },
  { id: "fan", name: "Cooler", cost: 20, lesson: "cool", blurb: "Heat is the enemy. Air is the fix." },
  { id: "ssd", name: "SSD", cost: 36, lesson: "storage", blurb: "Files that survive power-off." },
  { id: "gpu", name: "GPU", cost: 48, lesson: "gpu", blurb: "A thousand tiny painters." },
  { id: "nic", name: "Network card", cost: 28, lesson: "net", blurb: "Packets in. Packets out." },
  { id: "os", name: "BertyOS", cost: 44, lesson: "os", blurb: "The program that runs the rest." },
];

export const LESSONS: Lesson[] = [
  {
    id: "binary",
    unit: "Hardware",
    title: "Bits",
    stamps: 0,
    body: [
      "A computer only stores two states: off and on. We write them 0 and 1. Each 0 or 1 is a bit.",
      "Eight bits make a byte. A byte can hold a letter, a small number, or a tiny piece of a picture.",
      "On the board you collect bits. That is not a metaphor. Every gem is a 1 you picked up.",
    ],
    board: "Every amber gem is one bit. Clear a floor, you have proved you can gather data.",
    q: {
      prompt: "How many bits are in a byte?",
      choices: ["2", "8", "10", "100"],
      answer: 1,
    },
  },
  {
    id: "board",
    unit: "Hardware",
    title: "Motherboard",
    stamps: 1,
    course: "roll-out",
    part: "mobo",
    body: [
      "The motherboard is the printed circuit you have been rolling on. Copper traces are roads for electricity.",
      "Every other part plugs into it: CPU, RAM, storage, power. If a trace is broken, the signal never arrives.",
      "Vias are tiny holes that jump a signal from one layer of copper to another. You ran over them.",
    ],
    board: "First Trace is a clean board. Traces, vias, a gate at the end.",
    q: {
      prompt: "What do copper traces on a motherboard carry?",
      choices: ["Water", "Electrical signals", "Cool air", "Sound"],
      answer: 1,
    },
  },
  {
    id: "power",
    unit: "Hardware",
    title: "Power",
    stamps: 1,
    part: "psu",
    body: [
      "The wall is high-voltage AC. Chips want low-voltage DC. The power supply (PSU) converts one into the other.",
      "A computer that browns out reboots or corrupts data. Stable power is the first reliability lesson.",
      "Never open a PSU in class. Capacitors can hold charge after unplug.",
    ],
    board: "No power, no run. Watts you earn in Berty's Run are the classroom stand-in for energy budget.",
    q: {
      prompt: "What does a PSU do?",
      choices: [
        "Stores files forever",
        "Converts wall power into the voltages chips need",
        "Paints the screen",
        "Cools the CPU with water only",
      ],
      answer: 1,
    },
  },
  {
    id: "cpu",
    unit: "Hardware",
    title: "CPU",
    stamps: 2,
    part: "cpu",
    body: [
      "The CPU is the brain. It runs a tight loop: fetch an instruction, decode it, execute it, repeat.",
      "Clock speed is how many of those loops it can attempt per second. More cores means more loops in parallel.",
      "A CPU without instructions is a heater. Programs tell it what to do.",
    ],
    board: "You are the CPU when you plan a lean. Sequence first, then act.",
    q: {
      prompt: "The CPU loop is best described as:",
      choices: ["Heat, cool, sleep", "Fetch, decode, execute", "Click, drag, save", "Ping, pong, pause"],
      answer: 1,
    },
  },
  {
    id: "ram",
    unit: "Hardware",
    title: "RAM",
    stamps: 2,
    course: "mind-the-pit",
    part: "ram",
    body: [
      "RAM is working memory. Fast. The CPU can read it in nanoseconds.",
      "It is volatile: power off, the contents vanish. That is why unsaved work disappears.",
      "Empty sockets on Mind the Pit are RAM slots with nothing in them. A missing stick is a hole in the machine.",
    ],
    board: "Fall in a socket and you feel what a machine feels with no memory mapped there.",
    q: {
      prompt: "Why does RAM forget when you unplug?",
      choices: [
        "It is shy",
        "It is volatile — it needs power to hold bits",
        "The SSD deletes it on purpose",
        "Copper traces melt",
      ],
      answer: 1,
    },
  },
  {
    id: "cool",
    unit: "Hardware",
    title: "Heat and cooling",
    stamps: 2,
    part: "fan",
    body: [
      "Electricity through resistance makes heat. Chips throttle or die if they stay hot.",
      "Fans move air. Heat sinks spread heat. Thermal paste fills microscopic gaps between CPU and cooler.",
      "You already dodged fans and slid on paste. That was not decoration. That is the thermal path.",
    ],
    board: "Fan Line and Thermal Paste are the cooling chapter, written as a marble run.",
    q: {
      prompt: "Thermal paste is used to:",
      choices: [
        "Glue the GPU to the case",
        "Help heat move from the chip into the cooler",
        "Store extra files",
        "Paint traces orange",
      ],
      answer: 1,
    },
  },
  {
    id: "storage",
    unit: "Hardware",
    title: "Storage",
    stamps: 3,
    part: "ssd",
    body: [
      "Storage keeps bits when power is gone. SSDs use flash memory. Older drives used spinning platters.",
      "Storage is slower than RAM, but it is persistent. Your Berty's Run best times live in storage on this Chromebook.",
      "localStorage is a tiny SSD impression: key, value, still there after refresh. No account required.",
    ],
    board: "Your stamp card is persistent storage. RAM would forget it the moment you closed the tab.",
    q: {
      prompt: "What is the key difference between RAM and an SSD?",
      choices: [
        "RAM is always larger",
        "SSD keeps data with the power off; RAM does not",
        "RAM is only for pictures",
        "They are the same part",
      ],
      answer: 1,
    },
  },
  {
    id: "io",
    unit: "Hardware",
    title: "Input and output",
    stamps: 3,
    part: undefined,
    body: [
      "I/O is how the machine talks to the world: keyboard, display, ports, network.",
      "A USB port is a contract: voltage, data lines, a handshake. The gate at the end of a board is an I/O port.",
      "Input is data in. Output is data out. A computer with no I/O is a brick that thinks.",
    ],
    board: "Park in the port. That is output: you delivered the bits you collected.",
    q: {
      prompt: "Which pair is I/O?",
      choices: ["CPU and RAM", "Keyboard and screen", "Thermal paste and a fan", "A via and a trace"],
      answer: 1,
    },
  },
  {
    id: "gpu",
    unit: "Hardware",
    title: "GPU",
    stamps: 4,
    any3d: true,
    part: "gpu",
    body: [
      "A GPU is built for parallel work: the same math on a million pixels at once.",
      "3D boards in Berty's Run are drawn by the GPU. Thousands of triangles, one frame, sixty times a second.",
      "GPUs also train AI. Same idea: lots of simple operations, all at once.",
    ],
    board: "Clear a 3D board and you have used the GPU as a player, not just a spectator.",
    q: {
      prompt: "GPUs are fast at graphics because they:",
      choices: [
        "Have a bigger power button",
        "Run many simple operations in parallel",
        "Store files better than an SSD",
        "Do not need a motherboard",
      ],
      answer: 1,
    },
  },
  {
    id: "code",
    unit: "Software",
    title: "Programs",
    stamps: 3,
    body: [
      "A program is a list of instructions a CPU can run. Languages like Python or JavaScript compile or interpret down toward those instructions.",
      "This game is a program. Your lean is input. Physics is the process. The canvas is output.",
      "Code is not magic. It is precise writing that a machine will follow even when you are wrong.",
    ],
    board: "When Berty slides too far, that is not Berty being wild. That is the program doing exactly what we wrote.",
    q: {
      prompt: "A program is best described as:",
      choices: [
        "A power cable",
        "A list of instructions a computer follows",
        "A type of fan",
        "Random sparks",
      ],
      answer: 1,
    },
  },
  {
    id: "os",
    unit: "Software",
    title: "Operating system",
    stamps: 4,
    part: "os",
    body: [
      "The operating system is the first big program. It shares the CPU, memory, and devices among apps.",
      "ChromeOS, Windows, macOS, Linux: different OS families, same job. They sit between hardware and you.",
      "Without an OS, you would talk to the CPU in raw instructions. With one, you press Play.",
    ],
    board: "BertyOS is the pretend OS for your lab machine. Install it last. Then it can boot.",
    q: {
      prompt: "The operating system's job is to:",
      choices: [
        "Convert AC to DC",
        "Manage hardware so programs can run",
        "Cool the GPU with paste",
        "Replace the motherboard",
      ],
      answer: 1,
    },
  },
  {
    id: "algo",
    unit: "Thinking",
    title: "Algorithms",
    stamps: 5,
    body: [
      "An algorithm is a finite, definite procedure. Sequence, then maybe a loop, then maybe a branch.",
      "Your run is an algorithm: collect every bit, avoid fans, enter the port. Order matters.",
      "Computer science studies which procedures are correct, and which are fast enough.",
    ],
    board: "Ghosts are recorded algorithms — your best procedure, replayed.",
    q: {
      prompt: "An algorithm must be:",
      choices: ["A picture of a CPU", "A finite, definite procedure", "A brand of RAM", "Always written in Python"],
      answer: 1,
    },
  },
  {
    id: "net",
    unit: "Software",
    title: "Networks",
    stamps: 6,
    part: "nic",
    body: [
      "Networks move packets. A packet is a labeled chunk of bits: where from, where to, the payload.",
      "The internet is many networks agreeing on those labels (IP). Reliability is someone else's problem until TCP.",
      "This classroom game stores scores on the Chromebook on purpose. No names on a server.",
    ],
    board: "Crew Gate is two processes sharing a board — a tiny local network of two Berties.",
    q: {
      prompt: "A packet on a network is:",
      choices: [
        "A cooling fan",
        "A labeled chunk of bits sent from one machine to another",
        "A type of SSD",
        "Always a picture",
      ],
      answer: 1,
    },
  },
  {
    id: "debug",
    unit: "Thinking",
    title: "Debugging",
    stamps: 7,
    body: [
      "A bug is a mismatch between what you meant and what the machine did. The machine is not guessing.",
      "Debug like a scientist: reproduce, isolate, change one thing, test again.",
      "Retry after a fall is a debug loop. You form a hypothesis (too much lean), then test it.",
    ],
    board: "Three hearts are three experiments. The board did not cheat.",
    q: {
      prompt: "A good debug step is:",
      choices: [
        "Change five things at once",
        "Reproduce, isolate, change one thing, test",
        "Restart until luck wins",
        "Blame the copper",
      ],
      answer: 1,
    },
  },
  {
    id: "safe",
    unit: "Thinking",
    title: "Stay safe",
    stamps: 8,
    body: [
      "Phishing is a fake ask for a real secret. A password is a secret. Do not type it because a page looked official.",
      "This game stores nothing about you. No names. No accounts. That is a design choice, not an accident.",
      "Share machines in class? Do not save school passwords in a shared browser profile.",
    ],
    board: "Solvay Tech Ed: you can be proud of a stamp card without putting your name on a network.",
    q: {
      prompt: "If a page asks for your password and you did not go looking for it, you should:",
      choices: [
        "Type it quickly",
        "Stop. It may be phishing. Check with a teacher.",
        "Send it to a friend to test",
        "Post it on the board",
      ],
      answer: 1,
    },
  },
];

export function lessonById(id: string) {
  return LESSONS.find((l) => l.id === id);
}

export function partById(id: string) {
  return PARTS.find((p) => p.id === id);
}

export function stampsOf(bests: Record<string, number>) {
  return COURSES.filter((c) => bests[c.id] != null).length;
}

export function has3dStamp(bests: Record<string, number>) {
  return COURSES.some((c) => c.mode === "3d" && bests[c.id] != null);
}

export function lessonOpen(l: Lesson, bests: Record<string, number>) {
  const n = stampsOf(bests);
  if (n < l.stamps) return false;
  if (l.course && bests[l.course] == null) return false;
  if (l.any3d && !has3dStamp(bests)) return false;
  return true;
}

export function lockReason(l: Lesson, bests: Record<string, number>) {
  const n = stampsOf(bests);
  if (n < l.stamps) return `Stamp ${l.stamps} board${l.stamps === 1 ? "" : "s"} to open.`;
  if (l.course && bests[l.course] == null) {
    const c = COURSES.find((x) => x.id === l.course);
    return `Clear ${c?.name ?? l.course} first.`;
  }
  if (l.any3d && !has3dStamp(bests)) return "Clear any 3D board first.";
  return "";
}

export function canBoot(parts: string[]) {
  return ["mobo", "psu", "cpu", "ram", "os"].every((id) => parts.includes(id));
}

export function earnOnClear(bests: Record<string, number>, id: CourseId, time: number, par: number) {
  const prev = bests[id];
  const oldStars = starsFromBest(prev, par);
  const nextStars = starsFor(time, par);
  const first = prev == null;
  let watts = first ? 40 : 8;
  if (nextStars > oldStars) watts += (nextStars - oldStars) * 12;
  if (prev != null && time < prev) watts += 6;
  return { watts, first, stars: nextStars };
}
