# Debugzy handoff — Berty Run L1 First Trace

**From:** Grok Build (this chat) · 2026-09-22  
**Do not flip the hub chip** until you prove live play (URL + rev + screenshot).

## Preview

Playable in the Grok Build live preview (this session). First Trace clears on Assist: 3 bits + gate, ~33s, 3 hearts. Mute still shows **Trace complete**. Reduced-motion: no shake/flash.

This preview is **not** a classroom link. Do not send students `vercel.app`.

## Code

- Repo: https://github.com/trebiluk/berty-run
- Branch: `main`
- Chip: `BR 1.3.0`
- Heat: First Trace only (`roll-out`)

## Graft → `apps.kulibert.net/berty-run/`

Host: `trebiluk/apps-kulibert` → `public/berty-run/`

```bash
cd berty-run
npm ci
npm run build:cart
# dist/ is Vite base /berty-run/
rsync -a --delete dist/ ../apps-kulibert/public/berty-run/
```

`vite.config.ts` already uses `BERT_CART_BASE=/berty-run/` on `build:cart`.

Placeholder at https://apps.kulibert.net/berty-run/ stays **list · not built** until you:

1. Graft the cart
2. Play First Trace on school DNS
3. File URL + rev + screenshot
4. Then bump the hub chip (see `apps-kulibert` `docs/crew/HUB-CHIP-BUMP.md`)

## Locks (already in the cart)

Genre GD×Arrow **feel** only · 2D canvas · fat JUMP · 30–40s spine · 3 gems on path · Trace broke / Trace complete · PLAY+HELP · Berty/PCB IP · no WebGL.

## Leave

Hub chip. Classroom `vercel.app`. Gravity heats. Later courses as playable.
