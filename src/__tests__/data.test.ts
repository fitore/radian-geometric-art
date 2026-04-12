import { describe, it, expect, beforeEach } from 'vitest';
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

describe('localStorage contract', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves an entry and retrieves it by id', () => {
    const entry = makeEntry({ title: 'Vesica Piscis' });
    storage.saveEntry(entry);

    const retrieved = storage.getEntry(entry.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Vesica Piscis');
    expect(retrieved?.id).toBe(entry.id);
  });

  it('index contains the saved entry id', () => {
    const entry = makeEntry({ title: 'Star Polygon' });
    storage.saveEntry(entry);

    const raw = localStorage.getItem('radian:index');
    const ids = JSON.parse(raw ?? '[]') as string[];
    expect(ids).toContain(entry.id);
  });

  it('updates an entry without creating a duplicate', () => {
    const entry = makeEntry({ title: 'Original' });
    storage.saveEntry(entry);

    const updated = { ...entry, title: 'Updated' };
    storage.saveEntry(updated);

    const all = storage.getAllEntries();
    expect(all).toHaveLength(1);
    expect(all[0]?.title).toBe('Updated');
  });

  it('deletes an entry and removes it from the index', () => {
    const entry = makeEntry({ title: 'To Delete' });
    storage.saveEntry(entry);
    storage.deleteEntry(entry.id);

    expect(storage.getEntry(entry.id)).toBeNull();
    const all = storage.getAllEntries();
    expect(all.find(e => e.id === entry.id)).toBeUndefined();
  });

  it('returns entries in index order', () => {
    const a = makeEntry({ id: 'aaa', title: 'A' });
    const b = makeEntry({ id: 'bbb', title: 'B' });
    const c = makeEntry({ id: 'ccc', title: 'C' });
    storage.saveEntry(a);
    storage.saveEntry(b);
    storage.saveEntry(c);

    const all = storage.getAllEntries();
    expect(all.map(e => e.id)).toEqual(['aaa', 'bbb', 'ccc']);
  });

  it('migrates a v1 entry to current schema without data loss', () => {
    const id = crypto.randomUUID();
    // Write a raw v1-style entry (no schemaVersion)
    const v1 = {
      id,
      createdAt: '2024-01-01T00:00:00.000Z',
      title:     'Old Piece',
      imageUrl:  'https://example.com/img.jpg',
      sourceUrl: '',
      status:    'done',
      difficulty: 'advanced',
      tags: {
        constructionMethod: ['compass-and-straightedge'],
        tradition:          ['Islamic-geometric'],
        patternType:        ['rosette'],
        symmetry:           ['6-fold'],
        proportion:         [],
      },
      description:  'A venerable design',
      attemptNotes: 'Tried three times',
    };

    // Manually write v1 data bypassing storage (no schemaVersion key)
    localStorage.setItem('radian:index', JSON.stringify([id]));
    localStorage.setItem(`radian:entry:${id}`, JSON.stringify(v1));

    const retrieved = storage.getEntry(id);
    expect(retrieved?.schemaVersion).toBe(2);
    expect(retrieved?.title).toBe('Old Piece');
    expect(retrieved?.tags.constructionMethod).toContain('compass-and-straightedge');
    expect(retrieved?.status).toBe('done');
    expect(retrieved?.description).toBe('A venerable design');
  });
});
