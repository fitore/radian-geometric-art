import { describe, it, expect } from 'vitest';
import { filterEntries, sortEntries } from '../gallery.js';
import type { Entry, ActiveFilters } from '../types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyFilters(): ActiveFilters {
  return {
    status:             new Set(),
    difficulty:         new Set(),
    constructionMethod: new Set(),
    tradition:          new Set(),
    patternType:        new Set(),
    symmetry:           new Set(),
  };
}

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id:            overrides.id            ?? crypto.randomUUID(),
    createdAt:     overrides.createdAt     ?? new Date().toISOString(),
    schemaVersion: 2,
    title:         overrides.title         ?? 'Test piece',
    imageUrl:      '',
    sourceUrl:     '',
    status:        overrides.status        ?? 'want-to-try',
    difficulty:    overrides.difficulty    ?? 'beginner',
    tags:          overrides.tags          ?? {
      constructionMethod: [],
      tradition:          [],
      patternType:        [],
      symmetry:           [],
      proportion:         [],
    },
    description:   '',
    attemptNotes:  '',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('filterEntries', () => {
  const entries = [
    makeEntry({ id: '1', title: 'Rosette',     status: 'done',        difficulty: 'advanced',     tags: { constructionMethod: ['compass-and-straightedge'], tradition: ['Islamic-geometric'],  patternType: ['rosette'],    symmetry: ['6-fold'], proportion: [] } }),
    makeEntry({ id: '2', title: 'Star',        status: 'attempted',   difficulty: 'intermediate', tags: { constructionMethod: ['ruler-only'],               tradition: ['Gothic-Medieval'],    patternType: ['star-polygon'], symmetry: ['8-fold'], proportion: [] } }),
    makeEntry({ id: '3', title: 'Tessellation',status: 'want-to-try', difficulty: 'beginner',     tags: { constructionMethod: ['grid-based'],               tradition: ['Islamic-geometric'],  patternType: ['tessellation'], symmetry: ['4-fold'], proportion: [] } }),
  ];

  it('returns all entries when no filters are active', () => {
    const result = filterEntries(entries, emptyFilters(), '');
    expect(result).toHaveLength(3);
  });

  it('filters by tradition using OR within group', () => {
    const filters = { ...emptyFilters(), tradition: new Set(['Islamic-geometric', 'Gothic-Medieval']) };
    const result = filterEntries(entries, filters, '');
    // All three entries belong to one of these two traditions
    expect(result).toHaveLength(3);
  });

  it('filters across two groups using AND between groups', () => {
    // Must have Islamic-geometric tradition AND 6-fold symmetry
    const filters = {
      ...emptyFilters(),
      tradition: new Set(['Islamic-geometric']),
      symmetry:  new Set(['6-fold']),
    };
    const result = filterEntries(entries, filters, '');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('1');
  });

  it('excludes entries that match no active tag in a group', () => {
    // Only want Celtic-Insular, but no entries have it
    const filters = { ...emptyFilters(), tradition: new Set(['Celtic-Insular']) };
    const result = filterEntries(entries, filters, '');
    expect(result).toHaveLength(0);
  });

  it('sorts by createdAt descending by default', () => {
    const old    = makeEntry({ id: 'old', createdAt: '2023-01-01T00:00:00.000Z', title: 'Old' });
    const middle = makeEntry({ id: 'mid', createdAt: '2024-01-01T00:00:00.000Z', title: 'Mid' });
    const newest = makeEntry({ id: 'new', createdAt: '2025-01-01T00:00:00.000Z', title: 'New' });

    const sorted = sortEntries([old, newest, middle], 'newest');
    expect(sorted.map(e => e.id)).toEqual(['new', 'mid', 'old']);
  });
});
