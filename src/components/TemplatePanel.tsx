import { useState, useEffect, useRef } from 'react';
import type { Entry, ExtractionParams } from '../types.js';
import { storage } from '../data.js';
import { extractTemplate, downloadPng, DEFAULT_PARAMS } from '../canvas.js';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TemplatePanelProps {
  entry: Entry;
  onComplete: (updated: Entry) => void;
}

// ─── TemplatePanel ────────────────────────────────────────────────────────────

export function TemplatePanel({ entry, onComplete }: TemplatePanelProps) {
  const [params, setParams] = useState<ExtractionParams>({ ...DEFAULT_PARAMS });
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Run extraction on mount and when params change via the Update preview button
  useEffect(() => {
    void runExtraction(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount — manual re-trigger via button

  async function runExtraction(p: ExtractionParams) {
    setIsExtracting(true);
    setExtractError(null);
    setDataUrl(null);
    setSaved(false);

    try {
      const result = await extractTemplate(entry.imageUrl, p);
      setDataUrl(result.dataUrl);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d')!;
        canvas.width  = result.width;
        canvas.height = result.height;
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = result.dataUrl;
      }
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExtracting(false);
    }
  }

  function handleDownload() {
    if (!dataUrl) return;
    const slug = entry.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    downloadPng(dataUrl, `radian-template-${slug}.png`);
  }

  function handleSave() {
    if (!dataUrl) return;
    const storageKey = `${entry.id}-template`;
    storage.saveTemplate(storageKey, dataUrl);
    const updated: Entry = {
      ...entry,
      template: {
        storageKey,
        extractionParams: params,
        extractedAt: new Date().toISOString(),
      },
    };
    storage.saveEntry(updated);
    setSaved(true);
    onComplete(updated);
  }

  return (
    <div className="template-panel">
      <div className="analysis-header">
        <span className="analysis-title">◈ Line Template</span>
      </div>

      <div className="template-controls">
        <RangeControl
          id="ctrlSensitivity"
          label="Edge sensitivity"
          min={5} max={100}
          value={params.edgeSensitivity}
          onChange={v => setParams(p => ({ ...p, edgeSensitivity: v }))}
        />
        <RangeControl
          id="ctrlEdgeMax"
          label="Edge max"
          min={30} max={255}
          value={params.edgeMax}
          onChange={v => setParams(p => ({ ...p, edgeMax: v }))}
        />
        <RangeControl
          id="ctrlBlur"
          label="Pre-blur"
          min={0} max={4}
          value={params.blurRadius}
          onChange={v => setParams(p => ({ ...p, blurRadius: v }))}
        />
        <RangeControl
          id="ctrlWeight"
          label="Line weight"
          min={1} max={6}
          value={params.lineWeight}
          onChange={v => setParams(p => ({ ...p, lineWeight: v }))}
        />
        <div className="template-control template-control--inline">
          <label className="field-label" htmlFor="ctrlInvert">Invert (white lines on black)</label>
          <input
            type="checkbox"
            id="ctrlInvert"
            className="check-input"
            checked={params.invert}
            onChange={e => setParams(p => ({ ...p, invert: e.target.checked }))}
          />
        </div>
      </div>

      <div className="template-preview-wrap">
        {isExtracting && (
          <div className="template-loading" style={{ display: 'flex' }}>
            <div className="spinner" aria-label="Extracting…"></div>
            <div className="analysis-loading-text">Extracting edges…</div>
          </div>
        )}
        {extractError && (
          <div className="analysis-notice analysis-notice--error">
            Extraction failed: {extractError}
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="template-canvas"
          hidden={!dataUrl || isExtracting}
        />
      </div>

      <div className="analysis-actions">
        <button
          type="button"
          className="btn btn--action"
          onClick={() => { void runExtraction(params); }}
        >
          Update preview
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!dataUrl}
          onClick={handleDownload}
        >
          Download PNG
        </button>
        <button
          type="button"
          className="btn btn--action"
          disabled={!dataUrl || saved}
          onClick={handleSave}
        >
          {saved ? 'Saved ✓' : 'Save to entry'}
        </button>
      </div>
    </div>
  );
}

// ─── RangeControl ─────────────────────────────────────────────────────────────

interface RangeControlProps {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}

function RangeControl({ id, label, min, max, value, onChange }: RangeControlProps) {
  return (
    <div className="template-control">
      <label className="field-label" htmlFor={id}>
        {label} <span className="ctrl-value">{value}</span>
      </label>
      <input
        type="range"
        id={id}
        className="range-input"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  );
}
