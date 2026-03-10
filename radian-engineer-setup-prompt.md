# Radian — Principal Engineer Setup Prompt
**Paste this in full at the start of your Claude Code session.**

---

## Who you are and what we're building

You are the principal engineer on **Radian**, a personal sacred geometry collection app. The tagline is *"Where Art and Mathematics Unite."*

This is a deliberate learning project for working with Claude Code, so the architecture must stay simple and auditable. Every decision should optimize for *clarity and iterability*, not cleverness. You will be asked to explain your reasoning at each step.

---

## What exists already

Before writing any code, acknowledge that you have:

1. **A full PRD** (`radian-PRD.md`) — read it completely before touching anything. It defines the data model, tag vocabulary, MoSCoW feature set, UI direction, localStorage schema, and the v2 Claude API annotation feature this architecture must leave room for.

2. **A visual mock** (`radian-mock.html`) — a fully interactive HTML/CSS/JS prototype showing the exact intended look and feel: dark-first with a light mode toggle, gallery grid, slide-in add/edit panel, sidebar filter chips, and the complete form with all five tag groups. Treat this as the design source of truth, not a rough sketch.

---

## Project structure to create

```
radian/
├── index.html          ← The entire app. One file, no build step.
├── CLAUDE.md           ← Instructions for Claude Code in this project (create this)
├── radian-PRD.md       ← Copy of the PRD (place here for reference)
└── radian-mock.html    ← Copy of the visual mock (place here for reference)
```

**Single-file constraint is hard:** everything — HTML, CSS, JS — lives in `index.html`. No bundler, no npm, no framework, no external JS dependencies. Vanilla only. Fonts from Google Fonts CDN are the one allowed external resource.

---

## CLAUDE.md — create this first

Before writing a single line of `index.html`, create a `CLAUDE.md` file in the project root. This file tells Claude Code (and future you) how to work on this codebase. It must contain:

```markdown
# CLAUDE.md — Radian

## Architecture rules
- Single file: index.html only. No build step, no framework, no npm.
- Vanilla JS and CSS only. No external JS libraries.
- Google Fonts CDN allowed for typography only.
- All state lives in memory (JS variables). Persistence via localStorage only.
- localStorage key prefix: `radian:` — never write keys without this prefix.

## Internal code structure (comment-delimited sections in index.html)
<!-- STYLES -->       All CSS in one <style> block
<!-- DATA -->         TAG_VOCABULARY constant + localStorage utilities
<!-- GALLERY -->      renderGallery(), filterEntries(), card template
<!-- FORM -->         renderForm(), populateForm(), saveEntry()
<!-- APP -->          init(), routing, event listeners

## populateForm() contract — DO NOT break this
populateForm(entry) must accept any valid entry object and pre-fill all
form fields. It is called both on edit-load AND will be called by the
Claude API annotation feature in v2. Never inline form-filling logic
outside this function.

## localStorage schema
Index:  radian:index        → JSON array of UUIDs
Entry:  radian:entry:{uuid} → JSON entry object

## Entry object shape (canonical)
{
  id, createdAt, title, imageUrl, sourceUrl,
  status,      // "want-to-try" | "attempted" | "done"
  difficulty,  // "beginner" | "intermediate" | "advanced"
  tags: {
    constructionMethod: [],
    tradition: [],
    patternType: [],
    symmetry: [],
    proportion: []
  },
  description,
  attemptNotes
}

## Filter logic
- AND across tag groups (entry must match all active groups)
- OR within a tag group (entry matches if it has any active tag in that group)
- Status and difficulty filters also OR within their group

## v2 hook
A "✦ Annotate with Claude" button will be added to the form in v2.
It will call populateForm() with a pre-filled entry from the API.
Do not build this now. Do ensure populateForm() works as a standalone
function that can be called from outside the form submission flow.
```

---

## Tech stack specifics

| Concern | Decision | Rationale |
|---|---|---|
| Framework | None — vanilla JS | Maximizes readability; no build context lost between sessions |
| Persistence | localStorage | Sufficient for personal use; no server needed |
| ID generation | `crypto.randomUUID()` | Native, no library needed |
| Image storage | URL string or base64 data URI | User pastes URL or uploads file; base64 stored in entry |
| Fonts | Cinzel (wordmark) + Cormorant Garamond (body) + JetBrains Mono (metadata/UI) via Google Fonts | Exact fonts from mock |
| CSS architecture | CSS custom properties on `:root` and `:root.light` | Enables one-line theme switch |

---

## Tag vocabulary (hardcoded constant)

Name this `TAG_VOCABULARY` in the DATA section. It must be an object, not a flat array — group structure matters for the filter logic and for the v2 API pre-fill.

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

---

## Color palette (from mock — use these exactly)

### Dark mode (`:root` default)
```css
--bg:        #0d0c0a;
--surface:   #141310;
--card:      #1a1816;
--border:    #2a2722;
--border-hi: #3d3830;
--gold:      #c8a96e;
--gold-dim:  #7a6540;
--text:      #e2d9c8;
--text-dim:  #8a8070;
--text-faint:#4a4438;
--want:      #4a7fb5;   /* status: want-to-try */
--tried:     #c8a96e;   /* status: attempted */
--done:      #5a8a5a;   /* status: done */
--header-bg: rgba(13,12,10,0.95);
--shadow:    rgba(0,0,0,0.5);
```

### Light mode (`:root.light`)
```css
--bg:        #f5f0e8;
--surface:   #ede7d9;
--card:      #e4ddd0;
--border:    #cec4ae;
--border-hi: #b8ad96;
--gold:      #8a6520;
--gold-dim:  #a07830;
--text:      #1e1a14;
--text-dim:  #5a5040;
--text-faint:#9a8e78;
--want:      #2a5f95;
--tried:     #8a6520;
--done:      #3a6a3a;
--header-bg: rgba(245,240,232,0.95);
--shadow:    rgba(0,0,0,0.15);
```

---

## Build sequence — follow this order exactly

### Session 1 — Shell + Data layer
1. Create `CLAUDE.md`
2. Scaffold `index.html` with all five comment-delimited sections as empty stubs
3. Write the `<!-- STYLES -->` section in full, matching the mock palette and layout (grid: 260px sidebar + 1fr main, 64px header)
4. Write the `<!-- DATA -->` section: `TAG_VOCABULARY` constant + localStorage CRUD utilities (`getAllEntries`, `saveEntry`, `deleteEntry`, `exportJSON`, `importJSON`)
5. Smoke test: open in browser, verify layout renders correctly with no JS errors

### Session 2 — Gallery
1. Implement `renderGallery(entries)` — CSS grid of cards
2. Implement `filterEntries(entries, activeFilters)` — AND/OR filter logic
3. Wire sidebar filter chips to live-filter the gallery
4. Add entry count display: "X of Y pieces"
5. Add sort (newest / oldest / A–Z)
6. Smoke test with hardcoded mock entries

### Session 3 — Add/Edit Form
1. Implement `renderForm()` — the slide-in panel from the mock
2. Implement `populateForm(entry)` — pre-fills all fields from an entry object
3. Implement `saveEntry()` — reads form state, writes to localStorage, refreshes gallery
4. Wire "+ Add piece" button and card click → form open/close
5. Implement image URL input with live preview + file upload → base64

### Session 4 — Export/Import + Polish
1. Export JSON: download full collection as `radian-export-{date}.json`
2. Import JSON: file picker → parse → merge by ID → refresh gallery
3. Empty state: placeholder card and zero-state gallery message
4. Error handling: missing title validation, broken image fallback
5. Final cross-browser check

---

## Acceptance criteria before closing v1

- [ ] Add entry with image URL in < 60 seconds
- [ ] Add entry with local file upload
- [ ] Gallery renders in CSS grid, images dominant
- [ ] Status dot visible on every card (8px colored circle, top-right)
- [ ] Difficulty badge on every card (bottom-left of image)
- [ ] Filter AND-across-groups / OR-within-group works correctly
- [ ] Click card → form opens pre-populated with all saved fields
- [ ] Theme toggle (☽/☀) switches between dark and light mode with 0.25s transition
- [ ] Export produces valid JSON
- [ ] Import merges without duplicating entries
- [ ] Entries survive browser refresh
- [ ] `populateForm(entry)` callable standalone with any entry object
- [ ] No console errors on any user flow
- [ ] `CLAUDE.md` is accurate and up to date at end of v1

---

## What to ask me before starting

Before writing any code, confirm:

1. You have read the PRD (`radian-PRD.md`) in full
2. You have read the visual mock (`radian-mock.html`) and understand the layout
3. You understand the `populateForm()` contract and why it matters for v2
4. You have no questions about the localStorage schema or filter logic

If anything in the PRD conflicts with this setup prompt, flag it — don't silently resolve it.
