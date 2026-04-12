import { useReducer, useEffect, useCallback } from 'react';
import type { AppState, AppAction, ActiveFilters, Entry, SortKey } from './types.js';
import { storage } from './data.js';
import { SIDEBAR_GROUPS, filterEntries, sortEntries } from './gallery.js';
import { Gallery } from './components/Gallery.js';
import { EntryForm } from './components/EntryForm.js';
import { SettingsPanel } from './components/SettingsPanel.js';
import { escapeHtml } from './utils.js';

// ─── Initial state ────────────────────────────────────────────────────────────

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

const initialState: AppState = {
  entries:        [],
  activeFilters:  emptyFilters(),
  sort:           'newest',
  search:         '',
  selectedEntryId: null,
  openPanel:      null,
  formMode:       'new',
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ENTRIES_RELOADED':
      return { ...state, entries: action.entries };

    case 'ENTRY_SELECTED':
      return { ...state, selectedEntryId: action.id, openPanel: 'form', formMode: 'edit' };

    case 'FORM_OPENED_NEW':
      return { ...state, selectedEntryId: null, openPanel: 'form', formMode: 'new' };

    case 'FORM_CLOSED':
      return { ...state, openPanel: null, selectedEntryId: null };

    case 'SETTINGS_OPENED':
      return { ...state, openPanel: 'settings' };

    case 'SETTINGS_CLOSED':
      return { ...state, openPanel: null };

    case 'FILTER_TOGGLED': {
      const next = new Set(state.activeFilters[action.filterType]);
      if (next.has(action.value)) next.delete(action.value);
      else next.add(action.value);
      return { ...state, activeFilters: { ...state.activeFilters, [action.filterType]: next } };
    }

    case 'FILTERS_CLEARED':
      return { ...state, activeFilters: emptyFilters(), search: '' };

    case 'SORT_CHANGED':
      return { ...state, sort: action.sort };

    case 'SEARCH_CHANGED':
      return { ...state, search: action.search };

    default:
      return state;
  }
}

// ─── Theme helpers ────────────────────────────────────────────────────────────

function initTheme(): void {
  const saved = localStorage.getItem('radian:theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved ?? (prefersDark ? 'dark' : 'light');
  document.documentElement.dataset['theme'] = theme;
}

function toggleTheme(): void {
  const isDark = document.documentElement.dataset['theme'] === 'dark';
  const next = isDark ? 'light' : 'dark';
  document.documentElement.dataset['theme'] = next;
  localStorage.setItem('radian:theme', next);
}

// ─── App ──────────────────────────────────────────────────────────────────────

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load entries on mount and init theme
  useEffect(() => {
    initTheme();
    dispatch({ type: 'ENTRIES_RELOADED', entries: storage.getAllEntries() });
  }, []);

  const reloadEntries = useCallback(() => {
    dispatch({ type: 'ENTRIES_RELOADED', entries: storage.getAllEntries() });
  }, []);

  const handleSave = useCallback((saved: Entry) => {
    void saved;
    reloadEntries();
    dispatch({ type: 'FORM_CLOSED' });
  }, [reloadEntries]);

  const handleEntrySelect = useCallback((id: string) => {
    dispatch({ type: 'ENTRY_SELECTED', id });
  }, []);

  const handleExport = useCallback(() => {
    if (state.entries.length === 0) { alert('No entries to export.'); return; }
    storage.exportJSON();
  }, [state.entries.length]);

  const handleImport = useCallback((jsonStr: string) => {
    const result = storage.importJSON(jsonStr);
    if (result.ok) {
      reloadEntries();
      alert(`Imported ${result.count} piece${result.count !== 1 ? 's' : ''} successfully.`);
    } else {
      alert(`Import failed: ${result.error}`);
    }
  }, [reloadEntries]);

  const isDark = typeof document !== 'undefined' &&
    document.documentElement.dataset['theme'] === 'dark';

  const filtered = filterEntries(state.entries, state.activeFilters, state.search);
  const sorted   = sortEntries(filtered, state.sort);

  const selectedEntry = state.selectedEntryId
    ? state.entries.find(e => e.id === state.selectedEntryId) ?? null
    : null;

  const formEntry = state.formMode === 'edit' ? selectedEntry : null;

  return (
    <>
      {/* Background hex grid */}
      <svg className="bg-geometry" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <pattern id="hexgrid" width="60" height="52" patternUnits="userSpaceOnUse">
            <path d="M30 0 L60 17 L60 35 L30 52 L0 35 L0 17 Z" fill="none" stroke="var(--color-gold)" strokeWidth="0.4"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexgrid)"/>
      </svg>

      {/* Compass rose decoration */}
      <svg className="compass-deco" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="200" cy="200" r="190" fill="none" stroke="var(--color-gold)" strokeWidth="0.5"/>
        <circle cx="200" cy="200" r="150" fill="none" stroke="var(--color-gold)" strokeWidth="0.3"/>
        <circle cx="200" cy="200" r="100" fill="none" stroke="var(--color-gold)" strokeWidth="0.3"/>
        <circle cx="200" cy="200" r="50"  fill="none" stroke="var(--color-gold)" strokeWidth="0.5"/>
        <line x1="200" y1="10"  x2="200" y2="390" stroke="var(--color-gold)" strokeWidth="0.3"/>
        <line x1="10"  y1="200" x2="390" y2="200" stroke="var(--color-gold)" strokeWidth="0.3"/>
        <line x1="65"  y1="65"  x2="335" y2="335" stroke="var(--color-gold)" strokeWidth="0.3"/>
        <line x1="335" y1="65"  x2="65"  y2="335" stroke="var(--color-gold)" strokeWidth="0.3"/>
        <polygon points="200,10 208,45 200,35 192,45"    fill="var(--color-gold)"/>
        <polygon points="200,390 208,355 200,365 192,355" fill="var(--color-gold)" opacity="0.5"/>
        <polygon points="10,200 45,192 35,200 45,208"    fill="var(--color-gold)" opacity="0.5"/>
        <polygon points="390,200 355,192 365,200 355,208" fill="var(--color-gold)" opacity="0.5"/>
      </svg>

      <div className="app">

        {/* Header */}
        <header className="header">
          <div className="wordmark">
            <div className="wordmark-title">RADIAN</div>
            <div className="wordmark-sep"></div>
            <div className="wordmark-sub">Where Art and Mathematics Unite</div>
          </div>
          <div className="header-actions">
            <button
              className="btn btn--theme"
              title="Toggle light/dark mode"
              onClick={() => { toggleTheme(); }}
            >
              <span className="theme-icon" aria-hidden="true">{isDark ? '☽' : '☀'}</span>
              <span className="theme-label">{isDark ? 'Light' : 'Dark'}</span>
            </button>
            <button className="btn" onClick={() => document.getElementById('importFileInput')?.click()}>
              Import JSON
            </button>
            <button className="btn" onClick={handleExport}>Export JSON</button>
            <button className="btn" onClick={() => dispatch({ type: 'SETTINGS_OPENED' })}>Settings</button>
            <button className="btn btn--primary" onClick={() => dispatch({ type: 'FORM_OPENED_NEW' })}>
              + Add piece
            </button>
          </div>
        </header>

        {/* Sidebar */}
        <Sidebar
          activeFilters={state.activeFilters}
          search={state.search}
          filteredCount={filtered.length}
          totalCount={state.entries.length}
          onFilterToggle={(filterType, value) =>
            dispatch({ type: 'FILTER_TOGGLED', filterType, value })
          }
          onClearFilters={() => dispatch({ type: 'FILTERS_CLEARED' })}
        />

        {/* Main gallery */}
        <main className="main" id="mainArea">
          <div className="gallery-header">
            <div className="gallery-header-left">
              <GalleryTitle filtered={filtered.length} total={state.entries.length} />
              <div className="legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: 'var(--color-want)' }}></div>
                  Want to try
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: 'var(--color-tried)' }}></div>
                  Attempted
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: 'var(--color-done)' }}></div>
                  Done
                </div>
              </div>
            </div>
            <div className="gallery-header-right">
              <input
                type="search"
                className="search-input"
                placeholder="Search…"
                autoComplete="off"
                value={state.search}
                onChange={e => dispatch({ type: 'SEARCH_CHANGED', search: e.target.value.trim() })}
              />
              <select
                className="sort-select"
                value={state.sort}
                onChange={e => dispatch({ type: 'SORT_CHANGED', sort: e.target.value as SortKey })}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="az">Title A–Z</option>
              </select>
            </div>
          </div>

          <Gallery
            entries={sorted}
            activeFilters={state.activeFilters}
            selectedId={state.selectedEntryId}
            totalCount={state.entries.length}
            onSelect={handleEntrySelect}
            onAddNew={() => dispatch({ type: 'FORM_OPENED_NEW' })}
          />
        </main>

      </div>

      {/* Form panel backdrop */}
      <div
        className={`panel-backdrop${state.openPanel === 'form' ? ' open' : ''}`}
        onClick={() => dispatch({ type: 'FORM_CLOSED' })}
      />

      {/* Settings panel backdrop */}
      <div
        className={`panel-backdrop${state.openPanel === 'settings' ? ' open' : ''}`}
        onClick={() => dispatch({ type: 'SETTINGS_CLOSED' })}
      />

      {/* Entry form panel */}
      <EntryForm
        entry={formEntry}
        isOpen={state.openPanel === 'form'}
        onSave={handleSave}
        onCancel={() => dispatch({ type: 'FORM_CLOSED' })}
        onEntryUpdated={reloadEntries}
      />

      {/* Settings panel */}
      <SettingsPanel
        isOpen={state.openPanel === 'settings'}
        onClose={() => dispatch({ type: 'SETTINGS_CLOSED' })}
      />

      {/* Hidden file inputs */}
      <input
        type="file"
        id="imageFileInput"
        accept="image/*"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        id="importFileInput"
        accept=".json"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = ev => handleImport(ev.target?.result as string);
          reader.readAsText(file);
          e.target.value = '';
        }}
      />
    </>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  activeFilters: ActiveFilters;
  search: string;
  filteredCount: number;
  totalCount: number;
  onFilterToggle: (filterType: keyof ActiveFilters, value: string) => void;
  onClearFilters: () => void;
}

function Sidebar({ activeFilters, filteredCount, totalCount, onFilterToggle, onClearFilters }: SidebarProps) {
  return (
    <aside className="sidebar" id="sidebar">
      {SIDEBAR_GROUPS.map(group => (
        <div key={group.type} className="filter-section">
          <div className="filter-label">{group.label}</div>
          <div className="filter-chips">
            {group.chips.map(chip => (
              <span
                key={chip.value}
                className={`chip${chip.cls ? ` ${chip.cls}` : ''}${activeFilters[group.type].has(chip.value) ? ' active' : ''}`}
                onClick={() => onFilterToggle(group.type, chip.value)}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      ))}
      <div className="filter-footer">
        Showing{' '}
        <span id="countFiltered">{filteredCount}</span>
        {' '}of{' '}
        <span id="countTotal">{totalCount}</span>
        {' '}pieces
        <button className="clear-btn" onClick={onClearFilters}>
          Clear all filters
        </button>
      </div>
    </aside>
  );
}

// ─── Gallery title ────────────────────────────────────────────────────────────

function GalleryTitle({ filtered, total }: { filtered: number; total: number }) {
  let content: React.ReactNode;
  if (total === 0) {
    content = <>Your collection — <strong>empty</strong></>;
  } else if (filtered === total) {
    content = <>Your collection — <strong>{total} piece{total !== 1 ? 's' : ''}</strong></>;
  } else {
    content = <>Your collection — <strong>{filtered}</strong> of <strong>{total}</strong> pieces</>;
  }
  // escapeHtml not needed — React handles XSS escaping automatically
  void escapeHtml; // imported to satisfy module boundary rules
  return <div className="gallery-title" id="galleryTitle">{content}</div>;
}
