import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/components/game-shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [live, setLive] = useState(false);
  useEffect(() => {
    setLive(true);
  }, []);
  if (!live) {
    return (
      <main className="fixed inset-0 grid place-items-center bg-[#0b1220] text-[#f6efe2]">
        <p className="text-2xl font-extrabold">Berty's Run</p>
      </main>
    );
  }
  return <GameShell />;
}
