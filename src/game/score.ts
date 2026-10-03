export type ScoreInput = { bits: number; time: number; par: number };

export function timeBonus(time: number, par: number) {
  return Math.max(0, Math.round((par - time) * 20));
}

export function scoreFor({ bits, time, par }: ScoreInput) {
  return bits * 100 + timeBonus(time, par);
}

export function hudScore(bits: number) {
  return bits * 100;
}
