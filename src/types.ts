// ─── Core domain types ────────────────────────────────────────────────────────

export type Status = 'want-to-try' | 'attempted' | 'done';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Confidence = 'high' | 'medium' | 'low';
export type SortKey = 'newest' | 'oldest' | 'az';

export interface Tags {
  constructionMethod: string[];
  tradition: string[];
  patternType: string[];
  symmetry: string[];
  proportion: string[];
}

// ─── Analysis (Feature 2 — Pattern Analysis) ─────────────────────────────────

export interface AnalysisField {
  primary: string;
  secondary?: string;
  confidence: Confidence;
  rationale: string;
}

export interface ProportionField {
  detected: string[];
  confidence: Confidence;
  rationale: string;
}

export interface Analysis {
  constructionMethod: AnalysisField;
  tradition: AnalysisField;
  patternType: AnalysisField;
  symmetry: AnalysisField;
  proportion: ProportionField;
  description: string;
  suggestedDifficulty: Difficulty;
  constructionNotes: string;
  promptVersion: string;
  analyzedAt: string;
}

// ─── Template (Feature 3 — Line Template Extraction) ─────────────────────────

export interface ExtractionParams {
  edgeSensitivity: number; // Sobel threshold low (0–255)
  edgeMax: number;         // Sobel threshold high (0–255)
  blurRadius: number;      // Gaussian blur radius (0–5)
  lineWeight: number;      // Output stroke weight (1–6)
  invert: boolean;         // Invert output (white lines on black vs black on white)
}

export interface TemplateRef {
  storageKey: string;       // localStorage key holding the base64 PNG
  extractionParams: ExtractionParams;
  extractedAt: string;
}

// ─── Entry (schema v2) ───────────────────────────────────────────────────────

export interface Entry {
  id: string;
  createdAt: string;
  schemaVersion: 2;
  title: string;
  imageUrl: string;
  sourceUrl: string;
  status: Status;
  difficulty: Difficulty;
  tags: Tags;
  description: string;
  attemptNotes: string;
  analysis?: Analysis;
  template?: TemplateRef;
}

// ─── Gallery state ────────────────────────────────────────────────────────────

export interface ActiveFilters {
  status: Set<string>;
  difficulty: Set<string>;
  constructionMethod: Set<string>;
  tradition: Set<string>;
  patternType: Set<string>;
  symmetry: Set<string>;
}

export interface AppState {
  entries: Entry[];
  activeFilters: ActiveFilters;
  sort: SortKey;
  search: string;
  // Session state (React-only — not persisted to localStorage)
  selectedEntryId: string | null;
  openPanel: 'form' | 'settings' | null;
  formMode: 'new' | 'edit';
  sidebarOpen: boolean;
}

// ─── Analysis result (transient — lives in component state until acceptance) ─

export type AnalysisResult = Analysis;

// ─── App action types (named for what happened, not what to do) ──────────────

export type AppAction =
  | { type: 'ENTRY_SELECTED'; id: string }
  | { type: 'FORM_OPENED_NEW' }
  | { type: 'FORM_CLOSED' }
  | { type: 'SETTINGS_OPENED' }
  | { type: 'SETTINGS_CLOSED' }
  | { type: 'SIDEBAR_TOGGLED' }
  | { type: 'FILTER_TOGGLED'; filterType: keyof ActiveFilters; value: string }
  | { type: 'FILTERS_CLEARED' }
  | { type: 'SORT_CHANGED'; sort: SortKey }
  | { type: 'SEARCH_CHANGED'; search: string }
  | { type: 'ENTRIES_RELOADED'; entries: Entry[] };
