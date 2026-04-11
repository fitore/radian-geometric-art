# Radian Vision Spike — Findings

**Model:** claude-sonnet-4-6  
**Date:** 2026-04-03  
**Images tested:** 10/15  
**Overall accuracy:** 55.5%  
**Decision:** ITERATE

---

## Overall accuracy vs. thresholds

Overall accuracy is **55.5%** against a decision threshold of 70% (greenlight) / 50% (iterate) / <50% (descope).

Result: **Iterate.** Invest in prompt refinement (few-shot examples, chain-of-thought) before committing to build.

---

## Per-field accuracy breakdown

**Strong fields (≥70%):** `patternType`
**Weak fields (<60%):** `tradition`, `symmetry`, `proportion`

| Field | Accuracy |
|---|---|
| constructionMethod | 60.0% |
| tradition | 50.0% |
| patternType | 77.5% |
| symmetry | 47.5% |
| proportion | 42.5% |

---

## Failure pattern analysis

### By image type

- **clean-digital-diagram**: avg score 51.9% (n=8)
- **photograph-architecture**: avg score 90.0% (n=1)
- **photograph-nature**: avg score 50.0% (n=1)

### Notable misses

- **Image 7** (Penrose tiling — P3 rhombus aperiodic tiling with 5-fold symmetry): 15% — constructionMethod predicted `compass-and-straightedge` (gt: `grid-based`); symmetry predicted `10-fold` (gt: `5-fold`)
- **Image 11** (Compass-and-straightedge hexagon construction diagram): 10% — constructionMethod predicted `ruler-only` (gt: `compass-and-straightedge`)

---

## Confidence calibration

MISS with high confidence rate: **12.0%** of all predictions (6/50).

Claude is **overconfident** on wrong answers. Recommend adding the calibration rule from Part 5 of the spike doc to the system prompt before production use.

---

## Architecture recommendation

Based on the spike results and Part 4 of the spike document:

**Classification:** Use Claude Vision (Sonnet) as the primary classifier with the tested system prompt. The prompt is the load-bearing artifact — keep it versioned in `js/api.js` as a constant.

**Extraction pipeline:** Path C (Hybrid) is recommended.
- Canvas-based edge detection for the line template (fast, free, client-side, no external deps)
- Claude Vision for semantic classification (tags, rationale, construction notes)
- These are independent — do not couple them. A user can run extraction without analysis and vice versa.

**Cost estimate:** ~$0.003–0.008 per analysis call at Sonnet pricing. A 100-image collection costs under $1.

**If accuracy is borderline:** Re-run failing images on `claude-opus-4-6` to determine whether the more capable model resolves them. That informs whether production should use Sonnet (preferred, cheaper) or Opus (fallback for ambiguous images).

---

## Go/no-go recommendation

**Conditional go.** The 55.5% accuracy is in the iterate band (50-70%). Before committing to build, invest in: (1) few-shot examples for the weakest fields, (2) chain-of-thought prefix before JSON. Re-spike on the same 15 images. If accuracy crosses 70%, greenlight. If not, present analysis as "suggested tags" (the fallback UX from Part 3).
