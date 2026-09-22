# FeatureBot · Berty Run · L1 First Trace

Office: `shared/tekdash/crew-reports/FEATUREBOT-BERTY-RUN-L1.md`

## Lock

| Lock | Spec |
|------|------|
| Genre | GD × Geometry Arrow **feel** only — reflex timing auto-runner. **Not** Mario. **Not** marble-tunnel strategy. |
| Depth | Flat **2D canvas** (drawn depth ok). **No** WebGL / real 3D. |
| Control | One fat **JUMP** ≥44px · Space/Up + touch. Assist default. |
| Heat | ~30–40s · start → gap → spike-via → gem → overhang → gem → window → gem → EXIT |
| Gems | **3** on the auto-path |
| Fail | Calm “Trace broke · try again” + fat RETRY |
| Win | 3 gems + exit · text + gems (**never sound-only success**) |
| Start | PLAY + HELP · “Tap JUMP · collect all 3 gems.” Zero lecture overlay. |
| IP | Original Kulibert / Berty + PCB. **No** Geometry Dash / Arrow / Tron / Curveball names, art, fonts, skins. |

## Stack

Vanilla canvas or light Vite + canvas. Chromebook mid/low. Prefer zero-deps path from waiting-game `runner`.

L1 play loop is `src/game/engine.ts` — 2D canvas, no Phaser / Three / Matter. Shell is Vite + React (preview + `/berty-run/` cart). `bend3d.ts` is not on the L1 path.

## Play
- Chromebook 2D one-button timing auto-runner
- Berty auto-runs the copper
- Space / click / tap = JUMP (hold 200ms = higher)
- Crates, fans, pits · bits · checkpoints · gate
- Three hearts · fat retry
- Official shop-robot sprites
- Steal: Pixel Runner feel only — see `FEATUREBOT-BERTY-RUN-STEAL-MAP.md`

## Start
UX from `FEATUREBOT-BERTY-RUN-START-FROM-CURVEBALL.md` — **patterns only, not a Curveball clone.**

## Doors
- Code: https://github.com/trebiluk/berty-run
- School: https://apps.kulibert.net/berty-run/ — chip stays **list · not built** until Debugzy proves live play
- Never classroom `vercel.app`

## Acceptance (Build done = these true)

1. Preview URL playable (First Trace clears on Assist). **TRUE** — 3 bits + gate, 32.7s, 3 hearts. School door not flipped.
2. No GD/Arrow brand strings in UI or assets. **TRUE** — student chrome is Berty / PCB. Sprites: `berty-*.png`, crate, saw, gem, gate, floor. `ArrowUp` is the key code only. Crew docs may name the steal.
3. Success readable without audio. **TRUE** — muted clear still shows Trace complete, 3 bits + gate, three gem tiles.
4. Reduced-motion: no shake/flash spam. **TRUE** — `prefers-reduced-motion: reduce` kills camera shake, hitstop, particle bursts, jump spin, saw spin. CSS zeros overlay animation.
5. Hand Debugzy: preview URL + graft note for `apps.kulibert.net/berty-run/`. **TRUE** — `docs/crew/DEBUGZY-BERTY-RUN-GROK-BUILD-HANDOFF.md`
6. Debugzy proves live school door before hub chip flips off list. **HELD** — https://apps.kulibert.net/berty-run/ still **idea list · not built yet**. Grok Build will not flip it.

## Out of scope (HOLD)

Beatz playable · Hub accounts · multiplayer · gravity heats · Alias Pass · Baboo floorist

L1 does not ship any of these. Jump gravity is Pixel Runner feel, not flip heats. No login. No p2p. No Beatz. No alias chrome. No floorist.

*FeatureBot · 2026-09-22*
