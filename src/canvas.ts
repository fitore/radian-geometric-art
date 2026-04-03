import type { ExtractionParams } from './types.js';

// ─── Default extraction parameters ───────────────────────────────────────────

export const DEFAULT_PARAMS: ExtractionParams = {
  edgeSensitivity: 30,   // Sobel low threshold
  edgeMax:         120,  // Sobel high threshold
  blurRadius:      1,    // Pre-blur radius (0 = none)
  lineWeight:      1,    // Post-processing: dilate edges by N pixels
  invert:          false, // false = black lines on white, true = white on black
};

// ─── Gaussian blur (box approximation, 3 passes) ──────────────────────────────

function gaussianBlur(data: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  if (radius <= 0) return data;
  const result = new Uint8ClampedArray(data);
  const passes = 3; // box blur approximates Gaussian after 3 passes

  for (let pass = 0; pass < passes; pass++) {
    const src = pass % 2 === 0 ? (pass === 0 ? data : result) : result;
    const dst = result;
    const r = Math.max(1, Math.round(radius));

    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        for (let dx = -r; dx <= r; dx++) {
          const nx = Math.max(0, Math.min(width - 1, x + dx));
          const idx = (y * width + nx) * 4;
          sumR += src[idx]!;
          sumG += src[idx + 1]!;
          sumB += src[idx + 2]!;
          count++;
        }
        const idx = (y * width + x) * 4;
        dst[idx]     = sumR / count;
        dst[idx + 1] = sumG / count;
        dst[idx + 2] = sumB / count;
        dst[idx + 3] = src[idx + 3]!;
      }
    }
    // Vertical pass
    const tmp = new Uint8ClampedArray(dst);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        for (let dy = -r; dy <= r; dy++) {
          const ny = Math.max(0, Math.min(height - 1, y + dy));
          const idx = (ny * width + x) * 4;
          sumR += tmp[idx]!;
          sumG += tmp[idx + 1]!;
          sumB += tmp[idx + 2]!;
          count++;
        }
        const idx = (y * width + x) * 4;
        dst[idx]     = sumR / count;
        dst[idx + 1] = sumG / count;
        dst[idx + 2] = sumB / count;
        dst[idx + 3] = tmp[idx + 3]!;
      }
    }
  }
  return result;
}

// ─── Grayscale conversion ─────────────────────────────────────────────────────

function toGrayscale(data: Uint8ClampedArray, width: number, height: number): Float32Array {
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4]!;
    const g = data[i * 4 + 1]!;
    const b = data[i * 4 + 2]!;
    // Luminance-weighted grayscale
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return gray;
}

// ─── Sobel edge detection ─────────────────────────────────────────────────────

function sobelEdges(gray: Float32Array, width: number, height: number): Float32Array {
  const magnitude = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const tl = gray[(y - 1) * width + (x - 1)]!;
      const tm = gray[(y - 1) * width + x]!;
      const tr = gray[(y - 1) * width + (x + 1)]!;
      const ml = gray[y * width + (x - 1)]!;
      const mr = gray[y * width + (x + 1)]!;
      const bl = gray[(y + 1) * width + (x - 1)]!;
      const bm = gray[(y + 1) * width + x]!;
      const br = gray[(y + 1) * width + (x + 1)]!;

      const gx = -tl - 2 * ml - bl + tr + 2 * mr + br;
      const gy = -tl - 2 * tm - tr + bl + 2 * bm + br;
      magnitude[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return magnitude;
}

// ─── Threshold + dilate ───────────────────────────────────────────────────────

function thresholdAndDilate(
  magnitude: Float32Array,
  width: number,
  height: number,
  low: number,
  high: number,
  lineWeight: number,
): Uint8Array {
  // Hysteresis thresholding: strong edges + weak edges connected to strong
  const strong = new Uint8Array(width * height);
  const weak   = new Uint8Array(width * height);

  for (let i = 0; i < magnitude.length; i++) {
    const m = magnitude[i]!;
    if (m >= high) strong[i] = 255;
    else if (m >= low) weak[i] = 1;
  }

  // Simple connectivity: promote weak pixels adjacent to strong ones
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!weak[y * width + x]) continue;
      const neighbors = [
        strong[(y - 1) * width + x],
        strong[(y + 1) * width + x],
        strong[y * width + (x - 1)],
        strong[y * width + (x + 1)],
      ];
      if (neighbors.some(n => n)) strong[y * width + x] = 255;
    }
  }

  if (lineWeight <= 1) return strong;

  // Dilate edges by lineWeight pixels for thicker lines
  const dilated = new Uint8Array(strong);
  const r = lineWeight - 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!strong[y * width + x]) continue;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            dilated[ny * width + nx] = 255;
          }
        }
      }
    }
  }
  return dilated;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ExtractionResult {
  dataUrl: string; // PNG data URL
  width: number;
  height: number;
}

/**
 * Loads an image from a URL or data URI onto a canvas, runs the Sobel pipeline,
 * and returns a PNG data URL of the edge-detected template.
 */
export async function extractTemplate(
  imageUrl: string,
  params: ExtractionParams,
): Promise<ExtractionResult> {
  // Load image into a canvas
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image for template extraction'));
    img.src = imageUrl;
  });

  const { naturalWidth: w, naturalHeight: h } = img;
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width  = w;
  srcCanvas.height = h;
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.drawImage(img, 0, 0);

  const imageData = srcCtx.getImageData(0, 0, w, h);
  let pixels: Uint8ClampedArray = imageData.data;

  // 1. Optional pre-blur
  if (params.blurRadius > 0) {
    pixels = gaussianBlur(pixels, w, h, params.blurRadius);
  }

  // 2. Grayscale
  const gray = toGrayscale(pixels, w, h);

  // 3. Sobel
  const magnitude = sobelEdges(gray, w, h);

  // 4. Threshold + dilate
  const edges = thresholdAndDilate(
    magnitude, w, h,
    params.edgeSensitivity,
    params.edgeMax,
    params.lineWeight,
  );

  // 5. Render to output canvas
  const outCanvas = document.createElement('canvas');
  outCanvas.width  = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext('2d')!;
  const outData: ImageData = outCtx.createImageData(w, h);

  for (let i = 0; i < edges.length; i++) {
    const isEdge = edges[i]! > 0;
    let lineVal: number, bgVal: number;
    if (params.invert) {
      // White lines on black background
      lineVal = 255; bgVal = 0;
    } else {
      // Black lines on white background (print-ready)
      lineVal = 0; bgVal = 255;
    }
    const v = isEdge ? lineVal : bgVal;
    outData.data[i * 4]     = v;
    outData.data[i * 4 + 1] = v;
    outData.data[i * 4 + 2] = v;
    outData.data[i * 4 + 3] = 255;
  }

  outCtx.putImageData(outData, 0, 0);
  return {
    dataUrl: outCanvas.toDataURL('image/png'),
    width: w,
    height: h,
  };
}

/**
 * Downloads a PNG data URL as a file.
 */
export function downloadPng(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
