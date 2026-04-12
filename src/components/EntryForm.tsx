import { useState, useEffect, useRef, useCallback } from 'react';
import type { Entry, Tags, Status, Difficulty, Analysis, AnalysisResult } from '../types.js';
import { TAG_VOCABULARY } from '../data.js';
import { storage } from '../data.js';
import { callClaude, hasApiKey } from '../api.js';
import { AnalysisPanel } from './AnalysisPanel.js';
import { TemplatePanel } from './TemplatePanel.js';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EntryFormProps {
  entry: Entry | null;        // null = new entry
  isOpen: boolean;
  onSave: (entry: Entry) => void;
  onCancel: () => void;
  onEntryUpdated: () => void; // called after external mutations (template save)
}

// ─── Form field state ─────────────────────────────────────────────────────────

interface FormFields {
  imageUrl:     string;
  title:        string;
  status:       Status;
  difficulty:   Difficulty;
  tags:         Tags;
  sourceUrl:    string;
  description:  string;
  attemptNotes: string;
}

function emptyFields(): FormFields {
  return {
    imageUrl:     '',
    title:        '',
    status:       'want-to-try',
    difficulty:   'beginner',
    tags: {
      constructionMethod: [],
      tradition:          [],
      patternType:        [],
      symmetry:           [],
      proportion:         [],
    },
    sourceUrl:    '',
    description:  '',
    attemptNotes: '',
  };
}

function fieldsFromEntry(entry: Entry): FormFields {
  return {
    imageUrl:     entry.imageUrl,
    title:        entry.title,
    status:       entry.status,
    difficulty:   entry.difficulty,
    tags:         { ...entry.tags },
    sourceUrl:    entry.sourceUrl,
    description:  entry.description,
    attemptNotes: entry.attemptNotes,
  };
}

// ─── Tag group labels ─────────────────────────────────────────────────────────

const TAG_GROUP_LABELS: Record<string, string> = {
  constructionMethod: 'Construction method',
  tradition:          'Tradition',
  patternType:        'Pattern type',
  symmetry:           'Symmetry',
  proportion:         'Key proportion',
};

// ─── EntryForm ────────────────────────────────────────────────────────────────

export function EntryForm({ entry, isOpen, onSave, onCancel, onEntryUpdated }: EntryFormProps) {
  const [fields, setFields] = useState<FormFields>(emptyFields);
  const [titleError, setTitleError] = useState(false);

  // Transient analysis state — never written to localStorage before user saves
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing,    setIsAnalyzing]    = useState(false);
  const [analysisError,  setAnalysisError]  = useState<string | null>(null);

  // Transient template state
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync form fields whenever the entry prop changes (open for edit / new)
  useEffect(() => {
    if (isOpen) {
      setFields(entry ? fieldsFromEntry(entry) : emptyFields());
      setTitleError(false);
      setAnalysisResult(entry?.analysis ?? null);
      setAnalysisError(null);
      setIsAnalyzing(false);
      setShowTemplatePanel(false);
    }
  }, [entry, isOpen]);

  // Focus title on open for new entry
  useEffect(() => {
    if (isOpen && !entry) {
      setTimeout(() => titleInputRef.current?.focus(), 360);
    }
  }, [isOpen, entry]);

  // ── populateForm: single path from automated pipeline output to form UI ──────
  // Called by AnalysisPanel onAccept to merge suggested tags/difficulty.
  const populateForm = useCallback((partial: Partial<Entry>) => {
    setFields(prev => ({
      ...prev,
      ...(partial.imageUrl     !== undefined && { imageUrl:     partial.imageUrl }),
      ...(partial.title        !== undefined && { title:        partial.title }),
      ...(partial.status       !== undefined && { status:       partial.status }),
      ...(partial.difficulty   !== undefined && { difficulty:   partial.difficulty }),
      ...(partial.tags         !== undefined && { tags:         partial.tags }),
      ...(partial.sourceUrl    !== undefined && { sourceUrl:    partial.sourceUrl }),
      ...(partial.description  !== undefined && { description:  partial.description }),
      ...(partial.attemptNotes !== undefined && { attemptNotes: partial.attemptNotes }),
    }));
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!fields.title.trim()) {
      setTitleError(true);
      titleInputRef.current?.focus();
      return;
    }

    const id = entry?.id ?? crypto.randomUUID();
    const createdAt = entry?.createdAt ?? new Date().toISOString();
    const existing = entry?.id ? storage.getEntry(entry.id) : null;

    const saved: Entry = {
      id,
      createdAt,
      schemaVersion: 2,
      title:        fields.title.trim(),
      imageUrl:     fields.imageUrl.trim(),
      sourceUrl:    fields.sourceUrl.trim(),
      status:       fields.status,
      difficulty:   fields.difficulty,
      tags:         fields.tags,
      description:  fields.description.trim(),
      attemptNotes: fields.attemptNotes.trim(),
      // Carry analysis only if it has been accepted (exists in analysisResult state)
      // or was already on the entry and not replaced
      analysis:     analysisResult ?? existing?.analysis,
      template:     existing?.template,
    };

    storage.saveEntry(saved);
    onSave(saved);
  }

  // ── Image preview ─────────────────────────────────────────────────────────────

  const imageIsValid = fields.imageUrl.startsWith('http') ||
    fields.imageUrl.startsWith('https') ||
    fields.imageUrl.startsWith('data:');

  // ── Analysis trigger (user-triggered only — no useEffect) ────────────────────

  async function handleAnalyze() {
    if (!entry?.id) {
      setAnalysisError('Save the entry first, then analyze.');
      return;
    }
    if (!hasApiKey()) {
      setAnalysisError('No API key configured. Add one in Settings to use pattern analysis.');
      return;
    }
    if (!fields.imageUrl) {
      setAnalysisError('Save the entry with an image before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const result = await callClaude('analyze', { imageUrl: fields.imageUrl });
      // Result lives in transient state — NOT written to localStorage here
      setAnalysisResult(result);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsAnalyzing(false);
    }
  }

  // ── Analysis acceptance (populateForm is the single write path) ───────────────

  function handleAnalysisAccept(analysis: Analysis) {
    const suggested: Partial<Entry> = {
      tags: {
        constructionMethod: analysis.constructionMethod.primary !== 'uncertain'
          ? [analysis.constructionMethod.primary] : [],
        tradition: [
          ...(analysis.tradition.primary !== 'uncertain' ? [analysis.tradition.primary] : []),
          ...(analysis.tradition.secondary ? [analysis.tradition.secondary] : []),
        ],
        patternType: [
          ...(analysis.patternType.primary !== 'uncertain' ? [analysis.patternType.primary] : []),
          ...(analysis.patternType.secondary ? [analysis.patternType.secondary] : []),
        ],
        symmetry: analysis.symmetry.primary !== 'uncertain' && analysis.symmetry.primary !== 'none'
          ? [analysis.symmetry.primary] : [],
        proportion: analysis.proportion.detected,
      },
      difficulty: analysis.suggestedDifficulty,
    };
    // populateForm is the single path — merges into form state
    populateForm(suggested);
    // Keep the analysis result so it's saved with the entry when user clicks Save
    setAnalysisResult(analysis);
  }

  // ── Tag toggle ────────────────────────────────────────────────────────────────

  function toggleTag(group: keyof Tags, tag: string) {
    setFields(prev => {
      const current = prev.tags[group] as string[];
      const next = current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag];
      return { ...prev, tags: { ...prev.tags, [group]: next } };
    });
  }

  const hasImage = Boolean(fields.imageUrl.trim());

  return (
    <>
      <div className={`form-panel${isOpen ? ' open' : ''}`} role="dialog" aria-label="Add or edit piece">
        <div className="form-panel-header">
          <div className="form-panel-title" id="formTitle">
            {entry ? 'EDIT PIECE' : 'NEW PIECE'}
          </div>
          <button className="icon-btn" title="Close" aria-label="Close panel" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="form-panel-body" id="formBody">

          {/* Image */}
          <div className="form-field">
            <label className="field-label">Image</label>
            <div className="image-input-row">
              <input
                className="field-input"
                placeholder="Paste image URL…"
                id="fieldImageUrl"
                autoComplete="off"
                type="url"
                value={fields.imageUrl}
                onChange={e => setFields(prev => ({ ...prev, imageUrl: e.target.value }))}
              />
              <button
                type="button"
                className="upload-btn"
                title="Upload a local image file"
                onClick={() => document.getElementById('imageFileInput')?.click()}
              >
                ↑ Upload
              </button>
            </div>
            {fields.imageUrl && imageIsValid && (
              <img
                className="image-preview visible"
                src={fields.imageUrl}
                alt="Image preview"
              />
            )}
          </div>

          {/* Title */}
          <div className="form-field">
            <label className="field-label" htmlFor="fieldTitle">
              Title <span className="required-mark">*</span>
            </label>
            <input
              ref={titleInputRef}
              className={`field-input${titleError ? ' error' : ''}`}
              placeholder="Name this piece…"
              id="fieldTitle"
              autoComplete="off"
              value={fields.title}
              onChange={e => { setFields(prev => ({ ...prev, title: e.target.value })); setTitleError(false); }}
            />
            {titleError && <div className="field-error visible">Title is required</div>}
          </div>

          {/* Status + Difficulty */}
          <div className="status-diff-row">
            <div className="form-field">
              <div className="field-label">Status</div>
              <div className="radio-group">
                {(['want-to-try', 'attempted', 'done'] as const).map(val => (
                  <div
                    key={val}
                    className={`radio-option${val === 'want-to-try' ? ' radio-option--want' : val === 'attempted' ? ' radio-option--tried' : ' radio-option--done'}${fields.status === val ? ' selected' : ''}`}
                    onClick={() => setFields(prev => ({ ...prev, status: val }))}
                  >
                    <div className="radio-dot"></div>
                    <div className="radio-label">
                      {val === 'want-to-try' ? 'Want to try' : val === 'attempted' ? 'Attempted' : 'Done'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-field">
              <div className="field-label">Difficulty</div>
              <div className="radio-group">
                {(['beginner', 'intermediate', 'advanced'] as const).map(val => (
                  <div
                    key={val}
                    className={`radio-option${fields.difficulty === val ? ' selected' : ''}`}
                    onClick={() => setFields(prev => ({ ...prev, difficulty: val }))}
                  >
                    <div className="radio-dot"></div>
                    <div className="radio-label">
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="form-field">
            <div className="field-label">Tags</div>
            <div className="tag-groups-container">
              {(Object.keys(TAG_VOCABULARY) as Array<keyof typeof TAG_VOCABULARY>).map(group => {
                const tags = TAG_VOCABULARY[group] as readonly string[];
                const isOptional = group === 'proportion';
                return (
                  <div key={group} className="tag-group-wrap">
                    <div className="tag-group-label">
                      {TAG_GROUP_LABELS[group]}
                      {isOptional && <span className="tag-group-optional"> — optional</span>}
                    </div>
                    <div className="tag-checkboxes">
                      {tags.map(tag => (
                        <span
                          key={tag}
                          className={`tag-check${(fields.tags[group] as string[]).includes(tag) ? ' checked' : ''}`}
                          onClick={() => toggleTag(group as keyof Tags, tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Analysis section */}
          {(isAnalyzing || analysisResult || analysisError || entry?.analysis) && (
            <div className="analysis-section">
              {isAnalyzing && (
                <div className="analysis-loading">
                  <div className="spinner" aria-label="Analyzing…"></div>
                  <div className="analysis-loading-text">Analyzing with Claude…</div>
                </div>
              )}
              {!isAnalyzing && analysisError && (
                <div className="analysis-notice analysis-notice--error">
                  Analysis failed: {analysisError}
                </div>
              )}
              {!isAnalyzing && (analysisResult ?? entry?.analysis) && (
                <AnalysisPanel
                  entry={entry ?? { ...fields, id: '', createdAt: '', schemaVersion: 2 } as unknown as Entry}
                  result={analysisResult ?? entry?.analysis ?? null}
                  onAccept={handleAnalysisAccept}
                  onDismiss={() => { setAnalysisResult(null); setAnalysisError(null); }}
                />
              )}
            </div>
          )}

          {/* Source URL */}
          <div className="form-field">
            <label className="field-label" htmlFor="fieldSourceUrl">Source URL</label>
            <input
              className="field-input"
              placeholder="Link to origin (optional)…"
              id="fieldSourceUrl"
              autoComplete="off"
              type="url"
              value={fields.sourceUrl}
              onChange={e => setFields(prev => ({ ...prev, sourceUrl: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="form-field">
            <label className="field-label" htmlFor="fieldDescription">Description</label>
            <textarea
              className="field-input"
              placeholder="About this piece…"
              id="fieldDescription"
              value={fields.description}
              onChange={e => setFields(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Practice log divider */}
          <div className="form-divider">
            <span className="form-divider-label">practice log</span>
          </div>

          {/* Attempt Notes */}
          <div className="form-field">
            <label className="field-label" htmlFor="fieldAttemptNotes">Attempt Notes</label>
            <div className="field-sublabel">Your practice log — separate from description</div>
            <textarea
              className="field-input field-input--attempt"
              placeholder="What did you try? What was hard? What did you learn?…"
              id="fieldAttemptNotes"
              value={fields.attemptNotes}
              onChange={e => setFields(prev => ({ ...prev, attemptNotes: e.target.value }))}
            />
          </div>

          {/* Template section */}
          {showTemplatePanel && entry && (
            <div className="template-section">
              <TemplatePanel
                entry={entry}
                onComplete={updated => { onEntryUpdated(); void updated; }}
              />
            </div>
          )}

          {/* Feature action buttons — shown only when entry has an image */}
          {hasImage && entry?.id && (
            <div className="form-actions">
              <button
                type="button"
                className="btn btn--action"
                onClick={() => { void handleAnalyze(); }}
              >
                ✦ Analyze with Claude
              </button>
              <button
                type="button"
                className="btn btn--action"
                onClick={() => setShowTemplatePanel(true)}
              >
                ◈ Extract template
              </button>
            </div>
          )}

          {/* Image file upload handler (hidden input lives in App) */}
          <ImageUploadHandler onImage={url => setFields(prev => ({ ...prev, imageUrl: url }))} />

        </div>

        <div className="form-panel-footer">
          <button className="btn btn--cancel" onClick={onCancel}>Cancel</button>
          <button className="btn btn--save" onClick={handleSave}>Save piece</button>
        </div>
      </div>
    </>
  );
}

// ─── Image upload handler ─────────────────────────────────────────────────────
// Listens for the hidden #imageFileInput change event wired in App.tsx

function ImageUploadHandler({ onImage }: { onImage: (url: string) => void }) {
  useEffect(() => {
    const input = document.getElementById('imageFileInput') as HTMLInputElement | null;
    if (!input) return;

    function handleChange(e: Event) {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => onImage(ev.target?.result as string);
      reader.readAsDataURL(file);
      (e.target as HTMLInputElement).value = '';
    }

    input.addEventListener('change', handleChange);
    return () => input.removeEventListener('change', handleChange);
  }, [onImage]);

  return null;
}
