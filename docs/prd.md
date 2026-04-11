# PRD: Radian v2
## *Where Art and Mathematics Unite*
**For Claude Code — Read this fully before writing any code.**

---

## 1. What Radian Becomes

Radian v1 is a personal sacred geometry collection app — a practitioner's sketchbook for saving, tagging, and browsing geometric inspiration. It works. It solves the librarian's job: organize what you already have.

Radian v2 transforms it into an **active research and practice companion**. Three new capabilities, each building on the last:

**Discover** — Search the web for inspiration using the vocabulary you already think in. Select tags from Radian's taxonomy, and the app finds geometric patterns that match, sourced from practitioner references, museum collections, academic papers, and artist portfolios. Not a Google Images dump. A curated, geometry-literate search.

**Understand** — Point Radian at any geometric image — uploaded, pasted, or captured — and it tells you what it sees the way a knowledgeable practitioner would: the symmetry order, the cultural tradition, the probable construction method, the mathematical proportions at play. Every classification comes with confidence and reasoning, because a wrong answer from a tool you trust is worse than no answer at all.

**Draw** — Extract a clean line template from any pattern image, ready to print and trace. Then go further: generate the underlying construction framework — the compass arcs, the grid scaffolding, the step-by-step sequence a practitioner would follow to build this pattern from scratch. This is the feature that no tool in the world currently offers for sacred geometry.

Together, these capabilities close a loop that has never been closed digitally: **from curiosity ("I want to draw something like this") to understanding ("here's what this pattern actually is") to practice ("here's how to draw it, starting with these compass points").**

---

## 2. Who This Is For

The same person as v1, but now Radian serves their full workflow:

**Primary user:** A sacred geometry practitioner who draws by hand. They own compasses, straightedges, and fine-liner pens. They study traditions — Islamic geometric art, Celtic knotwork, Gothic tracery, Hindu yantras — and want to both learn the underlying mathematics and build physical drawing skill. They are precise, visually literate, and they know when a tool is guessing.

**What they currently do without Radian v2:**
- Browse Pinterest and Instagram for inspiration, mentally filtering past tattoo flash and AI art to find real geometric patterns
- Identify patterns by memory, experience, or consulting books (Eric Broug, Daud Sutton, Adam Williamson's videos)
- Extract templates by printing images and tracing them on a lightbox, or by painstakingly reconstructing the geometry from scratch
- Track their progress informally — photos in a camera roll, notes in a sketchbook

**What Radian v2 gives them:**
- A search engine that speaks their vocabulary
- An analyst that identifies patterns with practitioner-level precision
- A template extraction tool that produces print-ready drawing guides
- A construction sequencer that teaches them how the geometry works
- A practice journal that connects attempts back to source patterns

---

## 3. What Exists (v1 Baseline)

Radian v1 is built and functional. These systems are in place and must be preserved:

### Architecture
- Single-page app, vanilla HTML/CSS/JS
- Desktop browser only
- No build step, no framework
- localStorage persistence with `radian:` key prefix
- Comment-delimited code sections: STYLES, DATA, GALLERY, FORM, APP
- Google Fonts CDN (Cinzel, Cormorant Garamond, JetBrains Mono)

### Data Model
```javascript
// Entry object shape (canonical)
{
  id,              // crypto.randomUUID()
  createdAt,       // ISO timestamp
  title,           // string
  imageUrl,        // URL string or base64 data URI
  sourceUrl,       // original source link
  status,          // "want-to-try" | "attempted" | "done"
  difficulty,      // "beginner" | "intermediate" | "advanced"
  tags: {
    constructionMethod: [],
    tradition: [],
    patternType: [],
    symmetry: [],
    proportion: []
  },
  description,     // freeform text
  attemptNotes     // freeform text
}
```

### Tag Vocabulary
```javascript
const TAG_VOCABULARY = {
  constructionMethod: [
    'compass-and-straightedge', 'ruler-only', 'freehand',
    'polygonal-method', 'grid-based', 'string-art-parabolic'
  ],
  tradition: [
    'Islamic-geometric', 'Moorish-Andalusian', 'Persian-Iranian',
    'Moroccan-Maghrebi', 'Ottoman', 'Gothic-Medieval',
    'Hindu-Vedic', 'Celtic-Insular', 'Nature-derived'
  ],
  patternType: [
    'rosette', 'star-polygon', 'tessellation', 'arabesque-biomorph',
    'mandala', 'knot-interlace', 'spiral', 'parabolic-curve',
    'epicycloid', 'curve-of-pursuit', 'Flower-of-Life-lineage'
  ],
  symmetry: [
    '3-fold', '4-fold', '5-fold', '6-fold', '7-fold',
    '8-fold', '10-fold', '12-fold', '16-fold'
  ],
  proportion: [
    'golden-ratio', '√2', '√3', 'vesica-piscis', 'fibonacci', 'pi-based'
  ]
};
```

### Filter Logic
- AND across tag groups (entry must match all active groups)
- OR within a tag group (entry matches if it has any active tag in that group)
- Status and difficulty filters also OR within their group

### Key Contracts
- **`populateForm(entry)`** — Accepts any valid entry object and pre-fills all form fields. This is the primary integration point for all v2 features. Called on edit-load, and designed to be called by any automated pipeline that produces entry data.
- **`renderGallery(entries)`** — Renders a CSS grid of entry cards
- **`filterEntries(entries, activeFilters)`** — Applies AND/OR filter logic

### Aesthetic
Dark-first with light mode toggle. Sacred archive meets mathematical instrument. Warm, precise, geometry-as-hero. The design language is established in the interactive mock (`radian-mock.html`) and must be preserved across all new features.

### localStorage Schema
```
radian:index          → JSON array of UUIDs
radian:entry:{uuid}   → JSON entry object
```

---

## 4. Tag Vocabulary Extensions for v2

The existing TAG_VOCABULARY covers the classification space well. The following additions support new capabilities without breaking existing tags:

### New tags within existing groups

**constructionMethod** — add:
- `digital-parametric`: Generated algorithmically (Processing, GeoGebra, code)
- `mixed-media`: Combines multiple construction approaches

**tradition** — add:
- `Japanese-Mon`: Japanese family crest geometric traditions
- `Tibetan-Buddhist`: Sand mandala and thangka geometry
- `Art-Deco`: 1920s-30s geometric decorative arts
- `Contemporary-Mathematical`: Modern mathematical art (Escher-inspired, fractal, aperiodic)

**patternType** — add:
- `girih-tile`: Specific Islamic tile type using 5 girih shapes
- `zellige-mosaic`: Cut-tile mosaic patterns (distinct from printed tessellation)
- `trefoil-quatrefoil`: Gothic tracery window shapes
- `yantra`: Specific Hindu/Buddhist sacred diagram type

### New metadata fields on entry object

```javascript
// v2 additions to entry schema
{
  // ... all existing v1 fields preserved ...

  // Analysis metadata (populated by Claude Vision)
  analysis: {
    performedAt: null,       // ISO timestamp of last analysis
    modelVersion: null,      // e.g. "claude-sonnet-4-20250514"
    classifications: {
      constructionMethod: { primary: null, confidence: null, rationale: null },
      tradition:          { primary: null, secondary: null, confidence: null, rationale: null },
      patternType:        { primary: null, secondary: null, confidence: null, rationale: null },
      symmetry:           { primary: null, confidence: null, rationale: null },
      proportion:         { detected: [], confidence: null, rationale: null }
    },
    constructionNotes: null,   // How a practitioner would approach drawing this
    suggestedDifficulty: null
  },

  // Source metadata (populated by inspiration search)
  source: {
    discoveredVia: null,     // "manual" | "search" | "camera"
    searchQuery: null,       // The tag combination that found this
    originalContext: null     // Brief description of where it was found
  },

  // Template data (populated by line extraction)
  template: {
    extractedAt: null,
    lineTemplateDataUri: null,  // base64 PNG of extracted line drawing
    svgData: null,              // SVG string if vector extraction succeeded
    extractionParams: {
      edgeSensitivity: null,
      lineWeight: null,
      algorithm: null           // "sobel" | "canny" | "opencv" | "claude-svg"
    }
  },

  // Construction data (populated by construction sequence generator)
  construction: {
    generatedAt: null,
    steps: [],                  // Array of construction step objects
    baseGrid: null,             // "circle" | "square" | "triangular" | "hexagonal"
    startingRadius: null,       // Recommended compass radius in mm
    estimatedTime: null         // Rough estimate: "15 min" | "30 min" | "1 hr" | "2+ hr"
  },

  // Practice journal
  attempts: []                  // Array of attempt objects (see Section 6)
}
```

---

## 5. Feature: Discover — Tag-Driven Inspiration Search

### What it does
The user selects tags from Radian's existing filter sidebar — the same tags they use to browse their own collection — and Radian searches the web for matching sacred geometry inspiration. Results appear in the gallery alongside (or in place of) local entries, styled as "from the web" cards. Any result can be saved to the collection with one click, pre-tagged with the search terms.

### How it works
Selected tags are translated into a natural language search query using Claude's understanding of the domain. The query is sent to the Claude API with the web search tool enabled. Claude finds images, evaluates their relevance to the practitioner's intent (not just keyword match), and returns structured results.

### Detailed behavior

**Search trigger:** When the user has active filter tags selected and clicks "Search for Inspiration" (or when no local entries match and the app offers to search), Radian constructs a search request.

**Query construction:** Tags are not sent as a raw keyword string. They are structured into a prompt that tells Claude: "A sacred geometry practitioner is looking for patterns with these properties: [tags]. Find high-quality reference images from practitioner sources, museum collections, academic papers, art portfolios, and geometry education sites. Avoid AI-generated art, tattoo flash, and generic stock imagery unless the geometric content is genuinely relevant."

**Source prioritization:** The search prompt biases toward known high-value sources:
- Adam Williamson / Art of Islamic Pattern
- Clarissa Grandi / Artful Maths
- Eric Broug's Islamic geometric design work
- Wikimedia Commons (geometric art, architecture, manuscript pages)
- Museum digital collections (V&A, Met, Aga Khan Museum, Alhambra archives)
- Academic papers on geometry, tiling theory, symmetry groups
- GeoGebra and Desmos community galleries

**Result format:** Each result returns:
```javascript
{
  imageUrl: "https://...",
  sourceUrl: "https://...",       // Page the image was found on
  sourceName: "V&A Collection",   // Human-readable source attribution
  title: "8-fold rosette from Alhambra dado panel",
  suggestedTags: {
    constructionMethod: ["compass-and-straightedge"],
    tradition: ["Moorish-Andalusian"],
    patternType: ["rosette", "star-polygon"],
    symmetry: ["8-fold"],
    proportion: ["√2"]
  },
  relevanceNote: "High-resolution photo of original tilework, good construction reference"
}
```

**Gallery integration:** Search results render using the same card component as local entries, with visual differentiation:
- Dashed border instead of solid
- "From web" badge in top-right corner
- Source attribution below the image
- "Save to Collection" button replaces the edit button
- Clicking "Save" calls `populateForm()` with the suggested entry object, opens the form panel pre-filled, and lets the user review/edit tags before saving

**Search history:** Recent searches are stored in `radian:searches` as an array of `{tags, timestamp, resultCount}` objects. The sidebar shows a "Recent Searches" section below the filter chips for quick re-runs.

**Empty state:** When the gallery has no local matches for the active filters, instead of showing "No entries match," it shows: "No patterns in your collection match these filters. Search the web for inspiration?" with a single button that triggers the search.

### What this does NOT do
- It does not scrape or cache images. It stores URLs. If the source goes offline, the image link breaks. This is acceptable for a personal tool.
- It does not do visual similarity search ("find images that look like this one"). That requires embeddings infrastructure and is a separate feature.
- It does not automatically add results to the collection. The user always reviews and explicitly saves.

---

## 6. Feature: Understand — Pattern Analysis with Claude Vision

### What it does
The user points Radian at any geometric image — an entry in their collection, a search result, a file they upload, or a URL they paste — and Radian sends it to Claude Vision for analysis. Claude returns a structured classification mapped to TAG_VOCABULARY, with per-field confidence scores, practitioner-level reasoning, and construction notes. The analysis can be accepted (auto-filling the entry's tags) or edited by the user.

### How it works
The image is sent to the Claude API as a base64-encoded attachment with a system prompt that defines the TAG_VOCABULARY as a classification schema and provides practitioner-level heuristics for each field. Claude returns structured JSON that maps directly to the entry schema's `analysis` field.

### Detailed behavior

**Trigger points:** The "✦ Analyze" button appears in three places:
1. On any gallery card (hover action)
2. In the entry detail/edit view
3. On search result cards (analyze before saving)

**Analysis flow:**
1. User clicks "✦ Analyze"
2. Image is loaded to canvas, resized if necessary (max 2000x2000 to balance quality and API performance), converted to base64
3. Loading state: the analysis panel slides in with a shimmer animation and the text "Reading the geometry..." (not a generic spinner)
4. API call to Claude with the analysis system prompt (see spike document for the full prompt)
5. Response parsed and displayed in the analysis panel

**Analysis panel layout:**
- Left column: original image
- Right column: classification results, each field showing:
  - Tag label and selected value
  - Confidence badge (high / medium / low) with a visual indicator — not just text, a filled/partial/empty circle or bar
  - Rationale text in smaller type below
  - Edit control: the user can override Claude's classification by clicking the tag and selecting from the TAG_VOCABULARY dropdown
- Below: `constructionNotes` as a paragraph of practitioner-level description
- Below: `suggestedDifficulty` with accept/override

**Accepting analysis:**
- "Accept All" button applies all classifications to the entry's tag fields via `populateForm()`, merging with (not replacing) any tags the user already applied
- Individual "Accept" buttons per field for selective acceptance
- Accepted tags are visually marked in the entry as "AI-suggested" (subtle icon) vs. "user-assigned" — this distinction is stored in the entry data

**Re-analysis:** If the user has edited an entry's tags after analysis, they can re-run analysis at any time. The new analysis does not overwrite existing tags unless the user explicitly accepts it.

**Batch analysis:** The user can select multiple gallery entries and run "Analyze Selected." Each image is analyzed sequentially (not in parallel — respect API rate limits). Results queue up for review.

### Confidence display philosophy

This is critical. Radian's analysis is NOT an oracle. It is a knowledgeable assistant that shows its work. Design principles:

1. **Provenance over score.** A confidence badge without rationale is worthless. Every classification explains WHY.
2. **Calibrated uncertainty.** Low confidence on a genuinely ambiguous pattern is MORE valuable than false high confidence. The UX should treat "uncertain" as a useful answer, not a failure state.
3. **Human authority.** The practitioner's override is always final. The analysis panel's accept/edit/dismiss flow exists to reinforce that Claude is suggesting, the human is deciding.

---

## 7. Feature: Draw — Line Template Extraction

### What it does
Radian extracts a clean line drawing from any geometric image, producing a high-contrast template suitable for printing and tracing. The user controls extraction parameters — edge sensitivity, line weight, contrast — and can download the result as a print-ready file at standard compass-working sizes.

### How it works
Client-side canvas processing. The image is loaded into an HTML5 Canvas element and processed through an edge detection and cleanup pipeline. No API call required — this runs entirely in the browser and produces instant results.

### Detailed behavior

**Trigger:** "Extract Template" button appears alongside "✦ Analyze" on any entry or search result. Both can be run independently or together.

**Processing pipeline:**
1. Load image to canvas at original resolution
2. Convert to grayscale (luminance-weighted: 0.299R + 0.587G + 0.114B)
3. Gaussian blur (configurable σ, default 1.4) to reduce noise
4. Edge detection (Sobel gradient magnitude as default; Canny as upgrade path)
5. Binary threshold (configurable, with preview)
6. Optional morphological operations: dilation for line weight, erosion for noise cleanup
7. Invert to black-on-white for printing
8. Render result to display canvas

**Interactive controls:** The extraction view shows the result with live-adjustable sliders:
- **Edge sensitivity** (threshold): low = more lines captured, more noise; high = fewer lines, cleaner output
- **Line weight**: thin (1px) to bold (3px), applied via morphological dilation
- **Blur radius**: controls pre-processing smoothing
- **Contrast**: post-processing contrast adjustment before thresholding
- **Toggle: edges only / edges + fills**: some patterns benefit from preserving solid regions, not just outlines

Each slider updates the preview in real time (or near-real-time — debounce to 100ms to avoid lag on large images).

**Output formats:**
- **PNG** — high-resolution black-on-white line drawing, downloadable
- **SVG** — vector conversion of the edge-detected output (stretch goal — contour tracing to SVG paths is complex but transformative for practitioners who work digitally)
- **Print-ready PDF** — the template formatted to standard sizes with:
  - Page sizes: A4, US Letter, A3 (selectable)
  - Centered on page with margins
  - Optional: light blue construction grid overlay (square, triangular, or polar depending on detected symmetry)
  - Optional: center point marked
  - Optional: scale ruler on margin
  - Header with pattern title, source attribution, detected symmetry/tradition

**Storage:** When the user saves the template, the `template` field on the entry object stores the data URI, SVG data, and extraction parameters so the same settings can be re-applied or adjusted later.

### Known quality constraints (be honest with users)

Line extraction works on a spectrum:
- **Clean digital diagrams** → Excellent results. Near-perfect line templates.
- **High-contrast geometric art** → Good results. May need threshold tuning. Some noise from color boundaries.
- **Photographs of physical objects** → Variable results. Shadows, perspective distortion, material texture, and lighting all degrade output. Results are useful as rough reference, not as precision templates.
- **Complex multi-layered designs** → All layers collapse into one drawing. No way to separate overlapping geometric systems.

The UI should set this expectation: a brief helper text under the extraction view that reads "Best results from clean, high-contrast images. Photos of physical patterns may need adjustment."

---

## 8. Feature: Draw — Construction Sequence Generation

### What it does
This is the ambitious one. Given a pattern (either from the collection or freshly analyzed), Radian generates a step-by-step construction sequence: the compass operations, the straight lines, the order of operations a practitioner would follow to build this pattern from an empty page.

### How it works
Claude API. The image and its analysis metadata are sent to Claude with a specialized construction prompt. Claude returns a sequence of steps, each described in practitioner terms ("Set compass to radius R. Place point at center. Draw full circle. Without changing compass width, place point at intersection of circle and horizontal axis. Draw arc from..."). Each step is annotated with which tools are needed and what geometry it produces.

### Detailed behavior

**Trigger:** "Generate Construction" button appears on entries that have been analyzed. Analysis must exist because the construction prompt uses the detected symmetry, tradition, and proportion data to select the right construction approach.

**Construction step format:**
```javascript
{
  stepNumber: 1,
  instruction: "Draw a circle with your chosen radius R centered at point O.",
  tools: ["compass"],
  geometryProduced: "Base circle — this defines the scale of the entire pattern.",
  visualHint: "circle at center, radius R",
  dependsOn: []     // step numbers this step requires
}
```

**Step visualization:** Each step is displayed as a card in a vertical sequence. Ideally, each step would include a simple SVG diagram showing:
- The geometry produced so far (in gray)
- The geometry added in this step (in gold/highlight color)
- Key points and intersections labeled

This step-level visualization is the hardest part of the feature. Two possible approaches:
1. **Claude generates SVG fragments** — The prompt asks Claude to produce SVG `<path>` and `<circle>` elements for each step. Radian renders them cumulatively.
2. **Text-only with reference to full template** — Each step is text instructions only, with the full extracted template shown alongside for visual reference. Less magical but much simpler.

**Sequence navigator:** The user can step forward and backward through the construction, seeing the pattern build up step by step. Think of it like a slideshow of the construction process.

**Print output:** The full construction sequence exports as a multi-page PDF:
- Page 1: Finished pattern template (from extraction)
- Page 2: Construction overview (all steps listed)
- Pages 3+: One step per page with diagram and instructions
- Final page: Tool list, estimated time, difficulty rating, source attribution

**Construction approach selection:** Different traditions use different construction methods for similar geometries. An 8-pointed star can be constructed via:
- Rotating square method (Islamic)
- Compass and arc method (classical)
- Grid overlay method (modern)

When multiple construction approaches exist, Radian presents them as alternatives: "This pattern can be constructed two ways. Method A (rotating squares) is traditional to the Islamic geometric tradition. Method B (compass arcs) is the classical Euclidean approach. Which would you like to see?"

### What makes this transformative

No tool in the world currently does this. Books on Islamic geometric design (Eric Broug, Jay Bonner, Daud Sutton) include construction sequences, but they are static, limited to the patterns the author chose, and require buying the book. YouTube tutorials (Adam Williamson) demonstrate construction live, but you can't ask a video to construct a specific pattern you found.

Radian's construction generator would make the construction knowledge embedded in these traditions *queryable*. Upload any pattern, get a plausible construction sequence. This is the feature that transforms Radian from a clever utility into something genuinely new in the sacred geometry space.

### Honest risk assessment

This feature has the highest uncertainty of anything in this PRD. The risks:
1. **Claude may not generate accurate constructions.** Geometric construction requires spatial precision. Claude's strength is reasoning about patterns, not executing millimeter-accurate geometry. The generated sequences may be conceptually correct but imprecise in details.
2. **SVG generation per step is hard.** Getting Claude to emit correct, aligned SVG elements that build on each other step by step is a non-trivial prompt engineering challenge.
3. **Validation requires domain expertise.** There's no automated way to verify a construction sequence is correct. A human practitioner must review. This limits how much we can iterate without expert feedback.

**Recommendation for engineering:** Treat construction generation as a prototype feature with explicit "experimental" labeling in the UI. Display a disclaimer: "Construction sequences are AI-generated suggestions. Verify against established references before teaching or publishing." Start with text-only instructions and defer step-level SVG visualization until the text accuracy is validated.

---

## 9. Feature: Visual Similarity Search

### What it does
The user uploads or selects a pattern image, and Radian finds visually similar patterns — both from their personal collection and from the web. Unlike tag-based search (Feature 5), this works by visual resemblance, not by metadata.

### How it works
Claude Vision is sent the query image with a prompt: "Describe the visual and geometric properties of this pattern in detail, then generate search queries that would find similar patterns." The generated queries are then run through the web search pipeline (Feature 5). For local collection matching, Claude is sent the query image alongside thumbnails of collection entries and asked to rank them by similarity.

### Detailed behavior

**Trigger:** "Find Similar" button on any entry or image.

**Results display:** Two sections:
1. "Similar in your collection" — ranked list of local entries, showing why each is similar ("Also an 8-fold star polygon with √2 proportions")
2. "Similar on the web" — search results from visual description queries

This is less precise than embedding-based visual search but requires no infrastructure beyond what Features 5 and 6 already provide. It's Claude-reasoning-as-search-engine, which fits Radian's architecture.

### Future path: embeddings

True visual similarity search would use image embeddings (CLIP or similar) to compute vector distances between images. This requires:
- An embedding model (could be a separate API call per image)
- A vector store or similarity index (not localStorage-friendly)
- Batch processing of the existing collection

This is a v3+ capability that likely requires a backend. Flag it for architecture planning but do not build infrastructure for it now.

---

## 10. Feature: Practice Journal

### What it does
Radian becomes not just a collection tool but a practice tracker. The user can log drawing attempts against any entry in their collection, attaching photos of their work, notes on what went well or poorly, and time spent. Over time, this builds a personal record of skill development.

### Detailed behavior

**Attempt object:**
```javascript
{
  id: "uuid",
  entryId: "parent entry uuid",
  createdAt: "ISO timestamp",
  attemptPhotos: [],       // Array of base64 data URIs (photos of the drawing)
  duration: null,          // Minutes spent
  tools: [],               // e.g. ["compass", "straightedge", "0.3mm pen"]
  notes: "",               // Freeform text
  rating: null,            // 1-5 self-assessment
  challenges: [],          // Freeform tags: "line weight", "symmetry drift", "proportion error"
  status: "in-progress" | "completed" | "abandoned"
}
```

**UI integration:**
- Each gallery card shows an attempt count badge when attempts exist
- Entry detail view has a "Practice Log" tab showing chronological attempts
- "Log Attempt" button opens a lightweight form: photo upload, time, notes, self-rating
- Status on the parent entry auto-updates: first attempt → "attempted", any completed attempt → "done"

**Progress visualization:**
- A "My Practice" view (new top-level navigation) showing:
  - Total patterns attempted, completed, and in progress
  - Time invested (total and by tradition/type)
  - A heatmap or calendar showing drawing activity over time
  - A gallery of attempt photos, most recent first — "your wall of practice"

**Comparison view:** For entries with the source image and attempt photos, show them side by side. This is deeply motivating for practitioners — seeing your recreation next to the original, tracking how your accuracy improves over time.

### localStorage considerations
Photos as base64 data URIs in localStorage will hit storage limits fast. The entry schema should support this, but the app should warn when approaching the ~5MB localStorage limit per origin and offer export to JSON as a backup mechanism. A future version should consider IndexedDB for larger binary storage.

---

## 11. Feature: Camera Capture

### What it does
The user can use their device camera (or webcam) to capture a geometric pattern in the real world — a tile floor, a building facade, a page in a book — and immediately analyze or extract a template from it.

### How it works
Standard `getUserMedia` API to access the camera. The captured frame is loaded into the existing canvas pipeline for extraction and/or sent to Claude Vision for analysis. This is not real-time processing — it captures a single frame and processes it.

### Detailed behavior

**Trigger:** A camera icon in the header or a "Capture from Camera" option in the add-entry flow.

**Capture flow:**
1. Camera viewfinder opens in a modal
2. User frames the pattern (helper overlay suggests centering and squaring the pattern)
3. Capture button freezes the frame
4. User chooses: "Analyze," "Extract Template," or "Save to Collection" (or all three)
5. Captured image enters the normal processing flow

**Desktop vs. mobile:** The current app is desktop-only. Camera capture works on desktop via webcam but is most natural on mobile. If this feature is built, it implies at minimum a responsive camera capture modal, even if the rest of the app remains desktop-optimized.

### Use cases this unlocks
- Walking through the Alhambra and capturing tilework to analyze later
- Photographing a pattern in a library book without having to scan it
- Capturing a friend's drawing to identify its geometric properties
- Documenting your own in-progress construction for the practice journal

---

## 12. UI Architecture — How It All Fits Together

### Navigation model
v1 has a flat structure: sidebar filters + gallery + slide-in form panel. v2 adds enough capability that a slightly richer navigation is warranted, but it must stay light. No router, no multi-page app. Tab-like sections within the single page:

**Primary tabs (header):**
- **Collection** — the existing gallery, filter sidebar, and add/edit flow
- **Discover** — inspiration search, using the same filter sidebar
- **Practice** — practice journal overview and attempt history

**Contextual panels (slide-in from right, same as existing form panel):**
- **Entry Detail** — view/edit entry metadata, tags, description
- **Analysis** — Claude Vision results with accept/edit/dismiss
- **Template** — extraction controls, preview, download
- **Construction** — step-by-step sequence viewer (if generated)
- **Log Attempt** — practice journal entry form

**Flow logic:**
- Gallery card click → Entry Detail panel
- "✦ Analyze" → Analysis panel (can coexist with Detail)
- "Extract Template" → Template panel
- "Generate Construction" → Construction panel
- "Log Attempt" → Attempt form panel
- "Save from Search" → pre-filled Entry Detail panel (via `populateForm()`)

### The `populateForm()` integration map

Every v2 feature feeds through this single function. Here's the complete map:

| Feature | What calls `populateForm()` | What it pre-fills |
|---|---|---|
| Inspiration Search | "Save to Collection" on a search result | imageUrl, sourceUrl, suggested tags, source metadata |
| Pattern Analysis | "Accept All" in analysis panel | tags (merged with existing), analysis metadata, difficulty |
| Line Extraction | "Save Template" in extraction view | template data URI, extraction params |
| Construction Gen. | "Save Construction" | construction steps, base grid, estimated time |
| Camera Capture | "Save Capture" | imageUrl (base64), source: "camera" |

This is the architectural payoff of the v1 decision to reserve `populateForm()` as a standalone callable function.

---

## 13. Data & Storage Architecture

### localStorage schema (v2 additions)
```
radian:index              → JSON array of UUIDs (unchanged)
radian:entry:{uuid}       → JSON entry object (expanded schema)
radian:searches           → JSON array of recent search objects
radian:settings           → JSON user preferences (API key, default extraction params)
radian:attempts:index     → JSON array of attempt UUIDs
radian:attempt:{uuid}     → JSON attempt object
```

### Storage limits and mitigation
localStorage has a ~5-10MB limit per origin (varies by browser). The biggest consumers will be:
1. Base64 images (entry uploads and attempt photos): ~200KB-2MB each
2. Template data URIs: ~100KB-500KB each
3. SVG data: ~10KB-100KB each

**Mitigation strategies:**
- Display a storage usage indicator in settings
- Warn at 80% capacity
- Offer JSON export/import for full backup
- Suggest clearing old attempt photos first
- Future: migrate to IndexedDB for binary data, keep metadata in localStorage

### API key storage
Claude API key stored in `radian:settings` as plaintext in localStorage. Acceptable for personal use. Not acceptable for any shared or deployed version. The settings UI should display a clear warning: "Your API key is stored locally on this device and never sent anywhere except directly to the Anthropic API."

---

## 14. Claude API Integration Layer

### API configuration
```javascript
const RADIAN_API_CONFIG = {
  model: "claude-sonnet-4-20250514",   // Default. User can override in settings.
  maxTokens: 1000,
  apiVersion: "2023-06-01"
};
```

### System prompts (referenced, not inlined)

The API layer uses distinct system prompts for each capability:

1. **Inspiration Search Prompt** — Defines query construction, source prioritization, and result format. Includes TAG_VOCABULARY as reference. Enables web search tool.

2. **Pattern Analysis Prompt** — The full classification prompt from the spike document. Defines the TAG_VOCABULARY as classification schema with diagnostic heuristics. Expects structured JSON output.

3. **Construction Sequence Prompt** — Takes the analysis output + original image and generates step-by-step construction instructions. Includes tradition-specific construction conventions.

4. **Similarity Description Prompt** — Takes an image and generates detailed visual/geometric descriptions for search query construction.

Each prompt is stored as a constant in the code and versioned. When prompts are updated, the version string changes so cached analyses can be flagged as outdated.

### Error handling
- Network failures: retry once after 2 seconds, then show error with "Try Again" button
- Rate limits: display "Radian is thinking... (API busy, will retry)" with exponential backoff
- Malformed JSON responses: attempt to extract partial data, show what succeeded, flag what failed
- Timeout (>30s): cancel and offer to retry with a simpler prompt variant
- Missing API key: prompt user to add key in settings before any API feature can be used

### Cost transparency
The settings panel shows estimated API costs:
- Analysis: ~$0.003-0.008 per image
- Inspiration search: ~$0.005-0.015 per search
- Construction generation: ~$0.01-0.02 per pattern
- Display a running total of API calls made this session

---

## 15. Visual Design — v2 Additions

All new UI elements must follow the established Radian aesthetic: dark-first, warm tones, gold accents, Cinzel/Cormorant Garamond/JetBrains Mono type stack, precise and restrained.

### New UI elements needed

**Confidence badges:**
- High: filled gold circle (●) with "high" label
- Medium: half-filled gold circle (◐) with "medium" label
- Low: empty circle (○) with "low" label
- All in JetBrains Mono at small size, with rationale text in Cormorant Garamond italic below

**Search result cards:**
- Same card component as existing gallery
- Dashed border (`border-style: dashed`) in `--border` color
- "From web" badge: small pill in `--gold-dim` background, Cinzel caps
- Source attribution: one line below image in `--text-dim`

**Analysis panel:**
- Dark surface background (`--surface`)
- Classification rows with tag pill + confidence badge + rationale
- Accept/Edit/Dismiss buttons per row: subtle, low-profile, not attention-competing with the content
- "Accept All" as a gold-accented primary button at panel bottom

**Template extraction view:**
- Side-by-side: original image (left) and extracted template (right)
- Slider controls below in a toolbar strip
- Download button with format selector dropdown

**Construction sequence viewer:**
- Vertical card stack, each step numbered
- Gold step number, instruction text in Cormorant Garamond
- Tool icons (compass, straightedge, pen) as small inline indicators
- "Previous / Next" navigation at bottom

**Practice dashboard:**
- Statistics in JetBrains Mono (numbers should feel precise)
- Activity heatmap in gold intensity on dark background
- Attempt photo gallery as a tight grid

---

## 16. File Structure — v2

The single-file constraint relaxes for v2. New structure:

```
radian/
├── index.html              ← App shell, styles, UI components
├── js/
│   ├── types.js            ← Type definitions and schema constants
│   ├── data.js             ← TAG_VOCABULARY, localStorage CRUD, entry schema
│   ├── gallery.js          ← renderGallery(), filterEntries(), card template
│   ├── form.js             ← renderForm(), populateForm(), saveEntry()
│   ├── api.js              ← Claude API integration layer, all prompts
│   ├── vision.js           ← Canvas processing pipeline, edge detection
│   ├── construction.js     ← Construction sequence generation and display
│   └── app.js              ← init(), routing, event listeners, tab navigation
├── CLAUDE.md               ← Updated for v2 architecture
├── radian-PRD-v2.md        ← This document
└── radian-mock.html        ← Original visual mock (preserved as reference)
```

Still no build step. Still no npm. Still vanilla JS. Files are loaded via `<script src>` tags in dependency order. The comment-delimited section pattern from v1 evolves into actual file boundaries.

---

## 17. Inspiration Sources & Practitioner References

These inform both the search prioritization logic and the construction sequence accuracy:

**Books:**
- Eric Broug — *Islamic Geometric Design* (construction methods)
- Jay Bonner — *Islamic Geometric Patterns* (comprehensive academic reference)
- Daud Sutton — *Islamic Design: A Genius for Geometry* (concise, beautiful)
- Keith Critchlow — *Islamic Patterns: An Analytical and Cosmological Approach*
- George Bain — *Celtic Art: The Methods of Construction*
- Aidan Meehan — *Celtic Design* series

**Online practitioners:**
- Adam Williamson — Art of Islamic Pattern (YouTube, workshops)
- Clarissa Grandi — Artful Maths (worksheets, educational resources)
- Samira Mian — Islamic geometric art educator
- Rafael Araujo — Golden ratio and nature-based geometric constructions

**Academic resources:**
- Tiles & Patterns (Grünbaum & Shephard) — definitive tiling theory reference
- The Symmetries of Things (Conway, Burgiel, Goodman-Strauss) — symmetry group taxonomy

---

## 18. What This PRD Does NOT Decide

The following decisions are explicitly left for engineering to determine based on feasibility spikes, architectural constraints, and phasing judgment:

1. **Build order and phasing** — Which features ship in what sequence. The PM recommends Discover first, but engineering owns the build plan.
2. **Single-call vs. multi-call API architecture** — Whether analysis, construction, and extraction are separate API calls or a single combined call. Engineering decides based on latency, cost, and prompt quality tradeoffs.
3. **OpenCV.js vs. vanilla Canvas** — Whether the edge detection pipeline needs the heavier library. The spike will inform this.
4. **SVG export feasibility** — Whether contour-tracing to SVG is achievable in vanilla JS or requires a library. May be deferred.
5. **Construction sequence visualization** — Whether step-level SVG diagrams are generated by Claude, rendered programmatically, or deferred to text-only.
6. **Mobile responsiveness scope** — Whether the camera feature implies broader responsive design work, or remains a desktop-only modal.
7. **IndexedDB migration** — Whether the storage architecture should move to IndexedDB now (for photo storage) or stay on localStorage with export as a relief valve.
8. **Model selection** — Whether Sonnet is sufficient for all API features or whether specific capabilities (construction generation) need Opus.
9. **Rate limiting and batching** — How to handle batch analysis of multiple entries without hitting API limits.
10. **Prompt versioning strategy** — How to handle prompt updates and flag entries analyzed with older prompt versions.

---

## 19. Success Metrics

How we know v2 is working:

**Discover:**
- ≥ 70% of search results are practitioner-relevant (manual review of 20 searches)
- Average time from "I want to find a pattern" to "it's saved in my collection" < 60 seconds

**Understand:**
- ≥ 70% classification accuracy across the TAG_VOCABULARY (per the spike rubric)
- User override rate < 40% (if the practitioner is correcting more than 40% of classifications, the feature is a burden, not a benefit)

**Draw (Extraction):**
- ≥ 60% of extracted templates are rated "printable and useful" by the practitioner on clean digital inputs
- ≥ 30% on photographs (this is a hard problem — 30% is genuine value)

**Draw (Construction):**
- ≥ 50% of generated sequences are "plausible and followable" on first attempt
- This is deliberately a lower bar — construction generation is experimental

**Practice Journal:**
- Practitioner logs ≥ 3 attempts in the first two weeks of use (adoption signal)

---

## 20. The Vision

Radian v1 is a librarian. Radian v2 is a studio companion.

The end state is a tool that a sacred geometry practitioner opens every time they sit down to draw. They use it to find what to draw next, to understand what they're looking at, to prepare their template, to learn the construction, and to record their practice. It knows their vocabulary. It shows its reasoning. It respects their expertise.

The geometry is the hero. Radian is the instrument.
