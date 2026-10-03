/** Original Berty's Run loops. Note numbers are beats from the loop start. */

export type Tone = "square" | "triangle" | "sawtooth";

export type Note = { b: number; f: number; d: number; type: Tone; g: number };

export type Loop = { bpm: number; bars: number; notes: Note[] };

const beat = (b: number, f: number, d: number, type: Tone, g: number): Note => ({ b, f, d, type, g });

function row(freqs: number[], step: number, type: Tone, g: number, dur = 0.4): Note[] {
  return freqs.map((f, i) => beat(i * step, f, dur, type, g));
}

export const LOOPS: Record<"title" | "flat" | "deep" | "tube" | "fast", Loop> = {
  title: {
    bpm: 120,
    bars: 8,
    notes: [
      ...row([220, 262, 294, 330, 294, 262, 247, 220], 2, "triangle", 0.16, 1.4),
      ...row([110, 131, 147, 165], 4, "square", 0.1, 1.6),
    ],
  },
  flat: {
    bpm: 132,
    bars: 8,
    notes: [
      ...row([330, 392, 440, 392, 349, 330, 294, 330], 1, "triangle", 0.14, 0.7),
      ...row([165, 196, 220, 196], 2, "square", 0.1, 1.2),
    ],
  },
  deep: {
    bpm: 126,
    bars: 8,
    notes: [
      ...row([294, 349, 392, 440, 392, 349, 330, 294], 1, "triangle", 0.13, 0.75),
      ...row([147, 175, 196, 220], 2, "square", 0.11, 1.3),
    ],
  },
  tube: {
    bpm: 144,
    bars: 8,
    notes: [
      ...row([440, 523, 587, 659, 587, 523, 494, 440], 0.5, "square", 0.1, 0.35),
      ...row([220, 262, 294, 330], 2, "triangle", 0.12, 1.2),
    ],
  },
  fast: {
    bpm: 150,
    bars: 8,
    notes: [
      ...row([392, 440, 494, 523, 587, 523, 494, 440], 0.5, "square", 0.11, 0.32),
      ...row([196, 220, 247, 262], 2, "triangle", 0.1, 1.1),
    ],
  },
};
