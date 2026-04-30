# Radian Ontology

> The authoritative definition of every concept in Radian — what things mean, how they relate, and who governs them.
> **This file defines meaning. `types.ts` defines shape. They must agree.**
>
> Read before any task that touches: `types.ts`, `data.ts`, `src/ontology.ts` (Phase 2+), or any query that spans relationships between entities.

---

## Why This File Exists

`types.ts` + `TAG_VOCABULARY` describe the **schema**: what fields exist, what types they are. This file describes the **ontology**: what a Tradition *is*, what states an Entry can occupy, who is authorised to move it between states, and how these entities relate to each other.

Following Uschold's distinction: a schema uses a closed-world assumption ("if it is not in the schema, it does not exist"). An ontology uses an open-world assumption ("new concepts can be added without breaking existing ones"). This file is the open-world layer.

Every UI element, filter, API call, and AI classification should trace back to a concept defined here.

---

## Systems of Record

Before naming entities, name ownership. Following Kleppmann: every datastore is either a **system of record** (the authoritative source — cannot be rebuilt from another source) or a **derived view** (can be rebuilt by replaying the system of record).

| Entity | System of Record | Storage | Rebuild Strategy |
|---|---|---|---|
| `Entry` | `localStorage` (per device) | `radian:entry:{id}` | Backup/import JSON |
| `Tradition` | This ontology file → `TAG_VOCABULARY` in `data.ts` | Code | Rebuild from `data.ts` |
| `ConstructionMethod` | This ontology file → `TAG_VOCABULARY` in `data.ts` | Code | Rebuild from `data.ts` |
| `PatternType` | This ontology file → `TAG_VOCABULARY` in `data.ts` | Code | Rebuild from `data.ts` |
| `SymmetryGroup` | This ontology file → `TAG_VOCABULARY` in `data.ts` | Code | Rebuild from `data.ts` |
| `ProportionSystem` | This ontology file → `TAG_VOCABULARY` in `data.ts` | Code | Rebuild from `data.ts` |
| `Analysis` | Derived — from Entry + Claude model output | Embedded in `Entry` | Re-run `AnalyzeEntry` action |

**Implication:** vocabulary objects (Tradition, ConstructionMethod, etc.) have their system of record in code — the ontology file governs meaning, `data.ts` governs the string identifiers. `Entry` is the only entity with a system of record in localStorage. `Analysis` is derived and can be regenerated; it is not the source of truth.

---

## Object Types

### `Entry`

**What it is:** A geometric pattern that a practitioner has saved to their collection. It represents a single work of sacred geometry — either as inspiration the practitioner intends to study and reproduce, or as a record of their own attempt.

**Status:** `active`

**System of record:** `localStorage`

**Properties:**

| Property | Type | Required | Immutable | Constraints |
|---|---|---|---|---|
| `id` | UUID string | yes | yes | Set once at creation via `crypto.randomUUID()` |
| `createdAt` | ISO 8601 string | yes | yes | Set once at creation |
| `schemaVersion` | literal `2` | yes | yes | Migration is handled in `data.ts` |
| `title` | string | yes | no | Non-empty |
| `imageUrl` | string | yes | no | URL or base64 data URI |
| `sourceUrl` | string | no | no | URL of origin (attribution) |
| `status` | `Status` enum | yes | no | State machine governs transitions (see below) |
| `difficulty` | `Difficulty` enum | yes | no | `beginner` \| `intermediate` \| `advanced` |
| `tags` | `Tags` object | yes | no | All values must resolve to ontology vocabulary |
| `description` | string | no | no | Free text — practitioner's own notes |
| `attemptNotes` | string | no | no | Free text — notes on construction attempts |
| `analysis` | `Analysis` object | no | no | Derived — populated by `AnalyzeEntry` action only |
| `template` | `TemplateRef` object | no | no | Derived — populated by line extraction only |

**Status state machine:**

```
want-to-try ──→ attempted ──→ done
     ↑___________________________↑
          (regression allowed)
```

A practitioner can move backward: a pattern marked `done` can be revisited (set back to `attempted` if reattempted differently). Moving backward is allowed because practice is iterative — the state represents the practitioner's current relationship to the piece, not a one-way lifecycle.

**Display metadata:** Title (primary), status badge, difficulty badge, tradition tags, image thumbnail.

---

### `Tradition`

**What it is:** A named cultural lineage of geometric practice. A Tradition is not a style label — it is a historically grounded lineage with a geographic origin, a set of characteristic construction methods, and a relationship to specific mathematical proportions. Assigning a Tradition to an Entry is a classification claim about cultural provenance, not a visual similarity judgment.

**Status:** `active`

**System of record:** `TAG_VOCABULARY.tradition` in `data.ts` (identifiers) + this file (meanings)

**Properties:**

| Property | Type | Description |
|---|---|---|
| `id` | slug string | Stable identifier (e.g., `Islamic-geometric`) |
| `label` | string | Display name |
| `geographicOrigin` | string | Primary region of historical practice |
| `historicalPeriod` | string | Approximate span (e.g., "9th–17th century") |
| `characteristicMethods` | `ConstructionMethod[]` | Methods typical of this tradition |
| `characteristicPatterns` | `PatternType[]` | Pattern types typical of this tradition |
| `notes` | string | Practitioner context — what distinguishes this tradition |

**Defined instances:**

| id | label | Geographic Origin | Historical Period | Notes |
|---|---|---|---|---|
| `Islamic-geometric` | Islamic Geometric | Middle East, Central Asia, North Africa | 9th century–present | The broadest tradition umbrella. Characterised by compass-and-straightedge construction, star polygons, and interlocking tessellations. Root tradition for Moorish, Persian, Ottoman, and Moroccan sub-traditions. |
| `Moorish-Andalusian` | Moorish / Andalusian | Iberian Peninsula | 8th–15th century | Iberian expression of Islamic geometry. Alhambra is the canonical reference. Rich use of muqarnas and tile-based tessellations. |
| `Persian-Iranian` | Persian / Iranian | Iran, Central Asia | 9th–17th century | Iranian variant of Islamic geometry — tends toward more intricate star systems and the use of the girih tile method. |
| `Moroccan-Maghrebi` | Moroccan / Maghrebi | North Africa | 11th century–present | North African tradition with characteristic zellige tilework. Distinct colour palette and smaller repeat units. |
| `Ottoman` | Ottoman | Turkey, Balkans, Levant | 13th–19th century | Ottoman geometric tradition — distinct from Persian in proportioning systems. Muqarnas and geometric tile compositions. |
| `Gothic-Medieval` | Gothic / Medieval | Western Europe | 11th–15th century | European sacred geometry tradition. Characterised by pointed arches, rose windows, and Vesica Piscis-based proportioning. |
| `Hindu-Vedic` | Hindu / Vedic | Indian subcontinent | Ancient–present | Includes yantra geometry, kolam, rangoli. Governed by Vastu Shastra proportioning. Mandala forms are central. |
| `Celtic-Insular` | Celtic / Insular | British Isles, Ireland | 5th–12th century | Characterised by interlace knotwork, spiral forms, and the Book of Kells lineage. Constructed via ruler-only grid methods. |
| `Nature-derived` | Nature-derived | Universal | All periods | Patterns derived from natural forms: phyllotaxis spirals, Voronoi cells, radiolarian geometry. Fibonacci and golden ratio proportions. |
| `syncretic` | Syncretic | Cross-cultural | Contemporary | Patterns that intentionally blend multiple traditions. Not a default — requires evidence of deliberate synthesis. |
| `Contemporary-Mathematical` | Contemporary Mathematical | Global | 20th century–present | Patterns originating from mathematical art, computational geometry, or recreational mathematics. Includes work by Escher, Penrose, and mathematical artists. |

**Governance note:** Adding a new Tradition requires: (1) updating this ontology file, (2) adding the identifier to `TAG_VOCABULARY.tradition` in `data.ts`, (3) classifying the change. Adding a new value is **backward compatible**. Removing or renaming an existing value is **breaking** — it may invalidate existing `Entry.tags.tradition` values in localStorage.

---

### `ConstructionMethod`

**What it is:** A physical or procedural technique for constructing a geometric pattern. Methods are about *how* a practitioner draws — the tools and procedure — not about the resulting visual form. Two patterns can share the same construction method while looking entirely different, and the same visual pattern can often be produced by multiple methods.

**Status:** `active`

**System of record:** `TAG_VOCABULARY.constructionMethod` in `data.ts` + this file

**Defined instances:**

| id | label | Tools | Description |
|---|---|---|---|
| `compass-and-straightedge` | Compass and Straightedge | Compass, unmarked straightedge | The classical Euclidean method. All marks are compass arcs and straight lines only. The canonical method for Islamic and Gothic traditions. |
| `ruler-only` | Ruler Only | Marked ruler (measurements allowed) | Grid-based or measured construction. Allows measured distances. Used in Celtic knotwork and many folk geometric traditions. |
| `freehand` | Freehand | No tools or flexible curve tools | Drawn without geometric instruments. Includes free-form arabesque, biomorphic, and expressive geometric forms. |
| `polygonal-method` | Polygonal Method | Compass, ruler, polygon templates | Construction via regular polygons as base units. The girih tile method is a canonical example. |
| `grid-based` | Grid Based | Ruler, grid paper or digital grid | Construction on a regular grid (square, triangular, hexagonal). Celtic knotwork and Moorish zellige patterns often use this method. |
| `string-art-parabolic` | String Art / Parabolic | Nails, string, or drawn equivalents | Parabolic curves formed by straight-line envelopes. Associated with mathematical curve art. |

---

### `PatternType`

**What it is:** A geometric classification of a pattern's primary visual and mathematical form. PatternType answers "what kind of geometric object is this?" — distinct from Tradition (which answers "where does this come from?") and from SymmetryGroup (which answers "what symmetries does it exhibit?").

**Status:** `active`

**System of record:** `TAG_VOCABULARY.patternType` in `data.ts` + this file

**Defined instances:**

| id | label | Mathematical Family | Description |
|---|---|---|---|
| `rosette` | Rosette | Star polygon / radial | A radially symmetric decorative motif, typically based on n-fold star polygons. Common unit in Islamic geometric compositions. |
| `star-polygon` | Star Polygon | Stellated polygon | A polygon formed by connecting every k-th vertex of a regular n-gon. Notation: {n/k}. The building block of most Islamic geometric patterns. |
| `tessellation` | Tessellation | Plane tiling | A pattern that tiles the plane without gaps or overlaps. May be periodic, aperiodic, or semi-regular. |
| `arabesque-biomorph` | Arabesque / Biomorph | Curvilinear | Flowing, interlaced plant-derived or abstract curvilinear forms. Distinct from pure geometric forms — incorporates organic curvature. |
| `mandala` | Mandala | Radial symmetry | A geometric diagram with concentric radial structure, often used in meditation or ritual contexts. Distinct from rosette by its concentric compositional logic. |
| `knot-interlace` | Knot / Interlace | Knot theory / topology | Patterns of interlacing strands, often with consistent over-under weaving. Celtic knotwork is the primary example. |
| `spiral` | Spiral | Logarithmic / Archimedean | Patterns organised around a spiral growth law. Includes logarithmic spirals (Fibonacci / golden ratio), Archimedean spirals, and phyllotaxis patterns. |
| `parabolic-curve` | Parabolic Curve | Envelope of tangents | Straight-line envelope forming apparent curves. Associated with string art and mathematical curve construction. |
| `epicycloid` | Epicycloid | Roulette curve | Curves traced by a point on a circle rolling around another circle. Includes cardioid, nephroid, and higher-order forms. |
| `curve-of-pursuit` | Curve of Pursuit | Differential geometry | Pattern formed by curves traced by pursuers following targets in a regular polygon configuration. |
| `Flower-of-Life-lineage` | Flower of Life Lineage | Vesica Piscis / overlapping circles | Patterns derived from the overlapping-circles construction. Includes Seed of Life, Fruit of Life, Metatron's Cube. Widely found across traditions. |

---

### `SymmetryGroup`

**What it is:** A mathematical classification of a pattern's symmetry properties using the language of group theory. SymmetryGroup answers "what transformation invariances does this pattern exhibit?" This is a precision classification — it is mathematically determinable, not a matter of practitioner judgment.

**Status:** `active`

**System of record:** `TAG_VOCABULARY.symmetry` in `data.ts` + this file

**Note on notation:** Radian uses fold-count as the primary symmetry identifier (e.g., `6-fold`) rather than full crystallographic notation (e.g., C6v, p6m). This is intentional — the practitioner audience thinks in fold counts, not Schoenflies symbols. The full symmetry group (cyclic vs. dihedral, wallpaper group) is captured in the `notes` field below.

**Defined instances:**

| id | Fold Count | Full Symmetry | Has Bilateral | Common Traditions |
|---|---|---|---|---|
| `3-fold` | 3 | C3v (dihedral) | yes | Hindu-Vedic, Contemporary-Mathematical |
| `4-fold` | 4 | C4v (dihedral) | yes | Islamic-geometric, Gothic-Medieval |
| `5-fold` | 5 | C5v (dihedral) | yes | Islamic-geometric (difficult — not tile-able), Nature-derived |
| `6-fold` | 6 | C6v (dihedral) | yes | Islamic-geometric, Nature-derived, Celtic-Insular |
| `7-fold` | 7 | C7v (dihedral) | yes | Rare — appears in some Islamic patterns |
| `8-fold` | 8 | C8v (dihedral) | yes | Islamic-geometric, Ottoman |
| `10-fold` | 10 | C10v (dihedral) | yes | Islamic-geometric, Persian-Iranian |
| `12-fold` | 12 | C12v (dihedral) | yes | Islamic-geometric (high complexity patterns) |
| `16-fold` | 16 | C16v (dihedral) | yes | Rare — advanced Islamic geometric patterns |

**Governance note on 5-fold symmetry:** True 5-fold rotational symmetry cannot tile the Euclidean plane periodically (this is a theorem). Patterns described as "5-fold" are either rosettes (localised radial symmetry without tiling), Penrose tilings (aperiodic), or patterns that approximate 5-fold symmetry at the local level. This distinction matters for construction — a practitioner cannot construct a periodic tessellation with 5-fold symmetry using compass-and-straightedge; the geometry does not permit it.

---

### `ProportionSystem`

**What it is:** A mathematical proportioning principle embedded in a pattern's construction. Proportion Systems are about the *ratios* used to determine lengths, angles, and divisions — the invisible mathematical skeleton that underlies the visible geometry.

**Status:** `active`

**System of record:** `TAG_VOCABULARY.proportion` in `data.ts` + this file

**Defined instances:**

| id | label | Ratio / Value | Construction Origin | Common Traditions |
|---|---|---|---|---|
| `golden-ratio` | Golden Ratio | φ ≈ 1.618 | Arises naturally from regular pentagon construction | Nature-derived, Gothic-Medieval, Contemporary-Mathematical |
| `√2` | Root Two | √2 ≈ 1.414 | Diagonal of unit square | Islamic-geometric, Gothic-Medieval |
| `√3` | Root Three | √3 ≈ 1.732 | Height of equilateral triangle | Islamic-geometric, Celtic-Insular |
| `vesica-piscis` | Vesica Piscis | √3 : 1 length ratio | Intersection of two equal circles | Gothic-Medieval, Hindu-Vedic, Flower-of-Life-lineage |
| `fibonacci` | Fibonacci | Sequence approximating φ | Discrete approximation to golden ratio | Nature-derived, Contemporary-Mathematical |
| `pi-based` | Pi-based | π ≈ 3.14159 | Circle-squaring, arc-length proportions | Contemporary-Mathematical |

---

### `Analysis`

**What it is:** An AI-generated classification of an Entry, produced by sending the Entry's image to Claude Vision. An Analysis is **derived data** — it can be regenerated by re-running the `AnalyzeEntry` action. It is never the system of record; it is a classification suggestion that the practitioner accepts, modifies, or discards via `populateForm`.

**Status:** `active`

**System of record:** Derived — Entry + Claude model output. `promptVersion` records which prompt version produced this analysis.

**Properties:**

| Property | Type | Description |
|---|---|---|
| `constructionMethod` | `AnalysisField` | Identified construction method with confidence and rationale |
| `tradition` | `AnalysisField` | Identified tradition with confidence and rationale |
| `patternType` | `AnalysisField` | Identified pattern type with confidence and rationale |
| `symmetry` | `AnalysisField` | Identified symmetry with confidence and rationale |
| `proportion` | `ProportionField` | Detected proportions (may be multiple) with confidence and rationale |
| `description` | string | Free-text description of the pattern in practitioner vocabulary |
| `suggestedDifficulty` | `Difficulty` | Suggested difficulty for construction |
| `constructionNotes` | string | Practitioner-level notes on how to construct this pattern |
| `promptVersion` | string | Version identifier of the `SYSTEM_PROMPT` that produced this analysis |
| `analyzedAt` | ISO 8601 string | When this analysis was produced |

**Governance note:** `Analysis.constructionMethod.primary`, `Analysis.tradition.primary`, `Analysis.patternType.primary`, and `Analysis.symmetry.primary` must all resolve to values in the corresponding vocabulary (or be left empty). If the model returns an unrecognised value, that is a governance decision — either add the value to the vocabulary, map it to an existing value, or surface it to the practitioner as an unresolved classification.

---

## Link Types

Link types define named, typed relationships between object types. In the current implementation, links are materialised as arrays in `Entry.tags`. In the ontology layer (Phase 2+), links are traversable objects.

| Link Type | From | To | Cardinality | Storage | Description |
|---|---|---|---|---|---|
| `belongsToTradition` | Entry | Tradition | many-to-many | `Entry.tags.tradition[]` | Which cultural lineages this pattern draws from |
| `usesMethod` | Entry | ConstructionMethod | many-to-many | `Entry.tags.constructionMethod[]` | How this pattern is constructed |
| `classifiedAs` | Entry | PatternType | many-to-many | `Entry.tags.patternType[]` | What type of geometric pattern this is |
| `exhibitsSymmetry` | Entry | SymmetryGroup | many-to-many | `Entry.tags.symmetry[]` | What symmetry properties this pattern has |
| `employs` | Entry | ProportionSystem | many-to-many | `Entry.tags.proportion[]` | What proportioning principles underlie this pattern |
| `hasAnalysis` | Entry | Analysis | one-to-many | `Entry.analysis` (one, latest) | AI classifications performed on this entry |

**On cardinality enforcement:** All link types permit many-to-many assignment because a single geometric pattern can legitimately belong to multiple traditions (e.g., a syncretic pattern), use multiple construction methods, and exhibit multiple proportioning principles. The single constraint is that all linked values must resolve to defined ontology objects.

**On `hasAnalysis` cardinality:** The schema stores one Analysis per Entry (the most recent). The ontological model permits `one-to-many` — an Entry may be analysed multiple times as the prompt evolves. The `promptVersion` field supports reasoning about which analysis was produced by which model version.

---

## Action Types

Action Types are governed mutations. Every write to Entry data goes through an Action Type. This is the ontological generalisation of the `populateForm → saveCurrentEntry` contract in `form.ts`.

### `CreateEntry`

**Description:** Save a new geometric pattern to the practitioner's collection.

**Validation rules:**
- `title` must be non-empty
- `imageUrl` must be non-empty
- `status` must be `want-to-try` on creation (new patterns start as intentions)
- All tag values must resolve to ontology-defined vocabulary identifiers
- `id` is generated by the action — not supplied by the caller
- `createdAt` is generated by the action — not supplied by the caller

**Side effects:**
- Generates `id` via `crypto.randomUUID()`
- Sets `createdAt` to current ISO timestamp
- Sets `schemaVersion: 2`
- Writes to `radian:entry:{id}` in localStorage
- Appends `id` to `radian:index`

**Implementation:** `storage.saveEntry()` in `data.ts`, called via `EntryForm` component's save handler.

---

### `UpdateEntry`

**Description:** Modify an existing Entry's properties.

**Validation rules:**
- Entry must exist in localStorage
- `id` and `createdAt` are immutable — cannot be changed
- `schemaVersion` is immutable — cannot be changed
- Status transitions follow the state machine (see Entry state machine above — all transitions currently permitted)
- All tag values must resolve to ontology-defined vocabulary identifiers

**Side effects:**
- Writes updated Entry to `radian:entry:{id}` in localStorage
- Does not touch `radian:index` (id already present)

**Implementation:** `storage.saveEntry()` in `data.ts` (same function — detects existing entry by id).

---

### `AnalyzeEntry`

**Description:** Run AI classification on an Entry's image. Produces an `Analysis` object and offers it to the practitioner for acceptance via `populateForm`.

**Validation rules:**
- Entry must have a non-empty `imageUrl`
- A valid Anthropic API key must be present in `localStorage` (settings)
- API calls are user-triggered only — never automatic

**Side effects:**
- Calls Claude Vision via `callClaude('analyze', ...)` in `api.ts`
- On success: populates the Analysis panel with results; does not save until practitioner accepts
- On acceptance: calls `populateForm(entry)` which routes through the normal save path
- On failure: surfaces error per the error handling contract in `CLAUDE.md`

**Implementation:** `AnalysisPanel.tsx` initiates; `api.ts` executes; `populateForm` in `EntryForm.tsx` is the acceptance path.

---

### `TagEntry`

**Description:** Apply vocabulary tags to an Entry.

**Validation rules:**
- All tag values must exist in `TAG_VOCABULARY` (enforced by the form UI's tag selectors)
- Tags are additive — applying a tag does not remove others unless explicitly cleared

**Side effects:**
- Tag state is updated in form UI state
- Persisted only when `UpdateEntry` or `CreateEntry` is executed (tags are part of the Entry object, not a separate write)

**Implementation:** Tag selection in `EntryForm.tsx` drives form state; persisted via save.

---

### `DeleteEntry`

**Description:** Remove an Entry and all its associated derived data.

**Validation rules:**
- Entry must exist

**Side effects:**
- Removes `radian:entry:{id}` from localStorage
- Removes `id` from `radian:index`
- If `Entry.template` exists: removes `radian:template:{storageKey}` from localStorage (cascade)
- `Analysis` is embedded in the Entry object — deleted with it

**Implementation:** `storage.deleteEntry()` in `data.ts`.

---

## State Machines

### Entry.status

```
States:    want-to-try | attempted | done
Initial:   want-to-try  (enforced by CreateEntry)

Transitions (all permitted — practice is iterative):
  want-to-try → attempted   (started working on it)
  attempted   → done        (construction complete)
  done        → attempted   (revisiting, reattempting)
  attempted   → want-to-try (set aside for now)
  done        → want-to-try (set aside, want to retry from scratch)
```

**Rationale:** Sacred geometry practice is iterative and non-linear. A practitioner may complete a pattern, revisit it months later to try a different construction method, and return to `attempted` status. The state machine permits all transitions because the status represents the practitioner's current relationship to the piece, not an irreversible lifecycle milestone.

---

## Schema Evolution

When the ontology changes, classify the change before implementing.

| Change Type | Examples | Compatible? | Required Action |
|---|---|---|---|
| Add new vocabulary value | New Tradition added to `TAG_VOCABULARY` | Backward compatible | Update `TAG_VOCABULARY` + this file |
| Add optional Entry property | New optional field to `Entry` | Backward compatible | Update `types.ts`, add migration in `data.ts` |
| Add new object type | New vocabulary category (e.g., `Scale`) | Backward compatible | Update ontology, `types.ts`, `TAG_VOCABULARY`, `data.ts` |
| Rename vocabulary value | `Celtic-Insular` → `Celtic` | **Breaking** | ADR required. Existing Entry tags reference old id. Migration needed. |
| Remove vocabulary value | Remove `freehand` from ConstructionMethod | **Breaking** | ADR required. Existing Entry tags reference removed id. |
| Remove Entry property | Remove `sourceUrl` from Entry | **Breaking** | ADR required. Existing stored entries contain the field. |
| Change Entry property type | `difficulty: string` → `difficulty: DifficultyEnum` | **Breaking** | ADR required. Migration in `data.ts` must handle old shape. |

**Default stance:** design for backward compatibility. When a breaking change is necessary, write an ADR in `docs/adr/` before touching code.

---

## TypeScript Mapping

How each ontological concept maps to the current codebase:

| Ontology Concept | TypeScript Location | Notes |
|---|---|---|
| `Entry` object type | `Entry` interface in `types.ts` | Canonical — do not define locally |
| `Tradition` identifiers | `TAG_VOCABULARY.tradition` in `data.ts` | Strings only; meanings live in this file |
| `ConstructionMethod` identifiers | `TAG_VOCABULARY.constructionMethod` in `data.ts` | Strings only |
| `PatternType` identifiers | `TAG_VOCABULARY.patternType` in `data.ts` | Strings only |
| `SymmetryGroup` identifiers | `TAG_VOCABULARY.symmetry` in `data.ts` | Strings only |
| `ProportionSystem` identifiers | `TAG_VOCABULARY.proportion` in `data.ts` | Strings only |
| `Analysis` object type | `Analysis` interface in `types.ts` | Embedded in Entry; derived |
| `CreateEntry` action | `storage.saveEntry()` called from `EntryForm.tsx` | Validation in form component |
| `UpdateEntry` action | `storage.saveEntry()` called from `EntryForm.tsx` | Same function, detects existing id |
| `AnalyzeEntry` action | `callClaude('analyze', ...)` in `api.ts` | User-triggered only |
| `TagEntry` action | Form state in `EntryForm.tsx` | Persisted via save actions |
| `DeleteEntry` action | `storage.deleteEntry()` in `data.ts` | Cascades to template |
| Link `belongsToTradition` | `Entry.tags.tradition: string[]` | Array of Tradition identifiers |
| Link `usesMethod` | `Entry.tags.constructionMethod: string[]` | Array of ConstructionMethod identifiers |
| Link `classifiedAs` | `Entry.tags.patternType: string[]` | Array of PatternType identifiers |
| Link `exhibitsSymmetry` | `Entry.tags.symmetry: string[]` | Array of SymmetryGroup identifiers |
| Link `employs` | `Entry.tags.proportion: string[]` | Array of ProportionSystem identifiers |
| Link `hasAnalysis` | `Entry.analysis?: Analysis` | One-to-one (latest only) |
| Vocabulary access | `TAG_VOCABULARY` in `data.ts` | Consumed via `gallery.ts` filter groups |

**The gap this file fills:** the code gives you identifiers (`'Islamic-geometric'`) but not meanings ("a cultural lineage with these characteristics, these typical methods, these typical patterns"). This file provides the meaning layer. The OSDK (Phase 2) will surface that meaning programmatically.

---

## Phase 2: Planned OSDK (`src/ontology.ts`)

The Ontology SDK will wrap `data.ts` as the storage engine and expose this ontology's concepts as typed, traversable objects. `data.ts` becomes the persistence layer; `ontology.ts` becomes the semantic layer.

```typescript
// Planned shape — not yet implemented
export const Ontology = {
  // Vocabulary — governed term registry (replaces direct TAG_VOCABULARY access)
  vocabulary: {
    traditions(): TraditionObject[]
    methods(): ConstructionMethodObject[]
    patternTypes(): PatternTypeObject[]
    symmetryGroups(): SymmetryGroupObject[]
    proportionSystems(): ProportionSystemObject[]
  },

  // Entry operations — governed mutations via Action Types
  objects: {
    Entry: {
      list(filters?: EntryFilters): Entry[]
      get(id: string): Entry | null
      create(params: CreateEntryParams): Entry     // validates + saves
      update(id: string, params: Partial<Entry>): Entry
      delete(id: string): void                     // cascades per ontology rules
    }
  },

  // Link traversal — follow relationships defined in this file
  links: {
    forEntry(id: string): ResolvedEntryLinks    // traditions, methods, etc. as objects
    byTradition(id: string): Entry[]
    byMethod(id: string): Entry[]
    byPatternType(id: string): Entry[]
    bySymmetry(id: string): Entry[]
  },
};
```

**Architectural contract:** `ontology.ts` imports from `data.ts`; `data.ts` does not import from `ontology.ts`. The dependency flows one way: semantic layer depends on storage layer, not the reverse.

---

## Phase 4: Planned Context Graph

A queryable runtime representation of the relationship graph, enabling compound queries that span multiple link types:

```typescript
// Planned shape — not yet implemented
ContextGraph.query({
  type: 'Entry',
  where: {
    tradition: 'Islamic-geometric',
    method: 'compass-and-straightedge',
    symmetry: '6-fold',
  },
  include: ['analysis'],
});
```

This is the same query shape an AI agent would use via an MCP tool, or a BFF would use to assemble a rich response. The query vocabulary is governed by this ontology — you cannot query for relationships that are not defined above.

---

*Ontology version: 1.0. Governed by: Radian practitioner domain.*
*Schema evolution: any change to this file that affects `TAG_VOCABULARY` identifiers requires a corresponding `data.ts` update. Breaking changes require an ADR.*
