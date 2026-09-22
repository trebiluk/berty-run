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
  | "shop-exit";

export type Seg =
  | { k: "g"; w: number }
  | { k: "gap"; w: number }
  | { k: "crate" }
  | { k: "saw"; h?: number }
  | { k: "gems"; n: number; form?: "line" | "arc" | "high" }
  | { k: "check" }
  | { k: "boost" }
  | { k: "gate" };

export type Course = {
  id: CourseId;
  name: string;
  blurb: string;
  par: number;
  segs: Seg[];
  rows?: string[];
  mode?: "2d" | "3d";
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
