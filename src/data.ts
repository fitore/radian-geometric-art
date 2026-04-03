import type { Entry, Tags } from './types.js';

// ─── Tag vocabulary (v2 — adds syncretic + Contemporary-Mathematical) ─────────

export const TAG_VOCABULARY = {
  constructionMethod: [
    'compass-and-straightedge',
    'ruler-only',
    'freehand',
    'polygonal-method',
    'grid-based',
    'string-art-parabolic',
  ],
  tradition: [
    'Islamic-geometric',
    'Moorish-Andalusian',
    'Persian-Iranian',
    'Moroccan-Maghrebi',
    'Ottoman',
    'Gothic-Medieval',
    'Hindu-Vedic',
    'Celtic-Insular',
    'Nature-derived',
    'syncretic',
    'Contemporary-Mathematical',
  ],
  patternType: [
    'rosette',
    'star-polygon',
    'tessellation',
    'arabesque-biomorph',
    'mandala',
    'knot-interlace',
    'spiral',
    'parabolic-curve',
    'epicycloid',
    'curve-of-pursuit',
    'Flower-of-Life-lineage',
  ],
  symmetry: [
    '3-fold', '4-fold', '5-fold', '6-fold', '7-fold',
    '8-fold', '10-fold', '12-fold', '16-fold',
  ],
  proportion: [
    'golden-ratio', '√2', '√3', 'vesica-piscis', 'fibonacci', 'pi-based',
  ],
} as const;

export type TagGroup = keyof typeof TAG_VOCABULARY;

// ─── Schema migration ─────────────────────────────────────────────────────────

function migrateToV2(raw: Record<string, unknown>): Entry {
  const tags = (raw['tags'] as Partial<Tags> | undefined) ?? {};
  return {
    id: String(raw['id'] ?? crypto.randomUUID()),
    createdAt: String(raw['createdAt'] ?? new Date().toISOString()),
    schemaVersion: 2,
    title: String(raw['title'] ?? ''),
    imageUrl: String(raw['imageUrl'] ?? ''),
    sourceUrl: String(raw['sourceUrl'] ?? ''),
    status: (raw['status'] as Entry['status']) || 'want-to-try',
    difficulty: (raw['difficulty'] as Entry['difficulty']) || 'beginner',
    tags: {
      constructionMethod: tags.constructionMethod ?? [],
      tradition: tags.tradition ?? [],
      patternType: tags.patternType ?? [],
      symmetry: tags.symmetry ?? [],
      proportion: tags.proportion ?? [],
    },
    description: String(raw['description'] ?? ''),
    attemptNotes: String(raw['attemptNotes'] ?? ''),
  };
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const KEY_INDEX = 'radian:index';
const KEY_ENTRY = (id: string) => `radian:entry:${id}`;
// Template PNGs stored separately to keep entry objects lean
const KEY_TEMPLATE = (key: string) => `radian:template:${key}`;

function parseEntry(raw: Record<string, unknown>): Entry {
  if (!raw['schemaVersion'] || Number(raw['schemaVersion']) < 2) {
    return migrateToV2(raw);
  }
  return raw as unknown as Entry;
}

export const storage = {
  getAllEntries(): Entry[] {
    try {
      const ids = JSON.parse(localStorage.getItem(KEY_INDEX) ?? '[]') as string[];
      return ids
        .map(id => {
          try {
            const raw = JSON.parse(localStorage.getItem(KEY_ENTRY(id)) ?? 'null') as Record<string, unknown> | null;
            if (!raw) return null;
            const entry = parseEntry(raw);
            // Persist migration immediately
            if (!raw['schemaVersion'] || Number(raw['schemaVersion']) < 2) {
              localStorage.setItem(KEY_ENTRY(id), JSON.stringify(entry));
            }
            return entry;
          } catch { return null; }
        })
        .filter((e): e is Entry => e !== null);
    } catch { return []; }
  },

  getEntry(id: string): Entry | null {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY_ENTRY(id)) ?? 'null') as Record<string, unknown> | null;
      if (!raw) return null;
      return parseEntry(raw);
    } catch { return null; }
  },

  saveEntry(entry: Entry): void {
    try {
      const ids = JSON.parse(localStorage.getItem(KEY_INDEX) ?? '[]') as string[];
      if (!ids.includes(entry.id)) {
        ids.push(entry.id);
        localStorage.setItem(KEY_INDEX, JSON.stringify(ids));
      }
      localStorage.setItem(KEY_ENTRY(entry.id), JSON.stringify(entry));
    } catch (e) {
      console.error('radian: failed to save entry', e);
    }
  },

  deleteEntry(id: string): void {
    try {
      const ids = JSON.parse(localStorage.getItem(KEY_INDEX) ?? '[]') as string[];
      localStorage.setItem(KEY_INDEX, JSON.stringify(ids.filter(i => i !== id)));
      localStorage.removeItem(KEY_ENTRY(id));
    } catch (e) {
      console.error('radian: failed to delete entry', e);
    }
  },

  // Template PNG storage (base64)
  saveTemplate(key: string, dataUrl: string): void {
    try {
      localStorage.setItem(KEY_TEMPLATE(key), dataUrl);
    } catch (e) {
      console.error('radian: failed to save template', e);
    }
  },

  getTemplate(key: string): string | null {
    return localStorage.getItem(KEY_TEMPLATE(key));
  },

  deleteTemplate(key: string): void {
    localStorage.removeItem(KEY_TEMPLATE(key));
  },

  exportJSON(): void {
    const entries = this.getAllEntries();
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radian-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importJSON(jsonStr: string): { ok: boolean; count?: number; error?: string } {
    let incoming: unknown;
    try { incoming = JSON.parse(jsonStr); }
    catch { return { ok: false, error: 'Invalid JSON file.' }; }

    if (!Array.isArray(incoming)) {
      return { ok: false, error: 'Expected a JSON array of entries.' };
    }

    let imported = 0;
    for (const raw of incoming as unknown[]) {
      if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        if (obj['id'] && obj['title']) {
          this.saveEntry(parseEntry(obj));
          imported++;
        }
      }
    }
    return { ok: true, count: imported };
  },
};
