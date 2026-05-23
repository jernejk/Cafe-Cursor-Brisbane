# Mosaic Pop

A relaxing mobile-first tile-collection puzzle prototype. Tap matching coloured tiles on a pixel-art mosaic board to fill the collection tray, then advance through a sequence of target colours.

## Run locally

```bash
npm install
npm run dev
```

Open the dev server URL on your phone or use browser dev tools in portrait mode (~360–720px wide).

## Build

```bash
npm run build
```

Output goes to `dist/`.

## How to play

1. The board shows a fixed pixel-art **background** with scrambled **bubbles** on top (bubbles often sit on the wrong coloured square).
2. The top tray row shows the current **target** colour. Progress counts how many target tiles are **correctly placed** on the board (e.g. **Target: Cream 4/12**).
3. Tap any bubble on the board to pick it into the **bottom buffer** (mixed colours, up to 12 slots).
4. Tap a buffer tile to select it, then tap a board cell whose background matches that colour to **place** it. A correct placement puts the bubble on the matching square.
5. Wrong taps or invalid placements shake briefly.
6. Place 12 target-colour tiles correctly to advance to the next target (Cream → Orange → …). The buffer keeps other colours until you place them.

### Target order

Cream → Orange → Navy → Cyan → Yellow → Pink → Tan → Stone → Violet

### Boosters

| Button | Effect |
|--------|--------|
| Magic wand | Collects a random cluster of the current target colour |
| Brush | Recolours one random non-target tile to the current target |
| Magnet | Collects up to 12 visible target tiles at once |

The small red play badges are decorative only—no ads are shown.

### Settings

- **Restart Level** — reset the board and target to Cream
- **Animations** — toggle fly-to-tray animations
- **Sound** — toggle short Web Audio pops (no audio files bundled)

## Tech stack

- Vite + React + TypeScript
- HTML Canvas for the mosaic board
- CSS/HTML for tray, toolbar, and modals
- No external image assets

## Project structure

```
src/
  App.tsx              — layout, reducer wiring
  components/
    GameCanvas.tsx     — board rendering & animations
    Tray.tsx           — collection slots
    Toolbar.tsx        — booster buttons
    SettingsModal.tsx
  game/
    types.ts
    colors.ts
    level.ts           — level 1 matrix (24×33)
    logic.ts           — flood-fill, targets, boosters
    reducer.ts
```
