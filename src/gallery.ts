import type { Entry, ActiveFilters, SortKey } from './types.js';
import { TAG_VOCABULARY } from './data.js';

// ─── Sidebar group definitions ────────────────────────────────────────────────
// Consumed by App.tsx to render filter chips. Kept here alongside filter logic.

interface ChipDef { value: string; label: string; cls?: string; }
interface SidebarGroup { label: string; type: keyof ActiveFilters; chips: ChipDef[]; }

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    label: 'Status',
    type: 'status',
    chips: [
      { value: 'want-to-try', label: 'Want to try', cls: 'chip--want' },
      { value: 'attempted',   label: 'Attempted',   cls: 'chip--tried' },
      { value: 'done',        label: 'Done',         cls: 'chip--done' },
    ],
  },
  {
    label: 'Construction',
    type: 'constructionMethod',
    chips: TAG_VOCABULARY.constructionMethod.map(v => ({ value: v, label: v })),
  },
  {
    label: 'Tradition',
    type: 'tradition',
    chips: TAG_VOCABULARY.tradition.map(v => ({ value: v, label: v })),
  },
  {
    label: 'Pattern Type',
    type: 'patternType',
    chips: TAG_VOCABULARY.patternType.map(v => ({ value: v, label: v })),
  },
  {
    label: 'Symmetry',
    type: 'symmetry',
    chips: TAG_VOCABULARY.symmetry.map(v => ({ value: v, label: v })),
  },
  {
    label: 'Difficulty',
    type: 'difficulty',
    chips: [
      { value: 'beginner',     label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced',     label: 'Advanced' },
    ],
  },
];

// ─── Filter / sort (pure functions — no DOM access) ───────────────────────────

export function filterEntries(
  entries: Entry[],
  activeFilters: ActiveFilters,
  search: string,
): Entry[] {
  return entries.filter(entry => {
    if (search && !entry.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeFilters.status.size > 0 && !activeFilters.status.has(entry.status)) return false;
    if (activeFilters.difficulty.size > 0 && !activeFilters.difficulty.has(entry.difficulty)) return false;
    for (const group of ['constructionMethod', 'tradition', 'patternType', 'symmetry'] as const) {
      const active = activeFilters[group];
      if (active.size > 0) {
        const entryTags = new Set(entry.tags?.[group] ?? []);
        if (![...active].some(t => entryTags.has(t))) return false;
      }
    }
    return true;
  });
}

export function sortEntries(entries: Entry[], sortKey: SortKey): Entry[] {
  const sorted = [...entries];
  if (sortKey === 'newest') {
    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortKey === 'oldest') {
    sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  }
  return sorted;
}
