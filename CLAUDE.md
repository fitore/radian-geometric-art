# CLAUDE.md — Radian

> Coding agent context. Read fully before touching any code.
> This file governs — it does not describe. Constraints here are not suggestions.
> For architecture decisions and feature intent, read `docs/prd.md`.

---

## What This Codebase Is

A sacred geometry research and practice companion. The user is a practitioner
who draws by hand with compass and straightedge. They are visually literate and
precise. **A wrong classification is worse than no classification.**

Radian is also a demonstration of disciplined AI-assisted development. The
harness structure itself is part of what this project teaches.

---

## Stack

| Layer | Choice |
|---|---|
| Language | TypeScript strict mode — no `any` without a justifying comment |
| Build | Vite |
| Framework | React — functional components and hooks only |
| CSS | Open Props + vanilla CSS modules in `src/styles/` |
| API | `@anthropic-ai/sdk` browser client (`dangerouslyAllowBrowser: true`) |
| Storage | `localStorage` only — no server, no database |
| Edge detection | Vanilla Canvas API — no OpenCV.js unless spike evidence requires it |
| Vectorisation | `imagetracerjs` — raster to SVG paths, browser-native, MIT |
| Spatial index | `kd-tree-javascript` — nearest-neighbour for symmetry detection, MIT |

---

## The Architectural Contract

### `populateForm(entry)` in `form.ts`

The single integration point for all automated pipelines. Every feature that
produces entry data — AI analysis, future search results, image upload — calls
`populateForm(entry)` to pre-fill the form. Nothing writes to the UI directly.
Nothing writes to localStorage without going through `saveCurrentEntry()`.

**If you are writing code that saves an entry without routing through
`populateForm` → `saveCurrentEntry`, stop. That is a contract violation.**

**Known callers — do not trace beyond these:**
- `form.ts` — definition
- `panels.ts` — analysis results
- `app.ts` — edit action

Any new caller must be added to this list before the task is done.

### `types.ts` is the domain contract

`Entry`, `Analysis`, `TemplateRef`, `AppState` are defined once in `types.ts`.
All modules consume these types. Do not redefine them locally. Do not add
fields to `Entry` without updating the canonical type and the migration in
`data.ts`.

**AppState ground truth:** Read `src/types.ts` and report the exact current
`AppState` shape before any task that touches navigation, view state, or
session state. Do not infer shape from usage in other files. If a view
navigation field already exists, extend it — do not add a parallel field.

### `TAG_VOCABULARY` in `data.ts`

All tag values come from here. Do not hardcode tag strings in any other file.
Do not invent tags. When tag extensions are needed, add them to `TAG_VOCABULARY`
in `data.ts` first, then use them.

---

## Module Boundaries

```
src/
├── app.ts / App.tsx     ← Entry point. State (useReducer), event wiring. No business logic.
├── types.ts             ← Domain types only. No imports from other src modules.
├── utils.ts             ← Pure functions. No DOM, no API, no storage.
├── data.ts              ← TAG_VOCABULARY, SEED_ENTRIES, localStorage CRUD,
│                           schema migration, seedInitialEntries().
│                           No DOM access. Does not know the UI exists.
├── gallery.ts           ← filterEntries, sortEntries, renderGallery, card HTML.
├── form.ts              ← populateForm, clearForm, readFormState, saveCurrentEntry.
│                           Owns the form DOM. The only path to saving entries.
├── api.ts               ← callClaude(), SYSTEM_PROMPT, PROMPT_VERSION, cost tracking.
│                           No DOM access. Returns data; does not render.
├── canvas.ts            ← Sobel edge-detection pipeline. No API calls, no storage.
├── symmetry.ts          ← Client-side symmetry detection pipeline.
│                           Exports: extractPoints, detectSymmetry, mapToTag.
│                           No DOM access. No API calls. No storage writes.
├── components/
│   └── FundamentalDomainView.tsx  ← Wedge overlay, tile extraction, tessellation.
│                                     Reads SymmetryResult. No storage writes.
├── panels.ts            ← Settings, Analysis, Template panels. Renders results only.
│                           Calls populateForm — does not save directly.
└── styles/              ← CSS only. tokens.css owns all design tokens.
```

**Boundary rules:**
- `data.ts`, `api.ts`, and `symmetry.ts` have no DOM access.
- `utils.ts` has no imports from other `src/` modules.
- `types.ts` has no imports from other `src/` modules.
- `symmetry.ts` has no API calls and no localStorage writes.
- `FundamentalDomainView.tsx` has no storage writes — visualisation only.
- New modules must map to this structure with a comment at the top explaining
  their role and why they are not covered by an existing module.

---

## The Symmetry Detection Layer

### `symmetry.ts` is mathematics, not UI

`symmetry.ts` implements the client-side fold detection pipeline:
vectorisation (imagetracerjs) → point normalisation → KD-tree nearest-
neighbour scoring → symmetry group classification → TAG_VOCABULARY mapping.

It is pure computation. No DOM. No API. No storage.

The raw `SymmetryResult` (including `fundamentalDomain`) is held in
component state after detection runs. It is never persisted to localStorage.

### `FundamentalDomainView.tsx` is visualisation, not detection

The wedge overlay, extracted tile, and tessellation preview all live in
`FundamentalDomainView.tsx`. Do not add rendering logic to `symmetry.ts`.

### SymmetryResult maps to Analysis

Detection output populates `Analysis.classifications.symmetry` via
`populateForm` — the same path as Claude Vision analysis. The
`promptVersion` field uses `'symmetry-v1'` (not a Claude prompt version)
to distinguish client-side results from model results.

---



### `SYSTEM_PROMPT` is domain-authored

The system prompt in `api.ts` encodes practitioner knowledge about sacred
geometry: tradition diagnostics, construction method heuristics, confidence
calibration. **Do not rewrite or "improve" the system prompt without explicit
instruction.** It is not boilerplate — it is the load-bearing artifact for
the Understand feature.

When the prompt changes: increment `PROMPT_VERSION`. Every stored `Analysis`
carries `promptVersion`. When versions diverge, the UI surfaces a
"re-analyse available" indicator.

### API call shape

```typescript
// api.ts exports one dispatcher — do not add feature-specific API functions
// to other modules
callClaude(capability: 'analyze' | 'search' | 'construct', payload: unknown)
```

API calls are user-triggered only. No background calls, no auto-analysis on
upload. The user decides when to invoke Claude.

### Error handling contract

- Network failure: retry once after 2s, then surface error with retry button.
- Malformed JSON: extract partial data, show what succeeded, flag what failed.
  Do not silently discard partial results.
- Missing API key: block all API features, surface settings prompt.
  Do not make calls without a key.

---

## Storage Contract

```
localStorage
├── radian:index              → string[]     (ordered entry IDs)
├── radian:entry:{id}         → Entry        (metadata, tags, analysis)
├── radian:template:{id}      → string       (base64 PNG data URL)
├── radian:theme              → 'dark'       (absent = light mode default)
├── radian:seeded             → 'true'       (set once after initial seed — never re-seed)
└── radian:welcome-dismissed  → 'true'       (set when user dismisses welcome banner)
```

Key prefix is always `radian:`. Do not introduce new key patterns.
`id` is set once by `crypto.randomUUID()` at creation. Never reassigned.
`createdAt` is set once at creation. Never mutated.

**Seeding rules:**
- `seedInitialEntries()` in `data.ts` runs once on app init in `App.tsx`
- If `radian:seeded` exists, seeding is skipped — regardless of index length
- Seeded entries use hardcoded UUID string literals — not `crypto.randomUUID()`
  at runtime, to ensure stability across hot reloads
- Seeded entries have `createdAt: '2024-01-01T00:00:00.000Z'` so they
  sort below user-created entries
- `SEED_ENTRIES` in `data.ts` is the source — `PlaceholderEntry` type
  does not exist

---

## Theme and Visual Constraints

**Default is light mode.** The `<html>` element carries no `data-theme`
attribute by default. Dark mode activates on `data-theme="dark"`. The toggle
writes `radian:theme` to localStorage. Do not invert this default.

All design tokens live in `src/styles/tokens.css`. Do not hardcode colour
values in component CSS. Do not introduce new CSS variables without adding
them to `tokens.css` first.

Type stack: Cinzel (headings) · Cormorant Garamond (body) · JetBrains Mono
(data/numbers). Do not introduce new fonts.

---

## Constraints — Non-Negotiable

1. **`populateForm(entry)` is the single write path to the form UI.**
2. **`TAG_VOCABULARY` in `data.ts` is the single source of tag values.**
3. **`SYSTEM_PROMPT` is domain-authored. Do not modify without instruction.**
4. **`types.ts` is the domain contract. New `Entry` fields go here first.**
5. **Default theme is light. `data-theme="dark"` activates dark mode.**
6. **No new dependencies without a documented decision.** Flag the trade-off
   and wait for instruction before adding any package.
7. **API calls are user-triggered only.** No background or automatic calls.
8. **`data.ts`, `api.ts`, and `symmetry.ts` have no DOM access.**
9. **`SymmetryResult` is transient.** Never write it to localStorage.
10. **Symmetry detection results are suggestions.** Never apply tags
    automatically — always route through `populateForm` for user review.

---

## Before Starting Any Task

1. Read this file.
2. Identify which modules your task touches — read only those modules.
3. Read `docs/prd.md` for the feature's intent and acceptance criteria.
4. If the task touches `types.ts`, `data.ts`, `TAG_VOCABULARY`, entity
   relationships, or `src/ontology.ts`, read `docs/ontology.md` first —
   it defines what every entity means and how they relate.
5. If the task touches `api.ts` or analysis output, read `docs/spike-results.md`.
6. If the task touches `symmetry.ts` or `FundamentalDomainView`, read
   `architect.md` — it contains the mathematics domain knowledge
   (symmetry groups, proportion systems, tradition geometric signatures)
   needed to implement these features correctly.
7. Check `docs/adr/` for any prior decision affecting your task.

**Token discipline — apply these rules on every task:**

- **Bound discovery with grep before reading.** If you need to find where
  something is used, run `grep -r "term" src/ --include="*.tsx" --include="*.ts" -l`
  first. Read only the files grep returns. Do not open files speculatively.
- **Read only what the task touches.** If the task is in `symmetry.ts`,
  do not open `gallery.ts` or `panels.ts` unless grep shows they are
  directly relevant.
- **Read-and-report before writing.** For any task that changes shared
  contracts (AppState, Entry, populateForm callers), read the relevant
  type or function first and report what you find. Do not assume shape
  from usage.
- **Targeted edits over full rewrites.** Change the minimum lines needed.
  Do not reformat, reorganise, or "clean up" code outside the task scope.
- **Do not re-read files you have already read in this session.**

## Before Calling a Task Done

- Does `populateForm` remain the single form integration point?
- Do all tag values come from `TAG_VOCABULARY`?
- Is `SYSTEM_PROMPT` unchanged (or is `PROMPT_VERSION` incremented)?
- Do new types flow through `types.ts`?
- Does new CSS use existing tokens from `tokens.css`?
- Is the default theme still light?
- Is `SymmetryResult` held in component state only (not persisted)?

---

## Progressive Disclosure

- `docs/prd.md` — Feature definitions, entry schema, acceptance criteria
- `docs/ontology.md` — **Ontology layer.** What every entity means, how
  they relate, state machines, governed mutations, and how ontology concepts
  map to TypeScript code. Read before any task that touches `types.ts`,
  `data.ts`, `TAG_VOCABULARY`, entity relationships, or `src/ontology.ts`.
  The governing frame: `types.ts` defines shape; `docs/ontology.md` defines
  meaning.
- `docs/spike-results.md` — Vision accuracy results, extraction path decision
- `docs/adr/` — Architecture Decision Records
- `architect.md` — Domain mathematics and symmetry pipeline spec.
  Read before working on `symmetry.ts` or `FundamentalDomainView.tsx`.
- `mvp/` — v1 single-file reference (read only)
- `spike/` — Original spike artefacts (read only)