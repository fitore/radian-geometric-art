import { useState, useEffect, useRef } from 'react';
import type { AppView, AppAction } from '../types.js';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface HeaderProps {
  currentView: AppView;
  dispatch: React.Dispatch<AppAction>;
  isDark: boolean;
  onThemeToggle: () => void;
  onImport: () => void;
  onExport: () => void;
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const showBorder = isActive || hovered;
  const borderColor = isActive ? 'var(--color-text)' : 'var(--color-border)';

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: '0.6875rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--color-text)',
        background: 'none',
        border: 'none',
        borderBottom: `2px solid ${showBorder ? borderColor : 'transparent'}`,
        padding: '0 0 2px 0',
        cursor: 'pointer',
        transition: 'border-color 150ms',
      }}
    >
      {label}
    </button>
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

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header({ currentView, dispatch, isDark, onThemeToggle, onImport, onExport }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="wordmark">
          <div className="wordmark-title">RADIAN</div>
          <div className="wordmark-sep"></div>
          <div className="wordmark-sub">Where Art and Mathematics Unite</div>
        </div>
      </div>
      <nav className="header-nav">
        <NavItem
          label="ABOUT"
          isActive={currentView === 'about'}
          onClick={() => dispatch({ type: 'NAVIGATE_TO_ABOUT' })}
        />
        <NavItem
          label="COLLECTION"
          isActive={currentView === 'gallery'}
          onClick={() => dispatch({ type: 'NAVIGATE_TO_GALLERY' })}
        />
        <NavItem
          label="+ ADD PIECE"
          isActive={currentView === 'form'}
          onClick={() => dispatch({ type: 'NAVIGATE_TO_FORM' })}
        />
      </nav>
      <div className="header-actions">
        <SettingsDropdown
          isDark={isDark}
          onThemeToggle={onThemeToggle}
          onImport={onImport}
          onExport={onExport}
          onOpenSettings={() => dispatch({ type: 'SETTINGS_OPENED' })}
        />
      </div>
    </header>
  );
}
