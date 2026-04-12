import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntryForm } from '../components/EntryForm.js';
import type { Entry } from '../types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id:            'entry-123',
    createdAt:     '2025-01-01T00:00:00.000Z',
    schemaVersion: 2,
    title:         'Flower of Life',
    imageUrl:      'https://example.com/image.jpg',
    sourceUrl:     'https://example.com',
    status:        'done',
    difficulty:    'intermediate',
    tags: {
      constructionMethod: ['compass-and-straightedge'],
      tradition:          ['syncretic'],
      patternType:        ['Flower-of-Life-lineage'],
      symmetry:           ['6-fold'],
      proportion:         ['√3'],
    },
    description:   'A classic sacred geometry pattern',
    attemptNotes:  'Drew it three times',
    ...overrides,
  };
}

function defaultProps(overrides: Partial<Parameters<typeof EntryForm>[0]> = {}) {
  return {
    entry:          null,
    isOpen:         true,
    onSave:         vi.fn(),
    onCancel:       vi.fn(),
    onEntryUpdated: vi.fn(),
    ...overrides,
  };
}

// Mock storage so tests don't touch real localStorage
vi.mock('../data.js', () => ({
  TAG_VOCABULARY: {
    constructionMethod: ['compass-and-straightedge', 'ruler-only'],
    tradition:          ['Islamic-geometric', 'syncretic'],
    patternType:        ['rosette', 'Flower-of-Life-lineage'],
    symmetry:           ['6-fold', '8-fold'],
    proportion:         ['golden-ratio', '√3'],
  },
  storage: {
    getEntry: vi.fn(),
    saveEntry: vi.fn(),
    getAllEntries: vi.fn(() => []),
  },
}));

// Mock api.js so tests don't hit real network
vi.mock('../api.js', () => ({
  callClaude: vi.fn(),
  hasApiKey:  vi.fn(() => false),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EntryForm — populateForm contract', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders empty form when entry prop is null', () => {
    render(<EntryForm {...defaultProps()} />);

    const titleInput = screen.getByPlaceholderText('Name this piece…') as HTMLInputElement;
    expect(titleInput.value).toBe('');

    const descTextarea = screen.getByPlaceholderText('About this piece…') as HTMLTextAreaElement;
    expect(descTextarea.value).toBe('');
  });

  it('populates all fields when entry prop is provided', () => {
    const entry = makeEntry();
    render(<EntryForm {...defaultProps({ entry })} />);

    const titleInput = screen.getByPlaceholderText('Name this piece…') as HTMLInputElement;
    expect(titleInput.value).toBe('Flower of Life');

    const descTextarea = screen.getByPlaceholderText('About this piece…') as HTMLTextAreaElement;
    expect(descTextarea.value).toBe('A classic sacred geometry pattern');

    const notesTextarea = screen.getByPlaceholderText(/What did you try/) as HTMLTextAreaElement;
    expect(notesTextarea.value).toBe('Drew it three times');
  });

  it('calls onSave with the complete entry when submitted', () => {
    const onSave = vi.fn();
    render(<EntryForm {...defaultProps({ onSave })} />);

    const titleInput = screen.getByPlaceholderText('Name this piece…');
    fireEvent.change(titleInput, { target: { value: 'New Mandala' } });

    fireEvent.click(screen.getByText('Save piece'));

    expect(onSave).toHaveBeenCalledOnce();
    const saved = onSave.mock.calls[0]?.[0] as Entry;
    expect(saved.title).toBe('New Mandala');
    expect(saved.schemaVersion).toBe(2);
    expect(saved.id).toBeTruthy();
  });

  it('does not call onSave when required fields are missing', () => {
    const onSave = vi.fn();
    render(<EntryForm {...defaultProps({ onSave })} />);

    // title is empty — required
    fireEvent.click(screen.getByText('Save piece'));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });

  it('calls onCancel when cancel is triggered', () => {
    const onCancel = vi.fn();
    render(<EntryForm {...defaultProps({ onCancel })} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
