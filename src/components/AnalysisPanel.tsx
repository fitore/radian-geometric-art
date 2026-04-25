import type { Entry, Analysis, AnalysisResult } from '../types.js';
import type { SymmetryResult } from '../symmetry.js';
import { formatDate } from '../utils.js';
import { FundamentalDomainView } from './FundamentalDomainView.js';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AnalysisPanelProps {
  entry: Entry;
  result: AnalysisResult | null;   // null = not yet analysed
  symmetryResult?: SymmetryResult | null;  // set after client-side detection; used by Session B
  onAccept: (analysis: Analysis) => void;
  onDismiss: () => void;
}

// ─── AnalysisPanel ────────────────────────────────────────────────────────────
// Renders analysis results and surfaces the accept/dismiss contract.
// Does NOT write to localStorage — acceptance is the caller's responsibility.

export function AnalysisPanel({ entry, result, symmetryResult, onAccept, onDismiss }: AnalysisPanelProps) {
  if (!result) return null;

  const a = result;
  const entryTitle = entry.title || '(unsaved entry)';

  return (
    <div className="analysis-panel">
      <div className="analysis-header">
        <span className="analysis-title">✦ Pattern Analysis</span>
        <span className="analysis-meta">
          {entryTitle} · {a.promptVersion} · {formatDate(a.analyzedAt)}
        </span>
      </div>

      <div className="analysis-description">{a.description}</div>

      <div className="analysis-fields">
        <AnalysisFieldRow label="Construction" field={a.constructionMethod} />
        <AnalysisFieldRow label="Tradition" field={a.tradition} />
        <AnalysisFieldRow label="Pattern type" field={a.patternType} />
        <AnalysisFieldRow label="Symmetry" field={a.symmetry} />
        <ProportionRow proportion={a.proportion} />
      </div>

      {symmetryResult && symmetryResult.foldCount > 0 && entry.imageUrl && (
        <FundamentalDomainView imageUrl={entry.imageUrl} symmetryResult={symmetryResult} />
      )}

      {a.constructionNotes && (
        <div className="analysis-notes">{a.constructionNotes}</div>
      )}

      <div className="analysis-actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => onAccept(a)}
        >
          Apply suggested tags
        </button>
        <span className="analysis-difficulty-hint">
          Suggested difficulty: <strong>{a.suggestedDifficulty}</strong>
        </span>
        <button
          type="button"
          className="btn"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldLike {
  primary: string;
  secondary?: string;
  confidence: string;
  rationale: string;
}

function AnalysisFieldRow({ label, field }: { label: string; field: FieldLike }) {
  return (
    <div className="analysis-field">
      <div className="analysis-field-header">
        <span className="analysis-field-label">{label}</span>
        <span className={`analysis-confidence analysis-confidence--${field.confidence}`}>
          {field.confidence}
        </span>
      </div>
      <div className="analysis-field-value">
        {field.primary}
        {field.secondary && (
          <span className="analysis-secondary"> + {field.secondary}</span>
        )}
      </div>
      <div className="analysis-rationale">{field.rationale}</div>
    </div>
  );
}

function ProportionRow({ proportion }: { proportion: { detected: string[]; confidence: string; rationale: string } }) {
  return (
    <div className="analysis-field">
      <div className="analysis-field-header">
        <span className="analysis-field-label">Proportion</span>
        <span className={`analysis-confidence analysis-confidence--${proportion.confidence}`}>
          {proportion.confidence}
        </span>
      </div>
      <div className="analysis-field-value">
        {proportion.detected.length > 0 ? proportion.detected.join(', ') : '—'}
      </div>
      <div className="analysis-rationale">{proportion.rationale}</div>
    </div>
  );
}
