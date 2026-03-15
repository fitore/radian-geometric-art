# PRD: Radian
## *Where Art and Mathematics Unite*
**For Claude Code — Read this fully before writing any code.**

---

## 1. What We're Building

A personal, desktop-browser web app for collecting, tagging, and browsing sacred geometry inspiration and templates. The app is called **Radian** — named after the fundamental unit of angular measure that underlies all circular geometry, and everything in sacred geometry lives in radians.

Think of it as a practitioner's sketchbook — not a generic image bookmarker, but a tool built around the specific vocabulary and practice of drawing sacred geometry by hand.

Primary reference artists: **Clarissa Grandi** (Artful Maths) and **Adam Williamson** (Art of Islamic Pattern). The tag vocabulary and design decisions are drawn directly from how these artists and their communities describe and categorize their work.

---

## 2. Core User Story

> "When I encounter a piece of sacred geometry that moves me — in a book, on a website, in a photo I've taken — I want to save it with just enough structured metadata that future-me can find it and know what to do with it when I sit down to draw."

Two primary use moments:
1. **Capture** — I just found something. Add it fast, with minimal friction.
2. **Prepare to draw** — I'm sitting down to practice. Let me filter my collection to find something right for today.

---

## 3. Tech Stack & Constraints

- **Single HTML file** — everything (HTML, CSS, JS) in one `index.html`. No build step, no server, no framework.
- **Vanilla JS only** — no React, no npm, no dependencies.
- **localStorage** for persistence — simple key/value, sufficient for a personal collection.
- **Desktop browser only** — no mobile responsiveness required.
- **Must include an Export JSON button** from day one — insurance against data loss.

---

## 4. Data Model

Each collection entry is a JSON object:

```json
{
  "id": "uuid-v4",
  "createdAt": "ISO-8601",
  "title": "string (required)",
  "imageUrl": "string (URL or base64 data URI)",
  "sourceUrl": "string (optional link to origin)",
  "status": "want-to-try | attempted | done",
  "tags": {
    "constructionMethod": ["compass-and-straightedge"],
    "tradition": ["Islamic-geometric", "Persian"],
    "patternType": ["rosette", "tessellation"],
    "symmetry": ["10-fold"],
    "proportion": ["golden-ratio"]
  },
  "difficulty": "beginner | intermediate | advanced",
  "description": "string (optional, about the piece)",
  "attemptNotes": "string (optional, personal practice log — separate from description)"
}
```

**Important:** `tags` is an object with five named arrays, not a flat array. This preserves the group structure at the data level.

Storage key pattern: `radian:entry:{id}` for entries, `radian:index` for the list of all IDs.

---

## 5. Tag Vocabulary (Hardcoded)

These are the preset tags. The user can select multiples within each group. Custom tags are not supported in v1.

### Construction Method
`compass-and-straightedge` · `ruler-only` · `freehand` · `polygonal-method` · `grid-based` · `string-art-parabolic`

### Tradition
`Islamic-geometric` · `Moorish-Andalusian` · `Persian-Iranian` · `Moroccan-Maghrebi` · `Ottoman` · `Gothic-Medieval` · `Hindu-Vedic` · `Celtic-Insular` · `Nature-derived`

### Pattern Type
`rosette` · `star-polygon` · `tessellation` · `arabesque-biomorph` · `mandala` · `knot-interlace` · `spiral` · `parabolic-curve` · `epicycloid` · `curve-of-pursuit` · `Flower-of-Life-lineage`

### Symmetry
`3-fold` · `4-fold` · `5-fold` · `6-fold` · `7-fold` · `8-fold` · `10-fold` · `12-fold` · `16-fold`

### Key Proportion *(optional)*
`golden-ratio` · `√2` · `√3` · `vesica-piscis` · `fibonacci` · `pi-based`

---

## 6. Features — MoSCoW

### Must-Have (v1 ships with these)

**Add Entry**
- Image input: paste a URL *or* upload a local file (stored as base64 data URI)
- Title field (required — only required field)
- All five tag groups as multi-select checkboxes (grouped and labelled, matching the vocabulary above)
- Status selector: `want-to-try` / `attempted` / `done`
- Difficulty selector: `beginner` / `intermediate` / `advanced`
- Source URL field (optional)
- Description field (optional freeform textarea)
- Attempt Notes field (optional freeform textarea — visually distinct from description, labelled clearly as "your practice log")
- Save button — saves to localStorage, returns to gallery

**Gallery View**
- CSS grid of cards, large thumbnails (images are the primary content)
- Each card shows: image, title, status indicator (subtle colored dot — not a text label), difficulty badge, tradition tag(s)
- Click card → opens Edit/Detail view (same form as Add, pre-populated)

**Filter Panel** (sidebar or top bar)
- Filter by status (checkbox: want-to-try / attempted / done)
- Filter by construction method (multi-select)
- Filter by tradition (multi-select)
- Filter by pattern type (multi-select)
- Filter by symmetry (multi-select)
- Filter by difficulty (multi-select)
- Filters are AND across groups, OR within a group
- "Clear all filters" button

**Export**
- "Export JSON" button — downloads the full collection as a single JSON file
- "Import JSON" button — reads a previously exported file and merges into current collection (replace-by-id)

### Should-Have (include if straightforward, skip if costly)
- Search by title (simple substring match, live-filtering)
- Entry count shown in gallery header ("24 pieces · 6 filtered")
- Sort options: newest first / oldest first / title A–Z

### Won't-Have (explicitly out of scope for v1)
- User accounts or authentication
- Cloud sync or sharing
- Claude API annotation (planned for v2 — see Section 8)
- Generative geometry tools
- Mobile layout

---

## 7. UI Design Direction

**Aesthetic:** Dark background, generous whitespace, the geometry is the star. Think sketchbook-meets-archive, not productivity tool. No rounded-pill buttons, no bright primary colors.

**Palette (suggested):**
- Background: `#0f0f0f` or `#1a1a1a`
- Card surface: `#1e1e1e` / `#242424`
- Accent: warm gold `#c9a84c` or `#b8974a` — used sparingly for active states and the status "done" indicator
- Status colors: want-to-try = `#4a7fb5` (blue), attempted = `#c9a84c` (gold), done = `#5a8a5a` (muted green)
- Text: `#e8e0d0` (warm off-white)
- Tag chips: dark pill with light text, no bright backgrounds

**Gallery:**
- Cards should be image-dominant — minimum 200px image height, title beneath
- Status dot: small (8px) colored circle in the top-right corner of the card image
- Difficulty badge: small text label bottom-left of image (`beginner` / `intermediate` / `advanced`)

**Add/Edit Form:**
- Entry-first layout: this is the most-used screen. Keep it clean.
- Tag groups rendered as inline checkbox groups with a group label
- Description and Attempt Notes are visually separated — use a subtle divider or different background tint
- "Attempt Notes" label should include a sub-label: *"Your practice log — separate from description"*

**Navigation:**
- Two views only: Gallery and Add/Edit. No tabs, no sidebar nav.
- "+ Add" button always visible (top right of gallery)
- Back arrow from Add/Edit returns to gallery without saving

---

## 8. Planned v2 Feature (Do Not Build Now — Design for It)

The next version will add a **Claude API annotation** feature:
- User pastes an image URL or uploads a file on the Add Entry form
- A button "✦ Annotate with Claude" sends the image to the Anthropic API
- Claude describes the construction method, suggests tradition, pattern type, symmetry, and difficulty
- Response pre-fills the form — user reviews and adjusts before saving

**What this means for v1 architecture:**
- Keep the form logic in a single `populateForm(entry)` function so it can be called both on edit-load AND from an API response
- Image handling (URL vs base64) should be a reusable utility function
- Don't couple the save action tightly to the form — make it easy to inject pre-filled values programmatically

---

## 9. File Structure

Single file: `index.html`

Internal structure (comment-delimited sections):
```
<!-- STYLES -->         CSS, all inline in <style> tag
<!-- DATA -->           TAG_VOCABULARY constant, storage utilities
<!-- GALLERY -->        renderGallery(), filterEntries(), card template
<!-- FORM -->           renderForm(), populateForm(), saveEntry()
<!-- APP -->            init(), routing (show/hide views), event listeners
```

---

## 10. localStorage Schema

```javascript
// Index of all entry IDs
localStorage.setItem('radian:index', JSON.stringify(['id1', 'id2', ...]));

// Individual entries
localStorage.setItem('radian:entry:id1', JSON.stringify({ ...entryObject }));

// Utility pattern to get all entries:
const ids = JSON.parse(localStorage.getItem('radian:index') || '[]');
const entries = ids.map(id => JSON.parse(localStorage.getItem(`radian:entry:${id}`)));
```

Import merges by ID (existing entries with same ID are overwritten). A simple `crypto.randomUUID()` is fine for ID generation.

---

## 11. Acceptance Criteria

Before considering v1 done:

- [ ] Can add an entry with an image URL and a title in under 60 seconds
- [ ] Can add an entry with a local file upload
- [ ] Gallery shows all entries in a responsive grid
- [ ] Filtering by any combination of tag groups works correctly (AND across groups)
- [ ] Status dot is visible on every card without cluttering the image
- [ ] Clicking a card opens the edit form pre-populated with all saved values
- [ ] Export produces valid JSON that can be re-imported
- [ ] Import merges correctly without duplicating entries
- [ ] Entries persist across browser refresh
- [ ] `populateForm()` is a single function callable with any entry object (for future API integration)

---

## 12. First Prompt to Use

After reading this PRD, start with:

> "Build **Radian** — a sacred geometry collection app — as specified in the PRD. The app title is 'Radian' with the subtitle 'Where Art and Mathematics Unite'. Start with the full `index.html` — styles, data layer (TAG_VOCABULARY + localStorage utilities), gallery view, and add/edit form. Use the exact tag vocabulary from Section 5. Implement the data model from Section 4. Match the dark aesthetic from Section 7. Do not add any features not listed in Section 6 Must-Haves."

Then iterate:
- Session 2: Filtering + search
- Session 3: Polish (transitions, empty states, error handling)
- Session 4: Claude API annotation (v2)
