import { describe, it, expect, beforeEach } from 'vitest';
import { Ontology } from '../ontology.js';
import { storage } from '../data.js';
import type { Entry } from '../types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id:            overrides.id            ?? crypto.randomUUID(),
    createdAt:     overrides.createdAt     ?? new Date().toISOString(),
    schemaVersion: 2,
    title:         overrides.title         ?? 'Test piece',
    imageUrl:      overrides.imageUrl      ?? '',
    sourceUrl:     overrides.sourceUrl     ?? '',
    status:        overrides.status        ?? 'want-to-try',
    difficulty:    overrides.difficulty    ?? 'beginner',
    tags:          overrides.tags          ?? {
      constructionMethod: [],
      tradition:          [],
      patternType:        [],
      symmetry:           [],
      proportion:         [],
    },
    description:   overrides.description   ?? '',
    attemptNotes:  overrides.attemptNotes  ?? '',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Ontology SDK', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('resolves entry links to typed vocabulary objects', () => {
    const entry = makeEntry({
      id: 'ontology-test-id',
      tags: {
        tradition:          ['Islamic-geometric'],
        constructionMethod: ['compass-and-straightedge'],
        patternType:        ['rosette'],
        symmetry:           ['6-fold'],
        proportion:         ['golden-ratio'],
      },
    });
    storage.saveEntry(entry);

    const links = Ontology.links.forEntry('ontology-test-id');

    expect(links).not.toBeNull();

    // Tradition resolves to typed object with meaning, not just id string
    expect(links!.traditions).toHaveLength(1);
    expect(links!.traditions[0].id).toBe('Islamic-geometric');
    expect(links!.traditions[0].label).toBe('Islamic Geometric');
    expect(links!.traditions[0].geographicOrigin).toBe('Middle East, Central Asia, North Africa');
    expect(links!.traditions[0].historicalPeriod).toBe('9th century–present');

    // ConstructionMethod resolves with tools and description
    expect(links!.methods).toHaveLength(1);
    expect(links!.methods[0].id).toBe('compass-and-straightedge');
    expect(links!.methods[0].label).toBe('Compass and Straightedge');
    expect(links!.methods[0].tools).toBe('Compass, unmarked straightedge');

    // SymmetryGroup resolves with mathematical properties
    expect(links!.symmetryGroups).toHaveLength(1);
    expect(links!.symmetryGroups[0].foldCount).toBe(6);
    expect(links!.symmetryGroups[0].groupType).toBe('D');
    expect(links!.symmetryGroups[0].rotationAngleDeg).toBe(60);
    expect(links!.symmetryGroups[0].fullSymmetry).toBe('D6');

    // ProportionSystem resolves with ratio
    expect(links!.proportionSystems).toHaveLength(1);
    expect(links!.proportionSystems[0].id).toBe('golden-ratio');
    expect(links!.proportionSystems[0].ratio).toBe('φ ≈ 1.618');
  });

  it('returns null from forEntry when entry does not exist', () => {
    const result = Ontology.links.forEntry('nonexistent-id');
    expect(result).toBeNull();
  });
});
