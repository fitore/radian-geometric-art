import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisPanel } from '../components/AnalysisPanel.js';
import type { Entry, Analysis } from '../types.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockEntry: Entry = {
  id:            'entry-abc',
  createdAt:     '2025-01-01T00:00:00.000Z',
  schemaVersion: 2,
  title:         'Hexagonal Rosette',
  imageUrl:      'https://example.com/image.jpg',
  sourceUrl:     '',
  status:        'done',
  difficulty:    'intermediate',
  tags: {
    constructionMethod: [],
    tradition:          [],
    patternType:        [],
    symmetry:           [],
    proportion:         [],
  },
  description:   '',
  attemptNotes:  '',
};

const mockAnalysis: Analysis = {
  constructionMethod: { primary: 'compass-and-straightedge', confidence: 'high',   rationale: 'Clear compass arcs visible' },
  tradition:          { primary: 'Islamic-geometric',        confidence: 'high',   rationale: 'Characteristic star pattern' },
  patternType:        { primary: 'rosette',                  confidence: 'medium', rationale: 'Radiating petal structure' },
  symmetry:           { primary: '6-fold',                   confidence: 'high',   rationale: 'Six identical sectors' },
  proportion: {
    detected:   ['√3', 'vesica-piscis'],
    confidence: 'medium',
    rationale:  'Hexagonal proportions visible',
  },
  description:         'A six-fold rosette with compass construction.',
  suggestedDifficulty: 'intermediate',
  constructionNotes:   'Begin with a vesica piscis, then step off the radius.',
  promptVersion:       'analysis-v2',
  analyzedAt:          '2025-06-01T12:00:00.000Z',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AnalysisPanel — accept/dismiss contract', () => {
  it('renders suggested tags with confidence indicators', () => {
    render(
      <AnalysisPanel
        entry={mockEntry}
        result={mockAnalysis}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    // Confidence badges are rendered
    const highBadges = screen.getAllByText('high');
    expect(highBadges.length).toBeGreaterThanOrEqual(1);

    // Field values from analysis are shown
    expect(screen.getByText('compass-and-straightedge')).toBeInTheDocument();
    expect(screen.getByText('Islamic-geometric')).toBeInTheDocument();
    expect(screen.getByText('rosette')).toBeInTheDocument();
  });

  it('calls onAccept with the analysis result when accepted', () => {
    const onAccept = vi.fn();
    render(
      <AnalysisPanel
        entry={mockEntry}
        result={mockAnalysis}
        onAccept={onAccept}
        onDismiss={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Apply suggested tags'));

    expect(onAccept).toHaveBeenCalledOnce();
    expect(onAccept).toHaveBeenCalledWith(mockAnalysis);
  });

  it('does not call onSave directly — acceptance is the caller\'s responsibility', () => {
    // AnalysisPanel has no access to storage.saveEntry — it only calls onAccept.
    // This test verifies the component does not import or use storage directly
    // by checking that accepting does not produce side effects beyond onAccept.
    const onAccept = vi.fn();
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <AnalysisPanel
        entry={mockEntry}
        result={mockAnalysis}
        onAccept={onAccept}
        onDismiss={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Apply suggested tags'));

    // onAccept was called but no localStorage write happened from AnalysisPanel itself
    expect(onAccept).toHaveBeenCalledOnce();
    expect(storageSpy).not.toHaveBeenCalled();

    storageSpy.mockRestore();
  });

  it('calls onDismiss when dismissed without modifying the entry', () => {
    const onDismiss = vi.fn();
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <AnalysisPanel
        entry={mockEntry}
        result={mockAnalysis}
        onAccept={vi.fn()}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByText('Dismiss'));

    expect(onDismiss).toHaveBeenCalledOnce();
    expect(storageSpy).not.toHaveBeenCalled();

    storageSpy.mockRestore();
  });
});
