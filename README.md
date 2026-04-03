# Radian

**Where Art and Mathematics Unite**

A personal sacred geometry practice companion. Collect geometric patterns, analyze them with Claude Vision, and extract print-ready line templates with client-side edge detection.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (SPA)                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      app.ts (entry)                      │   │
│  │         init · state · event wiring · sidebar            │   │
│  └────┬──────────┬──────────┬──────────┬───────────┬────────┘   │
│       │          │          │          │           │            │
│  ┌────▼───┐ ┌────▼───┐ ┌───▼────┐ ┌───▼────┐ ┌────▼─────┐     │
│  │gallery │ │ form   │ │ data   │ │  api   │ │ panels   │     │
│  │        │ │        │ │        │ │        │ │          │     │
│  │filter  │ │render  │ │storage │ │callCla-│ │Settings  │     │
│  │sort    │ │populate│ │migrate │ │ude()   │ │Analysis  │     │
│  │render  │ │save    │ │TAG_VOC-│ │PROMPT  │ │Template  │     │
│  │cards   │ │        │ │ABULARY │ │_V2     │ │          │     │
│  └────────┘ └────────┘ └───┬────┘ └───┬────┘ └────┬─────┘     │
│                             │          │           │            │
│                      ┌──────▼──┐   ┌───▼──────┐ ┌─▼────────┐  │
│                      │  Local  │   │Anthropic │ │canvas.ts │  │
│                      │Storage  │   │  API     │ │          │  │
│                      │         │   │(browser) │ │  Sobel   │  │
│                      │metadata │   │          │ │  edge    │  │
│                      │+ image  │   │claude-   │ │detection │  │
│                      │  URLs   │   │sonnet-4-6│ │          │  │
│                      │+ templ- │   │          │ │PNG export│  │
│                      │  ate    │   └──────────┘ └──────────┘  │
│                      │  refs   │                               │
│                      └─────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### Module responsibilities

| Module | Responsibility |
|---|---|
| `app.ts` | Entry point. Global state (`entries`, `activeFilters`, `sort`, `search`). Event wiring. Sidebar rendering. |
| `data.ts` | `TAG_VOCABULARY` (v2). `localStorage` CRUD. Schema v1→v2 migration. Template PNG storage. Import / export JSON. |
| `gallery.ts` | `filterEntries` (AND-across-groups, OR-within), `sortEntries`, card HTML, `renderGallery`, `updateGalleryTitle`. |
| `form.ts` | `renderForm` (builds static DOM once). `populateForm` / `clearForm` / `readFormState` / `saveCurrentEntry`. |
| `api.ts` | `callClaude(capability, payload)` dispatcher. `SYSTEM_PROMPT_V2` (from spike). Session cost tracker. API key management (env → runtime fallback). |
| `canvas.ts` | Sobel edge-detection pipeline: Gaussian pre-blur → grayscale → Sobel → hysteresis threshold → dilation → PNG export. Zero external dependencies. |
| `panels.ts` | Settings panel (API key, cost, theme). Analysis panel (renders result, "Apply suggested tags"). Template panel (live canvas preview, controls, save/download). |
| `types.ts` | `Entry`, `Analysis`, `TemplateRef`, `AppState` — the domain contract. |
| `utils.ts` | `escapeHtml`, `formatDate`, `formatCost`. |

### Data flow

```
User action
    │
    ▼
app.ts (event handler)
    │
    ├─► data.ts ──► localStorage  (read/write Entry)
    │
    ├─► form.ts ──► DOM           (populate / read form fields)
    │
    ├─► gallery.ts ──► DOM        (render cards)
    │
    ├─► api.ts ──► Anthropic API  (analyze — user-triggered only)
    │       │
    │       └─► panels.ts ──► DOM (render analysis result)
    │
    └─► canvas.ts ──► <canvas>    (extract template — user-triggered only)
            │
            └─► panels.ts ──► DOM (render controls + preview)
```

### Storage layout

```
localStorage
├── radian:index              → string[]        (ordered entry IDs)
├── radian:entry:{id}         → Entry (JSON)    (metadata + tags + analysis)
└── radian:template:{id}      → string          (base64 PNG data URL)
```

### API key resolution

```
Build time:  VITE_ANTHROPIC_API_KEY in .env  →  baked into bundle
Runtime:     Settings panel prompt           →  module-scoped variable only
                                                (never written to localStorage)
```

---

## Getting started

```bash
git clone https://github.com/fitore/radian-geometric-art
cd radian-geometric-art
npm install

# Optional: add your Anthropic API key for Pattern Analysis
cp .env.example .env
# edit .env → VITE_ANTHROPIC_API_KEY=sk-ant-...

npm run dev       # http://localhost:5173
npm run build     # production build → dist/
```

If you skip the `.env` step, Radian runs fully without an API key. Add one later in the **Settings** panel to unlock pattern analysis.

---

## Features

### Phase A — Collection
- Add / edit sacred geometry pieces with image URL or file upload
- Tag each piece across five dimensions: construction method, tradition, pattern type, symmetry, proportion
- Filter (AND across groups, OR within) and sort your collection
- Import / export as JSON

### Phase B — Pattern Analysis
Triggered by the **✦ Analyze with Claude** button on any entry with an image.

Claude Vision classifies the pattern using a practitioner-designed taxonomy (SYSTEM_PROMPT_V2, validated via spike). Results show per-field confidence and rationale. **Apply suggested tags** fills the form from the analysis output.

Classification fields:
| Field | Values |
|---|---|
| Construction method | compass-and-straightedge · ruler-only · freehand · polygonal-method · grid-based · string-art-parabolic |
| Tradition | Islamic-geometric · Moorish-Andalusian · Persian-Iranian · Moroccan-Maghrebi · Ottoman · Gothic-Medieval · Hindu-Vedic · Celtic-Insular · Nature-derived · syncretic · Contemporary-Mathematical |
| Pattern type | rosette · star-polygon · tessellation · arabesque-biomorph · mandala · knot-interlace · spiral · parabolic-curve · epicycloid · curve-of-pursuit · Flower-of-Life-lineage |
| Symmetry | 3-fold through 16-fold |
| Proportion | golden-ratio · √2 · √3 · vesica-piscis · fibonacci · pi-based |

### Phase C — Line Template Extraction
Triggered by the **◈ Extract template** button. Runs a Sobel edge-detection pipeline entirely client-side (no external library, no server round-trip).

Controls: edge sensitivity · edge max · pre-blur · line weight · invert. Live canvas preview. Download as print-ready PNG or save the reference to the entry.

---

## Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript (strict) | Domain model complex enough to justify type safety |
| Build | Vite | Zero-config, fast HMR, handles TS + CSS natively |
| CSS | Open Props + Vanilla CSS | Bespoke aesthetic; no utility-class constraints |
| API | `@anthropic-ai/sdk` (browser) | `dangerouslyAllowBrowser: true` — personal tool, no server |
| Storage | `localStorage` | Metadata + image URLs well within limits; no server dependency |
| Edge detection | Vanilla Canvas API | ~200 lines; avoids 8MB OpenCV.js for well-defined pipeline |

---

## Project structure

```
radian-geometric-art/
├── index.html
├── src/
│   ├── app.ts          ← entry point
│   ├── types.ts
│   ├── utils.ts
│   ├── data.ts
│   ├── gallery.ts
│   ├── form.ts
│   ├── api.ts
│   ├── canvas.ts
│   ├── panels.ts
│   └── styles/
│       ├── index.css   ← imports Open Props + all modules
│       ├── tokens.css  ← design tokens (light default / dark override)
│       ├── layout.css
│       ├── gallery.css
│       ├── form.css
│       └── panels.css
├── mvp/                ← v1 single-file reference (preserved)
├── spike/              ← vision classification spike (preserved)
├── analysis docs/      ← PRD, technical brief, spike plan
├── vite.config.ts
├── tsconfig.json
└── .env.example
```

---

## Spike results

Pattern analysis uses SYSTEM_PROMPT_V2, the hardened iteration from the pre-build spike. Accuracy by field against a ground-truth test set of 10 images:

| Field | Accuracy | Status |
|---|---|---|
| patternType | 77.5% | Strong |
| constructionMethod | 60.0% | Acceptable |
| tradition | 50.0% | Iterate |
| symmetry | 47.5% | Iterate |
| proportion | 42.5% | Iterate |
| **Overall** | **55.5%** | **Iterate** |

Analysis results are presented as **suggested tags**, not authoritative classifications. `promptVersion` is stamped on each stored analysis — a "re-analyze available" indicator will surface when the prompt advances past the stored version.
