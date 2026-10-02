export type PlayStep = "locked" | "goal" | "brief" | "play";

export function playStep(input: {
  alias: string;
  unlocked: boolean;
  goal: string;
  cleared: boolean;
  briefPass: boolean;
  firstFree?: boolean;
  arcade?: boolean;
}): PlayStep {
  if (input.arcade) {
    if (!input.unlocked) return "locked";
    return "play";
  }
  if (input.firstFree) return "play";
  if (!input.unlocked) return "locked";
  if (!input.goal) return "goal";
  if (!input.cleared && !input.briefPass) return "brief";
  return "play";
}