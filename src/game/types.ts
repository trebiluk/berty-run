export type Vec = { x: number; y: number };

export type CourseId =
  | "roll-out"
  | "mind-the-pit"
  | "saw-line"
  | "oil-pan"
  | "crew-gate"
  | "around-the-bend"
  | "pit-drop"
  | "blade-walk"
  | "slick-shelf"
  | "shop-exit"
  | "cable-loom"
  | "case-fan"
  | "heat-sink"
  | "packet-lane"
  | "signal-hop"
  | "case-drop"
  | "dark-bay"
  | "practice-2d"
  | "practice-3d"
  | "tube-run";

export type SawDef = {
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  period?: number;
};

export type Course = {
  id: CourseId;
  name: string;
  blurb: string;
  par: number;
  rows: string[];
  saws?: SawDef[];
  mode?: "2d" | "3d";
  /** Always open. Not part of the par ladder, and not a PC part. */
  arcade?: boolean;
};

export type HudSnap = {
  phase: "boot" | "title" | "play" | "pause" | "win" | "fail";
  courseId: CourseId;
  courseName: string;
  time: number;
  gems: number;
  gemTotal: number;
  hearts: number;
  crew: boolean;
  mute: boolean;
  best: number | null;
  stars: number;
  is3d: boolean;
  par: number;
  bests: Record<string, number>;
  ghost: boolean;
  hasGhost: boolean;
  stamps: number;
  watts: number;
  parts: string[];
  passed: string[];
  earned: number;
  booted: boolean;
  inducted: boolean;
  fullUnlock: boolean;
  alias: string;
  code: string;
  botGift: string;
  botLine: string;
  goal: "" | "gaming" | "creator" | "laptop";
  needGoal: boolean;
  needBrief: boolean;
  intro: number;
  go: boolean;
  tip: string;
  follow: boolean;
  tilt: boolean;
  mouse: boolean;
  hands: boolean;
};

export type ControlsProbe = {
  getYaw: () => number;
  getSpeed: () => number;
  setSteer: (v: number) => void;
  setKeys: (codes: string[]) => void;
};

declare global {
  interface Window {
    __controlsTest?: ControlsProbe;
    __bertyRun?: { phase: string; gems: number; time: number };
  }
}
