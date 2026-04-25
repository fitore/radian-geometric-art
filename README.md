# Radian

**Where Art and Mathematics Unite**

A sacred geometry research and practice companion — and a worked example of
disciplined AI-assisted software development.

---

## What Radian Does

Radian serves practitioners who draw sacred geometry by hand with compass,
straightedge, and fine-liner. Three capabilities:

**Understand** — Upload or paste any geometric image. Radian classifies it
using practitioner vocabulary: symmetry order, cultural tradition, construction
method, and mathematical proportions. Every result shows confidence and
rationale. A wrong answer is worse than no answer, so uncertain classifications
say so.

**Discover** — Search for geometric inspiration using the same vocabulary.
Not an image dump — a curated, geometry-literate search across practitioner
references, museum collections, and artist portfolios.

**Draw** — Extract a print-ready line template from any pattern image using
client-side edge detection. Generate the underlying construction sequence: the
compass arcs, grid scaffolding, and step-by-step instructions a practitioner
would follow to build the pattern from scratch.

Together these close a loop that has never been closed digitally: from
curiosity ("I want to draw something like this") to understanding ("here is
what this pattern actually is") to practice ("here is how to draw it").

---

## What This Repo Also Demonstrates

Radian is built as a public example of a specific development methodology:
**harness engineering with Claude Code**.

The thesis is that AI-assisted development produces compounding quality gains
when the engineer treats the repo context as infrastructure — not just code.
The harness in this repo includes:

- **`CLAUDE.md`** — The coding agent's contract with the codebase. Constraints,
  module boundaries, integration points, and non-negotiables. Not a description
  of the project — a governance document the agent reads before every session.

- **`architect.md`** — The thinking partner context for planning sessions.
  Loaded in a long-form AI session before opening Claude Code. Produces
  task specifications, ADRs, and prompt iteration records — not code.

- **`docs/`** — The decision trail. Every non-obvious architectural choice has
  an ADR. Spike results are recorded with accuracy data. The PRD is versioned
  in `docs/prd.md`, not in a filename.

The separation between the thinking agent (architectural decisions, prompt
engineering, task scoping) and the coding agent (implementation against a
defined contract) is the core pattern this project demonstrates.

---

## Architecture

```
src/
├── main.tsx              ← React entry point
├── App.tsx               ← Root component — useReducer for session state,
│                            AppView routing (gallery | form | about)
├── types.ts              ← Domain contract: Entry, Analysis, TemplateRef,
│                            AppState, AppAction (discriminated union)
├── data.ts               ← TAG_VOCABULARY, localStorage CRUD, schema migration,
│                            SEED_ENTRIES, seedInitialEntries()
├── gallery.ts            ← filterEntries(), sortEntries() — pure functions
├── api.ts                ← callClaude(), SYSTEM_PROMPT, cost tracking
├── canvas.ts             ← Sobel edge-detection pipeline (no external deps)
├── symmetry.ts           ← Client-side fold detection pipeline — imagetracerjs
│                            vectorisation, KD-tree scoring, symmetry group detection
├── utils.ts              ← Pure helpers: escapeHtml, formatDate, formatCost
├── components/
│   ├── Header.tsx        ← Persistent header — wordmark, nav, settings dropdown
│   ├── Footer.tsx        ← Persistent footer — GitHub link
│   ├── Gallery.tsx       ← Card grid — receives filtered/sorted entries as props
│   ├── EntryCard.tsx     ← Single collection card
│   ├── EntryForm.tsx     ← Add/edit page — owns all form field state
│   ├── AboutPage.tsx     ← About page body content
│   ├── AnalysisPanel.tsx ← Analysis result display — accept/dismiss contract
│   ├── FundamentalDomainView.tsx ← Symmetry wedge overlay, tile extraction,
│   │                                tessellation preview
│   ├── TemplatePanel.tsx ← Edge extraction controls and preview
│   └── SettingsPanel.tsx ← API key, session cost, theme
└── styles/
    ├── tokens.css        ← All design tokens (light default / dark override)
    └── ...
```

**The central contract:** `populateForm(partial)` inside `EntryForm` is the
single path through which all automated pipeline output — AI analysis results,
image upload — updates the form UI. It is a `useCallback` handler passed
down as `onAccept` to `AnalysisPanel`. Nothing calls `setState` on form fields
directly from outside the form component.

**State layer separation:**

| State type | Where it lives | Example |
|---|---|---|
| Persistent | localStorage via `data.ts` only | Entry collection |
| Session | `useReducer` at App root | Selected entry, active filters, open panel |
| Transient | `useState` in the owning component | Analysis in-flight, form field values |

Analysis results are transient — they live in `EntryForm` state and are never
written to localStorage until the user saves the form.

**Storage:**
```
localStorage
├── radian:index              → string[]   (ordered entry IDs)
├── radian:entry:{id}         → Entry      (metadata, tags, analysis)
├── radian:template:{id}      → string     (base64 PNG, print-ready template)
├── radian:theme              → 'dark'     (absent = light mode default)
├── radian:seeded             → 'true'     (set once after initial seed — never re-seeds)
└── radian:welcome-dismissed  → 'true'     (set when user dismisses welcome banner)
```

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript strict | Domain model complex enough to justify type safety |
| UI framework | React 19 + `useReducer` | Explicit state layer separation; no implicit DOM writes |
| Build | Vite + `@vitejs/plugin-react` | Zero-config, fast HMR |
| CSS | Open Props + vanilla CSS | Bespoke aesthetic; no utility-class constraints |
| API | `@anthropic-ai/sdk` (browser) | Personal tool; no server required |
| Storage | `localStorage` | No server dependency; metadata + URLs within limits |
| Edge detection | Vanilla Canvas API | ~200 lines; spike showed sufficient for digital images |
| Tests | Vitest + React Testing Library | Contract tests; jsdom environment |

No backend. No database. The entire application runs in the browser.

---

## Classification Taxonomy

Analysis uses a practitioner-designed tag vocabulary across five dimensions:

| Dimension | Example values |
|---|---|
| Construction method | compass-and-straightedge · polygonal-method · grid-based |
| Tradition | Islamic-geometric · Celtic-Insular · Gothic-Medieval · Hindu-Vedic |
| Pattern type | rosette · star-polygon · tessellation · mandala · knot-interlace |
| Symmetry | 3-fold · 6-fold · 8-fold · 12-fold |
| Proportion | golden-ratio · √2 · √3 · vesica-piscis |

Full vocabulary in `src/data.ts`. Classifications are presented as **suggested
tags** with confidence levels — the practitioner reviews and accepts, edits,
or dismisses each one.

---

## Spike Results

Pattern analysis uses `SYSTEM_PROMPT` in `api.ts`, iterated from a pre-build
validation spike against a ground-truth test set of 10 images.

| Field | Accuracy | Notes |
|---|---|---|
| patternType | 77.5% | Strong — above 70% threshold |
| constructionMethod | 60.0% | Acceptable |
| tradition | 50.0% | Active prompt iteration |
| symmetry | 47.5% | Active prompt iteration |
| proportion | 42.5% | Active prompt iteration |
| **Overall** | **55.5%** | **Presented as suggestions, not authority** |

Full methodology and iteration history in `docs/spike-results.md`.

---

## Getting Started

```bash
git clone https://github.com/fitore/radian-geometric-art
cd radian-geometric-art
npm install

# Optional: add Anthropic API key for Pattern Analysis
cp .env.example .env
# VITE_ANTHROPIC_API_KEY=sk-ant-...

npm run dev        # http://localhost:5173
npm run build      # production → dist/
npm test           # run contract test suite (vitest)
npm run test:watch # watch mode
```

Without an API key, Radian runs fully as a collection tool. Add a key in the
Settings panel to unlock analysis. API key is never written to localStorage.

---

## Tests

Five contract test suites, each documenting non-negotiable behaviour:

| File | What it guards |
|---|---|
| `src/__tests__/data.test.ts` | localStorage schema contract, index ordering, v1→v2 migration |
| `src/__tests__/gallery.test.ts` | Filter (OR within group, AND across groups) and sort logic |
| `src/__tests__/EntryForm.test.tsx` | `populateForm` contract — single path from pipeline to form UI |
| `src/__tests__/AnalysisPanel.test.tsx` | Accept/dismiss boundary — no direct localStorage write |
| `src/__tests__/api.test.ts` | API key guard, response parsing, retry, cost accumulation |

---

## Docs

- `docs/prd.md` — Full product spec and feature definitions
- `docs/spike-results.md` — Classification accuracy, prompt iterations
- `docs/adr/` — Architecture Decision Records
- `CLAUDE.md` — Coding agent harness context
- `architect.md` — Thinking partner context for planning sessions
- `mvp/` — v1 single-file reference (preserved)
- `spike/` — Original spike artefacts (preserved)

---

## Practitioner References

The classification taxonomy and construction sequence logic draw from:
Eric Broug · Jay Bonner · Daud Sutton · Keith Critchlow · George Bain ·
Adam Williamson · Clarissa Grandi · Samira Mian · Grünbaum & Shephard
(Tilings and Patterns) · Conway, Burgiel & Goodman-Strauss (The Symmetries
of Things).
