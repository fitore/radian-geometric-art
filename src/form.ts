import type { Entry, Tags } from './types.js';
import { TAG_VOCABULARY } from './data.js';
import { escapeHtml } from './utils.js';
import { storage } from './data.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TAG_GROUP_LABELS: Record<string, string> = {
  constructionMethod: 'Construction method',
  tradition:          'Tradition',
  patternType:        'Pattern type',
  symmetry:           'Symmetry',
  proportion:         'Key proportion',
};

function buildTagGroupsHTML(): string {
  return (Object.keys(TAG_VOCABULARY) as Array<keyof typeof TAG_VOCABULARY>).map(group => {
    const tags = TAG_VOCABULARY[group] as readonly string[];
    const optionalSuffix = group === 'proportion'
      ? ` <span class="tag-group-optional">— optional</span>`
      : '';
    return `
      <div class="tag-group-wrap">
        <div class="tag-group-label">${escapeHtml(TAG_GROUP_LABELS[group])}${optionalSuffix}</div>
        <div class="tag-checkboxes">
          ${tags.map(tag => `
            <span class="tag-check"
                  data-group="${escapeHtml(group)}"
                  data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>
          `).join('')}
        </div>
      </div>`;
  }).join('');
}

function showImagePreview(src: string): void {
  const preview = document.getElementById('fieldImagePreview') as HTMLImageElement | null;
  if (!preview) return;
  const isValid = src.startsWith('http') || src.startsWith('https') || src.startsWith('data:');
  if (src && isValid) {
    preview.src = src;
    preview.classList.add('visible');
  } else {
    preview.src = '';
    preview.classList.remove('visible');
  }
}

// ─── renderForm ───────────────────────────────────────────────────────────────
// Builds the static form DOM once during init. Wires internal interactions.
// External event wiring (save, cancel) lives in app.ts.

export function renderForm(): void {
  const formBody = document.getElementById('formBody');
  if (!formBody) return;

  formBody.innerHTML = `
    <!-- Image -->
    <div class="form-field">
      <label class="field-label">Image</label>
      <div class="image-input-row">
        <input class="field-input" placeholder="Paste image URL…" id="fieldImageUrl" autocomplete="off" type="url">
        <button type="button" class="upload-btn" id="uploadBtn" title="Upload a local image file">↑ Upload</button>
      </div>
      <img class="image-preview" id="fieldImagePreview" src="" alt="Image preview">
    </div>

    <!-- Title -->
    <div class="form-field">
      <label class="field-label" for="fieldTitle">Title <span class="required-mark">*</span></label>
      <input class="field-input" placeholder="Name this piece…" id="fieldTitle" autocomplete="off">
      <div class="field-error" id="titleError">Title is required</div>
    </div>

    <!-- Status + Difficulty -->
    <div class="status-diff-row">
      <div class="form-field">
        <div class="field-label">Status</div>
        <div class="radio-group" id="statusGroup">
          <div class="radio-option radio-option--want selected" data-field="status" data-value="want-to-try">
            <div class="radio-dot"></div><div class="radio-label">Want to try</div>
          </div>
          <div class="radio-option radio-option--tried" data-field="status" data-value="attempted">
            <div class="radio-dot"></div><div class="radio-label">Attempted</div>
          </div>
          <div class="radio-option radio-option--done" data-field="status" data-value="done">
            <div class="radio-dot"></div><div class="radio-label">Done</div>
          </div>
        </div>
      </div>
      <div class="form-field">
        <div class="field-label">Difficulty</div>
        <div class="radio-group" id="difficultyGroup">
          <div class="radio-option selected" data-field="difficulty" data-value="beginner">
            <div class="radio-dot"></div><div class="radio-label">Beginner</div>
          </div>
          <div class="radio-option" data-field="difficulty" data-value="intermediate">
            <div class="radio-dot"></div><div class="radio-label">Intermediate</div>
          </div>
          <div class="radio-option" data-field="difficulty" data-value="advanced">
            <div class="radio-dot"></div><div class="radio-label">Advanced</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tags -->
    <div class="form-field">
      <div class="field-label">Tags</div>
      <div class="tag-groups-container" id="tagGroupsContainer">
        ${buildTagGroupsHTML()}
      </div>
    </div>

    <!-- Analysis section (hidden until triggered) -->
    <div class="analysis-section" id="analysisSection" hidden>
      <!-- Populated by panels.ts renderAnalysisResult() -->
    </div>

    <!-- Source URL -->
    <div class="form-field">
      <label class="field-label" for="fieldSourceUrl">Source URL</label>
      <input class="field-input" placeholder="Link to origin (optional)…" id="fieldSourceUrl" autocomplete="off" type="url">
    </div>

    <!-- Description -->
    <div class="form-field">
      <label class="field-label" for="fieldDescription">Description</label>
      <textarea class="field-input" placeholder="About this piece…" id="fieldDescription"></textarea>
    </div>

    <!-- Practice log divider -->
    <div class="form-divider">
      <span class="form-divider-label">practice log</span>
    </div>

    <!-- Attempt Notes -->
    <div class="form-field">
      <label class="field-label" for="fieldAttemptNotes">Attempt Notes</label>
      <div class="field-sublabel">Your practice log — separate from description</div>
      <textarea class="field-input field-input--attempt"
                placeholder="What did you try? What was hard? What did you learn?…"
                id="fieldAttemptNotes"></textarea>
    </div>

    <!-- Template section (hidden until triggered) -->
    <div class="template-section" id="templateSection" hidden>
      <!-- Populated by panels.ts renderTemplatePanel() -->
    </div>

    <!-- Action buttons for v2 features -->
    <div class="form-actions" id="formActions" hidden>
      <button type="button" class="btn btn--action" id="btnAnalyze">✦ Analyze with Claude</button>
      <button type="button" class="btn btn--action" id="btnExtract">◈ Extract template</button>
    </div>

    <!-- Hidden entry ID for edit mode -->
    <input type="hidden" id="fieldEntryId" value="">
  `;

  // Wire internal interactions
  formBody.querySelectorAll<HTMLElement>('.radio-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const field = opt.dataset['field'];
      if (!field) return;
      formBody.querySelectorAll<HTMLElement>(`.radio-option[data-field="${field}"]`)
        .forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  formBody.querySelectorAll<HTMLElement>('.tag-check').forEach(tag => {
    tag.addEventListener('click', () => tag.classList.toggle('checked'));
  });

  const imageUrlInput = document.getElementById('fieldImageUrl') as HTMLInputElement;
  imageUrlInput?.addEventListener('input', e => {
    showImagePreview((e.target as HTMLInputElement).value.trim());
  });

  const titleInput = document.getElementById('fieldTitle') as HTMLInputElement;
  titleInput?.addEventListener('input', () => {
    document.getElementById('titleError')?.classList.remove('visible');
    titleInput.classList.remove('error');
  });

  document.getElementById('uploadBtn')?.addEventListener('click', () => {
    document.getElementById('imageFileInput')?.click();
  });
}

// ─── populateForm ─────────────────────────────────────────────────────────────
// Pre-fills all form fields from an entry object.
// Called on edit-load AND by the analysis "Apply tags" action.
// Safe to call as a standalone function from outside the form submission flow.

export function populateForm(entry: Partial<Entry> | null): void {
  if (!entry) {
    clearForm();
    return;
  }

  (document.getElementById('fieldEntryId') as HTMLInputElement).value = entry.id ?? '';

  const imageVal = entry.imageUrl ?? '';
  (document.getElementById('fieldImageUrl') as HTMLInputElement).value = imageVal;
  showImagePreview(imageVal);

  (document.getElementById('fieldTitle') as HTMLInputElement).value = entry.title ?? '';

  const statusValue = entry.status ?? 'want-to-try';
  document.querySelectorAll<HTMLElement>('[data-field="status"]').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset['value'] === statusValue);
  });

  const diffValue = entry.difficulty ?? 'beginner';
  document.querySelectorAll<HTMLElement>('[data-field="difficulty"]').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset['value'] === diffValue);
  });

  document.querySelectorAll<HTMLElement>('.tag-check[data-group]').forEach(el => {
    const group = el.dataset['group'] as keyof Tags;
    const tag   = el.dataset['tag'] ?? '';
    const checked = Array.isArray(entry.tags?.[group]) && (entry.tags![group] as string[]).includes(tag);
    el.classList.toggle('checked', checked);
  });

  (document.getElementById('fieldSourceUrl') as HTMLInputElement).value = entry.sourceUrl ?? '';
  (document.getElementById('fieldDescription') as HTMLTextAreaElement).value = entry.description ?? '';
  (document.getElementById('fieldAttemptNotes') as HTMLTextAreaElement).value = entry.attemptNotes ?? '';

  document.getElementById('titleError')?.classList.remove('visible');
  (document.getElementById('fieldTitle') as HTMLInputElement)?.classList.remove('error');
}

export function clearForm(): void {
  (document.getElementById('fieldEntryId') as HTMLInputElement).value = '';
  (document.getElementById('fieldImageUrl') as HTMLInputElement).value = '';
  (document.getElementById('fieldTitle') as HTMLInputElement).value = '';
  (document.getElementById('fieldSourceUrl') as HTMLInputElement).value = '';
  (document.getElementById('fieldDescription') as HTMLTextAreaElement).value = '';
  (document.getElementById('fieldAttemptNotes') as HTMLTextAreaElement).value = '';
  showImagePreview('');

  document.querySelectorAll<HTMLElement>('[data-field="status"]').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset['value'] === 'want-to-try');
  });
  document.querySelectorAll<HTMLElement>('[data-field="difficulty"]').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset['value'] === 'beginner');
  });
  document.querySelectorAll<HTMLElement>('.tag-check').forEach(el => el.classList.remove('checked'));

  document.getElementById('titleError')?.classList.remove('visible');
  (document.getElementById('fieldTitle') as HTMLInputElement)?.classList.remove('error');

  // Hide v2 sections
  const analysisSection = document.getElementById('analysisSection');
  if (analysisSection) { analysisSection.hidden = true; analysisSection.innerHTML = ''; }
  const templateSection = document.getElementById('templateSection');
  if (templateSection) { templateSection.hidden = true; templateSection.innerHTML = ''; }
  const formActions = document.getElementById('formActions');
  if (formActions) formActions.hidden = true;
}

// ─── readFormState ────────────────────────────────────────────────────────────

export function readFormState(): Omit<Entry, 'schemaVersion' | 'createdAt'> {
  const id        = (document.getElementById('fieldEntryId') as HTMLInputElement).value;
  const imageUrl  = (document.getElementById('fieldImageUrl') as HTMLInputElement).value.trim();
  const title     = (document.getElementById('fieldTitle') as HTMLInputElement).value.trim();
  const sourceUrl = (document.getElementById('fieldSourceUrl') as HTMLInputElement).value.trim();
  const desc      = (document.getElementById('fieldDescription') as HTMLTextAreaElement).value.trim();
  const notes     = (document.getElementById('fieldAttemptNotes') as HTMLTextAreaElement).value.trim();

  const status = (document.querySelector<HTMLElement>('[data-field="status"].selected')?.dataset['value'] ?? 'want-to-try') as Entry['status'];
  const difficulty = (document.querySelector<HTMLElement>('[data-field="difficulty"].selected')?.dataset['value'] ?? 'beginner') as Entry['difficulty'];

  const tags: Tags = {
    constructionMethod: [],
    tradition: [],
    patternType: [],
    symmetry: [],
    proportion: [],
  };
  for (const group of Object.keys(TAG_VOCABULARY) as Array<keyof Tags>) {
    document.querySelectorAll<HTMLElement>(`.tag-check[data-group="${group}"].checked`).forEach(el => {
      tags[group].push(el.dataset['tag'] ?? '');
    });
  }

  return { id, imageUrl, title, sourceUrl, status, difficulty, tags, description: desc, attemptNotes: notes };
}

// ─── saveCurrentEntry ─────────────────────────────────────────────────────────
// Returns the saved entry or null if validation failed.

export function saveCurrentEntry(onSaved: (entry: Entry) => void): void {
  const formData = readFormState();

  if (!formData.title) {
    document.getElementById('titleError')?.classList.add('visible');
    const titleInput = document.getElementById('fieldTitle') as HTMLInputElement;
    titleInput.classList.add('error');
    titleInput.focus();
    return;
  }

  const existingId = formData.id;
  const id = existingId || crypto.randomUUID();

  let createdAt = new Date().toISOString();
  if (existingId) {
    const existing = storage.getEntry(existingId);
    if (existing) {
      createdAt = existing.createdAt;
    }
  }

  // Preserve existing analysis/template if present and entry is being edited
  const existing = existingId ? storage.getEntry(existingId) : null;

  const entry: Entry = {
    id,
    createdAt,
    schemaVersion: 2,
    title:        formData.title,
    imageUrl:     formData.imageUrl,
    sourceUrl:    formData.sourceUrl,
    status:       formData.status,
    difficulty:   formData.difficulty,
    tags:         formData.tags,
    description:  formData.description,
    attemptNotes: formData.attemptNotes,
    analysis:     existing?.analysis,
    template:     existing?.template,
  };

  storage.saveEntry(entry);
  onSaved(entry);
}
