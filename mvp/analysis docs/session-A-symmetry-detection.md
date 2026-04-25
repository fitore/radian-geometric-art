# Session A — Symmetry Detection
# Build the client-side fold detection pipeline and wire it to the Analyze button.
# Run this session before Session B (fundamental domain visualisation).

Read CLAUDE.md fully before doing anything else. Then read these files
only — do not open any other file until instructed:

  src/types.ts
  src/data.ts
  src/api.ts

Report the exact shape of the `Analysis` type and the exact string values
in `TAG_VOCABULARY` for the `symmetry` key before writing any code.
Do not proceed until you have confirmed both.

Do not open any CSS file. Do not open any styles/ directory.

---

## What to build

A client-side symmetry detection pipeline that:
1. Takes an entry's image
2. Vectorises it using imagetracerjs
3. Detects the fold count and symmetry group (Dn vs Cn)
4. Maps the result to TAG_VOCABULARY symmetry values
5. Merges the result into an Analysis object
6. Is triggered by an "Analyze" button on the entry detail panel

Runs entirely in the browser. No API call. No server round-trip.
Result is presented as a suggested tag with confidence — not applied
automatically.

---

## Part 1 — Install dependencies

```bash
npm install imagetracerjs kd-tree-javascript
npm install -D @types/kd-tree-javascript
```

No other packages.

---

## Part 2 — Create src/symmetry.ts

Create one new file. Do not add symmetry logic to any existing module.

The file exports exactly three functions:

```typescript
extractPoints(imageSource: HTMLImageElement | string): Promise<Point[]>
detectSymmetry(points: Point[]): SymmetryResult
mapToTag(result: SymmetryResult): SymmetryTag
```

Define these types locally in symmetry.ts. Do not add them to types.ts
except for FundamentalDomain which is needed by Session B — add that
to SymmetryResult now so Session B requires no types change.

```typescript
interface Point { x: number; y: number }

interface FundamentalDomain {
  angleStart: number    // radians — start of the wedge
  angleSweep: number    // radians — 180°/n for Dn, 360°/n for Cn
  centreX: number       // pixel coords in original image space
  centreY: number
  radius: number        // how far the wedge extends from centre
}

interface SymmetryResult {
  foldCount: number           // 0 if no clear symmetry detected
  groupType: 'D' | 'C' | 'none'
  rotationScore: number       // 0–1
  reflectionScore: number     // 0–1, 0 if not tested
  epsilon: number             // tolerance used
  fundamentalDomain?: FundamentalDomain  // populated when foldCount > 0
}

interface SymmetryTag {
  value: string | null        // e.g. '8-fold', or null if below threshold
  confidence: 'high' | 'medium' | 'low'
  rationale: string           // one sentence
}
```

---

## Part 3 — Implement extractPoints

```typescript
async function extractPoints(imageSource: HTMLImageElement | string): Promise<Point[]> {
  // 1. If imageSource is a string (data URI or URL), load it into an
  //    HTMLImageElement. If already an element, use directly.

  // 2. Draw to offscreen canvas. Cap longest side at 800px.
  //    Store the scale factor applied — needed to convert points back
  //    to image-space pixel coords for fundamentalDomain.

  // 3. Run imagetracerjs on the canvas ImageData with options:
  //      ltres: 1, qtres: 1, pathomit: 8, numberofcolors: 2

  // 4. Parse the SVG string. Extract all path 'd' attributes.
  //    Sample points along each path at ~4px intervals.

  // 5. Normalise:
  //    a. Record raw centroid (cx, cy) in canvas-space — needed for
  //       fundamentalDomain centre calculation.
  //    b. Translate: subtract centroid.
  //    c. Scale: divide by median distance from origin.
  //       Record scale factor.
  //    Attach cx, cy, and scale to the returned array as properties
  //    (or return a wrapper object) so detectSymmetry can compute
  //    fundamentalDomain in original image coordinates.

  // 6. Downsample to max 800 points if larger.
  //    Uniform random sampling without replacement.
}
```

---

## Part 4 — Implement detectSymmetry

Test fold counts in order: 6, 4, 8, 3, 12, 5, 10, 16, 7.
Exit early on first strong match.

```typescript
function detectSymmetry(points: Point[]): SymmetryResult {
  const FOLD_COUNTS = [6, 4, 8, 3, 12, 5, 10, 16, 7]
  const ROTATION_THRESHOLD = 0.82
  const REFLECTION_THRESHOLD = 0.75
  const EPSILON = 0.025

  // Build KD-tree. Distance function: squared Euclidean.
  const tree = new KDTree(points, (a, b) =>
    Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2), ['x', 'y'])

  for (const n of FOLD_COUNTS) {
    const angle = (2 * Math.PI) / n
    const rotationScore = scoreRotation(points, tree, angle, EPSILON)

    if (rotationScore >= ROTATION_THRESHOLD) {
      const reflectionScore = scoreReflections(points, tree, n, EPSILON)
      const groupType: 'D' | 'C' = reflectionScore >= REFLECTION_THRESHOLD ? 'D' : 'C'

      // Fundamental domain: wedge angle is 180°/n for Dn, 360°/n for Cn
      const angleSweep = groupType === 'D'
        ? Math.PI / n
        : (2 * Math.PI) / n

      const fundamentalDomain: FundamentalDomain = {
        angleStart: 0,
        angleSweep,
        centreX: points.centreX ?? 0,   // from extractPoints metadata
        centreY: points.centreY ?? 0,
        radius: points.imageRadius ?? 200
      }

      return {
        foldCount: n, groupType, rotationScore, reflectionScore,
        epsilon: EPSILON, fundamentalDomain
      }
    }
  }

  return { foldCount: 0, groupType: 'none', rotationScore: 0,
           reflectionScore: 0, epsilon: EPSILON }
}

function scoreRotation(points: Point[], tree: KDTree, angle: number, epsilon: number): number {
  let matches = 0
  for (const p of points) {
    const rotated = {
      x: p.x * Math.cos(angle) - p.y * Math.sin(angle),
      y: p.x * Math.sin(angle) + p.y * Math.cos(angle)
    }
    if (tree.nearest(rotated, 1, epsilon * epsilon).length > 0) matches++
  }
  return matches / points.length
}

function scoreReflections(points: Point[], tree: KDTree, n: number, epsilon: number): number {
  const scores: number[] = []
  for (let i = 0; i < n; i++) {
    const axisAngle = (Math.PI * i) / n
    const cos2 = Math.cos(2 * axisAngle)
    const sin2 = Math.sin(2 * axisAngle)
    let matches = 0
    for (const p of points) {
      const reflected = { x: p.x * cos2 + p.y * sin2, y: p.x * sin2 - p.y * cos2 }
      if (tree.nearest(reflected, 1, epsilon * epsilon).length > 0) matches++
    }
    scores.push(matches / points.length)
  }
  return scores.reduce((a, b) => a + b, 0) / scores.length
}
```

---

## Part 5 — Implement mapToTag

Read TAG_VOCABULARY symmetry values from data.ts first. Use exact strings.

```typescript
function mapToTag(result: SymmetryResult): SymmetryTag {
  if (result.foldCount === 0) {
    return {
      value: null,
      confidence: 'low',
      rationale: 'No clear rotational symmetry detected above threshold.'
    }
  }

  const tagValue = `${result.foldCount}-fold`  // verify against TAG_VOCABULARY

  // Confidence derivation — implement this inline, not as a separate function:
  // D group + rotationScore >= 0.90 → 'high'
  // D group + rotationScore >= 0.82 → 'medium'
  // C group (reflection absent)     → 'medium' always
  //                                   (cyclic-only is unusual; flag it)
  // rotationScore 0.82–0.87         → 'low' regardless of group
  let confidence: 'high' | 'medium' | 'low'
  if (result.groupType === 'D' && result.rotationScore >= 0.90) {
    confidence = 'high'
  } else if (result.groupType === 'D' && result.rotationScore >= 0.88) {
    confidence = 'medium'
  } else if (result.groupType === 'C') {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  const rationale = result.groupType === 'D'
    ? `${result.foldCount}-fold dihedral symmetry (rotation ${result.rotationScore.toFixed(2)}, reflection ${result.reflectionScore.toFixed(2)}).`
    : result.groupType === 'C'
    ? `${result.foldCount}-fold rotational symmetry only — reflection axes weak, pattern may be cyclic not dihedral.`
    : 'Symmetry detection inconclusive.'

  return { value: tagValue, confidence, rationale }
}
```

---

## Part 6 — Wire to Analysis type

When the Analyze button is clicked:
1. Call `extractPoints(entry.imageUrl)`
2. Call `detectSymmetry(points)`
3. Call `mapToTag(result)`
4. Construct partial Analysis — symmetry field only:

```typescript
const symmetryAnalysis: Partial<Analysis> = {
  classifications: {
    symmetry: {
      primary: tag.value,
      confidence: tag.confidence,
      rationale: tag.rationale
    }
  },
  analyzedAt: new Date().toISOString(),
  promptVersion: 'symmetry-v1'
}
```

5. Merge into existing entry analysis or create new one.
6. Call `populateForm({ ...entry, analysis: mergedAnalysis })`.
   Do not write to localStorage directly.

Store the raw `SymmetryResult` (including `fundamentalDomain`) in
component state — Session B will need it to render the overlay.
Do not persist `SymmetryResult` to localStorage. It is transient.

---

## Part 7 — The Analyze button

Add to the entry detail panel. Read the component structure first.

- Label: `Analyze`
- Loading state: disabled + label `Analyzing...`
- User-triggered only — no useEffect, no auto-trigger
- Separate from any existing Claude Vision trigger — additive, not replacement

Error handling:
- No paths from imagetracerjs → 'Could not extract pattern from this image'
- foldCount === 0 → show low-confidence result, do not suppress
- Any exception → log to console, show 'Analysis failed — try a cleaner image'

---

## Part 8 — Verification checklist

  [ ] npm install succeeds
  [ ] npm run build passes — no TypeScript errors
  [ ] npm test passes — no existing tests broken
  [ ] symmetry.ts exports: extractPoints, detectSymmetry, mapToTag
  [ ] FundamentalDomain type defined in symmetry.ts and present on SymmetryResult
  [ ] No symmetry logic in any other module
  [ ] TAG_VOCABULARY symmetry values used verbatim
  [ ] populateForm called — no direct localStorage writes
  [ ] Raw SymmetryResult held in component state (not persisted)
  [ ] Analyze button user-triggered only
  [ ] Button shows loading state during detection
  [ ] No CSS files modified
  [ ] data.ts, api.ts, canvas.ts, types.ts unchanged
  [ ] SYSTEM_PROMPT unchanged
