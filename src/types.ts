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
}
