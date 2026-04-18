# Handoff: Radian — Menu & Top-bar Redesign

## Overview

This package describes a redesign of the **filter menu** and **top-bar actions** for Radian (https://radian-geometric-art.vercel.app/), a personal collection tool for geometric art pieces.

The redesign replaces the existing left-rail filter menu with an **editorial popover toolbar** above the gallery, consolidates scattered top-bar actions into a matched pair of dropdown-style buttons (**Settings** + **Add piece**), and defines a responsive strategy that flows cleanly from 1440 → 390.

## About the Design Files

The files in this bundle are **design references created in HTML/React** — prototypes showing the intended look and behavior. They are **not production code to ship**. Your task is to **recreate these designs in the Radian codebase's existing environment** (likely Next.js + React on Vercel) using its established patterns, components, and styling conventions.

If the existing codebase has a design-system / token layer (CSS variables, Tailwind config, styled-components theme), adapt the tokens in this document to that layer rather than duplicating them.

## Fidelity

**High-fidelity.** Colors, typography, spacing, and interaction behavior are final. The one exception: the geometric piece thumbnails in the mock are procedurally-drawn SVG placeholders — the real app already has real thumbnails; keep those.

## Scope Summary

Two surfaces change:

1. **Top-bar actions** (right side): previously `DARK | IMPORT | EXPORT | SETTINGS | + ADD PIECE`. Now a single **Settings** dropdown (containing Dark mode, Import, Export) and a standalone **Add piece** button, both using an identical editorial dropdown-button style.
2. **Filter menu**: the left rail is replaced by a horizontal **filter toolbar** of popover buttons above the gallery grid. Each button opens a popover containing that group's chips. Active selections are reflected by a numeric badge on the button and by a **Filters summary bar** sitting directly above the grid with one-click-remove pills and a "Clear all".

Everything else on the page (the `RADIAN` wordmark, the tagline, the gallery grid layout, the card design) stays visually consistent with the current site.

---

## Screen: Collection (desktop)

### Layout

Single-column, full-width. Vertical stack:

1. **Top bar** (sticky, 60px tall, 1px bottom hairline)
2. **Gallery wrap** (padding `26px 32px 60px`)
   - Gallery header row (title + search + sort)
   - **Filter toolbar** (new) — horizontal row of dropdown buttons
   - **Active filters bar** (conditional — only when ≥1 filter is set)
   - **Grid** of piece cards: `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 22px`

### Top bar — left side

- 30×30 back button (1px hairline border, `--ink-soft` icon)
- `RADIAN` wordmark, 26px, Cormorant Garamond 500, `letter-spacing: 0.18em`, color `--gold-ink`
- Vertical hairline divider
- Tagline "Where art and mathematics unite" — JetBrains Mono 10.5px, uppercase, `letter-spacing: .14em`, color `--ink-mute`

### Top bar — right side (the consolidated actions)

Both buttons share the **same visual style** — a "tool" button: outlined, uppercase monospace label, chevron for dropdowns, gold-accent for primary.

#### Base "tool" button style
```
font: JetBrains Mono 500, 11px, letter-spacing .14em, uppercase
padding: 8px 12px
border: 1px solid var(--hair)
background: var(--bg-card)
color: var(--ink-soft)
border-radius: 3px
display: inline-flex; align-items: center; gap: 8px

:hover { border-color: var(--ink-soft); color: var(--ink); }
[data-open="true"] { border-color: var(--gold); color: var(--gold-ink); background: oklch(0.97 0.025 80); }
```

#### Settings button
- Label: `Settings`
- Trailing 10×10 chevron (down by default, still down when open — it's a menu, not a disclosure)
- Opens a popover (anchored right edge) — see below

#### Settings popover menu
```
min-width: 200px
background: var(--bg-card)
border: 1px solid var(--hair)
border-radius: 6px
box-shadow: 0 18px 40px -20px rgba(40,20,0,.25)
padding: 4px
position: absolute; top: calc(100% + 6px); right: 0
z-index: 60
```

Items (in order):
1. **Dark mode** — moon icon · label · right-aligned `on` badge (`--gold-ink`, 10px) when enabled. Toggles dark mode.
2. (Separator — 1px `--hair-soft`, margin `4px 2px`)
3. **Import** — up-arrow icon · label
4. **Export** — down-arrow icon · label

Menu item style:
```
font: JetBrains Mono, 11px, letter-spacing .14em, uppercase
padding: 9px 12px
color: var(--ink-soft)
border-radius: 3px
display: flex; gap: 10px; align-items: center
:hover { background: oklch(0.95 0.015 80); color: var(--ink); }
```

Icons are 11×11, `stroke="currentColor"`, `stroke-width: 1.2`, `fill: none`.

Dismiss on outside click.

#### Add piece button
Same base "tool" style, but with the **primary** modifier applied permanently:
```
border-color: var(--gold)
color: var(--gold-ink)
background: oklch(0.97 0.025 80)
:hover { border-color: var(--gold-ink); }
```
- Leading `+` icon (11×11 plus glyph, `stroke-width: 1.4`)
- Label: `Add piece`
- No chevron (not a dropdown)

---

## Gallery header row

Horizontal flex, `align-items: baseline`, `gap: 18px`, `flex-wrap: wrap`.

1. Title: `Your collection — <b>N pieces</b>` in Cormorant Garamond italic 20px, `--ink-soft`, with the number in non-italic `--ink` 500.
2. Spacer (`flex: 1`)
3. **Search** — 240px wide on desktop, full width on mobile. Magnifier glyph + `<input placeholder="Search…">`, JetBrains Mono 12px, 1px hairline border, 3px radius.
4. **Sort** — `Newest first ↓`, styled as the base tool button (outlined monospace).

---

## Filter toolbar (the centerpiece)

Horizontal row directly below the gallery header, `margin-bottom: 18px`. On mobile it becomes a horizontally-scrolling chip row (see Responsive).

Each filter group is a **dropdown tool button** (same base style as Settings/Add piece):

```
display: flex; flex-wrap: wrap; gap: 6px
```

**Button content:**
- Group label (e.g. `Status`, `Tradition`, `Pattern type`, `Symmetry`, `Difficulty`, `Construction`)
- If any option in the group is selected: a trailing numeric **badge** `.n` — pill, `background: var(--gold-ink)`, `color: var(--chip-on-fg)`, `font-size: 10px`, `padding: 1px 6px`, `border-radius: 999px`
- Trailing chevron

**Button states:**
- Default: outlined hairline
- `[data-active="true"]` (any option selected): gold border + gold-ink text + cream-gold background
- `[data-open="true"]`: popover visible

**Popover (`.pop`):**
```
position: absolute; top: calc(100% + 6px); left: 0
min-width: 260px; max-width: 360px
background: var(--bg-card)
border: 1px solid var(--hair)
border-radius: 6px
box-shadow: 0 18px 40px -20px rgba(40,20,0,.25)
padding: 12px
z-index: 30
```

Popover contents vary by group kind (see Filter Groups below). Dismiss on outside click; selections persist when popover closes.

After the filter tools, if any filter is active, render a **Clear** button (same base tool style) showing `Clear · N` where N is the total active filter count.

---

## Filter Groups (data + kinds)

Six groups. Four rendering kinds.

### 1. Status (kind: `status`)
Chips with a leading colored dot.
| value | label | dot |
|---|---|---|
| want | Want to try | `#3b6fb0` |
| attempted | Attempted | `#a88338` |
| done | Done | `#4d8555` |

Multi-select.

### 2. Construction (kind: default chips)
Multi-select.
Options: Compass & straightedge, Ruler only, Freehand, Polygonal method, Grid based, String art / parabolic

### 3. Tradition (kind: default chips)
Multi-select.
Options: Islamic geometric, Moorish-Andalusian, Persian-Iranian, Moroccan-Maghrebi, Ottoman, Gothic-Medieval, Hindu-Vedic, Celtic-Insular, Nature-derived, Syncretic, Contemporary-Mathematical

### 4. Pattern type (kind: default chips)
Multi-select.
Options: Rosette, Star polygon, Tessellation, Arabesque / biomorph, Mandala, Knot / interlace, Spiral, Parabolic curve, Epicycloid, Curve of pursuit, Flower of Life lineage

### 5. Symmetry (kind: `symmetry`)
Renders as a 5-column **numeric grid** inside the popover. Each option is a small chip, center-aligned, tabular-nums, label `N-fold`. Multi-select.
Options: 3, 4, 5, 6, 7, 8, 10, 12, 16

```
.num-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px }
```

### 6. Difficulty (kind: `segmented`)
Renders as a **segmented control** (single-select, clicking the active option clears it).
Options: Beginner, Intermediate, Advanced

```
.segmented {
  display: inline-flex;
  border: 1px solid var(--hair); border-radius: 3px; overflow: hidden;
  background: var(--chip-bg);
}
.segmented button {
  font: JetBrains Mono 11px, letter-spacing .1em
  padding: 6px 12px
  border: 0; border-right: 1px solid var(--hair); background: transparent
  color: var(--ink-soft); cursor: pointer
}
.segmented button[aria-pressed="true"] {
  background: var(--chip-on-bg); color: var(--chip-on-fg);
}
.segmented button:last-child { border-right: 0 }
```

### Chip styling (shared by status / default / symmetry)
```
font: JetBrains Mono 11px, letter-spacing .06em
color: var(--ink-soft)
background: var(--chip-bg)
border: 1px solid var(--hair)
padding: 5px 10px
border-radius: 3px
cursor: pointer
transition: all .15s ease

:hover { border-color: var(--ink-soft); color: var(--ink); }
[aria-pressed="true"] {
  background: var(--chip-on-bg);
  color: var(--chip-on-fg);
  border-color: var(--chip-on-bg);
}
```

Leading dot (for status chips):
```
.chip .dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; transform: translateY(-1px); }
```

---

## Active filters bar

Renders **only** when ≥1 filter is set. Sits between the filter toolbar and the grid.

```
display: flex; flex-wrap: wrap; align-items: center; gap: 8px
padding: 10px 14px
background: oklch(0.955 0.020 80)
border: 1px solid var(--hair-soft)
border-radius: 6px
margin-bottom: 22px
```

Contents:
1. Label `Filters` — JetBrains Mono 10.5px, uppercase, `letter-spacing: .18em`, `--ink-mute`, right padding 6px, right border 1px hairline, right margin 4px.
2. One **pill** per active filter value:
   ```
   font: JetBrains Mono 11px
   padding: 4px 8px 4px 10px
   background: var(--bg-card); border: 1px solid var(--hair); border-radius: 3px
   color: var(--ink)
   display: inline-flex; align-items: center; gap: 8px
   ```
   Pill label is the filter's display name (e.g. `Rosette`, `8-fold`, `Want to try`). Trailing close button:
   ```
   appearance: none; padding: 0; margin: 0; border: 0; background: transparent;
   width: 16px; height: 16px;
   display: inline-flex; align-items: center; justify-content: center;
   color: var(--ink-mute); cursor: pointer; line-height: 0;
   ```
   Inline 8×8 SVG with two `stroke-width: 1.3` diagonals forming an ×. **Critical: zero the button's default padding/border/margin, and set `line-height: 0` — otherwise the × sits off-center.**
3. `Clear all` button — right-aligned (`margin-left: auto`), JetBrains Mono 10.5px, uppercase, `letter-spacing: .16em`, `--gold-ink`, transparent background, no border, cursor pointer.

Clicking a pill's × removes just that value; clicking `Clear all` empties every group.

---

## Responsive Strategy

Breakpoints (max-width):

| BP | What changes |
|---|---|
| **1200** | Gallery grid: `minmax(230px, 1fr)`. Gallery padding → `22px 26px 60px`. |
| **980** | Top bar gap tightens to 14px, padding to `12px 20px`. Tagline hides. Chip padding tightens to `4px 8px`. |
| **760** | **The big one.** Filter toolbar becomes horizontally-scrolling (`overflow-x: auto; flex-wrap: nowrap; padding: 0 16px 8px; margin: 0 -16px 14px`). Grid: `minmax(160px, 1fr)`, gap 14px. Card title drops to 17px. Search goes full-width and drops to `order: 2` below the title. Gallery padding: `16px 16px 100px` (extra bottom for the mobile FAB, though in this design we keep toolbar always visible — the FAB is a fallback option for a future iteration). |
| **440** | Top bar padding `10px 14px`. Wordmark → 22px. Brand's right divider removed. Tool buttons → `padding: 7px 10px`. |

### Top-bar overflow on tablet
At ≤980, if horizontal space is tight, collapse `Settings` and `Add piece` into icon-only variants (drop the text label, keep the icon + chevron / icon-only). Don't drop them entirely — both are primary nav. The current build keeps labels because the consolidated set is only 2 items and fits.

### Filter toolbar on tablet (760–440)
Horizontal scroll row. Popovers still open; they must **constrain to viewport width** (`max-width: calc(100vw - 32px)`) and may want to anchor to the left edge of the scroll container rather than the button, so they don't clip. On mobile, opening a popover could alternatively elevate into a bottom sheet — optional enhancement.

### Filter toolbar at ≤440
Same horizontal scroll behavior. Consider letting the Active Filters bar wrap onto 2 lines; it already does via `flex-wrap: wrap`.

---

## Interactions & Behavior

### Settings dropdown
- Click toggles `data-open`.
- Click outside closes.
- Escape should close (not in mock — please add).
- Focus trap not required (simple menu).
- Dark mode toggle flips a class on `<html>`; the "on" badge reflects current state.

### Filter tool dropdowns
- Click toggles `data-open`.
- Click outside closes.
- Clicks **inside** the popover must not close it (mock uses `e.stopPropagation()` on the popover's `onClick`).
- Selections apply live (no Apply button).
- Popover width clamped `min 260px, max 360px`.

### Active filter pills
- Pill × removes that single value from its group.
- `Clear all` empties every group.

### Add piece
- No dropdown. Click opens the "add piece" modal/flow (not in scope here — use whatever the existing codebase already has).

### Gallery cards
- Hover: `transform: translateY(-2px)`, subtle.
- Status dot: top-right of image, 10×10, 2px card-colored border + 1px soft shadow ring.
- Difficulty level: bottom-left of image, inside a small monospace chip.

---

## State Management

Minimal shape. Suggest:

```ts
type FilterState = {
  status: string[];       // ['want', 'done', ...]
  construction: string[];
  tradition: string[];
  pattern: string[];
  symmetry: string[];     // ['3', '8', ...] — strings to match option values
  difficulty: string | null;  // single-select
};
```

- `toggle(groupKey, value, single?)` — for `single: true`, replace with `[value]` or clear if same; for multi, add or remove.
- `clearAll()` — empties everything.
- `activeCount = Object.values(state).flat().filter(Boolean).length`.

Persist to URL query params (`?status=want,done&tradition=islamic-geometric`) so filter state is shareable and survives reload — this is collection software; people will bookmark filtered views.

---

## Design Tokens

```css
:root {
  /* Palette — warm cream / ink / gold */
  --bg:        oklch(0.965 0.012 82);
  --bg-rail:   oklch(0.945 0.016 82);
  --bg-card:   oklch(0.985 0.008 85);
  --ink:       oklch(0.25 0.015 60);
  --ink-soft:  oklch(0.45 0.013 65);
  --ink-mute:  oklch(0.60 0.012 70);
  --hair:      oklch(0.85 0.010 75);
  --hair-soft: oklch(0.90 0.010 75);
  --gold:      oklch(0.58 0.075 75);
  --gold-ink:  oklch(0.38 0.065 70);
  --chip-bg:   oklch(0.99 0.005 85);
  --chip-on-bg:oklch(0.36 0.055 70);
  --chip-on-fg:oklch(0.98 0.010 85);

  /* Type */
  --font-display: 'Cormorant Garamond', 'EB Garamond', Georgia, serif;
  --font-ui:      'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;
  --font-body:    'Inter', system-ui, sans-serif;

  /* Radii */
  --r-sm: 3px;
  --r-md: 6px;
  --r-lg: 10px;

  /* Shadow */
  --shadow-card: 0 1px 0 rgba(50,30,10,.04), 0 12px 28px -18px rgba(50,30,10,.18);
}
```

### Status dot palette (not tokenized — literal values)
- `want`: `#3b6fb0`
- `attempted`: `#a88338`
- `done`: `#4d8555`

### Dark mode
Not mocked in detail; the Settings menu toggle is present but the dark palette is TBD. Suggest inverting ink/bg scale while preserving the gold accent and the same status dot colors.

---

## Typography scale (observed)

| Role | Family | Size | Weight | Letter-spacing | Transform |
|---|---|---|---|---|---|
| Wordmark | Cormorant Garamond | 26px | 500 | 0.18em | — |
| Page title ("Your collection —") | Cormorant Garamond italic | 20px | 400 | — | — |
| Card title | Cormorant Garamond | 19px | 400 | 0.01em | — |
| Card sub | JetBrains Mono | 11px | 400 | 0.10em | uppercase |
| Tool button / chip / menu item | JetBrains Mono | 11px | 400–500 | 0.14em (tool), 0.06em (chip) | uppercase (tool), as-is (chip) |
| Tagline / group label / meta | JetBrains Mono | 10.5px | 400–500 | 0.14–0.22em | uppercase |
| Pill close glyph | SVG | 8×8 box | — | — | — |

---

## Assets

- **Fonts:** Google Fonts — Cormorant Garamond (400, 500, 500italic), Inter (400, 500, 600), JetBrains Mono (400, 500). Load with `display: swap`.
- **Icons:** inline SVGs, stroked with `currentColor`, `stroke-width: 1.2–1.4`. No icon library used in the mock. If the codebase already has Lucide / Tabler / Radix icons, substitute equivalents:
  - Dark mode → `moon`
  - Import → `upload` / `log-in` (up arrow into tray)
  - Export → `download` / `log-out` (down arrow into tray)
  - Add piece → `plus`
  - Chevron → `chevron-down`
  - Pill close → `x`
  - Back → `chevron-left`
- **Piece thumbnails:** real, already exist in the app. The mock uses procedural SVG placeholders — ignore them.

---

## Files in this bundle

Reference HTML/JSX from the design — **do not ship as-is**; translate into the target framework.

- `Radian Menu Redesign.html` — entry point, stage wrapper, tweak panel (the tweak panel is a design harness, not part of the feature)
- `styles.css` — all design-system styling for the feature
- `app.jsx` — top-level app (header + gallery + drawer)
- `filters.jsx` — `FilterGroup`, `Chip`, `Segmented`, `ActiveBar` primitives
- `toolbar.jsx` — `FilterTool` popover component (Variation B's core)
- `data.js` — mock groups/pieces data shape, useful as a schema reference

The HTML file also includes a `.notes` block with design rationale and a mobile bottom-sheet drawer (`.drawer`, `.filter-fab`) as a fallback pattern — **not** part of the preferred direction (which is the toolbar at all widths), but included for reference if later testing shows the toolbar falters below 440px.

---

## Implementation Checklist

- [ ] Replace top-bar right side: `Settings` dropdown + `Add piece` button (matched style).
- [ ] Settings popover contains Dark / Import / Export. Outside-click and Escape dismiss.
- [ ] Remove the left filter rail.
- [ ] Add filter toolbar above the gallery grid with one dropdown per group.
- [ ] Each dropdown shows a numeric badge when any option in that group is active.
- [ ] Render group interiors per kind (chips / status-chips / numeric-grid / segmented).
- [ ] Active filters bar renders conditionally with remove-per-pill + Clear all.
- [ ] Wire filter state to the gallery query + persist to URL params.
- [ ] Responsive: toolbar scrolls horizontally ≤760; search goes full-width; grid tightens.
- [ ] Make sure the pill × is centered (zero the button's default chrome).
- [ ] Dark mode toggle wired; dark palette defined.

---

## Questions to confirm before building

1. Does the existing codebase use Tailwind, CSS Modules, styled-components, or something else? (Adapt tokens accordingly.)
2. What icon library is already installed?
3. Is there an existing design-system package for components like chips, segmented controls, popovers? (Prefer those over rebuilding.)
4. Should filter state sync to URL params, local storage, or just live memory?
5. What's the intended dark-mode palette? Mock leaves this open.
