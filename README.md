# ATLAS — 8-bit Geography Quiz

A personal, **fully offline**, NES-styled geography quiz. Four modes over the 193
UN member states: **Capitals**, **Flags**, **Letter Country-Capital**, and
**How Many Countries** (timed free-recall with a live pixel world map).

Built to match the Claude Design mockups (`ATLAS Mockups.dc.html`) 1:1 and the
functional spec in `atlas-app-plan.md`.

## Stack
- **Vite + React + Tailwind CSS**
- Static JSON country data, bundled flags and fonts (no network at runtime)
- `localStorage` for high scores only — one best per mode **+ length**
  (e.g. Capitals-10, Capitals-25, How-Many-10min). Nothing else persists;
  current-run state is in memory only.
- Desktop-only: fixed **1512×982** design canvas, scaled to fit the window.

## Run
```bash
npm install
npm run gen:data   # generates country data + world map + copies flag SVGs (see below)
npm run dev        # http://localhost:5173
npm run build      # static bundle in dist/ — deployable anywhere / runnable offline
```

## Data pipeline (`npm run gen:data`)
`scripts/generate-data.mjs` produces everything under `src/data/` and `public/flags/`:

- **`countries.json`** — 193 UN members `{ name, aliases, capital, capitalAliases,
  iso2, continent }`, derived from the `world-countries` package (Vatican, a UN
  *observer*, is excluded to land exactly on 193). Continents assigned singly so
  totals sum to 193: Europe 44 · Asia 46 · Africa 54 · N. America 23 · S. America 12
  · Oceania 14.
- **`letterPairs.json`** — the 139 distinct `(country-initial, capital-initial)`
  pairs, each with its list of valid country answers. This is the pool the
  Letter mode's "ALL" draws from.
- **`worldMap.json`** — real Natural Earth (`world-atlas`) per-country boundaries
  rasterized to a 140×54 grid, each cell keyed by ISO. Every country is
  guaranteed ≥1 cell (microstates get a manual representative point), so all 193
  stay individually lightable. Rendered blocky via a `<canvas>` scaled with
  `image-rendering: pixelated`.
- **`public/flags/*.svg`** — the 193 needed flags copied locally from
  `flag-icons` (true offline; the "OFFLINE" label on the title screen is real).

## Answer checking (spec §3)
Case-, accent-, and punctuation-insensitive. Any **alias** is accepted as input;
a wrong-answer reveal shows only the **primary** name. Letter mode resolves the
typed country and checks that *its* name+capital initials match the shown pair,
so any country matching both letters counts (e.g. `B · B` → Brazil *or* Barbados).

## Flow
Home → Mode Select → (Question Count | Time Select) → Play → Results.
Keyboard-first: type + **Enter** to answer; arrows + Enter to navigate menus;
**Esc** to go back. Quiz modes run a **Round 2 "Second Chance"** over the missed
questions once before Results.
