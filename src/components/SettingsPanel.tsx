import { useState } from 'react';
import { getApiKey, setApiKey, getSessionCostCents } from '../api.js';
import { formatCost } from '../utils.js';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── SettingsPanel ────────────────────────────────────────────────────────────

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState(false);
  // Re-render on key changes by holding a version counter
  const [keyVersion, setKeyVersion] = useState(0);

  const currentKey  = getApiKey();
  const maskedKey   = currentKey
    ? currentKey.slice(0, 7) + '•'.repeat(Math.max(0, currentKey.length - 11)) + currentKey.slice(-4)
    : '';
  const costDisplay = formatCost(getSessionCostCents());
  const isDark      = typeof document !== 'undefined' &&
    document.documentElement.dataset['theme'] === 'dark';

  function handleSetKey() {
    const val = keyInput.trim();
    if (!val.startsWith('sk-ant-') && !val.startsWith('sk-')) {
      setKeyError(true);
      return;
    }
    setApiKey(val);
    setKeyInput('');
    setKeyError(false);
    setKeyVersion(v => v + 1);
  }

  function handleClearKey() {
    setApiKey('');
    setKeyVersion(v => v + 1);
  }

  function handleThemeToggle() {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.dataset['theme'] = next;
    localStorage.setItem('radian:theme', next);
    // force re-render
    setKeyVersion(v => v + 1);
  }

  void keyVersion; // used to trigger re-render

  return (
    <>
      <div className={`settings-panel${isOpen ? ' open' : ''}`} role="dialog" aria-label="Settings">
        <div className="form-panel-header">
          <div className="form-panel-title">SETTINGS</div>
          <button className="icon-btn" title="Close" aria-label="Close settings" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-body">

          {/* API Key */}
          <div className="settings-section">
            <div className="settings-label">API Key</div>
            <div className="settings-hint">
              Used for Pattern Analysis. Stays in memory — never persisted.
            </div>
            {currentKey ? (
              <>
                <div className="settings-key-display">{maskedKey}</div>
                <button className="btn btn--action" onClick={handleClearKey}>Clear key</button>
              </>
            ) : (
              <>
                <div className="settings-key-input-row">
                  <input
                    type="password"
                    className="field-input"
                    placeholder="sk-ant-…"
                    autoComplete="off"
                    spellCheck={false}
                    value={keyInput}
                    onChange={e => { setKeyInput(e.target.value); setKeyError(false); }}
                  />
                  <button className="btn btn--primary" onClick={handleSetKey}>Set key</button>
                </div>
                {keyError && (
                  <div className="field-error visible">Enter a valid Anthropic API key</div>
                )}
              </>
            )}
          </div>

          {/* Session cost */}
          <div className="settings-section">
            <div className="settings-label">Session cost</div>
            <div className="settings-hint">
              Accumulated API spend this session (resets on page reload).
            </div>
            <div className="settings-cost-display">{costDisplay}</div>
          </div>

          {/* Theme */}
          <div className="settings-section">
            <div className="settings-label">Theme</div>
            <div className="theme-toggle-row">
              <span className="settings-hint">Current: {isDark ? 'Dark' : 'Light'}</span>
              <button className="btn" onClick={handleThemeToggle}>
                Switch to {isDark ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
