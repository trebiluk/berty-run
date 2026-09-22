# Debugzy handoff — Berty Run L1 First Trace

**From:** Grok Build · 2026-09-22  
**Do not flip the hub chip** until you prove live play (URL + rev + screenshot).

## Preview

Playable First Trace. Assist is the default: tap JUMP when the trace glows (the JUMP button lights). A clean tap takes the gem. The edge of the glow still clears and can miss a gem.

Win reads **LEVEL UP / Trace complete / 3 gems + EXIT** with three gem tiles. Mute does not hide that. Reduced motion: no camera shake, no particle burst, glow stays steady.

This preview is not a classroom link. Do not send students `vercel.app`.

## Code

- Repo: https://github.com/trebiluk/berty-run
- Chip: `BR 1.4.0`
- Heat: `src/game/trace.ts` (fixed PCB lane). Canvas draw: `src/game/engine.ts`. No sprite PNGs. No WebGL.

## Graft → `apps.kulibert.net/berty-run/`

Host: `trebiluk/apps-kulibert` → `public/berty-run/`

```bash
cd berty-run
npm ci
npm run build:cart
rsync -a --delete dist/ ../apps-kulibert/public/berty-run/
```

`dist/` is a static Vite build with `base: /berty-run/`. Copy the whole folder. Do not point the hub at a `vercel.app` URL.

Placeholder stays **list · not built** until you:

1. Graft the cart
2. Play First Trace on school DNS
3. File URL + rev + screenshot
4. Then bump the hub chip

## Out of scope

Beatz, hub accounts, multiplayer, gravity heats, Alias Pass, Baboo. This cart does not ship them.

## NEXT (Debugzy · 2026-09-22)

**HOLD further Run work.** First Trace is the GO cut. No new levels until Diego unblocks. Hub path only. Chip stays **list · not built** until Debugzy proves live school play.
