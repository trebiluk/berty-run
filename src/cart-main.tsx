import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GameShell } from "@/components/game-shell";

const root = document.getElementById("app");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <GameShell />
    </StrictMode>,
  );
}
