# Session B — Fundamental Domain Visualisation
# Show the practitioner the smallest repeating unit of the detected pattern.
# Run this session AFTER Session A (symmetry detection) is complete and working.

Read CLAUDE.md fully before doing anything else. Then read these files
only — do not open any other file until instructed:

  src/symmetry.ts
  src/types.ts

Confirm that SymmetryResult contains a fundamentalDomain field and that
FundamentalDomain has: angleStart, angleSweep, centreX, centreY, radius.
Do not proceed until confirmed.

Do not open any CSS file. Do not open any styles/ directory.

---

## What to build

Three layered visualisations that appear after symmetry detection runs,
overlaid on the entry's image in the analysis panel:

**Layer 1 — Fundamental domain overlay (always shown)**
A wedge drawn over the image showing the smallest region that generates
the full pattern. For D8 this is a 22.5° slice. This is what the
practitioner needs to draw.

**Layer 2 — Extracted tile (shown beside the overlay)**
The image pixels within the fundamental domain wedge, cropped and
displayed as a standalone tile. "This is the unit you repeat."

**Layer 3 — Tessellation preview (shown on demand)**
The extracted tile tiled back out using the detected group operations
to reconstruct the full pattern. Visual proof the detection worked.
Shown via a toggle — not rendered by default (computationally expensive).

All three are rendered client-side. No API call. No new dependencies
beyond what Session A installed.

---

## Part 1 — Read before building

Read the component that renders the analysis panel (panels.ts or
equivalent React component). Confirm:
- Where analysis results are currently displayed
- What state is available in that component
- Whether the raw SymmetryResult from Session A is accessible

If SymmetryResult is not in scope, identify where it is held and how
to pass it to the analysis panel. Do not refactor state — use what exists.

---

## Part 2 — Create src/FundamentalDomainView.tsx

One new component. Do not add visualisation logic to symmetry.ts or panels.

```typescript
interface FundamentalDomainViewProps {
  imageUrl: string               // the entry's image
  symmetryResult: SymmetryResult // from Session A detection
}
```

The component renders three sections in a vertical stack:
1. Overlay view (always visible)
2. Extracted tile (always visible when foldCount > 0)
3. Tessellation preview (hidden by default, toggle to show)

---

## Part 3 — Layer 1: Fundamental domain overlay

Render the entry image with an SVG overlay showing the wedge.

```
┌─────────────────────────┐
│                         │
│   [image]               │
│                         │
│   ╱━━━━━━━━━━━━━━╲      │ ← wedge outline in gold
│  ╱ shaded region  ╲     │ ← subtle fill, rest dimmed
│ ╱                  ╲    │
│ ─────────────────────   │
│                         │
└─────────────────────────┘
```

Implementation:
- Render image in a `<div>` with `position: relative`
- Layer an `<svg>` on top with `position: absolute`, same dimensions
- Draw the wedge as an SVG `<path>`:
  - Start at `(centreX, centreY)`
  - Line to point at `radius` distance at `angleStart`
  - Arc to point at `radius` distance at `angleStart + angleSweep`
  - Close back to centre
- Wedge fill: `rgba(212, 175, 55, 0.15)` (gold, subtle)
- Wedge stroke: `rgba(212, 175, 55, 0.8)`, strokeWidth 1.5
- Outside the wedge: `<rect>` covering full image with
  `fill="rgba(0,0,0,0.35)"` and `clipPath` excluding the wedge
  — this dims everything outside the fundamental domain

All SVG coordinates are in the same space as the image display dimensions,
not the original image pixel dimensions. Scale accordingly.

Below the overlay, render a caption in Cormorant Garamond italic:
`"The shaded wedge is the fundamental domain — the smallest unit that
generates this pattern when {n}-fold {D/C} symmetry is applied."`

---

## Part 4 — Layer 2: Extracted tile

Extract the image pixels within the fundamental domain wedge and display
them as a standalone tile beside a label.

```typescript
function extractTile(
  imageUrl: string,
  domain: FundamentalDomain,
  outputSize: number = 200   // px, square canvas
): Promise<string>  // returns data URI of the extracted tile
```

Implementation:
1. Draw the full image to an offscreen canvas
2. Create output canvas of `outputSize × outputSize`
3. For each pixel in the output canvas:
   a. Map to polar coordinates (r, θ) relative to the image centre
   b. If θ is within [angleStart, angleStart + angleSweep] and r <= radius:
      copy the pixel from the source canvas
   c. Otherwise: fill with --color-bg (warm off-white, #f5f0e8)
4. Return as data URI

Display:
- Label above: `FUNDAMENTAL UNIT` in Cinzel caps, 0.625rem
- The extracted tile image, 200×200px, subtle border
- Caption: `"{n}-fold — draw this, then apply {groupType}{n} symmetry"`

---

## Part 5 — Layer 3: Tessellation preview

Reconstruct the full pattern by tiling the fundamental domain using the
detected symmetry group operations.

```typescript
function renderTessellation(
  tile: string,               // data URI from extractTile
  result: SymmetryResult,
  outputSize: number = 400
): Promise<string>
```

Implementation:
1. Draw the tile to an offscreen canvas
2. Create output canvas `outputSize × outputSize`
3. Apply all group operations for Dn (or Cn):
   - For each k from 0 to n-1:
     a. Rotate tile by k × (360°/n) and draw to output canvas
     b. If groupType === 'D': also reflect across axis k×(180°/n)
        and draw the reflected-then-rotated tile
4. Return as data URI

Display:
- Hidden by default — rendered only when the user toggles it
- Toggle button: `Show reconstruction ↓` / `Hide reconstruction ↑`
  in Cinzel caps, 0.75rem, same style as existing secondary buttons
- Label above when visible: `PATTERN RECONSTRUCTION` in Cinzel caps
- Caption: `"The detected symmetry group applied to the fundamental
  unit. If this matches the original, detection is correct."`
- Display side-by-side with the original image when visible:
  Original | Reconstructed

---

## Part 6 — Integrate into analysis panel

Add `<FundamentalDomainView>` to the analysis panel component after
the existing classification results display.

Render condition: only when:
- symmetryResult is available in component state (set by Session A)
- symmetryResult.foldCount > 0
- entry.imageUrl is not null or empty

Do not render if detection hasn't run or returned no result.

The component is additive — it does not replace or modify existing
analysis panel content.

---

## Part 7 — Verification checklist

  [ ] npm run build passes — no TypeScript errors
  [ ] npm test passes — no existing tests broken
  [ ] FundamentalDomainView.tsx created — no visualisation logic in
      symmetry.ts or panels
  [ ] Overlay renders wedge in correct position over image
  [ ] Wedge angleSweep matches: 180°/n for Dn, 360°/n for Cn
  [ ] Extracted tile shows only pixels within the wedge
  [ ] Tessellation toggle hidden by default
  [ ] Tessellation renders after toggle
  [ ] Component only renders when foldCount > 0
  [ ] No new npm packages added
  [ ] No CSS files modified (inline styles or existing tokens only)
  [ ] data.ts, api.ts, canvas.ts, types.ts unchanged
  [ ] symmetry.ts unchanged (visualisation is in the new component only)
