# Radian Vision Spike — Scorecard

**Model:** claude-sonnet-4-6  
**Date:** 2026-04-03  
**Overall accuracy:** 55.5%  
**Decision:** ITERATE

## Per-image results

| # | Description | constructionMethod | tradition | patternType | symmetry | proportion | Score |
|---|---|---|---|---|---|---|---|
| 1 | Flower of Life — 19 overlapping circles  | ✓ 1.0 | ✗ -0.5 | ✓ 1.0 | ✓ 1.0 | ~ 0.5 | 60% |
| 2 | Islamic 8-pointed star geometric pattern | ✓ 1.0 | ✓ 1.0 | ✗ -0.5 | ✓ 1.0 | ~ 0.5 | 60% |
| 3 | Celtic triquetra (trinity knot) with int | ✓ 1.0 | ✓ 1.0 | ✓ 1.0 | ✓ 1.0 | ~ 0.5 | 90% |
| 4 | Chartres Cathedral north rose window — G | ✓ 1.0 | ✓ 1.0 | ✓ 1.0 | ✓ 1.0 | ~ 0.5 | 90% |
| 6 | Sri Yantra — Hindu sacred diagram with n | ✓ 1.0 | ✓ 1.0 | ✓ 1.0 | ✗ 0.0 | ✗ 0.0 | 60% |
| 7 | Penrose tiling — P3 rhombus aperiodic ti | ✗ -0.5 | ? 0.3 | ✓ 1.0 | ✗ -0.5 | ~ 0.5 | 15% |
| 8 | Nautilus shell cross-section showing log | ✗ 0.0 | ✓ 1.0 | ✓ 1.0 | ✗ 0.0 | ~ 0.5 | 50% |
| 10 | Persian/Islamic 12-fold girih star patte | ✓ 1.0 | ~ 0.5 | ✓ 1.0 | ✗ 0.0 | ~ 0.5 | 60% |
| 11 | Compass-and-straightedge hexagon constru | ✗ -0.5 | ? 0.3 | ? 0.3 | ? 0.3 | ? 0.3 | 10% |
| 14 | Metatron's Cube — 13 circles with all co | ✓ 1.0 | ✗ -0.5 | ✓ 1.0 | ✓ 1.0 | ~ 0.5 | 60% |

## Per-field accuracy

| Field | Accuracy | MATCH | PARTIAL | HONEST MISS | MISS HIGH | MISS LOW |
|---|---|---|---|---|---|---|
| constructionMethod | 60.0% | 7 | 0 | 0 | 2 | 1 |
| tradition | 50.0% | 5 | 1 | 2 | 2 | 0 |
| patternType | 77.5% | 8 | 0 | 1 | 1 | 0 |
| symmetry | 47.5% | 5 | 0 | 1 | 1 | 3 |
| proportion | 42.5% | 0 | 8 | 1 | 0 | 1 |
| **OVERALL** | **55.5%** | | | | | |

## Scoring key
| Verdict | Score | Meaning |
|---|---|---|
| MATCH ✓ | +1.0 | Primary matches ground truth |
| PARTIAL ~ | +0.5 | Secondary match or correct neighborhood |
| HONEST MISS ? | +0.25 | Uncertain/low-confidence on genuinely hard case |
| MISS HIGH ✗ | -0.5 | Wrong with high confidence |
| MISS LOW ✗ | 0.0 | Wrong with low/medium confidence |