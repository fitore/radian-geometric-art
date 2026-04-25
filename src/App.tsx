import { useReducer, useEffect, useCallback, useState, useRef } from 'react';
import type { AppState, AppAction, ActiveFilters, Entry, SortKey } from './types.js';
import { storage } from './data.js';
import { SIDEBAR_GROUPS, filterEntries, sortEntries } from './gallery.js';
import type { SidebarGroup } from './gallery.js';
import { Gallery } from './components/Gallery.js';
import { EntryForm } from './components/EntryForm.js';
import { SettingsPanel } from './components/SettingsPanel.js';
import { Footer } from './components/Footer.js';
import { AboutPage } from './components/AboutPage.js';
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
  sidebarOpen:    false,
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

    case 'SIDEBAR_TOGGLED':
      return { ...state, sidebarOpen: !state.sidebarOpen };

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
  const [isDark, setIsDark] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    initTheme();
    dispatch({ type: 'ENTRIES_RELOADED', entries: storage.getAllEntries() });
    setIsDark(document.documentElement.dataset['theme'] === 'dark');
  }, []);

  const reloadEntries = useCallback(() => {
    dispatch({ type: 'ENTRIES_RELOADED', entries: storage.getAllEntries() });
  }, []);

  const handleSave = useCallback((saved: Entry) => {
    void saved;
    reloadEntries();
    dispatch({ type: 'FORM_CLOSED' });
  }, [reloadEntries]);

  const handleDelete = useCallback((_id: string) => {
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

  const handleThemeToggle = useCallback(() => {
    toggleTheme();
    setIsDark(document.documentElement.dataset['theme'] === 'dark');
  }, []);

  const filtered = filterEntries(state.entries, state.activeFilters, state.search);
  const sorted   = sortEntries(filtered, state.sort);

  const selectedEntry = state.selectedEntryId
    ? state.entries.find(e => e.id === state.selectedEntryId) ?? null
    : null;

  const formEntry = state.formMode === 'edit' ? selectedEntry : null;

  // escapeHtml imported to satisfy module boundary rules
  void escapeHtml;

  const bgDecorations = (
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
    </>
  );

  if (showAbout) {
    return (
      <>
        {bgDecorations}
        <AboutPage onBack={() => setShowAbout(false)} />
      </>
    );
  }

  return (
    <>
      {bgDecorations}

      <div className="app">

        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="wordmark">
              <div className="wordmark-title">RADIAN</div>
              <div className="wordmark-sep"></div>
              <div className="wordmark-sub">Where Art and Mathematics Unite</div>
            </div>
          </div>
          <div className="header-actions">
            <SettingsDropdown
              isDark={isDark}
              onThemeToggle={handleThemeToggle}
              onImport={() => document.getElementById('importFileInput')?.click()}
              onExport={handleExport}
              onOpenSettings={() => dispatch({ type: 'SETTINGS_OPENED' })}
            />
            <button className="btn btn--primary" onClick={() => dispatch({ type: 'FORM_OPENED_NEW' })}>
              + Add piece
            </button>
          </div>
        </header>

        {/* Main gallery */}
        <main className="main" id="mainArea">
          {/* Collection header row */}
          <div className="gallery-header">
            <div className="gallery-header-left">
              <GalleryTitle filtered={filtered.length} total={state.entries.length} />
            </div>
            <div className="gallery-header-right">
              <div className="search-wrap">
                <span className="search-icon" aria-hidden="true">⌕</span>
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search..."
                  autoComplete="off"
                  value={state.search}
                  onChange={e => dispatch({ type: 'SEARCH_CHANGED', search: e.target.value.trim() })}
                />
              </div>
              <div className="sort-wrap">
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
          </div>

          {/* Filter chips bar */}
          <FilterBar
            activeFilters={state.activeFilters}
            onToggle={(filterType, value) => dispatch({ type: 'FILTER_TOGGLED', filterType, value })}
            onClear={() => dispatch({ type: 'FILTERS_CLEARED' })}
          />

          {/* Active filter strip */}
          <ActiveFilterStrip
            activeFilters={state.activeFilters}
            onToggle={(filterType, value) => dispatch({ type: 'FILTER_TOGGLED', filterType, value })}
            onClear={() => dispatch({ type: 'FILTERS_CLEARED' })}
          />

          <Gallery
            entries={sorted}
            activeFilters={state.activeFilters}
            selectedId={state.selectedEntryId}
            totalCount={state.entries.length}
            onSelect={handleEntrySelect}
            onAddNew={() => dispatch({ type: 'FORM_OPENED_NEW' })}
          />
        </main>

        <Footer onAbout={() => setShowAbout(true)} />

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
        onDelete={handleDelete}
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

// ─── Settings dropdown ────────────────────────────────────────────────────────

interface SettingsDropdownProps {
  isDark: boolean;
  onThemeToggle: () => void;
  onImport: () => void;
  onExport: () => void;
  onOpenSettings: () => void;
}

function SettingsDropdown({ isDark, onThemeToggle, onImport, onExport, onOpenSettings }: SettingsDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={ref} className="settings-dropdown" data-open={String(open)}>
      <button className="btn" onClick={() => setOpen(x => !x)}>
        Settings ∨
      </button>
      <div className="settings-drop-menu">
        <button
          className="settings-drop-item"
          onClick={() => { onThemeToggle(); setOpen(false); }}
        >
          {isDark ? '☀ Light mode' : '☽ Dark mode'}
        </button>
        <div className="settings-drop-divider" />
        <button
          className="settings-drop-item"
          onClick={() => { onImport(); setOpen(false); }}
        >
          Import JSON
        </button>
        <button
          className="settings-drop-item"
          onClick={() => { onExport(); setOpen(false); }}
        >
          Export JSON
        </button>
        <div className="settings-drop-divider" />
        <button
          className="settings-drop-item"
          onClick={() => { onOpenSettings(); setOpen(false); }}
        >
          API key & cost
        </button>
      </div>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  activeFilters: ActiveFilters;
  onToggle: (filterType: keyof ActiveFilters, value: string) => void;
  onClear: () => void;
}

function FilterBar({ activeFilters, onToggle, onClear }: FilterBarProps) {
  const totalActive = Object.values(activeFilters).reduce((sum, s) => sum + s.size, 0);

  return (
    <div className="filter-bar">
      {SIDEBAR_GROUPS.map(group => (
        <FilterGroup
          key={group.type}
          group={group}
          active={activeFilters[group.type]}
          onToggle={onToggle}
        />
      ))}
      {totalActive > 0 && (
        <button className="filter-clear-btn" onClick={onClear}>
          Clear · {totalActive}
        </button>
      )}
    </div>
  );
}

// ─── Filter group (single dropdown) ──────────────────────────────────────────

interface FilterGroupProps {
  group: SidebarGroup;
  active: Set<string>;
  onToggle: (filterType: keyof ActiveFilters, value: string) => void;
}

function FilterGroup({ group, active, onToggle }: FilterGroupProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const n = active.size;

  return (
    <div ref={ref} className="filter-group" data-open={String(open)}>
      <button
        className="filter-group-btn"
        data-active={n > 0 ? 'true' : 'false'}
        onClick={() => setOpen(x => !x)}
      >
        {group.label}
        {n > 0 && <span className="filter-count">{n}</span>}
        <span aria-hidden="true">∨</span>
      </button>
      <div className="filter-pop" onClick={e => e.stopPropagation()}>
        <div className="filter-pop-chips">
          {group.chips.map(chip => (
            <button
              key={chip.value}
              className="pop-chip"
              data-active={active.has(chip.value) ? 'true' : 'false'}
              onClick={() => onToggle(group.type, chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Active filter strip ──────────────────────────────────────────────────────

interface ActiveFilterStripProps {
  activeFilters: ActiveFilters;
  onToggle: (filterType: keyof ActiveFilters, value: string) => void;
  onClear: () => void;
}

function ActiveFilterStrip({ activeFilters, onToggle, onClear }: ActiveFilterStripProps) {
  const pills: { filterType: keyof ActiveFilters; value: string; label: string }[] = [];

  for (const group of SIDEBAR_GROUPS) {
    for (const value of activeFilters[group.type]) {
      const chip = group.chips.find(c => c.value === value);
      pills.push({ filterType: group.type, value, label: chip?.label ?? value });
    }
  }

  if (pills.length === 0) return null;

  return (
    <div className="active-bar">
      <span className="active-bar-label">Filters</span>
      {pills.map(pill => (
        <span key={`${pill.filterType}:${pill.value}`} className="active-pill">
          {pill.label}
          <button
            className="active-pill-dismiss"
            onClick={() => onToggle(pill.filterType, pill.value)}
            aria-label={`Remove filter: ${pill.label}`}
          >
            ×
          </button>
        </span>
      ))}
      <button className="active-bar-clear" onClick={onClear}>
        Clear all
      </button>
    </div>
  );
}

// ─── Gallery title ────────────────────────────────────────────────────────────

function GalleryTitle({ filtered, total }: { filtered: number; total: number }) {
  let content: React.ReactNode;
  if (total === 0) {
    content = <>Your collection — <em>empty</em></>;
  } else if (filtered === total) {
    content = <>Your collection — {total} piece{total !== 1 ? 's' : ''}</>;
  } else {
    content = <>Your collection — {filtered} of {total} pieces</>;
  }
  return <div className="gallery-title" id="galleryTitle">{content}</div>;
}
