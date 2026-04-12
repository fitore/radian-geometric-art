# Radian v2 — Vision Analysis Spike
## Principal Engineer: Geometric Pattern Classification & Line Template Feasibility


You are continuing a vision classification spike for Radian, a sacred geometry 
collection app. The spike validates whether Claude Vision can classify geometric 
pattern images using a structured taxonomy. Here is the full state:


## Key files
- spike/run-spike.js          — the spike runner (read this first)
- spike/results.json          — raw results from iteration 1 run
- spike/scorecard.md          — per-image scoring table
- spike/SPIKE-RESULTS.md      — findings narrative
- analysis docs/test-images.json  — 10 verified test images with ground truth
- analysis docs/radian-vision-spike.md  — full spike plan (Parts 1-5)
- analysis docs/radian-v2-PRD.md        — product context (Sections 6, 14)

## Spike results so far
Iteration 1 (SYSTEM_PROMPT_V1, model: claude-sonnet-4-6) ran across 10 images.
Overall accuracy: 55.5% → ITERATE decision (threshold: ≥70% greenlight).

Per-field accuracy:
- patternType:        77.5%  ← strong, above greenlight threshold
- constructionMethod: 60.0%
- tradition:          50.0%
- symmetry:           47.5%  ← weakest
- proportion:         42.5%  ← all wrong answers were PARTIAL (no confident misses)

Identified failure patterns:
1. Schema bleed — Claude put "Flower-of-Life-lineage" (a patternType value) into 
   the tradition field on images 1 and 14. "syncretic" and "Contemporary-Mathematical" 
   were missing from the tradition vocabulary in v1.
2. Symmetry miscounting — Penrose (predicted 10-fold, gt 5-fold), Sri Yantra 
   (predicted 4-fold, gt 3-fold), Nautilus (predicted 3-fold, gt none). Claude 
   is counting star points or rhombus pairs rather than full rotational repeats.
3. constructionMethod for organic sources — Nautilus shell predicted 
   compass-and-straightedge (should be freehand — it's a nature photograph).
4. Image 11 (hexagon GIF) scored 10% — Claude returned "uncertain" on 4/5 fields. 
   Suspected cause: animated GIF format renders poorly as base64. 
   Replace with a PNG version before re-running.

## What was already fixed
SYSTEM_PROMPT_V2 is written and live in spike/run-spike.js (replaces SYSTEM_PROMPT_V1 
which is kept as a const for comparison). Changes:
1. Added syncretic + Contemporary-Mathematical to tradition vocabulary
2. Explicit warning: "Flower-of-Life-lineage is a patternType ONLY, never a tradition"
3. Symmetry guideline rewritten: count rotational repeats, not points/edges
4. constructionMethod guideline: classify the SOURCE, not any overlay annotation

## Next task
Run the spike with SYSTEM_PROMPT_V2 (just run: node spike/run-spike.js from the 
project root) and compare results against iteration 1. 

If overall accuracy crosses 70%: greenlight Feature 2.
If still 50-70%: apply Part 5 Iteration 2 (chain-of-thought prefix before JSON).
If image 11 (hexagon GIF) still fails: replace its URL in test-images.json with 
a PNG equivalent from Wikimedia — search for "Regular hexagon inscribed circle PNG".

## API setup
.env file at project root contains key "radian-app-api-key" (funded, ~$5 balance).
dotenv is installed. The script reads it automatically.










**Purpose:** Validate whether Claude Vision can reliably classify sacred geometry images using Radian's TAG_VOCABULARY, and determine the right architecture for the analysis + extraction pipeline.

**Time budget:** 2 days
**Success gate:** If classification accuracy ≥ 70% across 12 test images on the primary fields (symmetry, tradition, patternType), Feature 2 is greenlit for build. Below 50%, descope to manual tagging with AI "suggestions" only. Between 50-70%, invest in prompt iteration before committing.

---

## Part 1: The System Prompt

This is the exact system prompt to be embedded in the `analyzePattern()` function. It is the load-bearing artifact for Feature 2.

```
You are a sacred geometry analysis engine for Radian, a practitioner's
research tool. You analyze images of geometric patterns and classify
them using a precise taxonomy designed for people who draw sacred
geometry by hand with compass, straightedge, and ruler.

YOUR TASK:
Given an image, produce a structured JSON analysis that maps to
Radian's tag vocabulary. You are classifying FOR A PRACTITIONER —
accuracy matters more than completeness. If you are uncertain about
a field, say so with a low confidence score and explain why. A wrong
classification is worse than an honest "uncertain."

CLASSIFICATION SCHEMA (Radian TAG_VOCABULARY):

constructionMethod (how would a practitioner draw this?):
  - compass-and-straightedge: Requires compass arcs and straight lines
  - ruler-only: Straight lines only, no compass work
  - freehand: Organic, hand-drawn, no precision tools
  - polygonal-method: Built from polygon subdivision
  - grid-based: Constructed on a square, triangular, or hex grid
  - string-art-parabolic: Straight lines forming curved envelopes

tradition (cultural/historical lineage):
  - Islamic-geometric: Broad Islamic geometric art tradition
  - Moorish-Andalusian: Specifically Iberian Islamic patterns
  - Persian-Iranian: Iranian geometric and arabesque traditions
  - Moroccan-Maghrebi: North African geometric traditions
  - Ottoman: Ottoman empire decorative geometry
  - Gothic-Medieval: European medieval geometric tracery
  - Hindu-Vedic: Indian yantra, kolam, rangoli traditions
  - Celtic-Insular: Celtic knotwork and insular art
  - Nature-derived: Patterns derived from natural forms (phyllotaxis, crystal structure)

patternType (what kind of pattern is this?):
  - rosette: Central radiating design, usually circular
  - star-polygon: Interlocking star shapes
  - tessellation: Repeating tileable pattern
  - arabesque-biomorph: Flowing organic/vegetal geometric forms
  - mandala: Concentric circular symbolic diagram
  - knot-interlace: Continuous interwoven lines
  - spiral: Logarithmic, Archimedean, or Fibonacci spirals
  - parabolic-curve: Curves formed by straight-line envelopes
  - epicycloid: Curves traced by circles rolling on circles
  - curve-of-pursuit: Lines converging from polygon vertices
  - Flower-of-Life-lineage: FOL, Seed of Life, Metatron's Cube, etc.

symmetry (rotational symmetry order):
  - 3-fold, 4-fold, 5-fold, 6-fold, 7-fold, 8-fold, 10-fold, 12-fold, 16-fold

proportion (key mathematical ratios present):
  - golden-ratio: φ ≈ 1.618, pentagon-derived proportions
  - √2: Diagonal of a unit square, octagon-related
  - √3: Height of equilateral triangle, hexagon-related
  - vesica-piscis: Intersection of two equal circles
  - fibonacci: Fibonacci sequence-based spacing
  - pi-based: Circle-derived proportions

ANALYSIS GUIDELINES:

1. SYMMETRY: Count the rotational repeats. If a rosette has 8 identical
   segments around center, it is 8-fold. If the pattern is a wallpaper
   tiling, identify the symmetry of the fundamental motif.

2. TRADITION: Look for diagnostic features:
   - Islamic geometric: Interlocking stars, no figurative elements,
     often 6-fold or 8-fold, compass-constructed
   - Celtic: Continuous unbroken lines, over-under weaving, terminals
   - Gothic: Pointed arches, trefoils, quatrefoils, tracery
   - Hindu-Vedic: Triangular yantras, lotus motifs, bindu points
   - Nature-derived: Fibonacci spirals, Voronoi patterns, crystal lattices
   If the tradition is ambiguous or the pattern is modern/syncretic,
   say so. Do not force a tradition assignment.

3. CONSTRUCTION METHOD: Ask yourself: "If I were drawing this with
   physical tools, what would I reach for?" A pattern of perfect
   circles and straight lines = compass-and-straightedge. A grid of
   squares with diagonal fills = grid-based. A flowing vine pattern
   = likely freehand origin even if digitally rendered.

4. PROPORTION: Only flag proportions you can visually confirm.
   A regular pentagon implies golden ratio. A regular hexagon implies
   √3. Overlapping equal circles imply vesica piscis. Do not guess
   proportions you cannot see evidence for.

5. CONFIDENCE: For each field, provide:
   - A confidence level: high (>80%), medium (50-80%), low (<50%)
   - A one-sentence rationale explaining what visual evidence supports
     your classification or why you are uncertain

RESPOND WITH THIS EXACT JSON STRUCTURE AND NOTHING ELSE:

{
  "analysis": {
    "constructionMethod": {
      "primary": "<tag from vocabulary>",
      "confidence": "high|medium|low",
      "rationale": "<one sentence>"
    },
    "tradition": {
      "primary": "<tag from vocabulary or 'syncretic' or 'uncertain'>",
      "secondary": "<optional second tradition if hybrid>",
      "confidence": "high|medium|low",
      "rationale": "<one sentence>"
    },
    "patternType": {
      "primary": "<tag from vocabulary>",
      "secondary": "<optional second type if composite>",
      "confidence": "high|medium|low",
      "rationale": "<one sentence>"
    },
    "symmetry": {
      "primary": "<N-fold from vocabulary>",
      "confidence": "high|medium|low",
      "rationale": "<one sentence>"
    },
    "proportion": {
      "detected": ["<tags from vocabulary>"],
      "confidence": "high|medium|low",
      "rationale": "<one sentence>"
    }
  },
  "description": "<2-3 sentence practitioner-level description of the pattern>",
  "suggestedDifficulty": "beginner|intermediate|advanced",
  "constructionNotes": "<1-2 sentences on how a practitioner might approach drawing this>"
}
```

---

## Part 2: Test Image Set

Select 12-15 images that span the TAG_VOCABULARY axes. Source them from known practitioner references where ground truth is verifiable.

### Required coverage matrix:

| # | Description | Expected Symmetry | Expected Tradition | Expected Type | Source suggestion |
|---|---|---|---|---|---|
| 1 | Simple Flower of Life (7-circle) | 6-fold | syncretic | Flower-of-Life-lineage | Wikimedia Commons |
| 2 | 8-pointed Islamic star pattern | 8-fold | Islamic-geometric | star-polygon | Art of Islamic Pattern / Adam Williamson |
| 3 | Celtic trinity knot (triquetra) | 3-fold | Celtic-Insular | knot-interlace | Wikimedia Commons |
| 4 | Gothic rose window (Chartres-style) | 12-fold | Gothic-Medieval | rosette | Architectural photo |
| 5 | Alhambra tiling (Nasrid geometric) | 8-fold or 16-fold | Moorish-Andalusian | tessellation | Photo or Wikimedia |
| 6 | Hindu Sri Yantra | 3-fold (triangular) | Hindu-Vedic | mandala | Wikimedia Commons |
| 7 | Penrose tiling fragment | 5-fold | syncretic/modern | tessellation | Math reference |
| 8 | Fibonacci spiral in nautilus | N/A spiral | Nature-derived | spiral | Nature photo |
| 9 | String art parabolic curve | N/A | syncretic/modern | parabolic-curve | Artful Maths / Clarissa Grandi |
| 10 | 12-fold Persian girih pattern | 12-fold | Persian-Iranian | star-polygon | Islamic art reference |
| 11 | Simple compass-and-straightedge hexagon construction | 6-fold | syncretic | rosette | Construction diagram |
| 12 | Moroccan zellige tilework photo | 8-fold | Moroccan-Maghrebi | tessellation | Photo of actual tilework |
| 13 | Curve of pursuit from square | 4-fold | syncretic/modern | curve-of-pursuit | Math illustration |
| 14 | Complex multi-layered mandala (modern) | 8-fold or 12-fold | syncretic | mandala | Artist portfolio |
| 15 | Ottoman Iznik-style geometric panel | 6-fold | Ottoman | star-polygon | Museum collection |

### How to select images:

- Prefer images where YOU (the tester) know the correct answer
- Include at least 3 photographs of physical objects (tilework, architecture, manuscript pages) — not just clean digital diagrams
- Include at least 2 images that are genuinely ambiguous (could be multiple traditions, unclear symmetry)
- Include 1 deliberately tricky image (a modern pattern that borrows from multiple traditions)

---

## Part 3: Test Protocol

### For each image, execute this sequence:

```
Step 1: Record your own ground truth classification BEFORE sending to Claude
Step 2: Send image to Claude with the system prompt above
Step 3: Record Claude's response
Step 4: Score each field:
        - MATCH: Claude's primary matches your ground truth
        - PARTIAL: Claude's primary is wrong but secondary is correct,
                   OR Claude is in the right neighborhood (e.g., says
                   "Islamic-geometric" when answer is "Moorish-Andalusian")
        - MISS: Claude's classification is wrong
        - HONEST MISS: Claude said "uncertain" or "low confidence"
                       and the answer is indeed hard — this is GOOD,
                       not a failure
Step 5: Record any notable observations (surprising accuracy, consistent
        failure patterns, hallucinated confidence)
```

### Scoring rubric:

| Score | Meaning |
|---|---|
| MATCH | +1 point |
| PARTIAL | +0.5 points |
| HONEST MISS | +0.25 points (rewarding calibrated uncertainty) |
| MISS with high confidence | -0.5 points (penalizing false confidence) |
| MISS with low confidence | 0 points (neutral) |

**Per-field accuracy** = total points / number of test images
**Overall accuracy** = average of per-field accuracies across the 5 tag groups

### Decision thresholds:

| Accuracy | Decision |
|---|---|
| ≥ 70% | Greenlight Feature 2 as designed. Claude can serve as the primary classifier. |
| 50-70% | Invest 1-2 more days in prompt refinement. Test whether few-shot examples in the prompt improve accuracy. If still < 70% after iteration, proceed with "suggestions" framing (see below). |
| < 50% | Descope. Feature 2 becomes line-extraction only (canvas processing) with no AI classification. Tag analysis moves to v3 or is cut. |

### "Suggestions" framing fallback:

If accuracy lands in the 50-70% range, the UX should present Claude's analysis as "suggested tags" with explicit uncertainty, not as authoritative classification. The form would show:

```
Suggested: 8-fold symmetry (medium confidence)
           "I count 8 repeating segments around the center,
            but the outer border may indicate 16-fold structure"

[Accept] [Edit] [Dismiss]
```

This preserves the practitioner's authority while still saving them tagging time.

---

## Part 4: Edge Detection Feasibility (Parallel Track)

While running the classification spike, also test the canvas-based line extraction pipeline on the same 12 images. This validates Feature 2's second half independently.

### Pipeline to test:

```javascript
function extractLineTemplate(imageElement, options = {}) {
  const {
    edgeSensitivity = 50,    // Canny low threshold
    edgeMax = 150,            // Canny high threshold
    blurRadius = 1.4,         // Gaussian sigma
    lineWeight = 1,           // Output line thickness multiplier
    invert = true             // White lines on black → black lines on white
  } = options;

  // 1. Load image to canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  ctx.drawImage(imageElement, 0, 0);

  // 2. Get pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // 3. Grayscale conversion (luminance-weighted)
  // 4. Gaussian blur (3x3 or 5x5 kernel)
  // 5. Sobel edge detection (gradient magnitude)
  // 6. Binary threshold
  // 7. Optional: morphological dilation for line weight
  // 8. Optional: invert for black-on-white output

  // Return: data URI of processed canvas
  return canvas.toDataURL('image/png');
}
```

### What to evaluate for each test image:

| Criterion | Question | Score 1-5 |
|---|---|---|
| Completeness | Are all major geometric lines captured? | |
| Noise | How much non-geometric noise (shadows, textures, artifacts)? | |
| Clean intersections | Do lines meet cleanly at vertices, or is there splotching? | |
| Printability | Would you actually use this as a drawing reference? | |
| Parameter sensitivity | Does a small tweak to thresholds dramatically change output? | |

### Expected results by image type:

- **Clean digital diagrams** (images 1, 7, 9, 11, 13): Should score 4-5 across the board
- **High-contrast geometric art** (images 2, 6, 10, 14, 15): Should score 3-4, may need threshold tuning
- **Photographs of physical objects** (images 4, 5, 8, 12): Will score 1-3. Perspective distortion, shadows, and material texture will degrade output significantly. This is expected and acceptable — the spike determines whether the results are "useful with tuning" or "garbage regardless."

### Architecture decision this informs:

If canvas-only edge detection is insufficient for photographs (likely), we have two escalation paths:

**Path A: OpenCV.js** — Adds ~8MB but provides Canny edge detection, adaptive thresholding, morphological operations, and Hough line detection. Much better for noisy inputs. Breaks the "no external JS" constraint but may be worth it.

**Path B: Claude Vision as preprocessor** — Send the image to Claude with a prompt like "Describe the key geometric construction lines in this pattern as SVG path data" and render Claude's description rather than processing the pixels directly. This is slower and costlier but produces semantically meaningful output (actual geometric primitives, not just edges). This is the most ambitious option and should only be attempted if Path A still produces poor results on photographs.

**Path C (recommended starting point): Hybrid** — Use canvas processing for the edge template (fast, free, client-side) and Claude Vision for the semantic analysis (tags, description, construction notes). The edge template is a visual aid; the analysis is the intelligence. Don't couple them — let each do what it's good at.

---

## Part 5: Prompt Iteration Notes

If initial accuracy is below target, try these modifications in order:

### Iteration 1: Add few-shot examples
Add 2-3 image+response pairs to the prompt as examples. Use images you scored as MATCH in the initial run. This typically improves accuracy 10-15% on classification tasks.

### Iteration 2: Chain-of-thought before JSON
Change the output format to allow Claude to reason first:

```
First, describe what you see in the image in 2-3 sentences, noting
specific geometric features. Then provide your classification as JSON.
```

This typically improves accuracy on ambiguous cases where the model needs to "think aloud" before committing.

### Iteration 3: Decompose the task
Instead of one prompt that classifies all five dimensions at once, make five sequential calls — one per tag group. Each call gets a focused prompt with group-specific heuristics. More expensive, but isolates failures and allows per-group prompt tuning.

### Iteration 4: Confidence calibration
If Claude is overconfident (saying "high" on wrong answers), add this to the prompt:

```
CALIBRATION RULE: Only use "high" confidence if you would bet money
on this answer being correct. "Medium" is your default. "Low" means
you are guessing and a practitioner should verify.
```

---

## Part 6: Outputs from This Spike

At the end of 2 days, deliver:

1. **Scorecard spreadsheet** — 12-15 rows (images) × 5 columns (tag groups) with MATCH/PARTIAL/MISS/HONEST MISS scores + notes
2. **Final system prompt** — The prompt from Part 1, refined based on any iterations performed
3. **Edge detection sample outputs** — Screenshots of 4-5 representative images showing before/after with the canvas pipeline, with printability scores
4. **Architecture recommendation** — One paragraph: which path (A/B/C) for extraction, what model/tier for classification, estimated per-analysis API cost, and any constraints discovered
5. **Updated CLAUDE.md section** — If greenlit, draft the v2 additions to the project's CLAUDE.md covering the API integration layer, new function contracts, and any new file structure

---

## Appendix: API Call Template

Use this as the exact API call structure for testing:

```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "YOUR_KEY_HERE",
    "anthropic-version": "2023-06-01"
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,  // The full prompt from Part 1
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",  // or image/png
              data: BASE64_IMAGE_DATA
            }
          },
          {
            type: "text",
            text: "Analyze this geometric pattern."
          }
        ]
      }
    ]
  })
});

const data = await response.json();
const analysis = JSON.parse(
  data.content
    .filter(block => block.type === "text")
    .map(block => block.text)
    .join("")
);
```

**Cost estimate per analysis:** ~0.003-0.008 USD per image with Sonnet (depending on image size). A full 15-image spike costs < $0.15.

**Model choice rationale:** Sonnet over Opus for the spike. Sonnet is 5x cheaper and fast enough for classification. If accuracy is borderline, re-run the failing cases on Opus to see if the more powerful model resolves them — that informs whether the production feature should use Sonnet (preferred) or Opus (fallback for complex images).
