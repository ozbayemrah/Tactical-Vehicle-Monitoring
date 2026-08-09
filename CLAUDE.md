# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A dystopian cyberpunk HMI/FUI prototype: a tactical map HUD tracking a simulated vehicle fleet, with RTS-style click/shift-click selection and shift-drag box-select. Static site, no backend, no build step.

## Running it

Must be served over `http://`, not opened via `file://` — the JS is loaded as ES modules (`js/main.js` uses `import`), which browsers block under `file://`.

```
npx serve .
```

## Architecture notes

- `js/main.js` is the entry point; it wires together `data.js` (fleet/satellite generation), `map.js` (Leaflet + dark CARTO tiles), `hud.js` (HUD chrome, boot sequence, logging), `input.js` (selection/click handling), and `sim.js` (per-tick vehicle movement/fuel/comms simulation).
- See the README for the full control scheme (click/shift-click select, shift-drag box-select, right-click move orders, squad hotkeys, formations).
