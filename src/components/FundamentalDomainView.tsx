// Fundamental domain visualisation — wedge overlay, extracted tile, tessellation preview.
// Reads SymmetryResult from Session A detection. No storage writes.

import { useState, useEffect, useRef } from 'react';
import type { SymmetryResult, FundamentalDomain } from '../symmetry.js';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FundamentalDomainViewProps {
  imageUrl: string
  symmetryResult: SymmetryResult
}

// ─── FundamentalDomainView ────────────────────────────────────────────────────

export function FundamentalDomainView({ imageUrl, symmetryResult }: FundamentalDomainViewProps) {
  const { foldCount, groupType, fundamentalDomain } = symmetryResult;

  const [tileUrl,      setTileUrl]      = useState<string | null>(null);
  const [tessUrl,      setTessUrl]      = useState<string | null>(null);
  const [showTess,     setShowTess]     = useState(false);
  const [imgDims,      setImgDims]      = useState<{ w: number; h: number } | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);

  // Extract tile once image dimensions are known
  useEffect(() => {
    if (!fundamentalDomain || !imgDims) return;
    let cancelled = false;
    extractTile(imageUrl, fundamentalDomain).then(url => {
      if (!cancelled) setTileUrl(url);
    }).catch(() => { /* extraction failure is non-fatal */ });
    return () => { cancelled = true; };
  }, [imageUrl, fundamentalDomain, imgDims]);

  // Render tessellation when toggled on (lazy — expensive)
  useEffect(() => {
    if (!showTess || !tileUrl || !fundamentalDomain) return;
    let cancelled = false;
    renderTessellation(tileUrl, symmetryResult).then(url => {
      if (!cancelled) setTessUrl(url);
    }).catch(() => { /* tessellation failure is non-fatal */ });
    return () => { cancelled = true; };
  }, [showTess, tileUrl, symmetryResult, fundamentalDomain]);

  if (!fundamentalDomain) return null;

  const domain = fundamentalDomain;
  const groupLabel = `${groupType}${foldCount}`;

  return (
    <div style={{ marginTop: '1.25rem' }}>

      {/* ── Layer 1: Fundamental domain overlay ─────────────────────────── */}
      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Pattern with fundamental domain overlay"
          style={{ width: '100%', display: 'block' }}
          onLoad={() => {
            const el = imgRef.current;
            if (el) setImgDims({ w: el.offsetWidth, h: el.offsetHeight });
          }}
        />
        {imgDims && (
          <WedgeOverlay
            domain={domain}
            displayW={imgDims.w}
            displayH={imgDims.h}
          />
        )}
      </div>
      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontStyle: 'italic',
        fontSize: '0.875rem',
        color: 'var(--color-text-muted, #888)',
        margin: '0.375rem 0 1rem',
      }}>
        The shaded wedge is the fundamental domain — the smallest unit that generates
        this pattern when {foldCount}-fold {groupLabel} symmetry is applied.
      </p>

      {/* ── Layer 2: Extracted tile ──────────────────────────────────────── */}
      {tileUrl && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '0.625rem',
            letterSpacing: '0.1em',
            color: 'var(--color-text-muted, #888)',
            marginBottom: '0.375rem',
          }}>
            FUNDAMENTAL UNIT
          </div>
          <img
            src={tileUrl}
            alt="Extracted fundamental domain tile"
            width={200}
            height={200}
            style={{
              display: 'block',
              border: '1px solid var(--color-border, rgba(0,0,0,0.15))',
            }}
          />
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted, #888)',
            margin: '0.375rem 0 0',
          }}>
            {foldCount}-fold — draw this, then apply {groupLabel} symmetry
          </p>
        </div>
      )}

      {/* ── Layer 3: Tessellation preview ───────────────────────────────── */}
      {tileUrl && (
        <>
          <button
            type="button"
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              background: 'none',
              border: '1px solid var(--color-border, rgba(0,0,0,0.2))',
              cursor: 'pointer',
              padding: '0.375rem 0.75rem',
              color: 'var(--color-text, inherit)',
              marginBottom: '0.75rem',
            }}
            onClick={() => setShowTess(x => !x)}
          >
            {showTess ? 'HIDE RECONSTRUCTION ↑' : 'SHOW RECONSTRUCTION ↓'}
          </button>

          {showTess && (
            <div>
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '0.625rem',
                letterSpacing: '0.1em',
                color: 'var(--color-text-muted, #888)',
                marginBottom: '0.375rem',
              }}>
                PATTERN RECONSTRUCTION
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <img
                    src={imageUrl}
                    alt="Original pattern"
                    style={{ width: 200, height: 200, objectFit: 'cover', display: 'block' }}
                  />
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted, #888)',
                    margin: '0.25rem 0 0',
                    textAlign: 'center',
                  }}>Original</p>
                </div>
                {tessUrl && (
                  <div>
                    <img
                      src={tessUrl}
                      alt="Tessellation reconstruction"
                      width={400}
                      height={400}
                      style={{ display: 'block' }}
                    />
                    <p style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: 'italic',
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted, #888)',
                      margin: '0.25rem 0 0',
                      textAlign: 'center',
                    }}>Reconstructed</p>
                  </div>
                )}
              </div>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontSize: '0.8125rem',
                color: 'var(--color-text-muted, #888)',
                margin: '0.5rem 0 0',
              }}>
                The detected symmetry group applied to the fundamental unit. If this
                matches the original, detection is correct.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── WedgeOverlay ─────────────────────────────────────────────────────────────

interface WedgeOverlayProps {
  domain: FundamentalDomain
  displayW: number
  displayH: number
}

function WedgeOverlay({ domain, displayW, displayH }: WedgeOverlayProps) {
  // The fundamentalDomain centre is the image-space centroid. We place the wedge
  // at the display centre and scale radius to 45% of the shorter display dimension.
  const { angleStart, angleSweep } = domain;

  const displayRadius = Math.min(displayW, displayH) * 0.45;
  const cx = displayW / 2;
  const cy = displayH / 2;

  const largeArc = angleSweep > Math.PI ? 1 : 0;

  const x1 = cx + displayRadius * Math.cos(angleStart);
  const y1 = cy + displayRadius * Math.sin(angleStart);
  const x2 = cx + displayRadius * Math.cos(angleStart + angleSweep);
  const y2 = cy + displayRadius * Math.sin(angleStart + angleSweep);

  const wedgePath = `M ${cx},${cy} L ${x1},${y1} A ${displayRadius},${displayRadius} 0 ${largeArc},1 ${x2},${y2} Z`;

  return (
    <svg
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}
      viewBox={`0 0 ${displayW} ${displayH}`}
      aria-hidden="true"
    >
      {/* Dim everything, then paint wedge on top to reveal the fundamental domain */}
      <rect x={0} y={0} width={displayW} height={displayH} fill="rgba(0,0,0,0.35)" />
      <path
        d={wedgePath}
        fill="rgba(212,175,55,0.15)"
        stroke="rgba(212,175,55,0.8)"
        strokeWidth={1.5}
      />
    </svg>
  );
}

// ─── extractTile ──────────────────────────────────────────────────────────────

async function extractTile(imageUrl: string, domain: FundamentalDomain, outputSize = 200): Promise<string> {
  const img = await loadImg(imageUrl);

  const src = document.createElement('canvas');
  src.width = img.naturalWidth;
  src.height = img.naturalHeight;
  const srcCtx = src.getContext('2d');
  if (!srcCtx) throw new Error('canvas unavailable');
  srcCtx.drawImage(img, 0, 0);
  const srcData = srcCtx.getImageData(0, 0, src.width, src.height);

  const out = document.createElement('canvas');
  out.width = outputSize;
  out.height = outputSize;
  const outCtx = out.getContext('2d');
  if (!outCtx) throw new Error('canvas unavailable');

  // Fill with background colour
  outCtx.fillStyle = '#f5f0e8';
  outCtx.fillRect(0, 0, outputSize, outputSize);

  const outData = outCtx.getImageData(0, 0, outputSize, outputSize);

  const { angleStart, angleSweep, centreX, centreY, radius } = domain;
  const iw = src.width;
  const ih = src.height;

  // Scale factor from output canvas to source image
  const scaleX = iw / outputSize;
  const scaleY = ih / outputSize;

  for (let py = 0; py < outputSize; py++) {
    for (let px = 0; px < outputSize; px++) {
      // Map output pixel to source image coords
      const sx = px * scaleX;
      const sy = py * scaleY;

      // Convert to polar relative to domain centre in source image space
      const dx = sx - centreX;
      const dy = sy - centreY;
      const r = Math.sqrt(dx * dx + dy * dy);
      let theta = Math.atan2(dy, dx);

      // Normalise theta to [angleStart, angleStart + 2π)
      while (theta < angleStart) theta += 2 * Math.PI;
      while (theta >= angleStart + 2 * Math.PI) theta -= 2 * Math.PI;

      if (r <= radius && theta >= angleStart && theta <= angleStart + angleSweep) {
        const srcX = Math.round(sx);
        const srcY = Math.round(sy);
        if (srcX >= 0 && srcX < iw && srcY >= 0 && srcY < ih) {
          const srcIdx = (srcY * iw + srcX) * 4;
          const outIdx = (py * outputSize + px) * 4;
          outData.data[outIdx]     = srcData.data[srcIdx];
          outData.data[outIdx + 1] = srcData.data[srcIdx + 1];
          outData.data[outIdx + 2] = srcData.data[srcIdx + 2];
          outData.data[outIdx + 3] = srcData.data[srcIdx + 3];
        }
      }
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return out.toDataURL();
}

// ─── renderTessellation ───────────────────────────────────────────────────────

async function renderTessellation(
  tileDataUrl: string,
  result: SymmetryResult,
  outputSize = 400
): Promise<string> {
  const { foldCount, groupType, fundamentalDomain } = result;
  if (!fundamentalDomain) return tileDataUrl;

  const tile = await loadImg(tileDataUrl);
  const out = document.createElement('canvas');
  out.width = outputSize;
  out.height = outputSize;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');

  const cx = outputSize / 2;
  const cy = outputSize / 2;

  for (let k = 0; k < foldCount; k++) {
    const angle = k * (2 * Math.PI) / foldCount;

    // Rotation
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.drawImage(tile, -cx, -cy, outputSize, outputSize);
    ctx.restore();

    // Reflection (Dn only)
    if (groupType === 'D') {
      const reflectAxis = k * Math.PI / foldCount;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(reflectAxis);
      ctx.scale(1, -1);
      ctx.rotate(-reflectAxis);
      ctx.rotate(angle);
      ctx.drawImage(tile, -cx, -cy, outputSize, outputSize);
      ctx.restore();
    }
  }

  return out.toDataURL();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}
