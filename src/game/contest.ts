import { boardFor } from "@/game/techworks";

export type HeatSeat = {
  place: number;
  alias: string;
  time: number;
  demo: boolean;
  you: boolean;
};

const DEMOS = ["Pixel", "Volt", "Nova", "Glitch", "Ampere", "Trace", "Solder", "Nix"];

/** Real times from this computer, then a labeled demo field so a class can see a heat before anyone else has posted. */
export function buildHeat(
  courseId: string,
  par: number,
  you: { alias: string; code: string; time: number | null },
  seed: number,
): HeatSeat[] {
  const real = boardFor(courseId).map((row) => ({
    alias: row.alias,
    time: row.time,
    demo: false,
    you: !!you.code && row.code === you.code,
  }));
  if (you.alias && you.time != null && !real.some((row) => row.you)) {
    real.push({ alias: you.alias, time: you.time, demo: false, you: true });
  }
  const demos = DEMOS.slice(0, Math.max(0, 8 - real.length)).map((alias, i) => {
    const wobble = ((seed * (i + 3) * 17) % 100) / 100;
    return { alias, time: Math.round(par * (0.72 + wobble * 0.7) * 10) / 10, demo: true, you: false };
  });
  return [...real, ...demos]
    .sort((a, b) => a.time - b.time || a.alias.localeCompare(b.alias))
    .map((row, i) => ({ ...row, place: i + 1 }));
}
