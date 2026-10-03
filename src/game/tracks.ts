export type Note = { b: number; f: number; d: number; type: OscillatorType; g: number };
export type Loop = { bpm: number; bars: number; notes: Note[] };

function fill(lead: number[], bass: number[], leadDur = 0.45, bassEvery = 1): Note[] {
  const notes: Note[] = [];
  for (let i = 0; i < 32; i++) {
    notes.push({ b: i, f: bass[i % bass.length], d: 0.9, type: "square", g: 0.1 });
    if (i % bassEvery === 0) notes.push({ b: i, f: lead[i % lead.length], d: leadDur, type: "triangle", g: 0.12 });
    if (i % 2 === 1) notes.push({ b: i + 0.5, f: lead[(i + 3) % lead.length], d: 0.28, type: "square", g: 0.07 });
  }
  return notes;
}

export const LOOPS: Record<"title" | "flat" | "deep" | "tube" | "fast", Loop> = {
  title: { bpm: 108, bars: 8, notes: fill([392, 440, 494, 440, 349, 392, 330, 349], [196, 220, 247, 220]) },
  flat: { bpm: 132, bars: 8, notes: fill([330, 392, 440, 392, 349, 330, 294, 330], [165, 196, 220, 196]) },
  deep: { bpm: 126, bars: 8, notes: fill([294, 349, 392, 440, 392, 349, 330, 294], [147, 175, 196, 220]) },
  tube: { bpm: 144, bars: 8, notes: fill([440, 523, 587, 659, 587, 523, 494, 440], [220, 262, 294, 330], 0.32) },
  fast: { bpm: 150, bars: 8, notes: fill([392, 440, 494, 523, 587, 523, 494, 440], [196, 220, 247, 262], 0.3) },
};
