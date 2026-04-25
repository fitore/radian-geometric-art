// Client-side fold detection pipeline. Pure computation — no app DOM, no API, no localStorage.
// Exports: extractPoints, detectSymmetry, mapToTag.

// @ts-expect-error — imagetracerjs ships no TypeScript declarations
import _imagetracer from 'imagetracerjs';
import { kdTree } from 'kd-tree-javascript';

// Minimal type for the imagetracerjs singleton
type ITracerInstance = {
  imagedataToSVG(
    imgd: ImageData,
    opts?: { ltres?: number; qtres?: number; pathomit?: number; numberofcolors?: number }
  ): string;
};

const ImageTracer = _imagetracer as ITracerInstance;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Point { x: number; y: number }

// A Point[] enriched with image-space metadata from extractPoints.
// detectSymmetry casts to this internally; the public API keeps Point[].
type PointCloud = Point[] & { centreX: number; centreY: number; imageRadius: number };

export interface FundamentalDomain {
  angleStart: number   // radians — start of the wedge
  angleSweep: number   // radians — 180°/n for Dn, 360°/n for Cn
  centreX: number      // pixel coords in original image space
  centreY: number
  radius: number       // how far the wedge extends from centre
}

export interface SymmetryResult {
  foldCount: number
  groupType: 'D' | 'C' | 'none'
  rotationScore: number
  reflectionScore: number
  epsilon: number
  fundamentalDomain?: FundamentalDomain
}

export interface SymmetryTag {
  value: string | null
  confidence: 'high' | 'medium' | 'low'
  rationale: string
}

// Exact TAG_VOCABULARY values — verified at mapToTag call site
const SYMMETRY_VOCAB = new Set([
  '3-fold', '4-fold', '5-fold', '6-fold', '7-fold',
  '8-fold', '10-fold', '12-fold', '16-fold',
]);

// ─── extractPoints ────────────────────────────────────────────────────────────

export async function extractPoints(imageSource: HTMLImageElement | string): Promise<Point[]> {
  console.log('[radian:symmetry] extractPoints called, source type:', typeof imageSource);
  const img = typeof imageSource === 'string' ? await loadImage(imageSource) : imageSource;

  // Draw to canvas, cap longest side at 800px
  const MAX = 800;
  const scaleFactor = Math.min(1, MAX / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const w = Math.round((img.naturalWidth || MAX) * scaleFactor);
  const h = Math.round((img.naturalHeight || MAX) * scaleFactor);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not extract pattern from this image');
  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);

  // Vectorise with imagetracerjs
  const svgString = ImageTracer.imagedataToSVG(imgData, {
    ltres: 2, qtres: 1, pathomit: 16, numberofcolors: 4,
  });
  console.log('[radian:symmetry] svg length:', svgString?.length ?? 0);

  // Extract points from SVG path data
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const pathEls = Array.from(svgDoc.querySelectorAll('path'));
  console.log('[radian:symmetry] paths found:', pathEls.length);

  const raw: Point[] = [];
  for (const el of pathEls) {
    samplePath(el.getAttribute('d') ?? '', raw);
  }
  console.log('[radian:symmetry] points before normalise:', raw.length);

  if (raw.length === 0) {
    // No paths — return empty cloud (foldCount will be 0)
    return Object.assign([] as Point[], {
      centreX: w / 2 / scaleFactor,
      centreY: h / 2 / scaleFactor,
      imageRadius: Math.min(w, h) / 2 / scaleFactor,
    }) as PointCloud;
  }

  // Normalise: translate to centroid, scale by median distance
  const cx = raw.reduce((s, p) => s + p.x, 0) / raw.length;
  const cy = raw.reduce((s, p) => s + p.y, 0) / raw.length;
  console.log('[radian:symmetry] centroid:', cx.toFixed(3), cy.toFixed(3));
  const translated = raw.map(p => ({ x: p.x - cx, y: p.y - cy }));

  const dists = translated.map(p => Math.sqrt(p.x * p.x + p.y * p.y)).sort((a, b) => a - b);
  const medianDist = dists[Math.floor(dists.length / 2)] || 1;
  const normalized = translated.map(p => ({ x: p.x / medianDist, y: p.y / medianDist }));
  console.log('[radian:symmetry] points after normalise:', normalized.length);

  // Downsample to ≤8000 points
  const sample = normalized.length > 8000 ? uniformSample(normalized, 8000) : normalized;
  console.log('[radian:symmetry] points after downsample:', sample.length);
  console.log('[radian:symmetry] sample[0..4]:', sample.slice(0, 5));

  return Object.assign(sample, {
    centreX: cx / scaleFactor,
    centreY: cy / scaleFactor,
    imageRadius: (medianDist * 2.5) / scaleFactor,
  }) as PointCloud;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not extract pattern from this image'));
    img.src = src;
  });
}

// Extract coordinate pairs from an SVG path `d` attribute.
// imagetracerjs at low tolerance produces mostly M/L/Q segments.
function samplePath(d: string, out: Point[]): void {
  const cleaned = d.replace(/[MmLlCcQqTtSsAaZz]/g, ' ');
  const re = /([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s*,?\s*([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    if (!isNaN(x) && !isNaN(y)) out.push({ x, y });
  }
}

function uniformSample<T>(arr: T[], n: number): T[] {
  const step = arr.length / n;
  return Array.from({ length: n }, (_, i) => arr[Math.floor(i * step)]);
}

// ─── detectSymmetry ───────────────────────────────────────────────────────────

export function detectSymmetry(points: Point[]): SymmetryResult {
  const cloud = points as PointCloud;
  const FOLD_COUNTS = [6, 4, 8, 3, 12, 5, 10, 16, 7] as const;
  const ROTATION_THRESHOLD = 0.82;
  const REFLECTION_THRESHOLD = 0.75;
  const EPSILON = 0.05;

  if (points.length === 0) {
    return { foldCount: 0, groupType: 'none', rotationScore: 0, reflectionScore: 0, epsilon: EPSILON };
  }

  const tree = new kdTree<Point>(
    [...points],
    (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2,
    ['x', 'y']
  );

  const results: Array<{
    n: number
    rotationScore: number
    reflectionScore: number
    groupType: 'D' | 'C'
  }> = [];

  for (const n of FOLD_COUNTS) {
    const angle = (2 * Math.PI) / n;
    const rotationScore = scoreRotation(points, tree, angle, EPSILON);
    console.log(`[radian:symmetry] testing ${n}-fold, rotation score:`, rotationScore.toFixed(3));

    if (rotationScore >= ROTATION_THRESHOLD) {
      const reflectionScore = scoreReflections(points, tree, n, EPSILON);
      const groupType: 'D' | 'C' = reflectionScore >= REFLECTION_THRESHOLD ? 'D' : 'C';
      console.log(`[radian:symmetry] ${n}-fold passed — reflection:`, reflectionScore.toFixed(3));
      results.push({ n, rotationScore, reflectionScore, groupType });
    }
  }

  if (results.length === 0) {
    return { foldCount: 0, groupType: 'none', rotationScore: 0, reflectionScore: 0, epsilon: EPSILON };
  }

  // Pick the highest rotation score among passing candidates
  const best = results.reduce((a, b) => a.rotationScore > b.rotationScore ? a : b);

  const angleSweep = best.groupType === 'D' ? Math.PI / best.n : (2 * Math.PI) / best.n;

  return {
    foldCount: best.n,
    groupType: best.groupType,
    rotationScore: best.rotationScore,
    reflectionScore: best.reflectionScore,
    epsilon: EPSILON,
    fundamentalDomain: {
      angleStart: 0,
      angleSweep,
      centreX: cloud.centreX ?? 0,
      centreY: cloud.centreY ?? 0,
      radius: cloud.imageRadius ?? 200,
    },
  };
}

function scoreRotation(points: Point[], tree: kdTree<Point>, angle: number, epsilon: number): number {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  let matches = 0;
  for (const p of points) {
    const rotated = { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos };
    if (tree.nearest(rotated, 1, epsilon * epsilon).length > 0) matches++;
  }
  return matches / points.length;
}

function scoreReflections(points: Point[], tree: kdTree<Point>, n: number, epsilon: number): number {
  let total = 0;
  for (let i = 0; i < n; i++) {
    const axisAngle = (Math.PI * i) / n;
    const cos2 = Math.cos(2 * axisAngle);
    const sin2 = Math.sin(2 * axisAngle);
    let matches = 0;
    for (const p of points) {
      const reflected = { x: p.x * cos2 + p.y * sin2, y: p.x * sin2 - p.y * cos2 };
      if (tree.nearest(reflected, 1, epsilon * epsilon).length > 0) matches++;
    }
    total += matches / points.length;
  }
  return total / n;
}

// ─── mapToTag ─────────────────────────────────────────────────────────────────

export function mapToTag(result: SymmetryResult): SymmetryTag {
  if (result.foldCount === 0) {
    return {
      value: null,
      confidence: 'low',
      rationale: 'No clear rotational symmetry detected above threshold.',
    };
  }

  const tagValue = `${result.foldCount}-fold`;
  if (!SYMMETRY_VOCAB.has(tagValue)) {
    // Fold count detected but not in TAG_VOCABULARY — treat as inconclusive
    return {
      value: null,
      confidence: 'low',
      rationale: `Detected ${result.foldCount}-fold symmetry but this value is not in the tag vocabulary.`,
    };
  }

  let confidence: 'high' | 'medium' | 'low';
  if (result.groupType === 'D' && result.rotationScore >= 0.90) {
    confidence = 'high';
  } else if (result.groupType === 'D' && result.rotationScore >= 0.88) {
    confidence = 'medium';
  } else if (result.groupType === 'C') {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  const rationale = result.groupType === 'D'
    ? `${result.foldCount}-fold dihedral symmetry (rotation ${result.rotationScore.toFixed(2)}, reflection ${result.reflectionScore.toFixed(2)}).`
    : `${result.foldCount}-fold rotational symmetry only — reflection axes weak, pattern may be cyclic not dihedral.`;

  return { value: tagValue, confidence, rationale };
}
