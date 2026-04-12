import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock the Anthropic SDK before importing api.ts ───────────────────────────
// vi.hoisted ensures mockCreate is available when the mock factory is evaluated
// at hoist time (before top-level imports resolve).

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { create: mockCreate };
  }
  return { default: MockAnthropic };
});

// Import api AFTER the mock is registered
import { callClaude, setApiKey, getSessionCostCents } from '../api.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSuccessResponse(analysisJson: object) {
  return {
    content: [{ type: 'text', text: JSON.stringify(analysisJson) }],
    usage: { input_tokens: 100, output_tokens: 50 },
  };
}

const validAnalysisPayload = {
  analysis: {
    constructionMethod: { primary: 'compass-and-straightedge', confidence: 'high',   rationale: 'Compass arcs visible' },
    tradition:          { primary: 'Islamic-geometric',        confidence: 'high',   rationale: 'Interlocking stars' },
    patternType:        { primary: 'rosette',                  confidence: 'medium', rationale: 'Radiating petals' },
    symmetry:           { primary: '6-fold',                   confidence: 'high',   rationale: 'Six sectors' },
    proportion: { detected: ['√3'], confidence: 'medium', rationale: 'Hexagonal proportions' },
  },
  description:         'A six-fold compass-constructed rosette.',
  suggestedDifficulty: 'intermediate',
  constructionNotes:   'Start from a vesica piscis.',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('API layer contract', () => {
  beforeEach(() => {
    setApiKey(''); // clear any key from previous tests
    mockCreate.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('throws if API key is not configured', async () => {
    setApiKey('');
    await expect(
      callClaude('analyze', { imageUrl: 'https://example.com/img.jpg' })
    ).rejects.toThrow('No API key configured');
  });

  it('returns parsed AnalysisResult on successful response', async () => {
    setApiKey('sk-ant-test-key');
    mockCreate.mockResolvedValue(makeSuccessResponse(validAnalysisPayload));

    const resultPromise = callClaude('analyze', { imageUrl: 'https://example.com/img.jpg' });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.constructionMethod.primary).toBe('compass-and-straightedge');
    expect(result.tradition.primary).toBe('Islamic-geometric');
    expect(result.promptVersion).toBe('analysis-v2');
    expect(result.analyzedAt).toBeTruthy();
  });

  it('retries once on network failure before rejecting', async () => {
    setApiKey('sk-ant-test-key');
    mockCreate
      .mockRejectedValueOnce(new Error('Network error'))  // first attempt fails
      .mockRejectedValueOnce(new Error('Network error')); // retry also fails → final reject

    const resultPromise = callClaude('analyze', { imageUrl: 'https://example.com/img.jpg' });
    // Pre-attach a no-op catch so Node.js does not flag the rejection as unhandled
    // during the timer-advance gap (vitest fake timers + async retry).
    void resultPromise.catch(() => {});
    // Advance through the 2 s retry delay
    await vi.runAllTimersAsync();

    await expect(resultPromise).rejects.toThrow('Network error');
    // Verify two attempts were made (original + one retry)
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('rejects with a structured error on malformed JSON response', async () => {
    setApiKey('sk-ant-test-key');
    // Both attempts return invalid JSON so the retry also fails
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'not valid json {{{{' }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    const resultPromise = callClaude('analyze', { imageUrl: 'https://example.com/img.jpg' });
    void resultPromise.catch(() => {}); // prevent unhandled-rejection window during timer advance
    await vi.runAllTimersAsync();

    await expect(resultPromise).rejects.toThrow();
  });

  it('increments session cost after a successful call', async () => {
    setApiKey('sk-ant-test-key');
    const costBefore = getSessionCostCents();

    mockCreate.mockResolvedValue(makeSuccessResponse(validAnalysisPayload));

    const resultPromise = callClaude('analyze', { imageUrl: 'https://example.com/img.jpg' });
    await vi.runAllTimersAsync();
    await resultPromise;

    expect(getSessionCostCents()).toBeGreaterThan(costBefore);
  });
});
