'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MODEL = 'claude-sonnet-4-6';
const TEST_IMAGES_PATH = path.resolve(__dirname, '../analysis docs/test-images.json');
const RESULTS_PATH = path.resolve(__dirname, 'results.json');
const SCORECARD_PATH = path.resolve(__dirname, 'scorecard.md');
const FINDINGS_PATH = path.resolve(__dirname, 'SPIKE-RESULTS.md');
const DELAY_MS = 1000;

const client = new Anthropic({ apiKey: process.env['radian-app-api-key'] });

// ---------------------------------------------------------------------------
// System prompt (from radian-vision-spike.md Part 1)
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a sacred geometry analysis engine for Radian, a practitioner's
research tool. You analyze images of geometric patterns and classify
them using a precise taxonomy designed for people who draw sacred
geometry by hand with compass, straightedge, and ruler.

YOUR TASK:
Given an image, produce a structured JSON analysis that maps to
Radian's tag vocabulary. You are classifying FOR A PRACTITIONER —
accuracy matters more than completeness. If you are uncertain about
a field, say so with a low confidence score and explain why. A wrong
classification is worse than an honest "uncertain."

CLASSIFICATION SCHEMA (Radian TAG_VOCABULARY):

constructionMethod (how would a practitioner draw this?):
  - compass-and-straightedge: Requires compass arcs and straight lines
  - ruler-only: Straight lines only, no compass work
  - freehand: Organic, hand-drawn, no precision tools
  - polygonal-method: Built from polygon subdivision
  - grid-based: Constructed on a square, triangular, or hex grid
  - string-art-parabolic: Straight lines forming curved envelopes

tradition (cultural/historical lineage):
  - Islamic-geometric: Broad Islamic geometric art tradition
  - Moorish-Andalusian: Specifically Iberian Islamic patterns
  - Persian-Iranian: Iranian geometric and arabesque traditions
  - Moroccan-Maghrebi: North African geometric traditions
  - Ottoman: Ottoman empire decorative geometry
  - Gothic-Medieval: European medieval geometric tracery
  - Hindu-Vedic: Indian yantra, kolam, rangoli traditions
  - Celtic-Insular: Celtic knotwork and insular art
  - Nature-derived: Patterns derived from natural forms (phyllotaxis, crystal structure)

patternType (what kind of pattern is this?):
  - rosette: Central radiating design, usually circular
  - star-polygon: Interlocking star shapes
  - tessellation: Repeating tileable pattern
  - arabesque-biomorph: Flowing organic/vegetal geometric forms
  - mandala: Concentric circular symbolic diagram
  - knot-interlace: Continuous interwoven lines
  - spiral: Logarithmic, Archimedean, or Fibonacci spirals
  - parabolic-curve: Curves formed by straight-line envelopes
  - epicycloid: Curves traced by circles rolling on circles
  - curve-of-pursuit: Lines converging from polygon vertices
  - Flower-of-Life-lineage: FOL, Seed of Life, Metatron's Cube, etc.

symmetry (rotational symmetry order):
  - 3-fold, 4-fold, 5-fold, 6-fold, 7-fold, 8-fold, 10-fold, 12-fold, 16-fold

proportion (key mathematical ratios present):
  - golden-ratio: φ ≈ 1.618, pentagon-derived proportions
  - √2: Diagonal of a unit square, octagon-related
  - √3: Height of equilateral triangle, hexagon-related
  - vesica-piscis: Intersection of two equal circles
  - fibonacci: Fibonacci sequence-based spacing
  - pi-based: Circle-derived proportions

ANALYSIS GUIDELINES:

1. SYMMETRY: Count the rotational repeats. If a rosette has 8 identical
   segments around center, it is 8-fold. If the pattern is a wallpaper
   tiling, identify the symmetry of the fundamental motif.

2. TRADITION: Look for diagnostic features:
   - Islamic geometric: Interlocking stars, no figurative elements,
     often 6-fold or 8-fold, compass-constructed
   - Celtic: Continuous unbroken lines, over-under weaving, terminals
   - Gothic: Pointed arches, trefoils, quatrefoils, tracery
   - Hindu-Vedic: Triangular yantras, lotus motifs, bindu points
   - Nature-derived: Fibonacci spirals, Voronoi patterns, crystal lattices
   If the tradition is ambiguous or the pattern is modern/syncretic,
   say so. Do not force a tradition assignment.

3. CONSTRUCTION METHOD: Ask yourself: "If I were drawing this with
   physical tools, what would I reach for?" A pattern of perfect
   circles and straight lines = compass-and-straightedge. A grid of
   squares with diagonal fills = grid-based. A flowing vine pattern
   = likely freehand origin even if digitally rendered.

4. PROPORTION: Only flag proportions you can visually confirm.
   A regular pentagon implies golden ratio. A regular hexagon implies
   √3. Overlapping equal circles imply vesica piscis. Do not guess
   proportions you cannot see evidence for.

5. CONFIDENCE: For each field, provide:
   - A confidence level: high (>80%), medium (50-80%), low (<50%)
   - A one-sentence rationale explaining what visual evidence supports
     your classification or why you are uncertain

RESPOND WITH THIS EXACT JSON STRUCTURE AND NOTHING ELSE:

{
  "analysis": {
    "constructionMethod": {
      "primary": "<tag from vocabulary>",
      "confidence": "high|medium|low",
      "rationale": "<one sentence>"
    },
    "tradition": {
      "primary": "<tag from vocabulary or 'syncretic' or 'uncertain'>",
      "secondary": "<optional second tradition if hybrid>",
      "confidence": "high|medium|low",
      "rationale": "<one sentence>"
    },
    "patternType": {
      "primary": "<tag from vocabulary>",
      "secondary": "<optional second type if composite>",
      "confidence": "high|medium|low",
      "rationale": "<one sentence>"
    },
    "symmetry": {
      "primary": "<N-fold from vocabulary>",
      "confidence": "high|medium|low",
      "rationale": "<one sentence>"
    },
    "proportion": {
      "detected": ["<tags from vocabulary>"],
      "confidence": "high|medium|low",
      "rationale": "<one sentence>"
    }
  },
  "description": "<2-3 sentence practitioner-level description of the pattern>",
  "suggestedDifficulty": "beginner|intermediate|advanced",
  "constructionNotes": "<1-2 sentences on how a practitioner might approach drawing this>"
}`;

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

// Tradition aliases: treat these pairs as PARTIAL matches
const TRADITION_NEIGHBORS = [
  new Set(['Moorish-Andalusian', 'Islamic-geometric']),
  new Set(['Moroccan-Maghrebi', 'Islamic-geometric']),
  new Set(['Persian-Iranian', 'Islamic-geometric']),
  new Set(['Moorish-Andalusian', 'Moroccan-Maghrebi']),
  new Set(['Contemporary-Mathematical', 'syncretic']),
];

function inNeighborhood(a, b) {
  return TRADITION_NEIGHBORS.some(s => s.has(a) && s.has(b));
}

/**
 * Score a single field against ground truth.
 *
 * Returns { score, verdict }
 * verdicts: MATCH | PARTIAL | HONEST_MISS | MISS_HIGH | MISS_LOW
 */
function scoreField(predicted, groundTruth, confidence, fieldName) {
  const gt = Array.isArray(groundTruth) ? groundTruth : [groundTruth];
  const pred = Array.isArray(predicted)
    ? (predicted.length > 0 ? predicted : null)
    : (predicted && predicted !== 'uncertain' ? predicted.trim() : null);

  // "none" symmetry / empty proportion handled specially
  const gtIsEmpty = gt.length === 0 || gt[0] === 'none' || gt[0] === '';
  const predIsNone = !pred || pred === 'none' || pred === '[]';

  if (gtIsEmpty && predIsNone) return { score: 1.0, verdict: 'MATCH' };

  // Honest uncertainty: Claude said uncertain or low confidence on a hard case
  if (!pred || predicted === 'uncertain') {
    return { score: 0.25, verdict: 'HONEST_MISS' };
  }

  // MATCH: primary is correct
  if (gt.includes(pred)) return { score: 1.0, verdict: 'MATCH' };

  // PARTIAL: secondary match (arrays share an element)
  if (Array.isArray(groundTruth)) {
    // For proportion: any overlap is partial
    const detected = Array.isArray(predicted) ? predicted : [predicted];
    const overlap = detected.filter(p => groundTruth.includes(p));
    if (overlap.length > 0) return { score: 0.5, verdict: 'PARTIAL' };
  }

  // PARTIAL: tradition neighborhood
  if (fieldName === 'tradition' && gt.some(g => inNeighborhood(pred, g))) {
    return { score: 0.5, verdict: 'PARTIAL' };
  }

  // MISS — penalize by confidence
  if (confidence === 'high') return { score: -0.5, verdict: 'MISS_HIGH' };
  return { score: 0.0, verdict: 'MISS_LOW' };
}

function scoreImage(imageRecord, claudeAnalysis) {
  const gt = imageRecord.groundTruth;
  const a = claudeAnalysis.analysis;
  const fields = {};

  // constructionMethod
  fields.constructionMethod = scoreField(
    a.constructionMethod?.primary,
    gt.constructionMethod,
    a.constructionMethod?.confidence,
    'constructionMethod'
  );

  // tradition
  fields.tradition = scoreField(
    a.tradition?.primary,
    gt.tradition,
    a.tradition?.confidence,
    'tradition'
  );

  // patternType
  fields.patternType = scoreField(
    a.patternType?.primary,
    gt.patternType,
    a.patternType?.confidence,
    'patternType'
  );

  // symmetry
  fields.symmetry = scoreField(
    a.symmetry?.primary,
    gt.symmetry,
    a.symmetry?.confidence,
    'symmetry'
  );

  // proportion (array field)
  fields.proportion = scoreField(
    a.proportion?.detected,
    gt.proportion,
    a.proportion?.confidence,
    'proportion'
  );

  const totalScore = Object.values(fields).reduce((s, f) => s + f.score, 0);
  const maxScore = 5; // 5 fields × 1.0 each
  const pct = totalScore / maxScore;

  return { fields, totalScore, maxScore, pct };
}

// ---------------------------------------------------------------------------
// Image fetch → base64
// ---------------------------------------------------------------------------

async function fetchImageAsBase64(url, attempt = 1) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'RadianSpikeBot/1.0 (https://github.com/fitore/radian-geometric-art; fitore@users) node-fetch/24',
      'Accept': 'image/png,image/jpeg,image/gif,image/webp,image/*',
    },
  });

  if (response.status === 429 || response.status === 503) {
    if (attempt >= 4) throw new Error(`HTTP ${response.status} fetching ${url} after ${attempt} attempts`);
    const backoff = attempt * 3000;
    process.stdout.write(` [rate-limited, retrying in ${backoff / 1000}s]`);
    await new Promise(r => setTimeout(r, backoff));
    return fetchImageAsBase64(url, attempt + 1);
  }

  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
  const contentType = response.headers.get('content-type') || 'image/png';
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  // Normalise media type to what Anthropic accepts
  const mediaType = contentType.split(';')[0].trim();
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return { base64, mediaType: allowed.includes(mediaType) ? mediaType : 'image/png' };
}

// ---------------------------------------------------------------------------
// Claude call
// ---------------------------------------------------------------------------

async function analyzeImage(imageRecord) {
  const { base64, mediaType } = await fetchImageAsBase64(imageRecord.url);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          { type: 'text', text: 'Analyze this geometric pattern.' },
        ],
      },
    ],
  });

  const rawText = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  // Strip markdown code fences if present
  const jsonText = rawText.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
  return JSON.parse(jsonText);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { images } = JSON.parse(fs.readFileSync(TEST_IMAGES_PATH, 'utf8'));
  const results = [];

  console.log(`\nRadian Vision Spike — ${images.length} images — model: ${MODEL}\n`);
  console.log('='.repeat(70));

  for (const image of images) {
    process.stdout.write(`\n[${image.id}/15] ${image.description}\n  Fetching image...`);

    let claudeAnalysis, scoringResult, error;
    try {
      process.stdout.write(' done. Calling Claude...');
      claudeAnalysis = await analyzeImage(image);
      scoringResult = scoreImage(image, claudeAnalysis);

      const pctStr = (scoringResult.pct * 100).toFixed(0);
      process.stdout.write(` done. Score: ${scoringResult.totalScore.toFixed(1)}/5 (${pctStr}%)\n`);

      for (const [field, { score, verdict }] of Object.entries(scoringResult.fields)) {
        const pred = field === 'proportion'
          ? JSON.stringify(claudeAnalysis.analysis.proportion?.detected)
          : claudeAnalysis.analysis[field]?.primary;
        const gt = Array.isArray(image.groundTruth[field])
          ? JSON.stringify(image.groundTruth[field])
          : image.groundTruth[field];
        const icon = verdict === 'MATCH' ? '✓' : verdict === 'PARTIAL' ? '~' : verdict === 'HONEST_MISS' ? '?' : '✗';
        console.log(`  ${icon} ${field.padEnd(22)} pred: ${String(pred).padEnd(28)} gt: ${gt}`);
      }
    } catch (err) {
      error = err.message;
      console.error(`  ERROR: ${error}`);
    }

    results.push({
      id: image.id,
      description: image.description,
      imageType: image.imageType,
      groundTruth: image.groundTruth,
      claudeAnalysis: claudeAnalysis || null,
      scoring: scoringResult || null,
      error: error || null,
    });

    if (image.id < images.length) await new Promise(r => setTimeout(r, DELAY_MS));
  }

  // -------------------------------------------------------------------------
  // Aggregate
  // -------------------------------------------------------------------------

  const successful = results.filter(r => r.scoring);
  const fieldNames = ['constructionMethod', 'tradition', 'patternType', 'symmetry', 'proportion'];

  const fieldTotals = {};
  for (const f of fieldNames) {
    const scores = successful.map(r => r.scoring.fields[f].score);
    fieldTotals[f] = {
      total: scores.reduce((a, b) => a + b, 0),
      max: successful.length,
      pct: scores.reduce((a, b) => a + b, 0) / successful.length,
      verdicts: Object.fromEntries(
        ['MATCH', 'PARTIAL', 'HONEST_MISS', 'MISS_HIGH', 'MISS_LOW'].map(v => [
          v,
          successful.filter(r => r.scoring.fields[f].verdict === v).length,
        ])
      ),
    };
  }

  const overallPct =
    fieldNames.reduce((s, f) => s + fieldTotals[f].pct, 0) / fieldNames.length;

  const decision =
    overallPct >= 0.7 ? 'GREENLIGHT' : overallPct >= 0.5 ? 'ITERATE' : 'DESCOPE';

  // -------------------------------------------------------------------------
  // Write results.json
  // -------------------------------------------------------------------------

  fs.writeFileSync(RESULTS_PATH, JSON.stringify({ model: MODEL, results, fieldTotals, overallPct, decision }, null, 2));
  console.log(`\n\nResults written to spike/results.json`);

  // -------------------------------------------------------------------------
  // Print summary
  // -------------------------------------------------------------------------

  console.log('\n' + '='.repeat(70));
  console.log('SCORECARD SUMMARY');
  console.log('='.repeat(70));
  console.log(`${'Field'.padEnd(24)} ${'Accuracy'.padEnd(10)} MATCH  PARTIAL  HONEST_MISS  MISS_HIGH  MISS_LOW`);
  console.log('-'.repeat(70));
  for (const f of fieldNames) {
    const ft = fieldTotals[f];
    const v = ft.verdicts;
    console.log(
      `${f.padEnd(24)} ${(ft.pct * 100).toFixed(1).padStart(5)}%     ${String(v.MATCH).padEnd(7)}${String(v.PARTIAL).padEnd(9)}${String(v.HONEST_MISS).padEnd(13)}${String(v.MISS_HIGH).padEnd(11)}${v.MISS_LOW}`
    );
  }
  console.log('-'.repeat(70));
  console.log(`${'OVERALL'.padEnd(24)} ${(overallPct * 100).toFixed(1).padStart(5)}%`);
  console.log(`\nDecision: ${decision}`);

  // -------------------------------------------------------------------------
  // Write scorecard.md
  // -------------------------------------------------------------------------

  const scorecardRows = successful.map(r => {
    const cells = fieldNames.map(f => {
      const { verdict } = r.scoring.fields[f];
      const score = r.scoring.fields[f].score;
      const icon = verdict === 'MATCH' ? '✓' : verdict === 'PARTIAL' ? '~' : verdict === 'HONEST_MISS' ? '?' : '✗';
      return `${icon} ${score.toFixed(1)}`;
    });
    return `| ${r.id} | ${r.description.substring(0, 40)} | ${cells.join(' | ')} | ${(r.scoring.pct * 100).toFixed(0)}% |`;
  });

  const scorecard = [
    '# Radian Vision Spike — Scorecard',
    '',
    `**Model:** ${MODEL}  `,
    `**Date:** ${new Date().toISOString().slice(0, 10)}  `,
    `**Overall accuracy:** ${(overallPct * 100).toFixed(1)}%  `,
    `**Decision:** ${decision}`,
    '',
    '## Per-image results',
    '',
    '| # | Description | constructionMethod | tradition | patternType | symmetry | proportion | Score |',
    '|---|---|---|---|---|---|---|---|',
    ...scorecardRows,
    '',
    '## Per-field accuracy',
    '',
    '| Field | Accuracy | MATCH | PARTIAL | HONEST MISS | MISS HIGH | MISS LOW |',
    '|---|---|---|---|---|---|---|',
    ...fieldNames.map(f => {
      const ft = fieldTotals[f];
      const v = ft.verdicts;
      return `| ${f} | ${(ft.pct * 100).toFixed(1)}% | ${v.MATCH} | ${v.PARTIAL} | ${v.HONEST_MISS} | ${v.MISS_HIGH} | ${v.MISS_LOW} |`;
    }),
    `| **OVERALL** | **${(overallPct * 100).toFixed(1)}%** | | | | | |`,
    '',
    '## Scoring key',
    '| Verdict | Score | Meaning |',
    '|---|---|---|',
    '| MATCH ✓ | +1.0 | Primary matches ground truth |',
    '| PARTIAL ~ | +0.5 | Secondary match or correct neighborhood |',
    '| HONEST MISS ? | +0.25 | Uncertain/low-confidence on genuinely hard case |',
    '| MISS HIGH ✗ | -0.5 | Wrong with high confidence |',
    '| MISS LOW ✗ | 0.0 | Wrong with low/medium confidence |',
  ].join('\n');

  fs.writeFileSync(SCORECARD_PATH, scorecard);
  console.log('Scorecard written to spike/scorecard.md');

  // -------------------------------------------------------------------------
  // Write SPIKE-RESULTS.md (findings)
  // -------------------------------------------------------------------------

  // Failure pattern analysis
  const failuresByType = {};
  for (const r of successful) {
    if (!failuresByType[r.imageType]) failuresByType[r.imageType] = { count: 0, totalScore: 0 };
    failuresByType[r.imageType].count++;
    failuresByType[r.imageType].totalScore += r.scoring.totalScore;
  }

  const failureTypeLines = Object.entries(failuresByType)
    .map(([type, d]) => `- **${type}**: avg score ${(d.totalScore / d.count / 5 * 100).toFixed(1)}% (n=${d.count})`)
    .join('\n');

  // Confidence calibration: MISS_HIGH count across all fields
  const missHighTotal = fieldNames.reduce((s, f) => s + fieldTotals[f].verdicts.MISS_HIGH, 0);
  const totalPredictions = successful.length * fieldNames.length;
  const overconfidenceRate = (missHighTotal / totalPredictions * 100).toFixed(1);

  const weakFields = fieldNames.filter(f => fieldTotals[f].pct < 0.6).map(f => `\`${f}\``).join(', ') || 'none';
  const strongFields = fieldNames.filter(f => fieldTotals[f].pct >= 0.7).map(f => `\`${f}\``).join(', ') || 'none';

  const findings = [
    '# Radian Vision Spike — Findings',
    '',
    `**Model:** ${MODEL}  `,
    `**Date:** ${new Date().toISOString().slice(0, 10)}  `,
    `**Images tested:** ${successful.length}/15  `,
    `**Overall accuracy:** ${(overallPct * 100).toFixed(1)}%  `,
    `**Decision:** ${decision}`,
    '',
    '---',
    '',
    '## Overall accuracy vs. thresholds',
    '',
    `Overall accuracy is **${(overallPct * 100).toFixed(1)}%** against a decision threshold of 70% (greenlight) / 50% (iterate) / <50% (descope).`,
    '',
    decision === 'GREENLIGHT'
      ? 'Result: **Greenlight Feature 2.** Claude can serve as the primary classifier for Radian pattern analysis.'
      : decision === 'ITERATE'
      ? 'Result: **Iterate.** Invest in prompt refinement (few-shot examples, chain-of-thought) before committing to build.'
      : 'Result: **Descope.** Feature 2 reverts to line-extraction only. Tag analysis moves to v3 or is cut.',
    '',
    '---',
    '',
    '## Per-field accuracy breakdown',
    '',
    `**Strong fields (≥70%):** ${strongFields}`,
    `**Weak fields (<60%):** ${weakFields}`,
    '',
    '| Field | Accuracy |',
    '|---|---|',
    ...fieldNames.map(f => `| ${f} | ${(fieldTotals[f].pct * 100).toFixed(1)}% |`),
    '',
    '---',
    '',
    '## Failure pattern analysis',
    '',
    '### By image type',
    '',
    failureTypeLines,
    '',
    '### Notable misses',
    '',
    ...successful
      .filter(r => r.scoring.pct < 0.5)
      .map(r => `- **Image ${r.id}** (${r.description}): ${(r.scoring.pct * 100).toFixed(0)}% — ` +
        fieldNames
          .filter(f => r.scoring.fields[f].verdict.startsWith('MISS'))
          .map(f => `${f} predicted \`${r.claudeAnalysis?.analysis?.[f]?.primary}\` (gt: \`${r.groundTruth[f]}\`)`)
          .join('; ')
      ),
    '',
    '---',
    '',
    '## Confidence calibration',
    '',
    `MISS with high confidence rate: **${overconfidenceRate}%** of all predictions (${missHighTotal}/${totalPredictions}).`,
    '',
    missHighTotal > 3
      ? 'Claude is **overconfident** on wrong answers. Recommend adding the calibration rule from Part 5 of the spike doc to the system prompt before production use.'
      : 'Confidence calibration is **acceptable**. Claude is not systematically overconfident.',
    '',
    '---',
    '',
    '## Architecture recommendation',
    '',
    'Based on the spike results and Part 4 of the spike document:',
    '',
    '**Classification:** Use Claude Vision (Sonnet) as the primary classifier with the tested system prompt. The prompt is the load-bearing artifact — keep it versioned in `js/api.js` as a constant.',
    '',
    '**Extraction pipeline:** Path C (Hybrid) is recommended.',
    '- Canvas-based edge detection for the line template (fast, free, client-side, no external deps)',
    '- Claude Vision for semantic classification (tags, rationale, construction notes)',
    '- These are independent — do not couple them. A user can run extraction without analysis and vice versa.',
    '',
    '**Cost estimate:** ~$0.003–0.008 per analysis call at Sonnet pricing. A 100-image collection costs under $1.',
    '',
    '**If accuracy is borderline:** Re-run failing images on `claude-opus-4-6` to determine whether the more capable model resolves them. That informs whether production should use Sonnet (preferred, cheaper) or Opus (fallback for ambiguous images).',
    '',
    '---',
    '',
    '## Go/no-go recommendation',
    '',
    decision === 'GREENLIGHT'
      ? `**Go.** Feature 2 as designed. The ${(overallPct * 100).toFixed(1)}% overall accuracy clears the 70% threshold. Ship the system prompt from Part 1 verbatim as \`PATTERN_ANALYSIS_PROMPT\` in \`js/api.js\`. Monitor per-field accuracy in production — proportion and tradition are the most likely to need iteration.`
      : decision === 'ITERATE'
      ? `**Conditional go.** The ${(overallPct * 100).toFixed(1)}% accuracy is in the iterate band (50-70%). Before committing to build, invest in: (1) few-shot examples for the weakest fields, (2) chain-of-thought prefix before JSON. Re-spike on the same 15 images. If accuracy crosses 70%, greenlight. If not, present analysis as "suggested tags" (the fallback UX from Part 3).`
      : `**No-go for v2.** The ${(overallPct * 100).toFixed(1)}% accuracy is below the 50% threshold. Feature 2 reverts to line-extraction only (canvas pipeline). Tag classification moves to v3 roadmap. Manual tagging with optional AI suggestions is the interim UX.`,
  ].join('\n');

  fs.writeFileSync(FINDINGS_PATH, findings);
  console.log('Findings written to spike/SPIKE-RESULTS.md');
  console.log('\nSpike complete.\n');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
