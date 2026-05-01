// src/ontology.ts
// Ontology SDK — semantic layer wrapping src/data.ts storage engine.
// Surfaces vocabulary types as typed objects (meaning, not just identifier strings).
// Imports only from src/data.ts and src/types.ts. No other src/ imports.
// No DOM access. No React. No localStorage writes — all writes delegate to data.ts.
// data.ts must NOT import this module. Dependency is one-way: ontology.ts → data.ts.

import type { Entry, ActiveFilters, Status, Difficulty, Analysis } from './types.js';
import { storage } from './data.js';

// ─── Vocabulary object type interfaces ───────────────────────────────────────

export interface TraditionObject {
  id: string;               // matches TAG_VOCABULARY.tradition value exactly
  label: string;            // human-readable display label
  geographicOrigin: string;
  historicalPeriod: string;
  notes: string;
}

export interface ConstructionMethodObject {
  id: string;               // matches TAG_VOCABULARY.constructionMethod value
  label: string;
  tools: string;
  description: string;
}

export interface PatternTypeObject {
  id: string;               // matches TAG_VOCABULARY.patternType value
  label: string;
  mathematicalFamily: string;
  description: string;
}

export interface SymmetryGroupObject {
  id: string;               // matches TAG_VOCABULARY.symmetry value
  label: string;
  foldCount: number;
  groupType: 'D' | 'C';    // D = dihedral (rotation + reflection); C = cyclic (rotation only)
                             // Consistent with symmetry.ts SymmetryResult.groupType
  rotationAngleDeg: number; // 360 / foldCount — computed from foldCount, not stored separately
  fullSymmetry: string;     // e.g. "D6" or "C5"
}

export interface ProportionSystemObject {
  id: string;               // matches TAG_VOCABULARY.proportion value
  label: string;
  ratio: string;
  constructionOrigin: string;
}

// ─── Link resolution shape ────────────────────────────────────────────────────

export interface ResolvedEntryLinks {
  traditions: TraditionObject[];
  methods: ConstructionMethodObject[];
  patternTypes: PatternTypeObject[];
  symmetryGroups: SymmetryGroupObject[];
  proportionSystems: ProportionSystemObject[];
}

// ─── Vocabulary registries ────────────────────────────────────────────────────
// Data copied verbatim from docs/ontology.md.
// ids confirmed against TAG_VOCABULARY in data.ts before writing.

export const TRADITIONS: TraditionObject[] = [
  {
    id: 'Islamic-geometric',
    label: 'Islamic Geometric',
    geographicOrigin: 'Middle East, Central Asia, North Africa',
    historicalPeriod: '9th century–present',
    notes: 'The broadest tradition umbrella. Characterised by compass-and-straightedge construction, star polygons, and interlocking tessellations. Root tradition for Moorish, Persian, Ottoman, and Moroccan sub-traditions.',
  },
  {
    id: 'Moorish-Andalusian',
    label: 'Moorish / Andalusian',
    geographicOrigin: 'Iberian Peninsula',
    historicalPeriod: '8th–15th century',
    notes: 'Iberian expression of Islamic geometry. Alhambra is the canonical reference. Rich use of muqarnas and tile-based tessellations.',
  },
  {
    id: 'Persian-Iranian',
    label: 'Persian / Iranian',
    geographicOrigin: 'Iran, Central Asia',
    historicalPeriod: '9th–17th century',
    notes: 'Iranian variant of Islamic geometry — tends toward more intricate star systems and the use of the girih tile method.',
  },
  {
    id: 'Moroccan-Maghrebi',
    label: 'Moroccan / Maghrebi',
    geographicOrigin: 'North Africa',
    historicalPeriod: '11th century–present',
    notes: 'North African tradition with characteristic zellige tilework. Distinct colour palette and smaller repeat units.',
  },
  {
    id: 'Ottoman',
    label: 'Ottoman',
    geographicOrigin: 'Turkey, Balkans, Levant',
    historicalPeriod: '13th–19th century',
    notes: 'Ottoman geometric tradition — distinct from Persian in proportioning systems. Muqarnas and geometric tile compositions.',
  },
  {
    id: 'Gothic-Medieval',
    label: 'Gothic / Medieval',
    geographicOrigin: 'Western Europe',
    historicalPeriod: '11th–15th century',
    notes: 'European sacred geometry tradition. Characterised by pointed arches, rose windows, and Vesica Piscis-based proportioning.',
  },
  {
    id: 'Hindu-Vedic',
    label: 'Hindu / Vedic',
    geographicOrigin: 'Indian subcontinent',
    historicalPeriod: 'Ancient–present',
    notes: 'Includes yantra geometry, kolam, rangoli. Governed by Vastu Shastra proportioning. Mandala forms are central.',
  },
  {
    id: 'Celtic-Insular',
    label: 'Celtic / Insular',
    geographicOrigin: 'British Isles, Ireland',
    historicalPeriod: '5th–12th century',
    notes: 'Characterised by interlace knotwork, spiral forms, and the Book of Kells lineage. Constructed via ruler-only grid methods.',
  },
  {
    id: 'Nature-derived',
    label: 'Nature-derived',
    geographicOrigin: 'Universal',
    historicalPeriod: 'All periods',
    notes: 'Patterns derived from natural forms: phyllotaxis spirals, Voronoi cells, radiolarian geometry. Fibonacci and golden ratio proportions.',
  },
  {
    id: 'syncretic',
    label: 'Syncretic',
    geographicOrigin: 'Cross-cultural',
    historicalPeriod: 'Contemporary',
    notes: 'Patterns that intentionally blend multiple traditions. Not a default — requires evidence of deliberate synthesis.',
  },
  {
    id: 'Contemporary-Mathematical',
    label: 'Contemporary Mathematical',
    geographicOrigin: 'Global',
    historicalPeriod: '20th century–present',
    notes: 'Patterns originating from mathematical art, computational geometry, or recreational mathematics. Includes work by Escher, Penrose, and mathematical artists.',
  },
];

export const CONSTRUCTION_METHODS: ConstructionMethodObject[] = [
  {
    id: 'compass-and-straightedge',
    label: 'Compass and Straightedge',
    tools: 'Compass, unmarked straightedge',
    description: 'The classical Euclidean method. All marks are compass arcs and straight lines only. The canonical method for Islamic and Gothic traditions.',
  },
  {
    id: 'ruler-only',
    label: 'Ruler Only',
    tools: 'Marked ruler (measurements allowed)',
    description: 'Grid-based or measured construction. Allows measured distances. Used in Celtic knotwork and many folk geometric traditions.',
  },
  {
    id: 'freehand',
    label: 'Freehand',
    tools: 'No tools or flexible curve tools',
    description: 'Drawn without geometric instruments. Includes free-form arabesque, biomorphic, and expressive geometric forms.',
  },
  {
    id: 'polygonal-method',
    label: 'Polygonal Method',
    tools: 'Compass, ruler, polygon templates',
    description: 'Construction via regular polygons as base units. The girih tile method is a canonical example.',
  },
  {
    id: 'grid-based',
    label: 'Grid Based',
    tools: 'Ruler, grid paper or digital grid',
    description: 'Construction on a regular grid (square, triangular, hexagonal). Celtic knotwork and Moorish zellige patterns often use this method.',
  },
  {
    id: 'string-art-parabolic',
    label: 'String Art / Parabolic',
    tools: 'Nails, string, or drawn equivalents',
    description: 'Parabolic curves formed by straight-line envelopes. Associated with mathematical curve art.',
  },
];

export const PATTERN_TYPES: PatternTypeObject[] = [
  {
    id: 'rosette',
    label: 'Rosette',
    mathematicalFamily: 'Star polygon / radial',
    description: 'A radially symmetric decorative motif, typically based on n-fold star polygons. Common unit in Islamic geometric compositions.',
  },
  {
    id: 'star-polygon',
    label: 'Star Polygon',
    mathematicalFamily: 'Stellated polygon',
    description: 'A polygon formed by connecting every k-th vertex of a regular n-gon. Notation: {n/k}. The building block of most Islamic geometric patterns.',
  },
  {
    id: 'tessellation',
    label: 'Tessellation',
    mathematicalFamily: 'Plane tiling',
    description: 'A pattern that tiles the plane without gaps or overlaps. May be periodic, aperiodic, or semi-regular.',
  },
  {
    id: 'arabesque-biomorph',
    label: 'Arabesque / Biomorph',
    mathematicalFamily: 'Curvilinear',
    description: 'Flowing, interlaced plant-derived or abstract curvilinear forms. Distinct from pure geometric forms — incorporates organic curvature.',
  },
  {
    id: 'mandala',
    label: 'Mandala',
    mathematicalFamily: 'Radial symmetry',
    description: 'A geometric diagram with concentric radial structure, often used in meditation or ritual contexts. Distinct from rosette by its concentric compositional logic.',
  },
  {
    id: 'knot-interlace',
    label: 'Knot / Interlace',
    mathematicalFamily: 'Knot theory / topology',
    description: 'Patterns of interlacing strands, often with consistent over-under weaving. Celtic knotwork is the primary example.',
  },
  {
    id: 'spiral',
    label: 'Spiral',
    mathematicalFamily: 'Logarithmic / Archimedean',
    description: 'Patterns organised around a spiral growth law. Includes logarithmic spirals (Fibonacci / golden ratio), Archimedean spirals, and phyllotaxis patterns.',
  },
  {
    id: 'parabolic-curve',
    label: 'Parabolic Curve',
    mathematicalFamily: 'Envelope of tangents',
    description: 'Straight-line envelope forming apparent curves. Associated with string art and mathematical curve construction.',
  },
  {
    id: 'epicycloid',
    label: 'Epicycloid',
    mathematicalFamily: 'Roulette curve',
    description: 'Curves traced by a point on a circle rolling around another circle. Includes cardioid, nephroid, and higher-order forms.',
  },
  {
    id: 'curve-of-pursuit',
    label: 'Curve of Pursuit',
    mathematicalFamily: 'Differential geometry',
    description: 'Pattern formed by curves traced by pursuers following targets in a regular polygon configuration.',
  },
  {
    id: 'Flower-of-Life-lineage',
    label: 'Flower of Life Lineage',
    mathematicalFamily: 'Vesica Piscis / overlapping circles',
    description: "Patterns derived from the overlapping-circles construction. Includes Seed of Life, Fruit of Life, Metatron's Cube. Widely found across traditions.",
  },
];

function makeSG(id: string, label: string, foldCount: number, groupType: 'D' | 'C'): SymmetryGroupObject {
  return {
    id,
    label,
    foldCount,
    groupType,
    rotationAngleDeg: 360 / foldCount,
    fullSymmetry: `${groupType}${foldCount}`,
  };
}

// All current vocabulary entries have bilateral symmetry → groupType 'D' (dihedral).
// groupType 'C' (cyclic) is available for future vocabulary additions.
export const SYMMETRY_GROUPS: SymmetryGroupObject[] = [
  makeSG('3-fold',  '3-fold',  3,  'D'),
  makeSG('4-fold',  '4-fold',  4,  'D'),
  makeSG('5-fold',  '5-fold',  5,  'D'),
  makeSG('6-fold',  '6-fold',  6,  'D'),
  makeSG('7-fold',  '7-fold',  7,  'D'),
  makeSG('8-fold',  '8-fold',  8,  'D'),
  makeSG('10-fold', '10-fold', 10, 'D'),
  makeSG('12-fold', '12-fold', 12, 'D'),
  makeSG('16-fold', '16-fold', 16, 'D'),
];

export const PROPORTION_SYSTEMS: ProportionSystemObject[] = [
  {
    id: 'golden-ratio',
    label: 'Golden Ratio',
    ratio: 'φ ≈ 1.618',
    constructionOrigin: 'Arises naturally from regular pentagon construction',
  },
  {
    id: '√2',
    label: 'Root Two',
    ratio: '√2 ≈ 1.414',
    constructionOrigin: 'Diagonal of unit square',
  },
  {
    id: '√3',
    label: 'Root Three',
    ratio: '√3 ≈ 1.732',
    constructionOrigin: 'Height of equilateral triangle',
  },
  {
    id: 'vesica-piscis',
    label: 'Vesica Piscis',
    ratio: '√3 : 1 length ratio',
    constructionOrigin: 'Intersection of two equal circles',
  },
  {
    id: 'fibonacci',
    label: 'Fibonacci',
    ratio: 'Sequence approximating φ',
    constructionOrigin: 'Discrete approximation to golden ratio',
  },
  {
    id: 'pi-based',
    label: 'Pi-based',
    ratio: 'π ≈ 3.14159',
    constructionOrigin: 'Circle-squaring, arc-length proportions',
  },
];

// ─── Internal helpers ─────────────────────────────────────────────────────────

function applyFilters(entries: Entry[], filters: ActiveFilters): Entry[] {
  return entries.filter(entry => {
    if (filters.status.size > 0 && !filters.status.has(entry.status)) return false;
    if (filters.difficulty.size > 0 && !filters.difficulty.has(entry.difficulty)) return false;
    for (const group of ['constructionMethod', 'tradition', 'patternType', 'symmetry'] as const) {
      const active = filters[group];
      if (active.size > 0) {
        const entryTags = new Set(entry.tags?.[group] ?? []);
        if (![...active].some(t => entryTags.has(t))) return false;
      }
    }
    return true;
  });
}

// ─── Ontology SDK ─────────────────────────────────────────────────────────────

export const Ontology = {

  // Vocabulary — returns the full typed registry for each domain concept.
  // Consumers ask for meaning; the registry provides it.
  vocabulary: {
    traditions:       (): TraditionObject[]          => TRADITIONS,
    methods:          (): ConstructionMethodObject[]  => CONSTRUCTION_METHODS,
    patternTypes:     (): PatternTypeObject[]         => PATTERN_TYPES,
    symmetryGroups:   (): SymmetryGroupObject[]       => SYMMETRY_GROUPS,
    proportionSystems:(): ProportionSystemObject[]    => PROPORTION_SYSTEMS,
  },

  // Entry object access — delegates to data.ts storage functions.
  // No mutations here — create/update/delete remain in data.ts (Phase 3 decision).
  objects: {
    Entry: {
      list(filters?: ActiveFilters): Entry[] {
        const all = storage.getAllEntries();
        return filters ? applyFilters(all, filters) : all;
      },
      get(id: string): Entry | null {
        return storage.getEntry(id);
      },
    },
  },

  // Link traversal — resolves Entry tag string arrays to typed vocabulary objects.
  // Unknown tag values (not in registry) are silently dropped, not thrown.
  links: {
    forEntry(id: string): ResolvedEntryLinks | null {
      const entry = Ontology.objects.Entry.get(id);
      if (!entry) return null;
      return {
        traditions: entry.tags.tradition
          .map(tid => TRADITIONS.find(t => t.id === tid))
          .filter((t): t is TraditionObject => t !== undefined),
        methods: entry.tags.constructionMethod
          .map(mid => CONSTRUCTION_METHODS.find(m => m.id === mid))
          .filter((m): m is ConstructionMethodObject => m !== undefined),
        patternTypes: entry.tags.patternType
          .map(pid => PATTERN_TYPES.find(p => p.id === pid))
          .filter((p): p is PatternTypeObject => p !== undefined),
        symmetryGroups: entry.tags.symmetry
          .map(sid => SYMMETRY_GROUPS.find(s => s.id === sid))
          .filter((s): s is SymmetryGroupObject => s !== undefined),
        proportionSystems: entry.tags.proportion
          .map(pid => PROPORTION_SYSTEMS.find(p => p.id === pid))
          .filter((p): p is ProportionSystemObject => p !== undefined),
      };
    },

    byTradition(traditionId: string): Entry[] {
      return Ontology.objects.Entry.list()
        .filter(e => e.tags.tradition.includes(traditionId));
    },

    byMethod(methodId: string): Entry[] {
      return Ontology.objects.Entry.list()
        .filter(e => e.tags.constructionMethod.includes(methodId));
    },
  },
};

// ─── Context Graph ────────────────────────────────────────────────────────────
// Compound queries across ontology link types.
// The query vocabulary is governed by the ontology — where keys map directly
// to defined link types. You cannot query for a relationship not defined above.
// This is the same query shape an AI agent would use via an MCP tool call,
// or a BFF would use to assemble a rich response.

export interface EntryQueryWhere {
  tradition?:   string;      // entry must have this Tradition id in tags.tradition
  method?:      string;      // entry must have this ConstructionMethod id
  patternType?: string;      // entry must have this PatternType id
  symmetry?:    string;      // entry must have this SymmetryGroup id
  proportion?:  string;      // entry must have this ProportionSystem id
  status?:      Status;      // exact match on entry.status
  difficulty?:  Difficulty;  // exact match on entry.difficulty
  search?:      string;      // case-insensitive substring match on entry.title
}

// Multiple where conditions are AND'd — entry must satisfy all of them.

export type EntryQueryInclude = 'analysis' | 'links';

export interface EntryQueryResult {
  entry:     Entry;
  analysis?: Analysis;         // present only when include contains 'analysis' and entry has one
  links?:    ResolvedEntryLinks; // present only when include contains 'links'
}

export interface EntryQuery {
  type:     'Entry';
  where?:   EntryQueryWhere;
  include?: EntryQueryInclude[];
}

export const ContextGraph = {
  query(q: EntryQuery): EntryQueryResult[] {
    let entries = storage.getAllEntries();

    if (q.where) {
      const w = q.where;
      if (w.tradition)   entries = entries.filter(e => e.tags.tradition.includes(w.tradition!));
      if (w.method)      entries = entries.filter(e => e.tags.constructionMethod.includes(w.method!));
      if (w.patternType) entries = entries.filter(e => e.tags.patternType.includes(w.patternType!));
      if (w.symmetry)    entries = entries.filter(e => e.tags.symmetry.includes(w.symmetry!));
      if (w.proportion)  entries = entries.filter(e => e.tags.proportion.includes(w.proportion!));
      if (w.status)      entries = entries.filter(e => e.status === w.status);
      if (w.difficulty)  entries = entries.filter(e => e.difficulty === w.difficulty);
      if (w.search)      entries = entries.filter(e => e.title.toLowerCase().includes(w.search!.toLowerCase()));
    }

    return entries.map(entry => {
      const result: EntryQueryResult = { entry };
      if (q.include?.includes('analysis') && entry.analysis) {
        result.analysis = entry.analysis;
      }
      if (q.include?.includes('links')) {
        result.links = Ontology.links.forEntry(entry.id)!;
      }
      return result;
    });
  },
};
