import './styles/index.css';

import type { AppState, Entry, ActiveFilters } from './types.js';
import { storage } from './data.js';
import { SIDEBAR_GROUPS, filterEntries, sortEntries, renderGallery, updateGalleryTitle } from './gallery.js';
import { renderForm, populateForm, clearForm, saveCurrentEntry } from './form.js';
import { renderSettings, triggerAnalysis, renderAnalysisResult, triggerTemplateExtraction } from './panels.js';
import { escapeHtml } from './utils.js';

// ─── Global state ─────────────────────────────────────────────────────────────

const state: AppState = {
  entries: [],
  activeFilters: {
    status:             new Set(),
    difficulty:         new Set(),
    constructionMethod: new Set(),
    tradition:          new Set(),
    patternType:        new Set(),
    symmetry:           new Set(),
  },
  sort: 'newest',
  search: '',
};

// ─── Gallery refresh ──────────────────────────────────────────────────────────

function refreshGallery(): void {
  const filtered = filterEntries(state.entries, state.activeFilters, state.search);
  const sorted   = sortEntries(filtered, state.sort);
  renderGallery(sorted, state.entries.length, openFormNew);
  updateGalleryTitle(filtered.length, state.entries.length);
}

// ─── Form panel ───────────────────────────────────────────────────────────────

function openFormNew(): void {
  document.getElementById('formTitle')!.textContent = 'NEW PIECE';
  clearForm();
  setFormPanelOpen(true);
  setTimeout(() => (document.getElementById('fieldTitle') as HTMLInputElement)?.focus(), 360);
}

function openFormEdit(id: string): void {
  const entry = storage.getEntry(id);
  if (!entry) return;
  document.getElementById('formTitle')!.textContent = 'EDIT PIECE';
  populateForm(entry);
  setFormPanelOpen(true);
  showFormActions(entry);

  // If entry already has analysis, render it
  if (entry.analysis) {
    renderAnalysisResult(entry, onEntryUpdated);
  }
}

function closeForm(): void {
  setFormPanelOpen(false);
}

function setFormPanelOpen(open: boolean): void {
  document.getElementById('formPanel')?.classList.toggle('open', open);
  document.getElementById('formBackdrop')?.classList.toggle('open', open);
}

function showFormActions(entry: Entry): void {
  const actions = document.getElementById('formActions');
  if (actions) actions.hidden = !entry.imageUrl;
}

// Called whenever an entry is updated via a panel action (analysis / template)
function onEntryUpdated(updated: Entry): void {
  state.entries = storage.getAllEntries();
  refreshGallery();
  // Keep form actions visible/synced
  showFormActions(updated);
}

// ─── Settings panel ───────────────────────────────────────────────────────────

function openSettings(): void {
  renderSettings();
  document.getElementById('settingsPanel')?.classList.add('open');
  document.getElementById('settingsBackdrop')?.classList.add('open');
}

function closeSettings(): void {
  document.getElementById('settingsPanel')?.classList.remove('open');
  document.getElementById('settingsBackdrop')?.classList.remove('open');
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function renderSidebar(): void {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = SIDEBAR_GROUPS.map(group => `
    <div class="filter-section">
      <div class="filter-label">${escapeHtml(group.label)}</div>
      <div class="filter-chips">
        ${group.chips.map(chip => `
          <span class="chip ${chip.cls ? escapeHtml(chip.cls) : ''}"
                data-filter-type="${escapeHtml(group.type)}"
                data-filter-value="${escapeHtml(chip.value)}">${escapeHtml(chip.label)}</span>
        `).join('')}
      </div>
    </div>
  `).join('') + `
    <div class="filter-footer">
      Showing <span id="countFiltered">0</span> of <span id="countTotal">0</span> pieces
      <button class="clear-btn" id="clearFilters">Clear all filters</button>
    </div>`;

  sidebar.querySelectorAll<HTMLElement>('.chip[data-filter-type]').forEach(chip => {
    chip.addEventListener('click', () => {
      const type  = chip.dataset['filterType'] as keyof ActiveFilters;
      const value = chip.dataset['filterValue'] ?? '';
      if (!state.activeFilters[type]) return;
      if (state.activeFilters[type].has(value)) {
        state.activeFilters[type].delete(value);
        chip.classList.remove('active');
      } else {
        state.activeFilters[type].add(value);
        chip.classList.add('active');
      }
      refreshGallery();
    });
  });

  document.getElementById('clearFilters')?.addEventListener('click', () => {
    for (const key of Object.keys(state.activeFilters) as Array<keyof ActiveFilters>) {
      state.activeFilters[key].clear();
    }
    sidebar.querySelectorAll('.chip.active').forEach(c => c.classList.remove('active'));
    state.search = '';
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInput) searchInput.value = '';
    refreshGallery();
  });
}

// ─── Theme ────────────────────────────────────────────────────────────────────

function initTheme(): void {
  const saved = localStorage.getItem('radian:theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  // Default is light; only switch to dark if explicitly saved or OS preference (and no explicit save)
  const theme = saved ?? (prefersDark ? 'dark' : 'light');
  document.documentElement.dataset['theme'] = theme;
  updateHeaderThemeBtn();
}

function updateHeaderThemeBtn(): void {
  const isDark = document.documentElement.dataset['theme'] === 'dark';
  const icon  = document.querySelector<HTMLElement>('.theme-icon');
  const label = document.querySelector<HTMLElement>('.theme-label');
  if (icon)  icon.textContent  = isDark ? '☽' : '☀';
  if (label) label.textContent = isDark ? 'Light' : 'Dark';
}

// ─── init ─────────────────────────────────────────────────────────────────────

function init(): void {
  initTheme();
  renderSidebar();
  renderForm();

  state.entries = storage.getAllEntries();
  refreshGallery();

  // ── Header ──

  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const isDark = document.documentElement.dataset['theme'] === 'dark';
    document.documentElement.dataset['theme'] = isDark ? 'light' : 'dark';
    updateHeaderThemeBtn();
    localStorage.setItem('radian:theme', isDark ? 'light' : 'dark');
  });

  document.getElementById('addBtn')?.addEventListener('click', openFormNew);
  document.getElementById('settingsBtn')?.addEventListener('click', openSettings);

  document.getElementById('exportBtn')?.addEventListener('click', () => {
    if (state.entries.length === 0) { alert('No entries to export.'); return; }
    storage.exportJSON();
  });

  document.getElementById('importBtn')?.addEventListener('click', () => {
    document.getElementById('importFileInput')?.click();
  });

  (document.getElementById('importFileInput') as HTMLInputElement)?.addEventListener('change', e => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = storage.importJSON(ev.target?.result as string);
      if (result.ok) {
        state.entries = storage.getAllEntries();
        refreshGallery();
        alert(`Imported ${result.count} piece${result.count !== 1 ? 's' : ''} successfully.`);
      } else {
        alert(`Import failed: ${result.error}`);
      }
      (e.target as HTMLInputElement).value = '';
    };
    reader.readAsText(file);
  });

  // ── Gallery ──

  document.getElementById('gallery')?.addEventListener('click', e => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.card[data-id]');
    if (card?.dataset['id']) openFormEdit(card.dataset['id']);
  });

  (document.getElementById('searchInput') as HTMLInputElement)?.addEventListener('input', e => {
    state.search = (e.target as HTMLInputElement).value.trim();
    refreshGallery();
  });

  (document.getElementById('sortSelect') as HTMLSelectElement)?.addEventListener('change', e => {
    state.sort = (e.target as HTMLSelectElement).value as AppState['sort'];
    refreshGallery();
  });

  // ── Form panel ──

  document.getElementById('formClose')?.addEventListener('click', closeForm);
  document.getElementById('btnCancel')?.addEventListener('click', closeForm);
  document.getElementById('formBackdrop')?.addEventListener('click', closeForm);

  document.getElementById('btnSave')?.addEventListener('click', () => {
    saveCurrentEntry(saved => {
      state.entries = storage.getAllEntries();
      closeForm();
      refreshGallery();
      // Show actions now that entry is persisted (may have imageUrl)
      void saved; // used above indirectly
    });
  });

  // ── Image file upload ──

  (document.getElementById('imageFileInput') as HTMLInputElement)?.addEventListener('change', e => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUri = ev.target?.result as string;
      (document.getElementById('fieldImageUrl') as HTMLInputElement).value = dataUri;
      // Trigger preview update manually
      (document.getElementById('fieldImageUrl') as HTMLInputElement).dispatchEvent(new Event('input'));
      // Show form actions since we now have an image
      const actions = document.getElementById('formActions');
      if (actions) actions.hidden = false;
    };
    reader.readAsDataURL(file);
    (e.target as HTMLInputElement).value = '';
  });

  // ── v2 feature buttons (delegated — buttons live inside form body) ──

  document.getElementById('formBody')?.addEventListener('click', async e => {
    const target = e.target as HTMLElement;

    if (target.id === 'btnAnalyze') {
      // Get current entry (may be unsaved edit; use saved state for analysis)
      const id = (document.getElementById('fieldEntryId') as HTMLInputElement).value;
      const entry = id ? storage.getEntry(id) : null;
      if (!entry) {
        const section = document.getElementById('analysisSection');
        if (section) {
          section.hidden = false;
          section.innerHTML = `<div class="analysis-notice analysis-notice--warn">Save the entry first, then analyze.</div>`;
        }
        return;
      }
      await triggerAnalysis(entry, onEntryUpdated);
    }

    if (target.id === 'btnExtract') {
      const id = (document.getElementById('fieldEntryId') as HTMLInputElement).value;
      const entry = id ? storage.getEntry(id) : null;
      if (!entry) {
        const section = document.getElementById('templateSection');
        if (section) {
          section.hidden = false;
          section.innerHTML = `<div class="analysis-notice analysis-notice--warn">Save the entry first, then extract.</div>`;
        }
        return;
      }
      await triggerTemplateExtraction(entry, onEntryUpdated);
    }
  });

  // Show form actions when image URL is typed directly
  document.getElementById('fieldImageUrl')?.addEventListener('input', e => {
    const val = (e.target as HTMLInputElement).value.trim();
    const actions = document.getElementById('formActions');
    if (actions) actions.hidden = !val;
  });

  // ── Settings panel ──

  document.getElementById('settingsClose')?.addEventListener('click', closeSettings);
  document.getElementById('settingsBackdrop')?.addEventListener('click', closeSettings);
}

document.addEventListener('DOMContentLoaded', init);
