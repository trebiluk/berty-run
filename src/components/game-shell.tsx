import { useEffect, useRef, useState } from "react";
import { Engine } from "@/game/engine";
import { CHIP, fmtTime } from "@/game/trace";
import type { HudSnap } from "@/game/types";
import "@/l1.css";

const idle: HudSnap = {
  phase: "boot",
  courseName: "First Trace",
  time: 0,
  gems: 0,
  gemTotal: 3,
  mute: false,
  best: null,
  hint: "",
  hot: false,
};

export function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [hud, setHud] = useState<HudSnap>(idle);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new Engine(canvas, setHud);
    engineRef.current = engine;
    const params = new URLSearchParams(window.location.search);
    if (params.get("help") === "1") setHelp(true);
    void engine.boot();
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const showJump = hud.phase === "play";
  const overlay = hud.phase !== "play";
  const live =
    hud.phase === "win"
      ? "Trace complete. 3 gems plus EXIT. Level up."
      : hud.phase === "fail"
        ? "Trace broke. Try again."
        : hud.phase === "short"
          ? "Missing a gem. Watch the pulses."
          : hud.hint;

  return (
    <main className="l1">
      <canvas ref={canvasRef} className="l1-canvas" aria-label="Berty on a copper trace" />
      <p className="l1-live" aria-live="polite">
        {live}
      </p>
      <header className="l1-top">
        <div className="l1-card">
          <p className="l1-kicker">{CHIP} · Assist</p>
          <h1 className="l1-title">Berty Run</h1>
        </div>
        {hud.phase === "play" || hud.phase === "pause" ? (
          <div className="l1-hud" aria-label={`${hud.gems} of 3 gems`}>
            <span className="l1-gems">
              {hud.gems}/{hud.gemTotal}
            </span>
            <span>{fmtTime(hud.time)}</span>
            <span className="l1-assist">Assist</span>
          </div>
        ) : null}
      </header>

      {showJump ? (
        <button
          type="button"
          className={hud.hot ? "l1-jump is-hot" : "l1-jump"}
          aria-label="Jump"
          onPointerDown={(ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            engineRef.current?.holdJump(true);
          }}
          onPointerUp={(ev) => {
            ev.preventDefault();
            engineRef.current?.holdJump(false);
          }}
          onPointerCancel={() => engineRef.current?.holdJump(false)}
        >
          JUMP
        </button>
      ) : null}

      {hud.phase === "play" && hud.hint ? <p className="l1-hint">{hud.hint}</p> : null}

      {overlay ? (
        <div className="l1-shade">
          <section className="l1-panel" aria-label={hud.courseName}>
            {hud.phase === "boot" ? <p className="l1-copy">Loading the copper…</p> : null}

            {hud.phase === "title" ? (
              <>
                <p className="l1-kicker">L1 · First Trace</p>
                <h2 className="l1-word">Berty Run</h2>
                <p className="l1-promise">Tap JUMP · collect all 3 gems.</p>
                {hud.best != null ? (
                  <p className="l1-best">
                    Berty Run · First Trace · Best: {fmtTime(hud.best)} (all gems)
                  </p>
                ) : null}
                {help ? (
                  <ul className="l1-help">
                    <li>Space, Up, or the JUMP button.</li>
                    <li>Tap JUMP when the trace glows.</li>
                    <li>Three gems, then the EXIT.</li>
                  </ul>
                ) : null}
                <div className="l1-row">
                  <button type="button" className="l1-btn l1-btn-play" onClick={() => engineRef.current?.startPlay()}>
                    PLAY
                  </button>
                  <button type="button" className="l1-btn l1-btn-help" onClick={() => setHelp((v) => !v)}>
                    {help ? "HIDE" : "HELP"}
                  </button>
                  <button
                    type="button"
                    className="l1-btn l1-btn-ghost"
                    onClick={() => engineRef.current?.toggleMute()}
                    aria-label={hud.mute ? "Unmute" : "Mute"}
                  >
                    {hud.mute ? "SOUND OFF" : "SOUND"}
                  </button>
                </div>
              </>
            ) : null}

            {hud.phase === "pause" ? (
              <>
                <h2 className="l1-word">Paused</h2>
                <p className="l1-copy">Tap JUMP on the glow.</p>
                <div className="l1-row">
                  <button type="button" className="l1-btn l1-btn-play" onClick={() => engineRef.current?.togglePause()}>
                    PLAY
                  </button>
                  <button type="button" className="l1-btn l1-btn-help" onClick={() => engineRef.current?.retry()}>
                    RETRY
                  </button>
                </div>
              </>
            ) : null}

            {hud.phase === "win" ? (
              <>
                <p className="l1-kicker">LEVEL UP</p>
                <h2 className="l1-word">Trace complete</h2>
                <p className="l1-copy">3 gems + EXIT</p>
                <GemRow got={3} />
                <p className="l1-best">
                  {fmtTime(hud.time)}
                  {hud.best != null ? ` · best ${fmtTime(hud.best)}` : ""}
                </p>
                <div className="l1-row">
                  <button type="button" className="l1-btn l1-btn-play" onClick={() => engineRef.current?.retry()}>
                    RETRY
                  </button>
                </div>
              </>
            ) : null}

            {hud.phase === "fail" ? (
              <>
                <p className="l1-kicker">First Trace</p>
                <h2 className="l1-word">Trace broke · try again</h2>
                <div className="l1-row">
                  <button type="button" className="l1-btn l1-btn-play" onClick={() => engineRef.current?.retry()}>
                    RETRY
                  </button>
                </div>
              </>
            ) : null}

            {hud.phase === "short" ? (
              <>
                <p className="l1-kicker">First Trace</p>
                <h2 className="l1-word">Missing a gem · watch the pulses</h2>
                <GemRow got={hud.gems} />
                <div className="l1-row">
                  <button type="button" className="l1-btn l1-btn-play" onClick={() => engineRef.current?.retry()}>
                    RETRY
                  </button>
                </div>
              </>
            ) : null}
          </section>
        </div>
      ) : null}
    </main>
  );
}

function GemRow({ got }: { got: number }) {
  return (
    <div className="l1-gemrow" aria-label={`${got} of 3 gems`}>
      {[0, 1, 2].map((n) => (
        <span key={n} className={n < got ? "l1-gem is-got" : "l1-gem"}>
          ◆
        </span>
      ))}
    </div>
  );
}
