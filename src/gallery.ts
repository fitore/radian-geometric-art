import type { Entry, ActiveFilters, SortKey } from './types.js';
import { escapeHtml } from './utils.js';
import { TAG_VOCABULARY } from './data.js';

// ─── Sidebar group definitions ────────────────────────────────────────────────

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

// ─── Filter / sort ────────────────────────────────────────────────────────────

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

// ─── Card template ────────────────────────────────────────────────────────────

const STATUS_CLASS: Record<string, string> = {
  'want-to-try': 'want',
  'attempted': 'tried',
  'done': 'done',
};

function createCardHTML(entry: Entry): string {
  const statusClass = STATUS_CLASS[entry.status] ?? 'want';
  const symTags  = entry.tags?.symmetry?.slice(0, 1) ?? [];
  const tradTags = entry.tags?.tradition?.slice(0, 2) ?? [];
  const patTags  = entry.tags?.patternType?.slice(0, 1) ?? [];

  const imageContent = entry.imageUrl
    ? `<img src="${escapeHtml(entry.imageUrl)}" alt="${escapeHtml(entry.title)}" loading="lazy" onerror="this.style.opacity='0'">`
    : `<div class="card-no-image">◈</div>`;

  const analyzedBadge = entry.analysis
    ? `<div class="analyzed-badge" title="Analyzed with Claude">✦</div>`
    : '';

  const tagHtml = [
    ...symTags.map(t => `<span class="card-tag card-tag--sym">${escapeHtml(t)}</span>`),
    ...tradTags.map(t => `<span class="card-tag">${escapeHtml(t)}</span>`),
    ...patTags.map(t => `<span class="card-tag">${escapeHtml(t)}</span>`),
  ].join('');

  return `
    <div class="card" data-id="${escapeHtml(entry.id)}">
      <div class="card-img-wrap">
        ${imageContent}
        <div class="card-overlay"></div>
        <div class="status-dot status-dot--${statusClass}"></div>
        <div class="diff-badge">${escapeHtml(entry.difficulty)}</div>
        ${analyzedBadge}
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(entry.title)}</div>
        <div class="card-tags">${tagHtml}</div>
      </div>
    </div>`;
}

// ─── Render ───────────────────────────────────────────────────────────────────

export function renderGallery(
  filteredEntries: Entry[],
  totalCount: number,
  onAddNew: () => void,
): void {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  if (totalCount === 0) {
    gallery.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">◈</div>
        <div class="empty-title">Your collection is empty</div>
        <div class="empty-sub">Add your first sacred geometry piece to begin</div>
      </div>
      <div class="card-placeholder" id="placeholderCard">
        <div class="card-placeholder-inner">
          <div class="card-placeholder-icon">◈</div>
          <div class="card-placeholder-text">Add a piece</div>
        </div>
      </div>`;
    document.getElementById('placeholderCard')?.addEventListener('click', onAddNew);
    return;
  }

  if (filteredEntries.length === 0) {
    gallery.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">◈</div>
        <div class="empty-title">No pieces match your filters</div>
        <div class="empty-sub">Try clearing some filters or adjusting your search</div>
      </div>`;
    return;
  }

  gallery.innerHTML = filteredEntries.map(createCardHTML).join('');
}

export function updateGalleryTitle(filtered: number, total: number): void {
  const titleEl = document.getElementById('galleryTitle');
  if (!titleEl) return;
  if (total === 0) {
    titleEl.innerHTML = `Your collection — <strong>empty</strong>`;
  } else if (filtered === total) {
    titleEl.innerHTML = `Your collection — <strong>${total} piece${total !== 1 ? 's' : ''}</strong>`;
  } else {
    titleEl.innerHTML = `Your collection — <strong>${filtered}</strong> of <strong>${total}</strong> pieces`;
  }
  const cf = document.getElementById('countFiltered');
  const ct = document.getElementById('countTotal');
  if (cf) cf.textContent = String(filtered);
  if (ct) ct.textContent = String(total);
}
