# Radian v2 — Technical Brief
## Principal Engineer → Director of Engineering

**Status:** Pre-build. No code written. This document sits between the PRD and the build plan.
**Date:** 2026-03-15
**Inputs:** `radian-v2-PRD.md`, `radian-vision-spike.md`, v1 codebase (`mvp/index.html`, 55KB, functional)

---

## Situation

Radian v1 is a working, single-file sacred geometry collection app. It solves the librarian problem: organize what you have. v2 adds seven features that transform it into an active studio companion. The PM has explicitly left phasing, feasibility boundaries, and ten architectural decisions to engineering.

**The complication:** Two of those seven features depend on AI capabilities that have not been validated against the actual domain. One feature (Construction Sequence Generation) is genuinely novel with no comparable tool in the world — which means we have no benchmark for what "good" looks like. The spike must precede the build.

**The question:** What do we build, in what order, and what do we defer or cut?

**The answer:** Below.

---

## 1. Architecture Assessment

### File Structure

The PRD's proposed `js/` split is mostly right. One correction and one addition.

**Correction — rename `vision.js` to `canvas.js`.** "Vision" in the context of this codebase should mean Claude Vision (the API feature). Canvas edge detection is client-side pixel processing with no AI involvement. Conflating them creates naming debt. `canvas.js` handles grayscale conversion, Gaussian blur, Sobel gradient, threshold, morphological operations — all of it. No API calls.

**Addition — add `panels.js`.** The PRD describes six contextual panels (Entry Detail, Analysis, Template, Construction, Log Attempt, and the upcoming Discover search panel). These share show/hide infrastructure, focus management, and scroll behavior. That infrastructure does not belong in `app.js` (which handles routing and tab state) and does not belong in the feature-specific files. `panels.js` owns the panel lifecycle.

**Recommended file structure:**

```
radian/
├── index.html          ← App shell, CSS, script tags in load order
├── js/
│   ├── data.js         ← TAG_VOCABULARY, localStorage/IndexedDB CRUD, schema, migration
│   ├── gallery.js      ← renderGallery(), filterEntries(), card templates (local + web)
│   ├── form.js         ← populateForm(), renderForm(), saveEntry()
│   ├── api.js          ← ALL Claude API calls, ALL system prompts, error handling, cost tracking
│   ├── canvas.js       ← Edge detection pipeline, canvas utilities (zero API dependency)
│   ├── panels.js       ← Panel show/hide, Analysis panel, Template panel, Construction panel
│   └── app.js          ← init(), tab navigation, event wiring, global state
├── radian-v2-PRD.md
├── radian-v2-technical-brief.md   ← this file
└── mvp/                ← v1 preserved as reference, not deleted
```

**Load order (dependency graph):**

```
data.js → gallery.js → form.js → api.js → canvas.js → panels.js → app.js
```

`gallery.js` depends on `data.js` for TAG_VOCABULARY and entry shape. `form.js` depends on `data.js` for save logic and `gallery.js` for re-render after save. `api.js` depends only on `data.js` for schema constants. `canvas.js` has zero external dependencies. `panels.js` depends on `api.js` and `canvas.js` for the content it renders. `app.js` wires all of them together.

No file should import from a file that loads after it. If that happens, the dependency graph is wrong, not the load order.

### State Management

v1 uses in-memory JS variables synced to localStorage on write. This model holds for all metadata (entry fields, analysis JSON, construction step arrays, search history) and breaks for binary blobs.

The binary blob problem is introduced by v2 in phases:

- **Phase 1 (Template Extraction):** `template.lineTemplateDataUri` — a base64 PNG. A 1000×1000 extraction at ~300KB raw = ~400KB base64. 50 entries × 400KB = 20MB. This exceeds the typical 5MB localStorage limit if all entries have templates.
- **Phase 2 (Practice Journal):** `attempt.attemptPhotos[]` — one per attempt, ~500KB–2MB each. 20 attempts × 1MB average = 20MB. localStorage cannot hold this at all.

**The minimum viable change for Phase 1:** Don't store the template data URI in localStorage. Store a reference key (`template.storageKey`) that points to an IndexedDB record for the binary. Metadata (extractionParams, extractedAt, SVG data if small) stays in localStorage.

**The minimum viable change for Phase 2:** Attempt photos stored in IndexedDB only. Attempt metadata (notes, duration, rating, challenges, status) stored in localStorage as `radian:attempt:{uuid}`.

Keeping metadata in localStorage and blobs in IndexedDB gives us two things: (1) the fast synchronous read of localStorage for rendering the gallery and filter sidebar, and (2) the async IndexedDB read for large blobs only when needed (opening a template or viewing attempt photos). This is the right partition.

**One addition to the in-memory model:** A `storage` module in `data.js` that provides a unified read/write interface over both localStorage and IndexedDB. Callers don't need to know which store a given key lives in. This is the abstraction that makes the migration from localStorage-only painless — we add IndexedDB behind the interface, not alongside it.

### API Layer Design

The PRD describes four distinct system prompts for four capabilities. My call: **single `callClaude(capability, payload)` dispatcher** with capability-specific configuration objects.

The error handling contract is identical across all four capabilities:
- Retry once after 2 seconds on network failure
- Exponential backoff on 429 (rate limit)
- Attempt partial data extraction on malformed JSON, flag what failed
- Cancel and offer retry if >30 seconds

If this contract lives in four functions, it gets copied four times and diverges. It belongs in one place.

```javascript
// api.js

const CLAUDE_CAPABILITIES = {
  analyze:   { prompt: ANALYSIS_PROMPT,     maxTokens: 1000, model: 'claude-sonnet-4-20250514' },
  search:    { prompt: SEARCH_PROMPT,        maxTokens: 1500, tools: ['web_search'] },
  construct: { prompt: CONSTRUCTION_PROMPT,  maxTokens: 2000 },
  describe:  { prompt: SIMILARITY_PROMPT,    maxTokens: 800 }
};

async function callClaude(capability, payload) {
  const config = CLAUDE_CAPABILITIES[capability];
  // build request, call API, handle errors uniformly, return structured result
}
```

This is a two-way door. If construction generation turns out to need Opus while others stay on Sonnet, that's one config field change. If we need to split the dispatcher later for capability-specific error paths, the refactor is mechanical. Start unified.

### Storage Migration: Stay or Move?

**Call: migrate binary blobs to IndexedDB in Phase 2. Stay on localStorage for everything else in v2.**

Estimated storage for 50 entries with URLs (not base64) + 50 templates + 20 attempts:
- Entry metadata (no base64 images): 50 × 5KB = 250KB — trivial
- Template metadata only (storageKey reference): 50 × 2KB = 100KB — trivial
- Template PNGs in IndexedDB: 50 × 400KB = 20MB — fine for IndexedDB
- Attempt metadata: 20 × 3KB = 60KB — trivial
- Attempt photos in IndexedDB: 20 × 1MB = 20MB — fine for IndexedDB
- Analysis JSON: 50 × 4KB = 200KB — trivial
- Construction steps: 50 × 10KB = 500KB — trivial

**Total localStorage usage at v2 scale: ~1.1MB. Comfortable.**
**Total IndexedDB usage at v2 scale: ~40MB. No constraint.**

The model works. The key discipline: never store binary image data in localStorage, starting from Phase 1. Entry images that are URLs stay as URLs (this is already v1 behavior). Entry images that are base64 uploads are a v1 existing problem — note them, warn about storage, but don't break backward compatibility.

---

## 2. Feasibility Assessment

### Feature 1 — Tag-Driven Inspiration Search

| Dimension | Assessment |
|---|---|
| Feasibility | Likely |
| Key risk | Web search returns page URLs, not image URLs. Museum digital collections, Wikimedia, and artist sites require different URL patterns to get directly embeddable images. A non-trivial number of results will fail to load as `<img src="...">`. |
| Dependencies | API key management (settings panel), `callClaude()` infrastructure |
| Complexity | **M** — Search call is straightforward. The work is parsing structured results from Claude and rendering "from web" cards that degrade gracefully when images don't load. |
| Descope lever | Return text results only (title, source attribution, source URL). No image preview. User clicks through to the source page. Delivers discovery value without the image loading problem. |

### Feature 2 — Pattern Analysis with Claude Vision

| Dimension | Assessment |
|---|---|
| Feasibility | Likely (pending spike) |
| Key risk | Classification accuracy on photographs of physical objects. The spike will quantify this. Photographs introduce shadow, perspective distortion, material texture — all of which degrade classification. The more dangerous failure is false high confidence on a wrong answer, which erodes user trust faster than honest uncertainty. |
| Dependencies | Spike results (gates the go/no-go decision), API key, image-to-base64 pipeline |
| Complexity | **M** — API call is straightforward. The analysis panel UI (per-field confidence badges with rationale, accept/edit/dismiss per field) is where the complexity lives. |
| Descope lever | Show raw JSON analysis in a collapsible panel. User reads and manually accepts. Loses the refined UX but still saves tagging time. |

### Feature 3 — Line Template Extraction

| Dimension | Assessment |
|---|---|
| Feasibility | Proven |
| Key risk | Quality on photographs. No edge detection algorithm — Sobel, Canny, or otherwise — produces print-ready results from a shadow-covered tilework photo. The risk is user disappointment if expectations aren't set before they use it. |
| Dependencies | None — fully client-side canvas processing |
| Complexity | **M** — The pipeline is well-understood. The real-time slider preview is the complexity: debounced pixel processing on a 2000×2000 canvas can lag on slower machines. Need to downsample preview, apply sliders, then upscale for final export. |
| Descope lever | Fixed parameters, no sliders. Single "Extract" button with sensible defaults (σ=1.4, threshold=100). Clean images get good results; photographs get a disclaimer. Ships with minimal UI work. |

### Feature 4 — Construction Sequence Generation

| Dimension | Assessment |
|---|---|
| Feasibility | Uncertain |
| Key risk | Two compounding risks: (1) Claude produces geometrically plausible but imprecise instructions — the prompt engineering challenge is hard because spatial reasoning at construction precision is not a strength of current models. (2) There is no automated validation path. A wrong construction sequence looks wrong to a practitioner immediately, but we can't catch it in code. |
| Dependencies | Feature 2 (analysis must exist — the construction prompt consumes symmetry, tradition, and proportion data from the analysis object) |
| Complexity | **XL** — Text generation is L. Step-level SVG visualization is XL. Validation has no automated path and requires domain expert review. |
| Descope lever | Text-only instructions, no step-level visualization. Clearly labeled "experimental" in the UI. This is the only version that should ship in v2. |

### Feature 5 — Visual Similarity Search

| Dimension | Assessment |
|---|---|
| Feasibility | Likely (web search portion only) |
| Key risk | The "similar in your collection" behavior requires sending multiple images to Claude in a single call. A collection of 50 entries = 50 thumbnails. At ~800 tokens per image, that's 40,000 input tokens per similarity query — roughly $0.12 per search and a slow response. This is untenable at scale. |
| Dependencies | Features 1 and 2 must exist before this adds meaningful value |
| Complexity | **M** (web search portion) / **L** (local collection matching) |
| Descope lever | Cut local collection matching. Web similarity search only: Claude describes the query image → generates search queries → Feature 1 runs them. This is the version to build in v2. Local similarity matching belongs in v3 when embeddings are viable. |

### Feature 6 — Practice Journal

| Dimension | Assessment |
|---|---|
| Feasibility | Proven |
| Key risk | Storage. Attempt photos are 500KB–2MB each. 20 attempts with photos = 10–40MB. localStorage cannot hold this. The feature is architecturally unshippable without IndexedDB for photo storage. |
| Dependencies | Entry schema v2 (attempts array), IndexedDB wrapper in `data.js` |
| Complexity | **M** — Data model is simple. The UI work is the attempt form, comparison view (source image vs. attempt photo side by side), and the practice dashboard stats. |
| Descope lever | Text-only attempts, no photos. Duration, notes, self-rating, challenges. Drops the storage problem entirely and ships with one afternoon of UI work. |

### Feature 7 — Camera Capture

| Dimension | Assessment |
|---|---|
| Feasibility | Proven (getUserMedia is standard) |
| Key risk | The use cases described in the PRD — capturing tilework at the Alhambra, photographing library books — are fundamentally mobile. Building a desktop-only camera modal gives you webcam capture in the studio: a use case served equally well by a file upload. The feature solves a mobile problem but the app is desktop-only. |
| Dependencies | Feature 2 (analysis) and/or Feature 3 (extraction) — camera is an input source, not a processing feature |
| Complexity | **S** (desktop webcam modal) / **L** (if responsive design is required to support the actual use cases) |
| Descope lever | **Cut from v2.** Replace with "Add by URL paste" — user pastes an image URL, app loads it into the analysis/extraction flow. Same integration point (`populateForm()`), zero complexity, no camera permissions, works in the actual use cases (user takes a photo on their phone, opens Radian on their desktop, pastes the URL). Camera capture belongs in v3 when mobile responsiveness is addressed. |

---

## 3. The Ten Decisions

### Decision 1: Build Order and Phasing

**Call:** Phase 0 → Phase 1 → Phase 2 → Phase 3. See Section 4 for full phase definitions.

The ordering is driven by three dependencies:
1. The spike gates Feature 2. Phase 1 cannot start until the spike is done.
2. Feature 4 (Construction) depends on Feature 2 (Analysis). Construction belongs late.
3. Feature 1 (Discovery) depends on the API infrastructure built in Phase 1. It's a Phase 2 item.

What would change my mind: If the spike returns ≥80% accuracy, I'd pull Construction into Phase 2 as an experimental feature rather than Phase 3. If the spike returns <50%, I'd cut Construction from v2 scope entirely.

### Decision 2: Single-Call vs. Multi-Call API Architecture

**Call:** Single `callClaude(capability, payload)` dispatcher. See Section 1 for the design.

What you gain: one error handling contract, one place to add cost tracking, one place to update the API version header, one place to handle model selection overrides.

What you give up: the ability to tune per-capability error paths without affecting all capabilities. Acceptable — the error paths are identical, and if they diverge later, the refactor is mechanical (split config objects, not rewrite logic).

### Decision 3: OpenCV.js vs. Vanilla Canvas

**Call:** Vanilla Canvas for v2. Evaluate OpenCV.js only if the spike shows that medium-quality photographs (good lighting, flat angle) produce unusable output with Sobel but usable output with Canny.

The trade-off: OpenCV.js is ~8MB with no CDN and no build step. For a personal tool, that's a meaningful load hit. The honest answer about photograph quality is that neither algorithm makes a shadow-covered tilework photo print-ready — the problem is the image, not the algorithm. The spike will tell us whether the quality gap matters on good photographs. Start lightweight, measure, escalate only on evidence.

### Decision 4: SVG Export Feasibility

**Call:** Defer to v3. Ship PNG download in v2.

Contour tracing (raster → vector paths) requires a library. The JS ports of Potrace and autotrace are large, old, or unmaintained. Practitioners who need SVG can run Inkscape's trace function on the PNG export — it's free and better than any browser-based solution. Don't build complex infrastructure for an edge case when a good workaround exists.

Add a placeholder "SVG export (coming soon)" option in the download dropdown that links to the Inkscape trace documentation. Honest and useful.

### Decision 5: Construction Sequence Visualization

**Call:** Text-only instructions in v2. Claude SVG generation deferred.

Getting Claude to produce cumulative SVG that builds correctly across steps requires a level of spatial precision that current models achieve inconsistently. A wrong step in the SVG is confusing; a wrong text step is correctable by a practitioner who can see the original image. Start with the version that fails gracefully.

If the text-only construction sequences prove accurate (≥50% of generated sequences rated "plausible" in the acceptance criteria), invest in step-level SVG for v3. Don't build the harder thing before validating the easier thing.

### Decision 6: Mobile Responsiveness Scope

**Call:** Desktop-only for all of v2. Camera capture deferred entirely.

The primary user sits at a desk. The mobile use case is real but it's a different workflow that requires responsive design of the entire app. Building a desktop camera modal gives you webcam capture — a niche within a niche. The URL paste workaround covers the legitimate field-capture use case with zero work. Flag mobile as a v3 consideration and move on.

### Decision 7: IndexedDB Migration Timing

**Call:** Introduce IndexedDB wrapper in Phase 1, migrate template binaries and attempt photos to it in Phase 2.

The detailed rationale is in Section 1. The sequencing matters: build the storage abstraction in Phase 1 (so `data.js` has the interface), use it for templates in Phase 1, use it for attempt photos in Phase 2. Don't defer the abstraction to Phase 2 — you'll be retrofitting.

### Decision 8: Model Selection

**Call:** Sonnet for all features in v2. Test construction generation on Sonnet first; escalate to Opus only with measured evidence that Opus produces meaningfully better construction sequences AND the practitioner confirms they'll pay the cost difference.

The classification task (Feature 2) is well-constrained by the schema and system prompt. Sonnet handles it. Construction generation (Feature 4) is where Opus might add value — it's a more complex spatial reasoning task. But "might" isn't "does." Run Phase 1 and Phase 2 on Sonnet. Measure. Sonnet is ~10× cheaper per token; that's a conversation grounded in data, not assumption.

### Decision 9: Rate Limiting and Batching

**Call:** Sequential execution with 500ms inter-call delay for batch operations. Visible queue with per-image status.

The Anthropic API rate limits vary by tier. Parallel calls from a personal app can hit them unexpectedly. Sequential processing is predictable and cancellable. At 500ms between calls and ~3–5 seconds per API call, a batch of 10 images takes ~40 seconds — visible to the user as a progress indicator ("Analyzing 3 of 10..."), not as a hang. If the user is on a high-tier API key, we can expose a setting to reduce the delay. Don't optimize prematurely.

### Decision 10: Prompt Versioning Strategy

**Call:** Embed a version string in the system prompt (e.g., `// PROMPT VERSION: analysis-v1`). Store `promptVersion` and `modelVersion` on each `analysis` object. Display a subtle "re-analyze available" indicator on gallery cards where `promptVersion` doesn't match the current version.

Analysis results are derived data — they can be regenerated from the source (the image). The version flag tells practitioners "this was analyzed before we improved the prompt" and lets them re-analyze on-demand, not automatically. No background batch jobs, no forced re-analysis. The user decides.

---

## 4. Build Phases

### Phase 0 — Foundation + Spike

**Scope:** Multi-file scaffold (v1 functionality preserved in new structure), settings panel with API key input, storage abstraction layer, run the vision analysis spike on 12–15 images.

**Prerequisites:** None. This is the starting point.

**Deliverables:**
- All v1 functionality working in the new multi-file structure (`data.js`, `gallery.js`, `form.js`, `app.js`)
- Settings panel: API key entry, storage usage indicator, light/dark toggle (moved from header)
- `callClaude()` dispatcher with error handling contract, even if no capabilities use it yet
- IndexedDB wrapper stubbed in `data.js` (interface defined, not yet used)
- Vision analysis spike scorecard: 12–15 images × 5 tag groups, scored per rubric

**Acceptance criteria:**
- All v1 entries render correctly from the new multi-file structure
- `populateForm()` works identically to v1
- API key stored and retrievable from settings
- Spike scorecard complete with accuracy ≥ threshold (determines Phase 1 scope)

**Risk register:**
1. *Spike accuracy <50%.* Mitigation: Feature 2 descoped to text-only suggestions. Phase 1 narrows to Feature 3 only.
2. *Refactoring breaks `populateForm()` behavior.* Mitigation: Don't refactor the function signature or behavior — copy it verbatim from v1, put it in `form.js`, confirm it works before touching anything else.

---

### Phase 1 — Understand + Extract

**Scope:** Pattern analysis (Feature 2), line template extraction (Feature 3). Both operate on images already in the collection. No new entry sources yet.

**Prerequisites:** Phase 0 complete. Spike accuracy ≥50% (if <50%, scope narrows to Feature 3 only).

**Deliverables:**
- "✦ Analyze" button on gallery cards and entry detail panel
- Analysis panel: image + classification rows with confidence badges (●/◐/○), rationale text, per-field accept/edit/dismiss, Accept All button
- Analysis metadata stored on entry (`analysis` field including `promptVersion`)
- "Extract Template" button on gallery cards and entry detail panel
- Template panel: original + extracted side-by-side, interactive sliders (edge sensitivity, line weight, blur radius), PNG download
- Template metadata stored on entry (storageKey reference to IndexedDB, extractionParams)
- Storage usage indicator in settings (updated after each write)

**Acceptance criteria:**
- 5 images analyzed end-to-end, tags populated via Accept All, stored correctly
- 5 templates extracted, downloaded as PNG, reopenable with original slider settings
- Storage gauge reflects accurate usage after each operation
- `populateForm()` correctly handles an entry with `analysis` and `template` fields that were missing before

**Risk register:**
1. *Analysis panel UI is underestimated.* Mitigation: Ship with Accept All only first. Per-field accept/edit is a follow-on. The analysis panel delivers value without it.
2. *Canvas slider preview lags on large images.* Mitigation: Preview operates on a downsampled canvas (max 800px); final export uses full resolution. Implement this distinction from the start.

---

### Phase 2 — Discover + Practice Journal + IndexedDB

**Scope:** Inspiration search (Feature 1), practice journal (Feature 6), attempt photo storage in IndexedDB.

**Prerequisites:** Phase 1 complete. IndexedDB wrapper from Phase 0 now activated for attempt photos.

**Deliverables:**
- "Discover" tab in header navigation
- Tag-based search using active filter selections, "from web" result cards (dashed border, source attribution, "Save to Collection" → `populateForm()`)
- Recent searches stored in `radian:searches`, shown in sidebar
- "Practice" tab in header navigation
- Practice dashboard: total attempted/completed, time invested, attempt photo wall
- "Log Attempt" form on each entry: photo upload, duration, notes, self-rating, challenges, status
- Attempt metadata in localStorage, attempt photos in IndexedDB
- Warning at 4MB localStorage usage, export to JSON at 4.5MB
- URL paste input as camera capture substitute

**Acceptance criteria:**
- 3 tag-based searches return ≥5 results each
- One search result saved to collection via `populateForm()` with correct pre-filled tags
- Practitioner logs 1 attempt with a photo — photo appears in the practice dashboard
- JSON export/import round-trips all entry metadata correctly

**Risk register:**
1. *Search result image URLs fail to load.* Mitigation: "From web" cards degrade gracefully — show source attribution and "View Source" link even when `<img>` fails. Treat broken images as expected, not as errors.
2. *IndexedDB wrapper introduces async bugs in the save flow.* Mitigation: The storage abstraction from Phase 0 must be tested with a stub before attempt photos depend on it. Don't wire the Practice Journal to IndexedDB without having written and tested the wrapper first.

---

### Phase 3 — Construction (experimental) + Visual Similarity Search (web only)

**Scope:** Construction sequence generation (Feature 4, text-only, labeled experimental), visual similarity search (Feature 5, web search portion only, no local collection matching).

**Prerequisites:** Phase 2 complete. Feature 4 requires Feature 2 (analysis object must exist on the entry).

**Deliverables:**
- "Generate Construction" button on entries that have analysis data
- Construction panel: numbered step cards (instruction + tools used), "Previous / Next" navigation, experimental disclaimer
- Construction steps stored on entry (`construction` field)
- "Find Similar" button on any entry or search result
- Similarity results: web results panel using Claude description → search queries → Feature 1 pipeline
- Construction sequences exported as multi-page text summary (not PDF — defer PDF to v3)

**Acceptance criteria:**
- 3 construction sequences generated and reviewed by practitioner; at least 1 rated "plausible and followable"
- If 0 of 3 are plausible, the feature is held behind a feature flag until prompt improvements are made
- 3 similarity searches return results with recognizable geometric relationship to the query image

**Risk register:**
1. *Construction quality is too poor to ship.* Mitigation: The experimental label and disclaimer are non-negotiable. If practitioner review finds 0 plausible sequences in the acceptance criteria test, do not ship. Hold the feature and invest in prompt iteration or defer to v3.
2. *Similarity search results are too generic.* Mitigation: The description prompt needs to be specific to geometric properties (symmetry order, construction method, visual density) not just general image description. Test prompt quality before shipping.

---

## 5. Schema Decisions

### Review of PRD Schema Extensions

The `source`, `analysis`, and `construction` field designs are correct. No changes recommended.

**`template` — one change required:**

```javascript
// PRD proposed (do not implement):
template: {
  lineTemplateDataUri: null,   // ← base64 data URI stored on the entry object
  // ...
}

// Correct implementation:
template: {
  storageKey: null,            // ← key into IndexedDB; data lives there, not here
  svgData: null,               // SVG is small (< 100KB); inline is acceptable
  extractionParams: { ... }
}
```

Storing a base64 PNG inline on the entry object defeats the purpose of the IndexedDB migration. The `storageKey` is a reference — a UUID that maps to an IndexedDB record containing the actual binary. Loading an entry for display should not require loading its 400KB template.

**Two missing fields:**

```javascript
// Add to entry root:
schemaVersion: 2,              // Migration gating for v3+

// Add to analysis object:
analysis: {
  promptVersion: null,         // e.g., "analysis-v1" — enables re-analysis detection
  // ... all existing PRD fields ...
}
```

### `attempts` — Nested vs. Separate

**Call: Separate top-level objects with `entryId` foreign key.** The PRD's proposed localStorage schema (`radian:attempts:index`, `radian:attempt:{uuid}`) is correct. Make it formal.

Nesting attempts inside the entry object means: loading any entry loads all its attempt metadata; building the practice dashboard requires iterating all entries; and attempt photos (in IndexedDB) can't be co-located with attempt metadata without a separate lookup anyway. The foreign key structure enables the practice dashboard query ("all attempts, sorted by date") without touching entries at all.

### Migration Strategy

No migration function. Optional field access throughout: `entry.analysis?.performedAt`, `entry.template?.storageKey`, etc. On first v2 save of any entry, write `schemaVersion: 2`. If v3 adds breaking changes, check `schemaVersion` on read. This is the minimum viable schema evolution strategy for a personal tool with one user.

---

## 6. API Cost Model

**Pricing basis:** Claude Sonnet 4, March 2026. Input: $3/MTok. Output: $15/MTok. Vision images: ~1,500–2,000 tokens per 1000×1000 image (varies by image complexity per Anthropic's vision token counting).

| Operation | Input tokens | Output tokens | Cost per call |
|---|---|---|---|
| Pattern analysis | 2,000 (image) + 800 (system prompt) = 2,800 | 400 (structured JSON) | ~$0.014 |
| Inspiration search | 700 (system + tag query) | 1,000 (results JSON) | ~$0.017 |
| Construction generation | 2,000 (image) + 1,200 (system + analysis context) = 3,200 | 1,500 (steps) | ~$0.032 |
| Similarity description | 2,000 (image) + 500 (system) = 2,500 | 500 (description + queries) | ~$0.015 |

**Typical practitioner monthly usage: 10 searches, 15 analyses, 5 construction sequences, 20 extractions:**

| Feature | Calls | Cost |
|---|---|---|
| Inspiration search (10) | 10 × $0.017 | $0.17 |
| Pattern analysis (15) | 15 × $0.014 | $0.21 |
| Construction generation (5) | 5 × $0.032 | $0.16 |
| Line extraction (20) | 0 (client-side) | $0.00 |
| **Monthly total** | | **~$0.54** |

This is effectively zero. The PRD's suggestion to display running cost totals in the UI adds anxiety without actionable value at this price point. Replace it with: show total API calls made this session in the settings panel footer. A practitioner will never make a decision based on a $0.014 call cost.

**Where costs could surprise:**
- Large images (4000×4000 screenshots or high-res scans): 8,000+ input tokens per analysis, ~4× the typical cost. Add a soft image resize to 2000px max before API calls — the PRD already specifies this.
- Construction prompts grow with analysis context. An entry with full analysis, construction notes, and a long description adds ~500 tokens to the construction prompt. Expected; not alarming.
- Batch analysis of 20 entries: 20 × $0.014 = $0.28. One coffee. Fine.
- The only genuine surprise scenario: a user sends a 16MP RAW-quality image repeatedly while debugging a construction prompt. Add the 2000px resize guard and this scenario disappears.

---

## 7. Spike Integration

### Confirming Decision Thresholds

The PRD's thresholds (≥70% greenlight, 50–70% iterate, <50% descope) are correct. I'd refine the scoring rubric with one addition:

**Track false confidence separately.** A "high confidence miss" is more damaging to user trust than a "low confidence miss." The current rubric penalizes it with -0.5 points, which is right. But I want a separate count in the scorecard: total high-confidence misses across all 15 images × 5 fields. If this count is >3, the prompt needs a calibration pass (Iteration 4 in the spike document) regardless of overall accuracy score. False confidence is a trust problem, not just an accuracy problem.

### What the Spike Should Test That It Currently Doesn't

1. **Response stability.** Run 3 of the 12 images through the prompt twice on separate calls. If the same image gets different confidence levels or different primary classifications across runs, the prompt is underspecified. Add this to the protocol as a stability check.

2. **Malformed JSON recovery.** Deliberately trigger a response that doesn't parse cleanly. One way: add an image with a user message that says "begin your response with 'Here is my analysis:'" before the JSON. Test that the parser in `api.js` handles leading text and strips it before `JSON.parse()`. This is not a Claude behavior test — it's an error handling test for the production code.

3. **More genuinely ambiguous images.** The spike calls for 2 ambiguous images. I'd make it 4. The failure mode we most need to understand is whether Claude forces a tradition assignment on a modern syncretic pattern (bad) vs. returns "syncretic/uncertain" with rationale (good). This is the feature's most important calibration point.

### How Spike Results Flow into Phasing

| Accuracy | Phase 1 scope | Phase 3 scope |
|---|---|---|
| ≥80% | Full analysis panel (per-field accept/edit) | Pull Construction into Phase 2 as experimental |
| 70–80% | Full analysis panel, one prompt iteration on lowest-scoring fields | Construction stays in Phase 3 |
| 55–70% | "Suggestions" framing — accept/edit UI shows "Suggested:" prefix. No change to functionality. | Construction deferred or cut |
| <50% | Feature 2 cut. Phase 1 = Feature 3 only. | Construction cut from v2. |

The "suggestions" framing doesn't require a different API call or a different data model. It's a label change and a UX tone shift. The analysis panel already has accept/edit/dismiss per field — that flow works regardless of whether we call it "classified" or "suggested."

### Prompt Engineering Risks the Spike Doesn't Address

The system prompt is ~1,500 tokens. For highly complex images (layered mandalas, composite patterns), there's a known behavior in large language models where attention to later sections of a long prompt decreases. If classification quality degrades specifically on later fields in the output (proportion, in particular — the last field in the JSON schema), this may be the cause. Test field order effects if accuracy varies significantly between early and late fields.

---

## 8. CLAUDE.md — v2 Draft

```markdown
# CLAUDE.md — Radian v2

## Project Context

Radian is a sacred geometry collection and studio companion app. Single-page, vanilla JS,
no build step, no npm. Desktop browser only. The aesthetic is dark-first, gold accents,
precise and restrained. Do not deviate from this without explicit instruction.

## Architecture Rules

### File structure (strict)
js/data.js → js/gallery.js → js/form.js → js/api.js → js/canvas.js → js/panels.js → js/app.js

This is the load order and the dependency graph. No file may call a function defined in
a file that loads after it. If you find yourself needing to do this, the architecture
has a boundary problem — surface it before writing code.

### No build step, no npm
Never add package.json, node_modules, webpack, vite, or any bundler. Never add npm
dependencies. Google Fonts CDN is allowed. OpenCV.js may be added only if the canvas
edge detection spike proves insufficient on medium-quality photographs — this requires
an explicit decision, not a default.

### No TypeScript
v2 remains vanilla JS. No transpilation. JSDoc comments for complex function signatures
if needed, not TypeScript annotations.

## File Responsibilities

**js/data.js** — TAG_VOCABULARY constant, entry schema definition, localStorage CRUD
functions, IndexedDB wrapper (binary storage), `schemaVersion` migration logic,
storage usage calculation.
- Never call the Claude API here.
- Never render HTML here.

**js/gallery.js** — `renderGallery(entries)`, `filterEntries(entries, activeFilters)`,
card template for local entries, card template for "from web" search result entries.
- Never call the Claude API here.
- Never write to localStorage here.

**js/form.js** — `populateForm(entry)`, `renderForm()`, `saveEntry()`.
- `populateForm()` is the primary integration contract for all v2 features. See below.
- Never call the Claude API here.

**js/api.js** — ALL Claude API calls. ALL system prompts stored as constants. The
`callClaude(capability, payload)` dispatcher. Cost tracking. Error handling.
- No canvas manipulation here.
- No DOM rendering here.
- No localStorage writes here (only `data.js` writes to storage).

**js/canvas.js** — `extractLineTemplate(imageElement, options)` and all canvas
processing utilities. Grayscale, Gaussian blur, Sobel edge detection, binary threshold,
morphological operations. Zero API calls.
- This file has no dependencies on any other Radian file.
- It only receives image data and returns processed data.

**js/panels.js** — Panel lifecycle (show/hide, focus, scroll). Analysis panel render
(confidence badges, classification rows, accept/edit/dismiss). Template panel render
(slider controls, side-by-side preview). Construction panel render (step cards, navigator).
- Calls api.js and canvas.js for data.
- Calls form.js (`populateForm()`) to commit accepted analysis.
- Never writes directly to localStorage.

**js/app.js** — `init()`, tab navigation (Collection/Discover/Practice), global event
listeners, wires all other modules together. No business logic here — delegate to
the appropriate module.

## The `populateForm()` Contract — DO NOT BREAK

`populateForm(entry)` accepts any valid entry object and pre-fills all form fields.
It is the integration point for every v2 feature:

| Feature | Caller | What it pre-fills |
|---|---|---|
| Inspiration Search | "Save to Collection" button | imageUrl, sourceUrl, suggestedTags, source metadata |
| Pattern Analysis | "Accept All" in analysis panel | tags (merged with existing), analysis metadata, difficulty |
| Line Extraction | "Save Template" action | template.storageKey, template.extractionParams |
| Construction Gen. | "Save Construction" action | construction.steps, construction.baseGrid, construction.estimatedTime |
| URL Paste | "Add by URL" flow | imageUrl, source.discoveredVia = "manual" |

Rules:
- `populateForm()` must handle partial entry objects gracefully (fields may be null or absent).
- It must MERGE new tags with existing tags, not replace them.
- It must never close the form panel — the user reviews before saving.
- Never add a second form-filling function. All roads lead to `populateForm()`.

## Storage Architecture

### What lives where
- Entry metadata: localStorage as `radian:entry:{uuid}` JSON
- Tag indexes, search history, settings, attempt metadata: localStorage
- Template PNGs: IndexedDB, referenced by `entry.template.storageKey`
- Attempt photos: IndexedDB, referenced by `attempt.attemptPhotos[]` keys
- Analysis JSON: localStorage (small enough, <10KB per entry)
- Construction steps: localStorage (text only, <20KB per entry)

### Never do this
- Never store a base64 image data URI directly on an entry object in localStorage.
  Base64 PNGs are 400-500KB. Three of them fill the quota. Use IndexedDB.
- Never store an Anthropic API key anywhere except `radian:settings` in localStorage,
  and never transmit it anywhere except directly to `api.anthropic.com`.

### Storage safety
- Write a storage usage check after every localStorage write in `data.js`.
- Warn user in settings UI at 4MB.
- Offer JSON export at 4.5MB.
- Never silently fail on a quota exceeded error.

## Claude API Integration

All API calls go through `callClaude(capability, payload)` in `api.js`.

### Capabilities
- `analyze` — Pattern analysis with Claude Vision. Takes base64 image.
- `search` — Tag-driven inspiration search. Takes structured tag object. Uses web_search tool.
- `construct` — Construction sequence generation. Takes base64 image + analysis object.
- `describe` — Visual similarity description. Takes base64 image.

### Error handling contract (enforced in callClaude, nowhere else)
1. Network failure → retry once after 2 seconds → show "Try Again" button
2. Rate limit (429) → exponential backoff starting at 2s → show "API busy, retrying..."
3. Malformed JSON response → extract partial data → flag failed fields
4. Timeout >30s → cancel → offer retry
5. Missing API key → prompt to open settings before any API call proceeds

### Prompt versioning
- Each system prompt constant includes a version comment: `// PROMPT VERSION: analyze-v1`
- Store `promptVersion` on the `analysis` object of every entry that has been analyzed.
- When `promptVersion` on an entry doesn't match the current prompt version, show a subtle
  "re-analyze available" indicator on the gallery card.

### Model selection
- Default: `claude-sonnet-4-20250514` for all capabilities.
- Model override available per capability in `CLAUDE_CAPABILITIES` config object.
- Do not upgrade to Opus without measuring accuracy improvement AND explicit user
  confirmation of cost difference.

## Entry Schema

```javascript
{
  // v1 fields (preserved exactly)
  id, createdAt, title, imageUrl, sourceUrl,
  status,       // "want-to-try" | "attempted" | "done"
  difficulty,   // "beginner" | "intermediate" | "advanced"
  tags: { constructionMethod: [], tradition: [], patternType: [], symmetry: [], proportion: [] },
  description, attemptNotes,

  // v2 additions
  schemaVersion: 2,

  source: {
    discoveredVia: null,    // "manual" | "search" | "camera" | "url-paste"
    searchQuery: null,
    originalContext: null
  },

  analysis: {
    performedAt: null,
    modelVersion: null,
    promptVersion: null,    // e.g., "analyze-v1"
    classifications: {
      constructionMethod: { primary: null, confidence: null, rationale: null },
      tradition:          { primary: null, secondary: null, confidence: null, rationale: null },
      patternType:        { primary: null, secondary: null, confidence: null, rationale: null },
      symmetry:           { primary: null, confidence: null, rationale: null },
      proportion:         { detected: [], confidence: null, rationale: null }
    },
    constructionNotes: null,
    suggestedDifficulty: null
  },

  template: {
    extractedAt: null,
    storageKey: null,       // IndexedDB key — NOT the data URI itself
    svgData: null,          // SVG string if vector extraction succeeded (inline OK, small)
    extractionParams: {
      edgeSensitivity: null,
      lineWeight: null,
      blurRadius: null,
      algorithm: null       // "sobel" | "canny"
    }
  },

  construction: {
    generatedAt: null,
    promptVersion: null,
    steps: [],
    baseGrid: null,
    startingRadius: null,
    estimatedTime: null
  }

  // attempts stored separately: radian:attempt:{uuid} with entryId foreign key
}
```

## What Claude Code Must Never Do

- Break `populateForm()`. Any change to its signature or behavior is a breaking change.
- Inline the API key in code. Ever.
- Add npm packages or a build step.
- Store binary data (images, PNGs) directly in localStorage.
- Write API call logic outside `js/api.js`.
- Write canvas processing logic outside `js/canvas.js`.
- Propose SVG export before Phase 3 is approved.
- Ship construction sequences without the "experimental" label and disclaimer.
- Write a migration function that modifies existing v1 entries — use optional field access instead.
- Create files not in the defined file structure without explaining why.

## Testing Expectations by Phase

**Phase 0:** Manually verify all v1 entry operations (create, edit, delete, filter) work correctly
in the multi-file structure. Run `populateForm()` with a complete v1 entry object and confirm
all fields populate.

**Phase 1:** Analyze 5 images end-to-end, accept all classifications, confirm analysis fields
stored correctly on entry object. Extract templates from 5 images, download PNG, reopen panel
and confirm slider settings are restored from `extractionParams`.

**Phase 2:** Run 3 tag searches, confirm ≥5 results each. Save 1 search result via
`populateForm()`. Log 1 practice attempt with a photo, confirm photo persists across page reload.
Export JSON, clear localStorage, import JSON, confirm all entries restored.

**Phase 3:** Generate 3 construction sequences. Confirm at least 1 practitioner-rated as
plausible. Run 3 similarity searches, confirm results have recognizable geometric relationship
to query.
```

---

## Open Questions Requiring Your Input Before Phase 1 Build

These are not decisions I can make without your input:

1. **The spike execution itself.** The spike requires sourcing 12–15 specific images from practitioner references (Adam Williamson, Wikimedia Commons, museum collections) and running the protocol manually. Do you want to run this yourself, or should I build a simple spike harness (a single HTML file that sends images to the Claude API and displays structured results) so you can run it with minimal setup?

2. **v1 entry base64 image handling.** If you have existing v1 entries stored with base64 images, those are already eating localStorage quota. I'd like to know your current storage usage before Phase 0 starts, so we know whether the IndexedDB migration is urgent or comfortable. Open browser DevTools → Application → Local Storage → check `radian:` keys.

3. **Construction sequence ambition.** The PRD calls this "the feature that no tool in the world currently offers." That's true, and it's also why the risk is highest here. If Phase 3 construction sequences turn out to be 40% plausible rather than 50%, is that enough to ship with the experimental label? That's a product judgment about user expectation-setting, not an engineering judgment.
```
