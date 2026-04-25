# ADR 002 — Symmetry Detection: Circle Contamination

**Date:** April 2026
**Status:** Open — gap check implemented, further options pending

## Context

Client-side symmetry detection using imagetracerjs vectorisation +
KD-tree nearest-neighbour scoring detects fold counts correctly on
clean digital drawings. However, compass-and-straightedge construction
drawings contain circular scaffold lines that are rotationally symmetric
at every angle. This causes all fold counts to score above the rotation
threshold, making winner selection non-trivial.

## Decision

Implemented a score gap check: the winning fold count must lead the
second-highest by at least 0.05. If the gap is below threshold, the
result is flagged ambiguous: true and confidence is downgraded to low.
On the test image, 4-fold scored 1.000 vs 5-fold at 0.915 (gap 0.085)
— correct detection with high confidence.

## Options Considered

1. **Gap threshold (implemented)** — require winner to lead by 0.05.
   Simple, effective when the correct fold count scores significantly
   higher. Risk: fails when pattern and scaffold have similar fold counts
   (e.g. a 6-fold pattern with hexagonal scaffold circles).

2. **Pre-filter circular arcs** — detect and remove curved SVG path
   segments before point sampling. Circles in SVG paths are identifiable
   by curvature. Removes scaffold noise at source. More robust but
   requires SVG path analysis before the KD-tree step.

3. **Weight straight segments higher** — sample more densely from
   straight path segments than curved ones. Construction lines are
   straight; scaffold is curved. Preserves scaffold information while
   reducing its influence on scores.

## Consequences

- Gap check is a two-way door — easy to tune or remove
- Option 2 (pre-filter) is the recommended next improvement if
  ambiguous results appear on real collection images
- Photographs are not yet validated — separate calibration needed
