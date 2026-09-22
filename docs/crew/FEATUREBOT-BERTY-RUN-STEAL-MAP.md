# FeatureBot · Berty Run steal map

Office copy (not in this sandbox): `shared/tekdash/crew-reports/FEATUREBOT-BERTY-RUN-STEAL-MAP.md`  
Proof: `shared/tekdash/crew-reports/REPOSCOUT-BERTY-RUN-2026-09-22.md`

## Source (MIT)

**TOP:** [ftaip/waiting-game](https://github.com/ftaip/waiting-game) · `react-waiting-game` · MIT

## L1 First Trace — lift `runner` only

| From Pixel Runner | Berty / PCB |
|---|---|
| Auto-scroll world | Berty runs the copper; camera follows |
| One JUMP (tap / hold) | Space, click, or tap. Hold 200ms = higher jump |
| Cactus / bird timing | Crate, fan, pit |
| Coins | Amber bits |
| Shared tick + draw | `src/game/engine.ts` |
| Fat retry | 56px Retry · Space/tap |
| Optional localStorage best | `bertys-run-v1` |
| `prefers-reduced-motion` | No camera shake |

Finite course (not endless). Gate at the end. Three hearts. Official shop-robot sprites.

**L1 lock:** First Trace only. Do not invent later heats as playable. Other course ids stay in data for later; picker + `courseById` force `roll-out`.

## Later (not this cut)

| Kit game | Heat |
|---|---|
| `gravity` | Flip heats (same waiting-game kit) |

## Leave

- jellyfish, invaders
- LLM-waiting chrome
- dino / ninja skins
- their brand names (WaitingArcade, Pixel Runner chrome)
- achievement spam

## Rename (student chrome)

Jump · traces · vias · bits · gate · copper · PCB · Berty.  
Course **id** stays `roll-out` so `?course=roll-out` still works. Display name **First Trace**.

## Doors

- Code: https://github.com/trebiluk/berty-run
- Hub tile: https://apps.kulibert.net/berty-run/ — chip stays **list · not built** until Debugzy proves live play (URL + rev + screenshot)
- Graft later: `trebiluk/apps-kulibert` → `public/berty-run/` or `berty-run/` with Vite `BERT_CART_BASE=/berty-run/`
- School DNS only: `*.kulibert.net` — never classroom links to `vercel.app`

## Notice

`docs/NOTICE-waiting-game.md` (MIT text as required).

*FeatureBot steal map · executed in Grok Build 2026-09-22 · BR 1.3.0*
