# Berty Run · First Trace

Chromebook 2D timing auto-runner. One button. Berty runs the copper. You tap **JUMP**.

**School door (after Debugzy grafts the cart):** https://apps.kulibert.net/berty-run/  
**Chip:** BR 1.5.0 — L1 First Trace with shop-robot sprites. Hub chip stays `list · not built` until Debugzy proves live play.

School DNS only (`*.kulibert.net`). Never send a class to `vercel.app`.

## Play

1. **PLAY** (or Space / tap the copper).
2. **JUMP** with Space, Up, or the JUMP button (also a tap on the trace).
3. Tap when the trace **glows**. Assist is on: a tap on the glow clears the beat.
4. Collect **3 gems**, then reach **EXIT**.
5. **Trace broke · try again** — fat **RETRY**. Missing a gem is not a fail: **Missing a gem · watch the pulses**.

Heat is about 34 seconds: gap, spike-via, gem, chip overhang, gem, timing window, gem, EXIT.

**HELP** on the title card. `?help=1` opens it. Sound is optional. A clear still shows **Trace complete**, **LEVEL UP**, and three gems with the sound off. `prefers-reduced-motion: reduce` turns off shake and pulse flash.

Jump timing is adapted from Pixel Runner in [ftaip/waiting-game](https://github.com/ftaip/waiting-game) (MIT). See [docs/NOTICE-waiting-game.md](docs/NOTICE-waiting-game.md).

## Run locally

```bash
npm ci
npm run dev
```

Open http://localhost:8080/

## Static cart for the hub

`npm run build:cart` writes a static site with Vite `base` `/berty-run/` into `dist/`.

```bash
npm ci
npm run build:cart
```

Copy **the contents of `dist/`** into `trebiluk/apps-kulibert` at `public/berty-run/` (replace that folder). Do not flip the hub chip in this repo. Debugzy grafts, plays the school URL, then flips the chip.

```bash
rsync -a --delete dist/ ../apps-kulibert/public/berty-run/
```

Files in that folder are the whole door: `index.html`, `assets/*`, `favicon.svg`. No server, no WebGL.

## Tests

```bash
npm test
```

`src/game/trace.test.ts` checks that gem-glow taps clear in 30–40s with 3 gems, edge taps can miss a gem, and a run with no jump fails.
