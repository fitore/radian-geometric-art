import type { Entry, ExtractionParams } from './types.js';
import { escapeHtml, formatCost, formatDate } from './utils.js';
import { callClaude, hasApiKey, getApiKey, setApiKey, getSessionCostCents } from './api.js';
import { storage } from './data.js';
import { extractTemplate, downloadPng, DEFAULT_PARAMS } from './canvas.js';
import { populateForm } from './form.js';

// ─── Settings panel ───────────────────────────────────────────────────────────

export function renderSettings(): void {
  const body = document.getElementById('settingsBody');
  if (!body) return;

  const currentKey = getApiKey();
  const maskedKey = currentKey
    ? currentKey.slice(0, 7) + '•'.repeat(Math.max(0, currentKey.length - 11)) + currentKey.slice(-4)
    : '';
  const costDisplay = formatCost(getSessionCostCents());

  body.innerHTML = `
    <div class="settings-section">
      <div class="settings-label">API Key</div>
      <div class="settings-hint">Used for Pattern Analysis. Stays in memory — never persisted.</div>
      ${currentKey
        ? `<div class="settings-key-display">${escapeHtml(maskedKey)}</div>
           <button class="btn btn--action" id="btnClearKey">Clear key</button>`
        : `<div class="settings-key-input-row">
             <input type="password" class="field-input" id="settingsApiKey"
                    placeholder="sk-ant-…" autocomplete="off" spellcheck="false">
             <button class="btn btn--primary" id="btnSetKey">Set key</button>
           </div>
           <div class="field-error" id="keyError">Enter a valid Anthropic API key</div>`
      }
    </div>

    <div class="settings-section">
      <div class="settings-label">Session cost</div>
      <div class="settings-hint">Accumulated API spend this session (resets on page reload).</div>
      <div class="settings-cost-display">${escapeHtml(costDisplay)}</div>
    </div>

    <div class="settings-section">
      <div class="settings-label">Theme</div>
      <div class="theme-toggle-row">
        <span class="settings-hint">Current: ${document.documentElement.dataset['theme'] === 'dark' ? 'Dark' : 'Light'}</span>
        <button class="btn" id="settingsThemeToggle">
          Switch to ${document.documentElement.dataset['theme'] === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>
    </div>
  `;

  // Wire key actions
  document.getElementById('btnSetKey')?.addEventListener('click', () => {
    const input = document.getElementById('settingsApiKey') as HTMLInputElement;
    const val = input?.value?.trim() ?? '';
    if (!val.startsWith('sk-ant-') && !val.startsWith('sk-')) {
      document.getElementById('keyError')?.classList.add('visible');
      return;
    }
    setApiKey(val);
    renderSettings(); // re-render to show masked key
  });

  document.getElementById('btnClearKey')?.addEventListener('click', () => {
    setApiKey('');
    renderSettings();
  });

  document.getElementById('settingsThemeToggle')?.addEventListener('click', () => {
    const isDark = document.documentElement.dataset['theme'] === 'dark';
    document.documentElement.dataset['theme'] = isDark ? 'light' : 'dark';
    updateHeaderThemeBtn();
    localStorage.setItem('radian:theme', isDark ? 'light' : 'dark');
    renderSettings();
  });
}

function updateHeaderThemeBtn(): void {
  const isDark = document.documentElement.dataset['theme'] === 'dark';
  const icon  = document.querySelector<HTMLElement>('.theme-icon');
  const label = document.querySelector<HTMLElement>('.theme-label');
  if (icon)  icon.textContent  = isDark ? '☽' : '☀';
  if (label) label.textContent = isDark ? 'Light' : 'Dark';
}

// ─── Analysis panel (rendered inside form body) ───────────────────────────────

export async function triggerAnalysis(entry: Entry, onComplete: (updated: Entry) => void): Promise<void> {
  const section = document.getElementById('analysisSection');
  if (!section) return;

  if (!hasApiKey()) {
    section.hidden = false;
    section.innerHTML = `
      <div class="analysis-notice analysis-notice--warn">
        No API key configured. Add one in <strong>Settings</strong> to use pattern analysis.
      </div>`;
    return;
  }

  if (!entry.imageUrl) {
    section.hidden = false;
    section.innerHTML = `
      <div class="analysis-notice analysis-notice--warn">
        Save the entry with an image before analyzing.
      </div>`;
    return;
  }

  section.hidden = false;
  section.innerHTML = `
    <div class="analysis-loading">
      <div class="spinner" aria-label="Analyzing…"></div>
      <div class="analysis-loading-text">Analyzing with Claude…</div>
    </div>`;

  try {
    const analysis = await callClaude('analyze', { imageUrl: entry.imageUrl });
    const updated: Entry = { ...entry, analysis };
    storage.saveEntry(updated);
    renderAnalysisResult(updated, onComplete);
    onComplete(updated);
  } catch (err) {
    section.innerHTML = `
      <div class="analysis-notice analysis-notice--error">
        Analysis failed: ${escapeHtml(err instanceof Error ? err.message : String(err))}
      </div>`;
  }
}

export function renderAnalysisResult(entry: Entry, _onApply: (updated: Entry) => void): void {
  const section = document.getElementById('analysisSection');
  if (!section || !entry.analysis) return;
  section.hidden = false;

  const a = entry.analysis;

  const fieldRow = (label: string, field: { primary: string; secondary?: string; confidence: string; rationale: string }): string => `
    <div class="analysis-field">
      <div class="analysis-field-header">
        <span class="analysis-field-label">${escapeHtml(label)}</span>
        <span class="analysis-confidence analysis-confidence--${escapeHtml(field.confidence)}">${escapeHtml(field.confidence)}</span>
      </div>
      <div class="analysis-field-value">${escapeHtml(field.primary)}${field.secondary ? ` <span class="analysis-secondary">+ ${escapeHtml(field.secondary)}</span>` : ''}</div>
      <div class="analysis-rationale">${escapeHtml(field.rationale)}</div>
    </div>`;

  const proportionRow = (): string => `
    <div class="analysis-field">
      <div class="analysis-field-header">
        <span class="analysis-field-label">Proportion</span>
        <span class="analysis-confidence analysis-confidence--${escapeHtml(a.proportion.confidence)}">${escapeHtml(a.proportion.confidence)}</span>
      </div>
      <div class="analysis-field-value">${a.proportion.detected.length > 0 ? a.proportion.detected.map(escapeHtml).join(', ') : '—'}</div>
      <div class="analysis-rationale">${escapeHtml(a.proportion.rationale)}</div>
    </div>`;

  section.innerHTML = `
    <div class="analysis-panel">
      <div class="analysis-header">
        <span class="analysis-title">✦ Pattern Analysis</span>
        <span class="analysis-meta">
          ${escapeHtml(a.promptVersion)} · ${formatDate(a.analyzedAt)}
        </span>
      </div>

      <div class="analysis-description">${escapeHtml(a.description)}</div>

      <div class="analysis-fields">
        ${fieldRow('Construction', a.constructionMethod)}
        ${fieldRow('Tradition', a.tradition)}
        ${fieldRow('Pattern type', a.patternType)}
        ${fieldRow('Symmetry', a.symmetry)}
        ${proportionRow()}
      </div>

      ${a.constructionNotes ? `<div class="analysis-notes">${escapeHtml(a.constructionNotes)}</div>` : ''}

      <div class="analysis-actions">
        <button type="button" class="btn btn--primary" id="btnApplyTags">Apply suggested tags</button>
        <span class="analysis-difficulty-hint">Suggested difficulty: <strong>${escapeHtml(a.suggestedDifficulty)}</strong></span>
      </div>
    </div>`;

  document.getElementById('btnApplyTags')?.addEventListener('click', () => {
    // Build a partial entry with tags derived from analysis
    const suggested: Partial<Entry> = {
      tags: {
        constructionMethod: a.constructionMethod.primary !== 'uncertain' ? [a.constructionMethod.primary] : [],
        tradition: [
          ...(a.tradition.primary !== 'uncertain' ? [a.tradition.primary] : []),
          ...(a.tradition.secondary ? [a.tradition.secondary] : []),
        ],
        patternType: [
          ...(a.patternType.primary !== 'uncertain' ? [a.patternType.primary] : []),
          ...(a.patternType.secondary ? [a.patternType.secondary] : []),
        ],
        symmetry: a.symmetry.primary !== 'uncertain' && a.symmetry.primary !== 'none'
          ? [a.symmetry.primary]
          : [],
        proportion: a.proportion.detected,
      },
      difficulty: a.suggestedDifficulty,
    };
    // Merge into current form state without overwriting other fields
    const current = entry;
    populateForm({ ...current, ...suggested });
  });
}

// ─── Template panel (rendered inside form body) ───────────────────────────────

export async function triggerTemplateExtraction(entry: Entry, onComplete: (updated: Entry) => void): Promise<void> {
  const section = document.getElementById('templateSection');
  if (!section) return;

  if (!entry.imageUrl) {
    section.hidden = false;
    section.innerHTML = `
      <div class="analysis-notice analysis-notice--warn">
        Save the entry with an image before extracting a template.
      </div>`;
    return;
  }

  section.hidden = false;
  renderTemplateControls(entry, DEFAULT_PARAMS, onComplete);
}

function renderTemplateControls(
  entry: Entry,
  params: ExtractionParams,
  onComplete: (updated: Entry) => void,
): void {
  const section = document.getElementById('templateSection');
  if (!section) return;

  section.innerHTML = `
    <div class="template-panel">
      <div class="analysis-header">
        <span class="analysis-title">◈ Line Template</span>
      </div>

      <div class="template-controls">
        <div class="template-control">
          <label class="field-label" for="ctrlSensitivity">Edge sensitivity <span class="ctrl-value" id="valSensitivity">${params.edgeSensitivity}</span></label>
          <input type="range" id="ctrlSensitivity" min="5" max="100" value="${params.edgeSensitivity}" class="range-input">
        </div>
        <div class="template-control">
          <label class="field-label" for="ctrlEdgeMax">Edge max <span class="ctrl-value" id="valEdgeMax">${params.edgeMax}</span></label>
          <input type="range" id="ctrlEdgeMax" min="30" max="255" value="${params.edgeMax}" class="range-input">
        </div>
        <div class="template-control">
          <label class="field-label" for="ctrlBlur">Pre-blur <span class="ctrl-value" id="valBlur">${params.blurRadius}</span></label>
          <input type="range" id="ctrlBlur" min="0" max="4" value="${params.blurRadius}" class="range-input">
        </div>
        <div class="template-control">
          <label class="field-label" for="ctrlWeight">Line weight <span class="ctrl-value" id="valWeight">${params.lineWeight}</span></label>
          <input type="range" id="ctrlWeight" min="1" max="6" value="${params.lineWeight}" class="range-input">
        </div>
        <div class="template-control template-control--inline">
          <label class="field-label" for="ctrlInvert">Invert (white lines on black)</label>
          <input type="checkbox" id="ctrlInvert" ${params.invert ? 'checked' : ''} class="check-input">
        </div>
      </div>

      <div class="template-preview-wrap">
        <div class="template-loading" id="templateLoading">
          <div class="spinner" aria-label="Extracting…"></div>
          <div class="analysis-loading-text">Extracting edges…</div>
        </div>
        <canvas id="templateCanvas" class="template-canvas" hidden></canvas>
      </div>

      <div class="analysis-actions">
        <button type="button" class="btn btn--action" id="btnReExtract">Update preview</button>
        <button type="button" class="btn btn--primary" id="btnDownloadTemplate" disabled>Download PNG</button>
        <button type="button" class="btn btn--action" id="btnSaveTemplate" disabled>Save to entry</button>
      </div>
    </div>`;

  let currentParams = { ...params };
  let currentDataUrl: string | null = null;

  function readControls(): ExtractionParams {
    return {
      edgeSensitivity: Number((document.getElementById('ctrlSensitivity') as HTMLInputElement).value),
      edgeMax:         Number((document.getElementById('ctrlEdgeMax') as HTMLInputElement).value),
      blurRadius:      Number((document.getElementById('ctrlBlur') as HTMLInputElement).value),
      lineWeight:      Number((document.getElementById('ctrlWeight') as HTMLInputElement).value),
      invert:          (document.getElementById('ctrlInvert') as HTMLInputElement).checked,
    };
  }

  function updateLabels(p: ExtractionParams): void {
    (document.getElementById('valSensitivity') as HTMLElement).textContent = String(p.edgeSensitivity);
    (document.getElementById('valEdgeMax') as HTMLElement).textContent = String(p.edgeMax);
    (document.getElementById('valBlur') as HTMLElement).textContent = String(p.blurRadius);
    (document.getElementById('valWeight') as HTMLElement).textContent = String(p.lineWeight);
  }

  // Wire range labels
  ['ctrlSensitivity', 'ctrlEdgeMax', 'ctrlBlur', 'ctrlWeight'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      updateLabels(readControls());
    });
  });

  async function runExtraction(): Promise<void> {
    currentParams = readControls();
    const loading = document.getElementById('templateLoading');
    const canvas  = document.getElementById('templateCanvas') as HTMLCanvasElement;
    const dlBtn   = document.getElementById('btnDownloadTemplate') as HTMLButtonElement;
    const saveBtn = document.getElementById('btnSaveTemplate') as HTMLButtonElement;

    if (loading) loading.style.display = 'flex';
    canvas.hidden = true;
    dlBtn.disabled = true;
    saveBtn.disabled = true;

    try {
      const result = await extractTemplate(entry.imageUrl, currentParams);
      currentDataUrl = result.dataUrl;

      // Draw to canvas
      const ctx = canvas.getContext('2d')!;
      canvas.width  = result.width;
      canvas.height = result.height;
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        if (loading) loading.style.display = 'none';
        canvas.hidden = false;
        dlBtn.disabled = false;
        saveBtn.disabled = false;
      };
      img.src = result.dataUrl;
    } catch (err) {
      if (loading) loading.style.display = 'none';
      const wrap = document.querySelector('.template-preview-wrap');
      if (wrap) wrap.innerHTML = `<div class="analysis-notice analysis-notice--error">Extraction failed: ${escapeHtml(err instanceof Error ? err.message : String(err))}</div>`;
    }
  }

  document.getElementById('btnReExtract')?.addEventListener('click', runExtraction);

  document.getElementById('btnDownloadTemplate')?.addEventListener('click', () => {
    if (!currentDataUrl) return;
    const slug = entry.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    downloadPng(currentDataUrl, `radian-template-${slug}.png`);
  });

  document.getElementById('btnSaveTemplate')?.addEventListener('click', () => {
    if (!currentDataUrl) return;
    const storageKey = `${entry.id}-template`;
    storage.saveTemplate(storageKey, currentDataUrl);
    const updated: Entry = {
      ...entry,
      template: {
        storageKey,
        extractionParams: currentParams,
        extractedAt: new Date().toISOString(),
      },
    };
    storage.saveEntry(updated);
    onComplete(updated);

    const saveBtn = document.getElementById('btnSaveTemplate') as HTMLButtonElement;
    saveBtn.textContent = 'Saved ✓';
    saveBtn.disabled = true;
  });

  // Run immediately on open
  runExtraction();
}
